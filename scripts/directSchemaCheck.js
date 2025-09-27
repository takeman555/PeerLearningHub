#!/usr/bin/env node

/**
 * Direct Schema Check Script
 * 
 * This script directly queries the database to check table schemas
 * without relying on Supabase's schema cache.
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

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function testProfilesColumns() {
  console.log('🔍 Testing profiles table columns...');
  
  const columnsToTest = [
    'id',
    'full_name',
    'avatar_url',
    'bio',
    'country',
    'created_at',
    'role',
    'show_in_community',
    'membership_status'
  ];
  
  for (const column of columnsToTest) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(column)
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Column '${column}': ${error.message}`);
      } else {
        console.log(`   ✅ Column '${column}': exists`);
      }
    } catch (error) {
      console.log(`   ❌ Column '${column}': ${error.message}`);
    }
  }
}

async function testPostsColumns() {
  console.log('\n🔍 Testing posts table columns...');
  
  const columnsToTest = [
    'id',
    'user_id',
    'content',
    'created_at',
    'updated_at'
  ];
  
  for (const column of columnsToTest) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(column)
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Column '${column}': ${error.message}`);
      } else {
        console.log(`   ✅ Column '${column}': exists`);
      }
    } catch (error) {
      console.log(`   ❌ Column '${column}': ${error.message}`);
    }
  }
}

async function testForeignKeyRelationships() {
  console.log('\n🔍 Testing foreign key relationships...');
  
  try {
    // Test posts -> profiles relationship
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        profiles!inner(
          id,
          full_name
        )
      `)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ posts -> profiles relationship: ${error.message}`);
    } else {
      console.log('   ✅ posts -> profiles relationship: working');
    }
  } catch (error) {
    console.log(`   ❌ posts -> profiles relationship: ${error.message}`);
  }
  
  try {
    // Test post_likes -> posts relationship
    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        id,
        post_id,
        posts!inner(
          id,
          content
        )
      `)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ post_likes -> posts relationship: ${error.message}`);
    } else {
      console.log('   ✅ post_likes -> posts relationship: working');
    }
  } catch (error) {
    console.log(`   ❌ post_likes -> posts relationship: ${error.message}`);
  }
}

async function createTestProfile() {
  console.log('\n🧪 Testing profile creation...');
  
  const testProfile = {
    id: '99999999-9999-9999-9999-999999999999',
    full_name: 'Schema Test User',
    role: 'user',
    show_in_community: true,
    membership_status: 'premium'
  };
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(testProfile, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.log(`   ❌ Profile creation failed: ${error.message}`);
      
      // Try with minimal data
      console.log('   🔄 Trying with minimal data...');
      const minimalProfile = {
        id: testProfile.id,
        full_name: testProfile.full_name
      };
      
      const { data: minData, error: minError } = await supabase
        .from('profiles')
        .upsert(minimalProfile, { onConflict: 'id' })
        .select();
      
      if (minError) {
        console.log(`   ❌ Minimal profile creation failed: ${minError.message}`);
      } else {
        console.log('   ✅ Minimal profile creation successful');
        
        // Try to update with new columns
        console.log('   🔄 Trying to update with new columns...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'user',
            show_in_community: true,
            membership_status: 'premium'
          })
          .eq('id', testProfile.id);
        
        if (updateError) {
          console.log(`   ❌ Profile update failed: ${updateError.message}`);
        } else {
          console.log('   ✅ Profile update successful');
        }
      }
    } else {
      console.log('   ✅ Profile creation successful');
    }
    
    // Cleanup
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testProfile.id);
    
  } catch (error) {
    console.log(`   ❌ Profile test failed: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Direct Database Schema Check');
  console.log('===============================');
  
  // Check if tables exist
  const tables = ['profiles', 'posts', 'post_likes', 'groups'];
  console.log('\n📋 Checking table existence...');
  
  for (const table of tables) {
    const exists = await checkTableExists(table);
    console.log(`   ${exists ? '✅' : '❌'} Table '${table}': ${exists ? 'exists' : 'missing'}`);
  }
  
  // Test column existence
  await testProfilesColumns();
  await testPostsColumns();
  
  // Test relationships
  await testForeignKeyRelationships();
  
  // Test profile creation
  await createTestProfile();
  
  console.log('\n🎯 Summary:');
  console.log('- Check the output above to see which columns are missing');
  console.log('- Missing columns need to be added via Supabase SQL Editor');
  console.log('- Foreign key relationships may need to be recreated');
}

main().catch(error => {
  console.error('❌ Schema check failed:', error.message);
  process.exit(1);
});