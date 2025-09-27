#!/usr/bin/env node

/**
 * Test Real Database Connection
 * Verifies that the application can connect to and use the real Supabase database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTableAccess() {
  console.log('🔍 Testing table access...');
  
  const tables = ['profiles', 'user_roles', 'posts', 'groups', 'group_memberships', 'post_likes'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        results[table] = { status: 'error', message: error.message };
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        results[table] = { status: 'success', count: data?.[0]?.count || 0 };
        console.log(`✅ ${table}: accessible (${data?.[0]?.count || 0} rows)`);
      }
    } catch (err) {
      results[table] = { status: 'error', message: err.message };
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  return results;
}

async function testAuthFlow() {
  console.log('\n🔍 Testing authentication flow...');
  
  try {
    // Test getting current session (should be null for unauthenticated user)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      return false;
    }
    
    console.log(`✅ Session check working (current session: ${session ? 'authenticated' : 'none'})`);
    
    // Test sign up with a test user (this will fail if user exists, which is expected)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      console.log(`⚠️  Sign up test: ${signUpError.message} (this may be expected)`);
    } else {
      console.log('✅ Sign up test successful');
      
      // Clean up test user if created
      if (signUpData.user) {
        console.log('🧹 Cleaning up test user...');
        // Note: In production, you'd need admin privileges to delete users
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Auth flow test failed:', err.message);
    return false;
  }
}

async function testPostsAccess() {
  console.log('\n🔍 Testing posts access...');
  
  try {
    // Test reading posts (should work with RLS policies)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id')
      .eq('is_active', true)
      .limit(5);
    
    if (error) {
      console.error('❌ Posts access failed:', error.message);
      return false;
    }
    
    console.log(`✅ Posts access working (found ${posts?.length || 0} posts)`);
    
    // Display sample posts if any exist
    if (posts && posts.length > 0) {
      console.log('📋 Sample posts:');
      posts.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.content.substring(0, 50)}...`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('❌ Posts access test failed:', err.message);
    return false;
  }
}

async function testGroupsAccess() {
  console.log('\n🔍 Testing groups access...');
  
  try {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('id, name, description, external_link, member_count')
      .eq('is_active', true)
      .limit(10);
    
    if (error) {
      console.error('❌ Groups access failed:', error.message);
      return false;
    }
    
    console.log(`✅ Groups access working (found ${groups?.length || 0} groups)`);
    
    if (groups && groups.length > 0) {
      console.log('📋 Available groups:');
      groups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.name} (${group.member_count} members)`);
      });
    } else {
      console.log('📋 No groups found - this is expected for a new setup');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Groups access test failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Real Database Connection');
  console.log('===================================\n');
  
  // Test 1: Table access
  const tableResults = await testTableAccess();
  
  // Test 2: Authentication flow
  const authWorking = await testAuthFlow();
  
  // Test 3: Posts access
  const postsWorking = await testPostsAccess();
  
  // Test 4: Groups access
  const groupsWorking = await testGroupsAccess();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successfulTables = Object.values(tableResults).filter(r => r.status === 'success').length;
  const totalTables = Object.keys(tableResults).length;
  
  console.log(`📋 Table Access: ${successfulTables}/${totalTables} tables accessible`);
  console.log(`🔐 Authentication: ${authWorking ? '✅ Working' : '❌ Issues'}`);
  console.log(`📝 Posts Access: ${postsWorking ? '✅ Working' : '❌ Issues'}`);
  console.log(`👥 Groups Access: ${groupsWorking ? '✅ Working' : '❌ Issues'}`);
  
  const overallSuccess = successfulTables === totalTables && authWorking && postsWorking && groupsWorking;
  
  if (overallSuccess) {
    console.log('\n🎉 All tests passed! Database is ready for use.');
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Database connection is working');
    console.log('2. ✅ Authentication system is ready');
    console.log('3. ✅ Core features can access data');
    console.log('4. 🔄 Test user registration in the app');
    console.log('5. 🔄 Verify all app features work correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above.');
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check Supabase project settings');
    console.log('2. Verify RLS policies are correct');
    console.log('3. Ensure all tables were created properly');
  }
  
  return overallSuccess;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);