#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProfile() {
  console.log('👤 Getting or creating test profile for post creation test...\n');

  try {
    // Try to get existing profile first
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();

    if (profileError || !profile) {
      console.log('No existing profile found, creating new one...');
      
      // Create a test profile directly
      const testProfile = {
        id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for testing
        full_name: 'Test User',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert(testProfile)
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create test profile:', createError.message);
        return;
      }

      profile = newProfile;

      // Also create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: testProfile.id,
          role: 'user'
        });
      
      if (roleError) {
        console.warn('⚠️ Failed to create user role:', roleError.message);
      }
    }

    console.log('✅ Using profile:', profile.full_name || profile.email);

    // Now test post creation
    console.log('\n📝 Testing post creation with test profile...');
    
    const testPostData = {
      user_id: profile.id,
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
      console.error('Error code:', createError.code);
      console.error('Error details:', createError.details);
      return;
    }

    console.log('✅ Post created successfully!');
    console.log('Post ID:', newPost.id);
    console.log('Content:', newPost.content);

    // Test getting author info separately
    const { data: authorProfile, error: authorError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', newPost.user_id)
      .single();

    if (authorError) {
      console.error('❌ Failed to get author profile:', authorError.message);
    } else {
      console.log('✅ Author profile retrieved:', authorProfile.full_name);
    }

    // Clean up
    console.log('\n🧹 Cleaning up test post...');
    await supabase.from('posts').delete().eq('id', newPost.id);
    console.log('✅ Test post cleaned up');

    console.log('\n🎉 Post creation test successful! The JOIN error should be fixed.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

createTestProfile();