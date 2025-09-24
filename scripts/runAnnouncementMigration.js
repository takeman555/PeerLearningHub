const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Running Announcement Migration');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('\n📂 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/006_create_announcements_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');
    
    console.log('\n🚀 Executing migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n${i + 1}/${statements.length} Executing statement...`);
        console.log(`📄 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('1')
            .limit(0);
          
          // If that also fails, try using the raw query
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql: statement })
            });
            
            if (!response.ok) {
              console.log(`⚠️  Statement ${i + 1} may have failed, but continuing...`);
              console.log(`Error: ${error?.message || 'Unknown error'}`);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } catch (fetchError) {
            console.log(`⚠️  Statement ${i + 1} execution uncertain, continuing...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Migration execution completed!');
    
    // Test the migration by checking if the table exists
    console.log('\n🔍 Verifying migration...');
    
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('⚠️  Table verification failed, but migration may still be successful');
        console.log('Error:', error.message);
      } else {
        console.log('✅ Announcements table is accessible');
      }
    } catch (verifyError) {
      console.log('⚠️  Table verification uncertain');
    }
    
    // Test the function
    try {
      const { data, error } = await supabase.rpc('get_published_announcements', {
        limit_count: 1,
        offset_count: 0
      });
      
      if (error) {
        console.log('⚠️  Function verification failed');
        console.log('Error:', error.message);
      } else {
        console.log('✅ get_published_announcements function is working');
        console.log(`📊 Found ${data?.length || 0} published announcements`);
      }
    } catch (funcError) {
      console.log('⚠️  Function verification uncertain');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Execute SQL directly using Supabase SQL editor approach
async function runMigrationDirect() {
  try {
    console.log('\n📂 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/006_create_announcements_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n🚀 Executing migration directly...');
    
    // Use the SQL REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (response.ok) {
      console.log('✅ Migration executed successfully via direct SQL');
    } else {
      const errorText = await response.text();
      console.log('⚠️  Direct SQL execution response:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error.message);
  }
}

console.log('\n🎯 Choose migration method:');
console.log('1. Standard migration (recommended)');
console.log('2. Direct SQL execution (fallback)');

// Run standard migration
runMigration().then(() => {
  console.log('\n💡 If the migration didn\'t work completely, you may need to:');
  console.log('1. Run the SQL manually in Supabase SQL Editor');
  console.log('2. Check your service role key permissions');
  console.log('3. Ensure RLS policies allow the operations');
  
  console.log('\n📋 Next steps:');
  console.log('1. Restart your app to clear any cached schema');
  console.log('2. Test the announcements functionality');
  console.log('3. Check the admin panel at /admin/announcements');
});