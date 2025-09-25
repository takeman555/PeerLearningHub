const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPostsTable() {
  console.log('🚀 Creating posts table directly...');
  
  try {
    // Create posts table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (createError) {
      console.error('❌ Error creating posts table:', createError);
      return false;
    }

    console.log('✅ Posts table created successfully');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return false;
    }

    console.log('✅ RLS enabled on posts table');

    // Create basic policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Anyone can view active posts" ON public.posts
          FOR SELECT USING (is_active = true);

        CREATE POLICY "Authenticated users can create posts" ON public.posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own posts" ON public.posts
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own posts" ON public.posts
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError);
      return false;
    }

    console.log('✅ Basic policies created');

    // Test the table
    const { data, error: testError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (testError) {
      console.error('❌ Error testing posts table:', testError);
      return false;
    }

    console.log('✅ Posts table is working! Current count:', data);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the function
createPostsTable().then(success => {
  if (success) {
    console.log('🎉 Posts table setup completed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Posts table setup failed');
    process.exit(1);
  }
});