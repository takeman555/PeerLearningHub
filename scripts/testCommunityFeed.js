const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommunityFeed() {
  console.log('🚀 Testing Community Feed Service...\n');
  
  try {
    // Test 1: Get posts with author information (without JOIN)
    console.log('🔍 Test 1: Fetching posts with author information...');
    const { data: posts, error: postsError } = await supabase
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

    if (postsError) {
      console.error('❌ Error fetching posts:', postsError);
    } else {
      console.log('✅ Posts query successful!');
      console.log(`📊 Found ${posts.length} posts`);
      if (posts.length > 0) {
        // Get author information separately
        const { data: author } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', posts[0].user_id)
          .single();
        
        console.log('📝 Sample post:', {
          id: posts[0].id,
          content: posts[0].content.substring(0, 50) + '...',
          author: author?.full_name || 'Unknown',
          created: posts[0].created_at
        });
      }
    }

    // Test 2: Check profiles table
    console.log('\n🔍 Test 2: Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active')
      .eq('is_active', true)
      .limit(3);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log('✅ Profiles query successful!');
      console.log(`📊 Found ${profiles.length} active profiles`);
      profiles.forEach(profile => {
        console.log(`👤 ${profile.full_name || 'No name'} (${profile.email})`);
      });
    }

    // Test 3: Check user_roles table
    console.log('\n🔍 Test 3: Checking user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, is_active')
      .eq('is_active', true)
      .limit(3);

    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError);
    } else {
      console.log('✅ User roles query successful!');
      console.log(`📊 Found ${roles.length} active user roles`);
      roles.forEach(role => {
        console.log(`🔑 User ${role.user_id}: ${role.role}`);
      });
    }

    // Test 4: Test permission check simulation (without JOIN)
    console.log('\n🔍 Test 4: Testing permission check simulation...');
    if (profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_active')
        .eq('id', testUserId)
        .eq('is_active', true)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
      } else {
        // Get user roles separately
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role, is_active')
          .eq('user_id', testUserId)
          .eq('is_active', true);

        if (rolesError) {
          console.error('❌ Error fetching user roles:', rolesError);
        } else {
          console.log('✅ Permission check successful!');
          console.log(`👤 User: ${userProfile.full_name || userProfile.email}`);
          console.log(`🔑 Roles: ${userRoles.map(r => r.role).join(', ') || 'No roles assigned'}`);
        }
      }
    }

    console.log('\n🎉 All tests completed!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testCommunityFeed();