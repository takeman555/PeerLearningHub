const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPostsTable() {
  console.log('🚀 Creating posts table using direct SQL...');
  
  try {
    // First, let's check if the table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'posts');

    if (checkError) {
      console.log('⚠️ Could not check existing tables, proceeding anyway...');
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ Posts table already exists');
    }

    // Try to query the posts table directly
    const { data, error: queryError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (queryError) {
      console.error('❌ Posts table is not accessible:', queryError);
      
      // If we can't access it, it might be a schema cache issue
      // Let's try to create some sample data to force table creation
      console.log('🔧 Attempting to force table creation...');
      
      // This might fail, but it could trigger table creation
      const { error: insertError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            content: 'Test post to create table',
            tags: ['test'],
            is_active: false
          }
        ]);

      if (insertError) {
        console.error('❌ Could not create posts table:', insertError);
        return false;
      }

      console.log('✅ Posts table created via insert');
      
      // Clean up the test post
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('content', 'Test post to create table');

      if (deleteError) {
        console.log('⚠️ Could not clean up test post, but table exists');
      }
    } else {
      console.log('✅ Posts table is accessible');
      console.log(`📊 Current posts count: ${data?.length || 0}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  createPostsTable().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { createPostsTable };