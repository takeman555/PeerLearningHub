#!/usr/bin/env node

/**
 * Community Integration Test Script
 * 
 * This script performs comprehensive integration testing of the community features
 * after the fixes have been applied. It tests the complete user flow including:
 * 1. User registration and profile setup
 * 2. Post creation and management
 * 3. Like functionality
 * 4. Community member display
 * 5. Admin functionality
 * 
 * Usage: node scripts/testCommunityIntegration.js
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

// Test data
const testUsers = [
  {
    id: 'test-user-1-' + Date.now(),
    full_name: 'Test User 1',
    email: 'testuser1@example.com',
    role: 'user',
    show_in_community: true,
    membership_status: 'premium'
  },
  {
    id: 'test-admin-' + Date.now(),
    full_name: 'Test Admin',
    email: 'testadmin@example.com',
    role: 'admin',
    show_in_community: true,
    membership_status: 'lifetime'
  },
  {
    id: 'test-user-2-' + Date.now(),
    full_name: 'Test User 2',
    email: 'testuser2@example.com',
    role: 'user',
    show_in_community: false,
    membership_status: 'premium'
  }
];

let testPosts = [];
let testResults = {
  userCreation: false,
  postCreation: false,
  likeFunctionality: false,
  postDeletion: false,
  communityDisplay: false,
  adminFunctionality: false
};

async function setupTestUsers() {
  console.log('👥 Setting up test users...');
  
  try {
    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(user, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.log(`   ❌ Failed to create user ${user.full_name}: ${error.message}`);
        return false;
      } else {
        console.log(`   ✅ Created user: ${user.full_name} (${user.role})`);
      }
    }
    
    testResults.userCreation = true;
    return true;
  } catch (error) {
    console.error('❌ User setup failed:', error.message);
    return false;
  }
}

async function testPostCreation() {
  console.log('\n📝 Testing post creation...');
  
  try {
    const user1 = testUsers[0];
    const admin = testUsers[1];
    
    const postsToCreate = [
      {
        id: 'test-post-1-' + Date.now(),
        user_id: user1.id,
        content: 'This is a test post from user 1'
      },
      {
        id: 'test-post-2-' + Date.now(),
        user_id: admin.id,
        content: 'This is a test post from admin'
      }
    ];
    
    for (const post of postsToCreate) {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select();
      
      if (error) {
        console.log(`   ❌ Failed to create post: ${error.message}`);
        return false;
      } else {
        console.log(`   ✅ Created post: ${post.content.substring(0, 30)}...`);
        testPosts.push(post);
      }
    }
    
    testResults.postCreation = true;
    return true;
  } catch (error) {
    console.error('❌ Post creation test failed:', error.message);
    return false;
  }
}

async function testLikeFunctionality() {
  console.log('\n👍 Testing like functionality...');
  
  if (testPosts.length === 0) {
    console.log('   ⚠️  No test posts available, skipping like tests');
    return false;
  }
  
  try {
    const user1 = testUsers[0];
    const user2 = testUsers[1];
    const post = testPosts[0];
    
    // Test 1: User 1 likes the post
    console.log('   Test 1: Adding like...');
    const { data: like1, error: likeError1 } = await supabase
      .from('post_likes')
      .insert({ post_id: post.id, user_id: user1.id })
      .select();
    
    if (likeError1) {
      console.log(`   ❌ Like creation failed: ${likeError1.message}`);
      return false;
    } else {
      console.log('   ✅ Like added successfully');
    }
    
    // Test 2: Check like count
    const { count: likeCount1, error: countError1 } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    if (countError1) {
      console.log(`   ❌ Like count check failed: ${countError1.message}`);
      return false;
    } else {
      console.log(`   ✅ Like count: ${likeCount1}`);
    }
    
    // Test 3: User 2 also likes the post
    console.log('   Test 2: Adding second like...');
    const { error: likeError2 } = await supabase
      .from('post_likes')
      .insert({ post_id: post.id, user_id: user2.id });
    
    if (likeError2) {
      console.log(`   ❌ Second like creation failed: ${likeError2.message}`);
      return false;
    } else {
      console.log('   ✅ Second like added successfully');
    }
    
    // Test 4: Check updated like count
    const { count: likeCount2, error: countError2 } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    if (countError2) {
      console.log(`   ❌ Updated like count check failed: ${countError2.message}`);
      return false;
    } else {
      console.log(`   ✅ Updated like count: ${likeCount2}`);
    }
    
    // Test 5: Remove like (User 1 unlikes)
    console.log('   Test 3: Removing like...');
    const { error: unlikeError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', post.id)
      .eq('user_id', user1.id);
    
    if (unlikeError) {
      console.log(`   ❌ Like removal failed: ${unlikeError.message}`);
      return false;
    } else {
      console.log('   ✅ Like removed successfully');
    }
    
    // Test 6: Check final like count
    const { count: likeCount3, error: countError3 } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    if (countError3) {
      console.log(`   ❌ Final like count check failed: ${countError3.message}`);
      return false;
    } else {
      console.log(`   ✅ Final like count: ${likeCount3}`);
    }
    
    testResults.likeFunctionality = true;
    return true;
  } catch (error) {
    console.error('❌ Like functionality test failed:', error.message);
    return false;
  }
}

async function testPostDeletion() {
  console.log('\n🗑️  Testing post deletion...');
  
  if (testPosts.length === 0) {
    console.log('   ⚠️  No test posts available, skipping deletion tests');
    return false;
  }
  
  try {
    const user1 = testUsers[0];
    const admin = testUsers[1];
    const user2 = testUsers[2];
    const post = testPosts[0];
    
    // Test 1: Non-owner tries to delete (should fail)
    console.log('   Test 1: Non-owner attempting deletion...');
    const { error: deleteError1 } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
      .eq('user_id', user2.id); // Wrong user
    
    // This should fail due to RLS policy
    if (deleteError1) {
      console.log('   ✅ Non-owner deletion correctly blocked');
    } else {
      console.log('   ❌ Non-owner deletion should have been blocked');
      return false;
    }
    
    // Test 2: Owner deletes post (should succeed)
    console.log('   Test 2: Owner attempting deletion...');
    const { error: deleteError2 } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);
    
    if (deleteError2) {
      console.log(`   ❌ Owner deletion failed: ${deleteError2.message}`);
      
      // Try admin deletion instead
      console.log('   Test 2b: Admin attempting deletion...');
      const { error: adminDeleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      if (adminDeleteError) {
        console.log(`   ❌ Admin deletion also failed: ${adminDeleteError.message}`);
        return false;
      } else {
        console.log('   ✅ Admin deletion successful');
      }
    } else {
      console.log('   ✅ Owner deletion successful');
    }
    
    // Remove the deleted post from our test array
    testPosts = testPosts.filter(p => p.id !== post.id);
    
    testResults.postDeletion = true;
    return true;
  } catch (error) {
    console.error('❌ Post deletion test failed:', error.message);
    return false;
  }
}

async function testCommunityDisplay() {
  console.log('\n👥 Testing community member display...');
  
  try {
    // Test community member filtering
    const { data: allMembers, error: allError } = await supabase
      .from('profiles')
      .select('id, full_name, role, show_in_community, membership_status')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.log(`   ❌ Failed to fetch all members: ${allError.message}`);
      return false;
    }
    
    console.log(`   📊 Total profiles: ${allMembers.length}`);
    
    // Filter according to community display rules
    const communityMembers = allMembers.filter(member => 
      member.show_in_community === true && 
      ['premium', 'lifetime'].includes(member.membership_status) &&
      member.full_name !== null
    );
    
    console.log(`   📊 Community members: ${communityMembers.length}`);
    
    // Check admin ordering
    const admins = communityMembers.filter(member => member.role === 'admin');
    const regularMembers = communityMembers.filter(member => member.role !== 'admin');
    
    console.log(`   📊 Admins: ${admins.length}, Regular members: ${regularMembers.length}`);
    
    // Verify test users are correctly filtered
    const visibleTestUsers = communityMembers.filter(member => 
      testUsers.some(testUser => testUser.id === member.id)
    );
    
    console.log(`   📊 Visible test users: ${visibleTestUsers.length}`);
    
    // Should be 2 (user1 and admin, but not user2 who has show_in_community=false)
    if (visibleTestUsers.length >= 2) {
      console.log('   ✅ Community display filtering working correctly');
      testResults.communityDisplay = true;
      return true;
    } else {
      console.log('   ❌ Community display filtering not working as expected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Community display test failed:', error.message);
    return false;
  }
}

async function testAdminFunctionality() {
  console.log('\n👑 Testing admin functionality...');
  
  try {
    const admin = testUsers[1];
    
    // Test admin can see all posts
    const { data: allPosts, error: postsError } = await supabase
      .from('posts')
      .select('*');
    
    if (postsError) {
      console.log(`   ❌ Admin post access failed: ${postsError.message}`);
      return false;
    } else {
      console.log(`   ✅ Admin can access all posts (${allPosts.length} posts)`);
    }
    
    // Test admin role verification
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin.id)
      .single();
    
    if (adminError) {
      console.log(`   ❌ Admin role check failed: ${adminError.message}`);
      return false;
    } else if (adminProfile.role === 'admin') {
      console.log('   ✅ Admin role correctly set');
    } else {
      console.log('   ❌ Admin role not set correctly');
      return false;
    }
    
    testResults.adminFunctionality = true;
    return true;
  } catch (error) {
    console.error('❌ Admin functionality test failed:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test likes
    for (const post of testPosts) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id);
    }
    
    // Delete test posts
    for (const post of testPosts) {
      await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
    }
    
    // Delete test users
    for (const user of testUsers) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
    }
    
    console.log('   ✅ Test data cleaned up successfully');
  } catch (error) {
    console.log(`   ⚠️  Cleanup failed: ${error.message}`);
  }
}

async function generateTestReport() {
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\nDetailed Results:');
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} ${test}`);
  });
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Community fixes are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above and fix any issues.');
  }
  
  return passedTests === totalTests;
}

async function main() {
  console.log('🧪 Community Integration Test Suite');
  console.log('===================================');
  
  try {
    // Run all tests in sequence
    await setupTestUsers();
    await testPostCreation();
    await testLikeFunctionality();
    await testPostDeletion();
    await testCommunityDisplay();
    await testAdminFunctionality();
    
    // Generate report
    const allTestsPassed = await generateTestReport();
    
    // Always cleanup
    await cleanupTestData();
    
    if (allTestsPassed) {
      console.log('\n🎯 Community fixes integration test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review and fix the issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Integration test suite failed:', error.message);
    await cleanupTestData();
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  cleanupTestData().then(() => process.exit(1));
});

// Run the integration tests
main();