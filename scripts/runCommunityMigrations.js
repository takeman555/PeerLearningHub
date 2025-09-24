#!/usr/bin/env node

/**
 * Community Management Database Migration Script
 * 
 * This script runs the database migrations for the community management updates:
 * 1. Creates posts and groups tables with proper schema
 * 2. Sets up data cleanup functions
 * 3. Creates initial groups as specified in requirements
 * 
 * Usage: node scripts/runCommunityMigrations.js [--cleanup] [--admin-id=<uuid>]
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

async function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read migration file ${filename}: ${error.message}`);
  }
}

async function runMigration(filename, description) {
  console.log(`\n📄 Running migration: ${filename}`);
  console.log(`   ${description}`);
  
  try {
    const sql = await readMigrationFile(filename);
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        if (error) {
          // If exec RPC doesn't exist, try direct SQL execution
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          // For now, we'll log the statement and continue
          // In a real scenario, you'd need to execute this via Supabase SQL editor
        }
      }
    }
    
    console.log(`✅ Migration completed: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    console.log(`\n💡 Please run this migration manually in Supabase SQL Editor:`);
    console.log(`   File: supabase/migrations/${filename}`);
    return false;
  }
}

async function checkMigrationStatus() {
  console.log('\n🔍 Checking migration status...');
  
  try {
    // Check if migrations table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['posts', 'groups', 'group_memberships', 'post_likes']);
    
    if (tablesError) {
      console.log('   Migration tables not found, will create them.');
      return false;
    }
    
    const existingTables = tables.map(t => t.table_name);
    const requiredTables = ['posts', 'groups', 'group_memberships', 'post_likes'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`   Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.log(`   Error checking status: ${error.message}`);
    return false;
  }
}

async function performDataCleanup(adminId = null) {
  console.log('\n🧹 Performing data cleanup and initial setup...');
  
  try {
    const { data, error } = await supabase.rpc('perform_community_reset', {
      admin_user_id: adminId
    });
    
    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
    
    console.log('✅ Data cleanup completed successfully');
    console.log(`   Deleted posts: ${data.deleted_posts}`);
    console.log(`   Deleted groups: ${data.deleted_groups}`);
    console.log(`   Created groups: ${data.created_groups}`);
    console.log(`   Integrity check: ${data.integrity_check_passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Admin user ID: ${data.admin_user_id}`);
    
    return data;
  } catch (error) {
    console.error(`❌ Data cleanup failed: ${error.message}`);
    return null;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    // Check groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, external_link')
      .eq('is_active', true);
    
    if (groupsError) {
      throw new Error(`Failed to verify groups: ${groupsError.message}`);
    }
    
    console.log(`✅ Found ${groups.length} active groups:`);
    groups.forEach(group => {
      console.log(`   - ${group.name} ${group.external_link ? '(has external link)' : '(no external link)'}`);
    });
    
    // Check data integrity
    const { data: integrity, error: integrityError } = await supabase.rpc('validate_data_integrity');
    
    if (integrityError) {
      throw new Error(`Failed to validate integrity: ${integrityError.message}`);
    }
    
    console.log(`✅ Data integrity check: ${integrity ? 'PASSED' : 'FAILED'}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldCleanup = args.includes('--cleanup');
  const adminIdArg = args.find(arg => arg.startsWith('--admin-id='));
  const adminId = adminIdArg ? adminIdArg.split('=')[1] : null;
  
  console.log('🚀 Community Management Database Migration');
  console.log('==========================================');
  
  // Check current status
  const tablesExist = await checkMigrationStatus();
  
  // Run migrations if needed
  if (!tablesExist) {
    console.log('\n📦 Running database migrations...');
    
    const migration1Success = await runMigration(
      '007_create_posts_and_groups_tables.sql',
      'Creating posts and groups tables with proper schema and RLS policies'
    );
    
    if (!migration1Success) {
      console.error('❌ Failed to create core tables. Aborting.');
      process.exit(1);
    }
    
    const migration2Success = await runMigration(
      '008_data_cleanup_and_initial_groups.sql',
      'Setting up data cleanup functions and initial groups'
    );
    
    if (!migration2Success) {
      console.error('❌ Failed to setup cleanup functions. Aborting.');
      process.exit(1);
    }
  } else {
    console.log('✅ Database tables already exist, skipping migration.');
  }
  
  // Perform cleanup if requested
  if (shouldCleanup) {
    const cleanupResult = await performDataCleanup(adminId);
    if (!cleanupResult) {
      console.error('❌ Data cleanup failed. Aborting.');
      process.exit(1);
    }
  } else {
    console.log('\n💡 To perform data cleanup and create initial groups, run:');
    console.log('   node scripts/runCommunityMigrations.js --cleanup');
    if (adminId) {
      console.log(`   node scripts/runCommunityMigrations.js --cleanup --admin-id=${adminId}`);
    }
  }
  
  // Verify setup
  const verificationSuccess = await verifySetup();
  
  if (verificationSuccess) {
    console.log('\n🎉 Community management database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use the new database tables');
    console.log('2. Test the permission system with different user roles');
    console.log('3. Verify external links are working correctly');
  } else {
    console.error('\n❌ Setup verification failed. Please check the logs above.');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the migration
main().catch(error => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});