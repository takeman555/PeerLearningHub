#!/usr/bin/env node

/**
 * Community Management Setup Validation Script
 * 
 * This script validates the environment and provides instructions for
 * setting up the community management database schema.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function validateEnvironment() {
  console.log('🔍 Validating environment...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - EXPO_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }
  
  console.log('✅ Environment variables found');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Service key: ${supabaseServiceKey.substring(0, 20)}...`);
  
  return true;
}

async function validateSupabaseConnection() {
  console.log('\n🔍 Testing Supabase connection...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test connection by checking auth users table
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Connected successfully`);
    console.log(`   Found ${data.users.length} users in auth.users table`);
    
    return true;
  } catch (error) {
    console.error(`❌ Connection error: ${error.message}`);
    return false;
  }
}

async function checkExistingTables() {
  console.log('\n🔍 Checking existing database structure...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for existing tables
    const tables = ['profiles', 'user_roles', 'posts', 'groups'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        results[table] = !error;
        if (!error) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing: ${error.message}`);
        }
      } catch (err) {
        results[table] = false;
        console.log(`❌ Table '${table}' missing or inaccessible`);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Database check failed: ${error.message}`);
    return {};
  }
}

function validateMigrationFiles() {
  console.log('\n🔍 Validating migration files...');
  
  const migrationFiles = [
    '007_create_posts_and_groups_tables.sql',
    '008_data_cleanup_and_initial_groups.sql'
  ];
  
  const results = {};
  
  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
    const exists = fs.existsSync(filePath);
    results[file] = exists;
    
    if (exists) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
  
  return results;
}

function printMigrationInstructions(tableResults, fileResults) {
  console.log('\n📋 Migration Instructions');
  console.log('========================');
  
  const needsMigration = !tableResults.posts || !tableResults.groups;
  
  if (needsMigration) {
    console.log('\n🚀 To set up the community management database:');
    console.log('\n1. Open your Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql`);
    
    console.log('\n2. Run the migration files in order:');
    
    if (fileResults['007_create_posts_and_groups_tables.sql']) {
      console.log('   a) Copy and paste the contents of:');
      console.log('      supabase/migrations/007_create_posts_and_groups_tables.sql');
      console.log('      This creates the posts, groups, and related tables.');
    }
    
    if (fileResults['008_data_cleanup_and_initial_groups.sql']) {
      console.log('   b) Copy and paste the contents of:');
      console.log('      supabase/migrations/008_data_cleanup_and_initial_groups.sql');
      console.log('      This sets up cleanup functions and initial groups.');
    }
    
    console.log('\n3. After running migrations, test the setup:');
    console.log('   node scripts/validateCommunitySetup.js');
    
    console.log('\n4. To create initial groups and cleanup data:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   SELECT public.perform_community_reset();');
    
  } else {
    console.log('\n✅ Database tables already exist!');
    console.log('\nTo reset data and create initial groups:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   SELECT public.perform_community_reset();');
  }
  
  console.log('\n📚 For detailed documentation, see:');
  console.log('   DATABASE_COMMUNITY_SCHEMA.md');
}

async function main() {
  console.log('🏗️  Community Management Database Setup Validator');
  console.log('================================================');
  
  // Validate environment
  const envValid = await validateEnvironment();
  if (!envValid) {
    console.log('\n❌ Environment validation failed. Please check your .env file.');
    process.exit(1);
  }
  
  // Test connection
  const connectionValid = await validateSupabaseConnection();
  if (!connectionValid) {
    console.log('\n❌ Connection validation failed. Please check your Supabase configuration.');
    process.exit(1);
  }
  
  // Check existing tables
  const tableResults = await checkExistingTables();
  
  // Validate migration files
  const fileResults = validateMigrationFiles();
  
  // Print instructions
  printMigrationInstructions(tableResults, fileResults);
  
  console.log('\n🎉 Validation completed!');
}

main().catch(error => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});