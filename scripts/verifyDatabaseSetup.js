#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * 
 * This script verifies that all necessary tables and data are properly set up
 * for the community functionality to work correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 Database Setup Verification');
console.log('==============================\n');

/**
 * Test table accessibility
 */
async function testTableAccess(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      return { accessible: false, error: error.message, count: 0 };
    }
    
    return { accessible: true, error: null, count: data?.length || 0 };
  } catch (error) {
    return { accessible: false, error: error.message, count: 0 };
  }
}

/**
 * Test specific table data
 */
async function testTableData(tableName, expectedMinCount = 0) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      return { 
        success: false, 
        error: error.message, 
        count: 0,
        hasData: false 
      };
    }
    
    return { 
      success: true, 
      error: null, 
      count: count || 0,
      hasData: (count || 0) >= expectedMinCount,
      data: data || []
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      count: 0,
      hasData: false 
    };
  }
}

/**
 * Main verification function
 */
async function verifySetup() {
  let allGood = true;
  const results = {};

  console.log('📋 Testing table accessibility...\n');

  // Test core tables
  const tables = ['profiles', 'groups', 'posts', 'post_likes'];
  
  for (const table of tables) {
    const result = await testTableAccess(table);
    results[table] = result;
    
    if (result.accessible) {
      console.log(`✅ ${table}: Accessible`);
    } else {
      console.log(`❌ ${table}: ${result.error}`);
      allGood = false;
    }
  }

  console.log('\n📊 Testing table data...\n');

  // Test profiles data
  if (results.profiles?.accessible) {
    const profilesData = await testTableData('profiles', 1);
    if (profilesData.success && profilesData.hasData) {
      console.log(`✅ Profiles: ${profilesData.count} records found`);
      
      // Check for admin user
      const adminUsers = profilesData.data.filter(p => p.is_admin);
      if (adminUsers.length > 0) {
        console.log(`   👑 Admin users: ${adminUsers.length}`);
      } else {
        console.log(`   ⚠️  No admin users found`);
        allGood = false;
      }
    } else {
      console.log(`❌ Profiles: No data found`);
      allGood = false;
    }
  }

  // Test groups data
  if (results.groups?.accessible) {
    const groupsData = await testTableData('groups', 7);
    if (groupsData.success && groupsData.hasData) {
      console.log(`✅ Groups: ${groupsData.count} records found`);
      
      // Check for expected groups
      const expectedGroups = [
        'ピアラーニングハブ生成AI部',
        'さぬきピアラーニングハブゴルフ部',
        'さぬきピアラーニングハブ英語部',
        'WAOJEさぬきピアラーニングハブ交流会参加者',
        '香川イノベーションベース',
        'さぬきピアラーニングハブ居住者',
        '英語キャンプ卒業者'
      ];
      
      const foundGroups = groupsData.data.map(g => g.name);
      const missingGroups = expectedGroups.filter(name => !foundGroups.includes(name));
      
      if (missingGroups.length === 0) {
        console.log(`   🎯 All 7 expected groups found`);
      } else {
        console.log(`   ⚠️  Missing groups: ${missingGroups.join(', ')}`);
        allGood = false;
      }
      
      // Check external links
      const groupsWithLinks = groupsData.data.filter(g => g.external_link);
      console.log(`   🔗 Groups with external links: ${groupsWithLinks.length}/${groupsData.count}`);
      
    } else {
      console.log(`❌ Groups: Expected 7 groups, found ${groupsData.count}`);
      allGood = false;
    }
  }

  // Test posts table (should be empty but accessible)
  if (results.posts?.accessible) {
    const postsData = await testTableData('posts');
    if (postsData.success) {
      console.log(`✅ Posts: Table ready (${postsData.count} records)`);
    } else {
      console.log(`❌ Posts: ${postsData.error}`);
      allGood = false;
    }
  }

  // Test post_likes table (should be empty but accessible)
  if (results.post_likes?.accessible) {
    const likesData = await testTableData('post_likes');
    if (likesData.success) {
      console.log(`✅ Post Likes: Table ready (${likesData.count} records)`);
    } else {
      console.log(`❌ Post Likes: ${likesData.error}`);
      allGood = false;
    }
  }

  console.log('\n🔧 Testing functionality...\n');

  // Test groups service functionality
  try {
    const { data: testGroups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, external_link, member_count, is_active')
      .eq('is_active', true)
      .limit(3);

    if (groupsError) {
      console.log(`❌ Groups query failed: ${groupsError.message}`);
      allGood = false;
    } else {
      console.log(`✅ Groups query successful: ${testGroups?.length || 0} active groups`);
    }
  } catch (error) {
    console.log(`❌ Groups functionality test failed: ${error.message}`);
    allGood = false;
  }

  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=======================');
  
  if (allGood) {
    console.log('🎉 All checks passed!');
    console.log('✅ Database is properly set up');
    console.log('✅ All required tables are accessible');
    console.log('✅ Initial data is present');
    console.log('✅ Community features should work correctly');
    console.log('\n🚀 You can now use the community functionality in the app!');
  } else {
    console.log('⚠️  Some issues were found');
    console.log('📋 Please review the errors above');
    console.log('💡 You may need to run the manual database setup');
    console.log('📖 See: MANUAL_DATABASE_SETUP.md for instructions');
  }

  return allGood;
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Critical verification error:', error);
      process.exit(1);
    });
}

module.exports = { verifySetup };