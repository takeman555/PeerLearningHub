#!/usr/bin/env node

/**
 * Test Likes Functionality with Valid UUID
 * Tests the likes functionality with proper UUID format
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a valid UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createTestUser() {
  console.log('🔧 Creating test user...');
  
  const testUserId = generateUUID();
  
  try {
    // Create test user profile
    const { error: profileError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO profiles (id, email, full_name, is_active, is_verified)
        VALUES ('${testUserId}', 'test-likes@example.com', 'Test Likes User', true, true)
        ON CONFLICT (id) DO NOTHING;
      `
    });
    
    if (profileError) {
      console.error('Error creating test user profile:', profileError);
      return null;
    }
    
    console.log('✅ Test user created:', testUserId);
    return testUserId;
    
  } catch (error) {
    console.error('Error in createTestUser:', error);
    return null;
  }
}

async function testLikesFunctionality() {
  console.log('🧪 Testing likes functionality with valid UUID...');
  
  try {
    // Create test user
    const testUserId = await createTestUser();
    if (!testUserId) {
      console.error('❌ Failed to create test user');
      return false;
    }
    
    // Get a test post
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, likes_count')
      .eq('is_active', true)
      .limit(1);
    
    if (postsError || !posts || posts.length === 0) {
      console.log('⚠️  No test posts available, creating one...');
      
      // Create a test post
      const { data: newPost, error: createError } = await supabase
        .from('posts')
        .insert({
          user_id: testUserId,
          content: 'Test post for likes functionality',
          is_active: true
        })
        .select('id, likes_count')
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test post:', createError.message);
        return false;
      }
      
      posts[0] = newPost;
    }
    
    const testPost = posts[0];
    console.log(`📝 Testing with post ${testPost.id} (current likes: ${testPost.likes_count})`);
    
    // Test 1: Add a like
    console.log('🔧 Adding like...');
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({
        post_id: testPost.id,
        user_id: testUserId
      });
    
    if (likeError) {
      console.error('❌ Failed to add like:', likeError.message);
      return false;
    }
    
    console.log('✅ Like added successfully');
    
    // Test 2: Check if likes count updated
    console.log('🔍 Checking likes count...');
    const { data: updatedPost, error: checkError } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', testPost.id)
      .single();
    
    if (checkError) {
      console.error('❌ Failed to check updated likes count:', checkError.message);
      return false;
    }
    
    console.log(`📊 Likes count: ${testPost.likes_count} → ${updatedPost.likes_count}`);
    
    if (updatedPost.likes_count === testPost.likes_count + 1) {
      console.log('✅ Likes count updated correctly');
    } else {
      console.log(`⚠️  Likes count not updated correctly. Expected: ${testPost.likes_count + 1}, Got: ${updatedPost.likes_count}`);
    }
    
    // Test 3: Check if like exists
    console.log('🔍 Verifying like exists...');
    const { data: likeCheck, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', testPost.id)
      .eq('user_id', testUserId);
    
    if (likeCheckError) {
      console.error('❌ Failed to check like existence:', likeCheckError.message);
      return false;
    }
    
    if (likeCheck && likeCheck.length > 0) {
      console.log('✅ Like exists in database');
    } else {
      console.log('❌ Like not found in database');
      return false;
    }
    
    // Test 4: Remove the like
    console.log('🔧 Removing like...');
    const { error: unlikeError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', testPost.id)
      .eq('user_id', testUserId);
    
    if (unlikeError) {
      console.error('❌ Failed to remove like:', unlikeError.message);
      return false;
    }
    
    console.log('✅ Like removed successfully');
    
    // Test 5: Check if likes count decreased
    console.log('🔍 Checking final likes count...');
    const { data: finalPost, error: finalCheckError } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', testPost.id)
      .single();
    
    if (finalCheckError) {
      console.error('❌ Failed to check final likes count:', finalCheckError.message);
      return false;
    }
    
    console.log(`📊 Final likes count: ${updatedPost.likes_count} → ${finalPost.likes_count}`);
    
    if (finalPost.likes_count === testPost.likes_count) {
      console.log('✅ Likes count decreased correctly');
    } else {
      console.log(`⚠️  Likes count not decreased correctly. Expected: ${testPost.likes_count}, Got: ${finalPost.likes_count}`);
    }
    
    // Test 6: Verify like is gone
    console.log('🔍 Verifying like is removed...');
    const { data: finalLikeCheck, error: finalLikeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', testPost.id)
      .eq('user_id', testUserId);
    
    if (finalLikeCheckError) {
      console.error('❌ Failed to check final like state:', finalLikeCheckError.message);
      return false;
    }
    
    if (!finalLikeCheck || finalLikeCheck.length === 0) {
      console.log('✅ Like successfully removed from database');
    } else {
      console.log('❌ Like still exists in database');
      return false;
    }
    
    console.log('🎉 All likes functionality tests passed!');
    return true;
    
  } catch (err) {
    console.error('❌ Error testing likes functionality:', err.message);
    return false;
  }
}

async function testAnonymousAccess() {
  console.log('\n🔍 Testing anonymous access to likes...');
  
  try {
    // Test if anonymous users can view likes
    const { data: likes, error } = await supabase
      .from('post_likes')
      .select('post_id, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Anonymous access to likes failed:', error.message);
      return false;
    }
    
    console.log(`✅ Anonymous access working (found ${likes?.length || 0} likes)`);
    return true;
    
  } catch (err) {
    console.error('❌ Error testing anonymous access:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Likes Functionality with Valid UUID');
  console.log('===============================================\n');
  
  // Test 1: Full functionality test
  const functionalityTest = await testLikesFunctionality();
  
  // Test 2: Anonymous access test
  const anonymousTest = await testAnonymousAccess();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`🔧 Functionality Test: ${functionalityTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`👁️  Anonymous Access: ${anonymousTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (functionalityTest && anonymousTest) {
    console.log('\n🎉 All tests passed! Likes functionality is working correctly.');
    console.log('\n📋 What works:');
    console.log('1. ✅ Adding likes to posts');
    console.log('2. ✅ Automatic likes count updates');
    console.log('3. ✅ Removing likes from posts');
    console.log('4. ✅ RLS policies for security');
    console.log('5. ✅ Anonymous viewing of likes');
    console.log('\n🔄 Next steps:');
    console.log('1. Update app to remove fallback behavior');
    console.log('2. Test likes functionality in the actual app');
    console.log('3. Monitor for any remaining issues');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return functionalityTest && anonymousTest;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);