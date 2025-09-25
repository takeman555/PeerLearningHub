const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPostsTableFromScratch() {
  console.log('🚀 Creating posts table from scratch using SQL Editor approach...');
  
  const createTableSQL = `
-- Drop table if exists (for clean start)
DROP TABLE IF EXISTS public.posts CASCADE;

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_is_active ON public.posts(is_active);
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active posts" ON public.posts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
  `;

  console.log('📋 SQL to execute in Supabase Dashboard:');
  console.log('=====================================');
  console.log(createTableSQL);
  console.log('=====================================');
  console.log('');
  console.log('🔧 Please copy the above SQL and execute it in:');
  console.log('   Supabase Dashboard → SQL Editor → New Query → Paste → Run');
  console.log('');
  console.log('⚠️  After execution, run this script again to test the table.');

  // Try to test if table exists
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Table not found - please execute the SQL above');
      return false;
    }

    console.log('✅ Posts table exists and is accessible!');
    console.log(`📊 Current posts count: ${data?.length || 0}`);
    return true;
  } catch (error) {
    console.log('❌ Table not accessible - please execute the SQL above');
    return false;
  }
}

if (require.main === module) {
  createPostsTableFromScratch().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { createPostsTableFromScratch };