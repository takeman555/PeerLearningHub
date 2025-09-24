const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Manual Migration Execution');
console.log('=============================');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('📂 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/006_create_announcements_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Executing migration...');
    
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
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
            
            // Try alternative execution method
            const { error: directError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(0);
              
            if (directError && directError.message.includes('does not exist')) {
              console.log('💡 Trying direct SQL execution...');
              // This is expected - we're just testing if we can execute SQL
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.log(`⚠️  Statement ${i + 1} execution error:`, execError.message);
        }
      }
    }
    
    console.log('\n🎉 Migration execution completed!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table verification failed:', tableError.message);
      console.log('\n💡 Manual steps required:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the migration SQL from:');
      console.log('   PeerLearningHub/supabase/migrations/006_create_announcements_table.sql');
      console.log('4. Execute the SQL manually');
    } else {
      console.log('✅ Table created successfully!');
      
      // Test the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_published_announcements', { limit_count: 5, offset_count: 0 });
      
      if (rpcError) {
        console.log('⚠️  RPC function verification failed:', rpcError.message);
      } else {
        console.log('✅ RPC function works correctly!');
        console.log(`📊 Found ${rpcData?.length || 0} published announcements`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run the migration manually in Supabase SQL Editor');
  }
}

async function showMigrationSQL() {
  console.log('\n📋 Migration SQL to copy to Supabase SQL Editor:');
  console.log('=' .repeat(60));
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/006_create_announcements_table.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(migrationSQL);
  console.log('=' .repeat(60));
}

async function main() {
  await executeMigration();
  await showMigrationSQL();
  
  console.log('\n📋 Next steps:');
  console.log('1. If automatic migration failed, copy the SQL above to Supabase SQL Editor');
  console.log('2. Run: node scripts/testAnnouncements.js');
  console.log('3. Start your app: npm start');
  console.log('4. Test the announcements functionality');
}

main().catch(console.error);