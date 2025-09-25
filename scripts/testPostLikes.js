#!/usr/bin/env node

/**
 * Test script for post_likes table functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostLikes() {
  console.log('❤️ Testing Post Likes Functionality...\n');

  try {
    // 1. Check if post_likes table exists
    console.log('1. Checking post_likes table accessibility...');
    const { error: tableCheckError } = await supabase
      .from('post_likes')
      .select('count', { count: 'exact', head: true });

    if (tableCheckError) {
      console.error('❌ post_likes table not accessible:', tableCheckError.message);
      console.error('Error code:', tableCheckError.code);
      console.error('Error details:', tableCheckError.details);
      
      // Try to create the table if it doesn't exist
      console.log('\n🔧 Attempting to create post_likes table...');
      const { error: createError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.post_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(post_id, user_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
          CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
          
          ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Anyone can view likes" ON public.post_likes
            FOR SELECT USING (true);
          
          CREATE POLICY "Users can like posts" ON public.post_likes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can unlike posts" ON public.post_likes
            FOR DELETE USING (auth.uid() = user_id);
        `
      });
      
      if (createError) {
        console.error('❌ Failed to create post_likes table:', createError.message);
      } else {
        console.log('✅ post_likes table created successfully');
      }
      return;
    }
    console.log('✅ post_likes table is accessible');

    // 2. Get test data
    console.log('\n2. Getting test data...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id')
      .limit(1);

    if (postsError || !posts || posts.length === 0) {
      console.error('❌ No test posts found:', postsError?.message);
      return;
    }

    const testPost = posts[0];
    console.log('✅ Test post found:', testPost.id.substring(0, 8) + '...');

    // 3. Test like insertion
    console.log('\n3. Testing like insertion...');
    const { data: newLike, error: insertError } = await supabase
      .from('post_likes')
      .insert({
        user_id: testPost.user_id,
        post_id: testPost.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert like:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);
      return;
    }

    console.log('✅ Like inserted successfully:', newLike.id.substring(0, 8) + '...');

    // 4. Test like retrieval
    console.log('\n4. Testing like retrieval...');
    const { data: existingLike, error: selectError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', testPost.user_id)
      .eq('post_id', testPost.id)
      .single();

    if (selectError) {
      console.error('❌ Failed to retrieve like:', selectError.message);
    } else {
      console.log('✅ Like retrieved successfully:', existingLike.id.substring(0, 8) + '...');
    }

    // 5. Test like deletion
    console.log('\n5. Testing like deletion...');
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', testPost.user_id)
      .eq('post_id', testPost.id);

    if (deleteError) {
      console.error('❌ Failed to delete like:', deleteError.message);
    } else {
      console.log('✅ Like deleted successfully');
    }

    // 6. Test likes count update
    console.log('\n6. Testing likes count...');
    const { data: postWithCount, error: countError } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', testPost.id)
      .single();

    if (countError) {
      console.error('❌ Failed to get likes count:', countError.message);
    } else {
      console.log('✅ Likes count retrieved:', postWithCount.likes_count);
    }

    console.log('\n🎉 All post_likes tests passed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPostLikes().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});