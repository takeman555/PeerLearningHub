#!/usr/bin/env node

/**
 * Check deleted posts in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeletedPosts() {
  console.log('🔍 Checking posts status in database...\n');

  try {
    // Get all posts (including deleted ones)
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('id, content, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all posts:', allError.message);
      return;
    }

    console.log(`📊 Total posts in database: ${allPosts.length}`);
    
    const activePosts = allPosts.filter(post => post.is_active);
    const deletedPosts = allPosts.filter(post => !post.is_active);
    
    console.log(`✅ Active posts: ${activePosts.length}`);
    console.log(`❌ Deleted posts: ${deletedPosts.length}\n`);

    if (deletedPosts.length > 0) {
      console.log('🗑️ Deleted posts:');
      deletedPosts.forEach(post => {
        console.log(`  - ID: ${post.id.substring(0, 8)}...`);
        console.log(`    Content: ${post.content.substring(0, 50)}...`);
        console.log(`    Deleted at: ${post.updated_at}`);
        console.log('');
      });
    }

    // Check what the API returns (active posts only)
    const { data: apiPosts, error: apiError } = await supabase
      .from('posts')
      .select('id, content, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (apiError) {
      console.error('❌ Error fetching API posts:', apiError.message);
      return;
    }

    console.log(`🔄 Posts returned by API (should match active posts): ${apiPosts.length}`);
    
    if (activePosts.length !== apiPosts.length) {
      console.log('⚠️ Mismatch detected! API might be returning cached data.');
    } else {
      console.log('✅ API results match database active posts.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeletedPosts();