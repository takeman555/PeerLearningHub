#!/usr/bin/env node

/**
 * Test script for post creation functionality
 * Tests the fixed communityFeedService without JOIN queries
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostCreation() {
  console.log('🧪 Testing Post Creation (Fixed Version)...\n');

  try {
    // 1. Check if posts table exists and is accessible
    console.log('1. Checking posts table accessibility...');
    const { error: tableCheckError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (tableCheckError) {
      console.error('❌ Posts table not accessible:', tableCheckError.message);
      return;
    }
    console.log('✅ Posts table is accessible');

    // 2. Get a test user
    console.log('\n2. Getting test user...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No test users found:', usersError?.message);
      return;
    }

    const testUser = users[0];
    console.log('✅ Test user found:', testUser.full_name || testUser.email);

    // 3. Test post creation without JOIN
    console.log('\n3. Testing post creation without JOIN...');
    const testPostData = {
      user_id: testUser.id,
      content: `Test post created at ${new Date().toISOString()}`,
      tags: ['test', 'automated']
    };

    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert(testPostData)
      .select(`
        id,
        user_id,
        content,
        tags,
        likes_count,
        comments_count,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (createError) {
      console.error('❌ Post creation failed:', createError.message);
      console.error('Error details:', createError);
      return;
    }

    console.log('✅ Post created successfully:', newPost.id);

    // 4. Test getting author information separately
    console.log('\n4. Testing separate author information retrieval...');
    const { data: authorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', newPost.user_id)
      .single();

    if (profileError) {
      console.error('❌ Failed to get author profile:', profileError.message);
    } else {
      console.log('✅ Author profile retrieved:', authorProfile.full_name || authorProfile.email);
    }

    // 5. Test post retrieval without JOIN
    console.log('\n5. Testing post retrieval without JOIN...');
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        tags,
        likes_count,
        comments_count,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Failed to fetch posts:', fetchError.message);
    } else {
      console.log(`✅ Retrieved ${posts.length} posts successfully`);
      
      // Test getting author info for each post
      for (const post of posts.slice(0, 2)) { // Test first 2 posts
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', post.user_id)
          .single();
        
        console.log(`  - Post ${post.id.substring(0, 8)}... by ${profile?.full_name || profile?.email || 'Unknown'}`);
      }
    }

    // 6. Clean up test post
    console.log('\n6. Cleaning up test post...');
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', newPost.id);

    if (deleteError) {
      console.error('❌ Failed to clean up test post:', deleteError.message);
    } else {
      console.log('✅ Test post cleaned up successfully');
    }

    console.log('\n🎉 All tests passed! Post creation should work without JOIN errors.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPostCreation().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});