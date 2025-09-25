const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPostsDirectly() {
  console.log('🚀 Testing posts table directly...');
  
  try {
    // Test 1: Simple select
    console.log('🔍 Test 1: Simple select from posts...');
    const { data: posts, error: selectError } = await supabase
      .from('posts')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Select error:', selectError);
      return false;
    }

    console.log(`✅ Select successful, found ${posts.length} posts`);

    // Test 2: Count query
    console.log('🔍 Test 2: Count query...');
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count error:', countError);
      return false;
    }

    console.log(`✅ Count successful: ${count} posts`);

    // Test 3: Insert test post
    console.log('🔍 Test 3: Insert test post...');
    const testUserId = '2d3bb1bb-033a-4ef2-a4c9-4fca3677261e'; // From our earlier test
    
    const { data: insertData, error: insertError } = await supabase
      .from('posts')
      .insert([
        {
          user_id: testUserId,
          content: 'Test post from direct script',
          tags: ['test'],
          is_active: true
        }
      ])
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return false;
    }

    console.log('✅ Insert successful:', insertData);

    // Test 4: Query the inserted post
    console.log('🔍 Test 4: Query inserted post...');
    const { data: queryData, error: queryError } = await supabase
      .from('posts')
      .select('*')
      .eq('content', 'Test post from direct script');

    if (queryError) {
      console.error('❌ Query error:', queryError);
      return false;
    }

    console.log('✅ Query successful:', queryData);

    // Test 5: Clean up
    console.log('🔍 Test 5: Clean up test post...');
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('content', 'Test post from direct script');

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  testPostsDirectly().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPostsDirectly };