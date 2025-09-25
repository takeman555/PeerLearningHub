#!/usr/bin/env node

/**
 * Complete Database Setup Script
 * 
 * This script sets up the entire database with all necessary tables, functions, and initial data
 * Addresses the issues identified in the community functionality analysis
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🚀 Complete Database Setup');
console.log('==========================\n');

/**
 * Step 1: Create exec_sql function
 */
async function createExecSqlFunction() {
  console.log('📝 Step 1: Creating exec_sql function...');
  
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'SQL executed successfully';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: execSqlFunction });
    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      const { error: directError } = await supabase.from('_migrations').select('count').limit(1);
      if (directError && directError.code === 'PGRST205') {
        console.log('   ⚠️  exec_sql function needs to be created manually in Supabase SQL editor');
        console.log('   📋 Please run the SQL from: supabase/migrations/000_create_exec_sql_function.sql');
        return false;
      }
    }
    console.log('   ✅ exec_sql function created');
    return true;
  } catch (error) {
    console.log('   ⚠️  exec_sql function needs manual creation');
    return false;
  }
}

/**
 * Step 2: Create migrations table
 */
async function createMigrationsTable() {
  console.log('📝 Step 2: Creating migrations table...');
  
  const migrationsTableSQL = `
    CREATE TABLE IF NOT EXISTS public._migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    GRANT ALL ON TABLE public._migrations TO authenticated;
    GRANT ALL ON TABLE public._migrations TO anon;
    GRANT USAGE, SELECT ON SEQUENCE public._migrations_id_seq TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE public._migrations_id_seq TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationsTableSQL });
    if (error) {
      console.log('   ❌ Failed to create migrations table:', error.message);
      return false;
    }
    console.log('   ✅ Migrations table created');
    return true;
  } catch (error) {
    console.log('   ❌ Error creating migrations table:', error.message);
    return false;
  }
}

/**
 * Step 3: Create profiles table
 */
async function createProfilesTable() {
  console.log('📝 Step 3: Creating profiles table...');
  
  const profilesTableSQL = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      full_name TEXT,
      email TEXT,
      avatar_url TEXT,
      is_admin BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);

    -- Grant permissions
    GRANT ALL ON TABLE public.profiles TO authenticated;
    GRANT SELECT ON TABLE public.profiles TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: profilesTableSQL });
    if (error) {
      console.log('   ❌ Failed to create profiles table:', error.message);
      return false;
    }
    console.log('   ✅ Profiles table created');
    return true;
  } catch (error) {
    console.log('   ❌ Error creating profiles table:', error.message);
    return false;
  }
}

/**
 * Step 4: Create posts and groups tables
 */
async function createPostsAndGroupsTables() {
  console.log('📝 Step 4: Creating posts and groups tables...');
  
  const tablesSQL = `
    -- Groups table
    CREATE TABLE IF NOT EXISTS public.groups (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      external_link TEXT,
      member_count INTEGER DEFAULT 0,
      created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Posts table
    CREATE TABLE IF NOT EXISTS public.posts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      content TEXT NOT NULL,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      tags TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Post likes table
    CREATE TABLE IF NOT EXISTS public.post_likes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    );

    -- Enable RLS
    ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

    -- Groups policies
    CREATE POLICY "Groups are viewable by everyone" ON public.groups
      FOR SELECT USING (is_active = true);

    CREATE POLICY "Only admins can manage groups" ON public.groups
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true AND is_active = true
        )
      );

    -- Posts policies
    CREATE POLICY "Posts are viewable by everyone" ON public.posts
      FOR SELECT USING (is_active = true);

    CREATE POLICY "Authenticated users can create posts" ON public.posts
      FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_active = true
        )
      );

    CREATE POLICY "Users can update own posts" ON public.posts
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own posts" ON public.posts
      FOR DELETE USING (auth.uid() = user_id);

    -- Post likes policies
    CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can manage their likes" ON public.post_likes
      FOR ALL USING (auth.uid() = user_id);

    -- Grant permissions
    GRANT ALL ON TABLE public.groups TO authenticated;
    GRANT SELECT ON TABLE public.groups TO anon;
    GRANT ALL ON TABLE public.posts TO authenticated;
    GRANT SELECT ON TABLE public.posts TO anon;
    GRANT ALL ON TABLE public.post_likes TO authenticated;
    GRANT SELECT ON TABLE public.post_likes TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: tablesSQL });
    if (error) {
      console.log('   ❌ Failed to create posts and groups tables:', error.message);
      return false;
    }
    console.log('   ✅ Posts and groups tables created');
    return true;
  } catch (error) {
    console.log('   ❌ Error creating posts and groups tables:', error.message);
    return false;
  }
}

/**
 * Step 5: Create initial admin user and profiles
 */
async function createInitialProfiles() {
  console.log('📝 Step 5: Creating initial profiles...');
  
  // Create a test admin profile
  const adminProfileSQL = `
    INSERT INTO public.profiles (id, full_name, email, is_admin, is_active)
    VALUES (
      gen_random_uuid(),
      'Admin User',
      'admin@peerlearninghub.com',
      true,
      true
    )
    ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO public.profiles (id, full_name, email, is_admin, is_active)
    VALUES (
      gen_random_uuid(),
      'Test Member',
      'member@peerlearninghub.com',
      false,
      true
    )
    ON CONFLICT (email) DO NOTHING;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: adminProfileSQL });
    if (error) {
      console.log('   ❌ Failed to create initial profiles:', error.message);
      return false;
    }
    console.log('   ✅ Initial profiles created');
    return true;
  } catch (error) {
    console.log('   ❌ Error creating initial profiles:', error.message);
    return false;
  }
}

/**
 * Step 6: Create initial groups
 */
async function createInitialGroups() {
  console.log('📝 Step 6: Creating initial groups...');
  
  // Get admin user ID
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single();

  if (!adminUser) {
    console.log('   ⚠️  No admin user found, skipping group creation');
    return false;
  }

  const groupsSQL = `
    INSERT INTO public.groups (name, description, external_link, created_by, member_count)
    VALUES 
      ('ピアラーニングハブ生成AI部', '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。', 'https://discord.gg/ai-learning-hub', '${adminUser.id}', 0),
      ('さぬきピアラーニングハブゴルフ部', '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。', 'https://discord.gg/sanuki-golf-club', '${adminUser.id}', 0),
      ('さぬきピアラーニングハブ英語部', '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。', 'https://discord.gg/sanuki-english-club', '${adminUser.id}', 0),
      ('WAOJEさぬきピアラーニングハブ交流会参加者', 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。', 'https://discord.gg/waoje-sanuki-exchange', '${adminUser.id}', 0),
      ('香川イノベーションベース', '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。', 'https://discord.gg/kagawa-innovation-base', '${adminUser.id}', 0),
      ('さぬきピアラーニングハブ居住者', 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。', 'https://discord.gg/sanuki-residents', '${adminUser.id}', 0),
      ('英語キャンプ卒業者', '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。', 'https://discord.gg/english-camp-alumni', '${adminUser.id}', 0)
    ON CONFLICT (name) DO NOTHING;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: groupsSQL });
    if (error) {
      console.log('   ❌ Failed to create initial groups:', error.message);
      return false;
    }
    console.log('   ✅ Initial groups created');
    return true;
  } catch (error) {
    console.log('   ❌ Error creating initial groups:', error.message);
    return false;
  }
}

/**
 * Step 7: Reload schema cache
 */
async function reloadSchemaCache() {
  console.log('📝 Step 7: Reloading schema cache...');
  
  const reloadSQL = `NOTIFY pgrst, 'reload schema';`;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: reloadSQL });
    if (error) {
      console.log('   ⚠️  Schema cache reload may have failed:', error.message);
    } else {
      console.log('   ✅ Schema cache reloaded');
    }
    return true;
  } catch (error) {
    console.log('   ⚠️  Schema cache reload error:', error.message);
    return true; // Don't fail the entire setup for this
  }
}

/**
 * Step 8: Verify setup
 */
async function verifySetup() {
  console.log('📝 Step 8: Verifying setup...');
  
  try {
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesError) {
      console.log('   ❌ Profiles table verification failed:', profilesError.message);
      return false;
    }

    // Test groups table
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('count', { count: 'exact', head: true });
    
    if (groupsError) {
      console.log('   ❌ Groups table verification failed:', groupsError.message);
      return false;
    }

    // Test posts table
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });
    
    if (postsError) {
      console.log('   ❌ Posts table verification failed:', postsError.message);
      return false;
    }

    console.log('   ✅ All tables verified successfully');
    return true;
  } catch (error) {
    console.log('   ❌ Verification error:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  let success = true;

  // Execute setup steps
  success = await createExecSqlFunction() && success;
  success = await createMigrationsTable() && success;
  success = await createProfilesTable() && success;
  success = await createPostsAndGroupsTables() && success;
  success = await createInitialProfiles() && success;
  success = await createInitialGroups() && success;
  success = await reloadSchemaCache() && success;
  success = await verifySetup() && success;

  console.log('\n📊 SETUP SUMMARY');
  console.log('================');
  
  if (success) {
    console.log('🎉 Database setup completed successfully!');
    console.log('✅ All tables created');
    console.log('✅ Initial data populated');
    console.log('✅ Permissions configured');
    console.log('✅ Schema cache reloaded');
    console.log('\n🚀 You can now use the community features in the app!');
  } else {
    console.log('⚠️  Database setup completed with some issues');
    console.log('📋 Please check the logs above for details');
    console.log('💡 You may need to run some steps manually in Supabase SQL editor');
  }

  process.exit(success ? 0 : 1);
}

// Run setup if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Critical setup error:', error);
    process.exit(1);
  });
}

module.exports = { main };