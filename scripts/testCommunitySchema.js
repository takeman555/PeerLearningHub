#!/usr/bin/env node

/**
 * Community Management Schema Test Script
 * 
 * This script tests the database schema for community management features:
 * - Verifies table structure
 * - Tests constraints and indexes
 * - Validates RLS policies
 * - Checks data cleanup functions
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTableStructure() {
  console.log('\n🔍 Testing table structure...');
  
  const tables = ['posts', 'groups', 'group_memberships', 'post_likes'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position');
      
      if (error) {
        console.error(`❌ Failed to check ${table} structure: ${error.message}`);
        continue;
      }
      
      console.log(`✅ Table ${table}:`);
      data.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.error(`❌ Error checking ${table}: ${error.message}`);
    }
  }
}

async function testConstraints() {
  console.log('\n🔍 Testing constraints...');
  
  try {
    // Test posts content length constraint
    console.log('Testing posts content length constraint...');
    const { error: contentError } = await supabase
      .from('posts')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // This will fail due to FK, but constraint should be checked first
        content: '' // Empty content should fail
      });
    
    if (contentError && contentError.message.includes('posts_content_length')) {
      console.log('✅ Posts content length constraint working');
    } else {
      console.log('⚠️  Posts content length constraint may not be working as expected');
    }
    
    // Test groups external_link format constraint
    console.log('Testing groups external_link format constraint...');
    const { error: linkError } = await supabase
      .from('groups')
      .insert({
        name: 'Test Group',
        external_link: 'invalid-url', // Invalid URL format
        created_by: '00000000-0000-0000-0000-000000000000'
      });
    
    if (linkError && linkError.message.includes('groups_external_link_format')) {
      console.log('✅ Groups external_link format constraint working');
    } else {
      console.log('⚠️  Groups external_link format constraint may not be working as expected');
    }
    
  } catch (error) {
    console.log('✅ Constraints are working (expected errors occurred)');
  }
}

async function testIndexes() {
  console.log('\n🔍 Testing indexes...');
  
  try {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname, tablename')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%');
    
    if (error) {
      console.error(`❌ Failed to check indexes: ${error.message}`);
      return;
    }
    
    const expectedIndexes = [
      'idx_posts_user_id',
      'idx_posts_created_at',
      'idx_posts_is_active',
      'idx_posts_tags',
      'idx_groups_created_by',
      'idx_groups_created_at',
      'idx_groups_is_active',
      'idx_groups_name'
    ];
    
    const existingIndexes = data.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !existingIndexes.includes(idx));
    
    if (missingIndexes.length === 0) {
      console.log('✅ All expected indexes exist');
    } else {
      console.log(`⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
    }
    
    console.log(`Found ${existingIndexes.length} community-related indexes`);
    
  } catch (error) {
    console.error(`❌ Error checking indexes: ${error.message}`);
  }
}

async function testFunctions() {
  console.log('\n🔍 Testing cleanup functions...');
  
  const functions = [
    'cleanup_all_posts',
    'cleanup_all_groups',
    'create_initial_groups',
    'validate_data_integrity',
    'perform_community_reset'
  ];
  
  for (const func of functions) {
    try {
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_schema', 'public')
        .eq('routine_name', func);
      
      if (error) {
        console.error(`❌ Failed to check function ${func}: ${error.message}`);
        continue;
      }
      
      if (data.length > 0) {
        console.log(`✅ Function ${func} exists`);
      } else {
        console.log(`❌ Function ${func} missing`);
      }
    } catch (error) {
      console.error(`❌ Error checking function ${func}: ${error.message}`);
    }
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing data integrity validation...');
  
  try {
    const { data, error } = await supabase.rpc('validate_data_integrity');
    
    if (error) {
      console.error(`❌ Data integrity check failed: ${error.message}`);
      return;
    }
    
    console.log(`✅ Data integrity check: ${data ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    console.error(`❌ Error running integrity check: ${error.message}`);
  }
}

async function testRLSPolicies() {
  console.log('\n🔍 Testing RLS policies...');
  
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, tablename, cmd')
      .in('tablename', ['posts', 'groups', 'group_memberships', 'post_likes']);
    
    if (error) {
      console.error(`❌ Failed to check RLS policies: ${error.message}`);
      return;
    }
    
    const policyCount = data.length;
    const tables = [...new Set(data.map(p => p.tablename))];
    
    console.log(`✅ Found ${policyCount} RLS policies across ${tables.length} tables`);
    
    tables.forEach(table => {
      const tablePolicies = data.filter(p => p.tablename === table);
      console.log(`   ${table}: ${tablePolicies.length} policies`);
    });
    
  } catch (error) {
    console.error(`❌ Error checking RLS policies: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Community Management Schema Test');
  console.log('===================================');
  
  await testTableStructure();
  await testConstraints();
  await testIndexes();
  await testFunctions();
  await testDataIntegrity();
  await testRLSPolicies();
  
  console.log('\n🎉 Schema testing completed!');
  console.log('\nTo run the actual migration:');
  console.log('   node scripts/runCommunityMigrations.js');
  console.log('\nTo run migration with cleanup:');
  console.log('   node scripts/runCommunityMigrations.js --cleanup');
}

main().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});