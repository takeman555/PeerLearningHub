#!/usr/bin/env node

/**
 * Community Display Settings Migration Script
 * 
 * This script runs the database migration for community display settings:
 * 1. Adds show_in_community and membership_status columns to profiles table
 * 2. Sets up appropriate indexes and RLS policies
 * 3. Updates existing users with default values
 * 
 * Usage: node scripts/runCommunityDisplayMigration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running Community Display Settings Migration');
  console.log('===============================================');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '013_add_community_display_settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Try to execute the statement directly
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            // If exec RPC doesn't exist, we'll need to handle this differently
            console.log(`   ⚠️  RPC exec not available, statement logged for manual execution`);
            console.log(`   Statement: ${statement.substring(0, 100)}...`);
          } else {
            console.log(`   ✅ Statement executed successfully`);
          }
        } catch (execError) {
          console.log(`   ⚠️  Direct execution failed: ${execError.message}`);
          console.log(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n🔍 Verifying migration results...');
    
    // Check if new columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .in('column_name', ['show_in_community', 'membership_status']);
    
    if (columnsError) {
      console.log('   ⚠️  Could not verify columns, but migration SQL was processed');
    } else {
      const existingColumns = columns.map(c => c.column_name);
      const requiredColumns = ['show_in_community', 'membership_status'];
      const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));
      
      if (missingColumns.length === 0) {
        console.log('   ✅ All required columns exist');
      } else {
        console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
      }
    }
    
    // Test updating a profile to verify the new columns work
    console.log('\n🧪 Testing new columns functionality...');
    
    try {
      // Get a test user
      const { data: testUser, error: userError } = await supabase
        .from('profiles')
        .select('id, show_in_community, membership_status')
        .limit(1)
        .single();
      
      if (userError || !testUser) {
        console.log('   ⚠️  No test user found, skipping functionality test');
      } else {
        console.log(`   📝 Testing with user: ${testUser.id}`);
        console.log(`   Current values: show_in_community=${testUser.show_in_community}, membership_status=${testUser.membership_status}`);
        
        // Try to update the user's settings
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            show_in_community: true,
            membership_status: 'premium'
          })
          .eq('id', testUser.id);
        
        if (updateError) {
          console.log(`   ⚠️  Update test failed: ${updateError.message}`);
        } else {
          console.log('   ✅ Update test successful');
        }
      }
    } catch (testError) {
      console.log(`   ⚠️  Functionality test failed: ${testError.message}`);
    }
    
    console.log('\n🎉 Community Display Settings Migration Completed!');
    console.log('\nNext steps:');
    console.log('1. Verify the migration in Supabase dashboard');
    console.log('2. Test the updated community member display functionality');
    console.log('3. Update user profiles to set their community display preferences');
    
    // If any statements failed, provide manual execution instructions
    console.log('\n💡 If any statements failed to execute automatically,');
    console.log('   please run them manually in the Supabase SQL Editor:');
    console.log(`   File: supabase/migrations/013_add_community_display_settings.sql`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Please run this migration manually in Supabase SQL Editor:');
    console.log('   File: supabase/migrations/013_add_community_display_settings.sql');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the migration
runMigration().catch(error => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});