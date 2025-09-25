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

async function testPostsQueries() {
  console.log('🔍 Testing different posts queries...\n');
  
  // Test 1: Simple select without joins
  console.log('Test 1: Simple select all columns');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Found', data.length, 'posts');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 2: Select specific columns
  console.log('\nTest 2: Select specific columns');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Found', data.length, 'posts');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 3: Try with join to profiles
  console.log('\nTest 3: Join with profiles table');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        profiles(full_name, email)
      `)
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Found', data.length, 'posts');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 4: Try the exact query from the service
  console.log('\nTest 4: Exact service query');
  try {
    const { data, error } = await supabase
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
        updated_at,
        profiles!posts_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Found', data.length, 'posts');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 5: Check if we can insert a test post
  console.log('\nTest 5: Try to insert a test post (will fail without auth)');
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        content: 'Test post'
      })
      .select();

    if (error) {
      console.log('❌ Error (expected):', error.message);
    } else {
      console.log('✅ Unexpected success:', data);
    }
  } catch (err) {
    console.log('❌ Exception (expected):', err.message);
  }
}

testPostsQueries();