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
  console.log('🚀 Creating posts table manually...');
  
  try {
    // Create the posts table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
          
          -- Constraints
          CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_posts_is_active ON public.posts(is_active);
        CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);

        -- Enable RLS
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Anyone can view active posts" ON public.posts;
        CREATE POLICY "Anyone can view active posts" ON public.posts
          FOR SELECT USING (is_active = true);

        DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
        CREATE POLICY "Members can create posts" ON public.posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
        CREATE POLICY "Users can update own posts" ON public.posts
          FOR UPDATE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
        CREATE POLICY "Users can delete own posts" ON public.posts
          FOR DELETE USING (auth.uid() = user_id);

        -- Reload schema cache
        NOTIFY pgrst, 'reload schema';
      `
    });

    if (createError) {
      console.error('❌ Error creating posts table:', createError);
      return false;
    }

    console.log('✅ Posts table created successfully');

    // Test the table
    const { data, error: testError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Error testing posts table:', testError);
      return false;
    }

    console.log('✅ Posts table is accessible');
    console.log(`📊 Current posts count: ${data?.length || 0}`);

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