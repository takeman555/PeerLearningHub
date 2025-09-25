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

async function testPostsTable() {
  console.log('🔍 Testing posts table access...');
  
  try {
    // Try to query the posts table
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Posts table error:', error);
      
      if (error.code === 'PGRST205') {
        console.log('📝 Posts table does not exist. You need to:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the following SQL:');
        console.log(`
-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active posts" ON public.posts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON public.posts(is_active);
        `);
      }
      return false;
    }

    console.log('✅ Posts table exists and is accessible!');
    console.log('📊 Current posts count:', data);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testProfilesTable() {
  console.log('🔍 Testing profiles table access...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Profiles table error:', error);
      return false;
    }

    console.log('✅ Profiles table exists and is accessible!');
    console.log('📊 Current profiles count:', data);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Testing database tables...\n');
  
  const profilesOk = await testProfilesTable();
  console.log('');
  const postsOk = await testPostsTable();
  
  console.log('\n📋 Summary:');
  console.log('Profiles table:', profilesOk ? '✅' : '❌');
  console.log('Posts table:', postsOk ? '✅' : '❌');
  
  if (!postsOk) {
    console.log('\n💡 To fix the posts table issue:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and run the SQL shown above');
    console.log('4. Run this script again to verify');
  }
}

runTests();