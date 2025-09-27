#!/usr/bin/env node

/**
 * Fix Supabase Connection Issues
 * Uses alternative methods to bypass schema cache problems
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRawSQL(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ ${description} failed:`, error.message);
      return false;
    }
    
    console.log(`✅ ${description} completed`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} error:`, err.message);
    return false;
  }
}

async function createCompleteSchema() {
  console.log('🚀 Creating complete database schema...\n');
  
  // Complete schema creation SQL
  const schemaSQL = `
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      country TEXT,
      bio TEXT,
      skills TEXT[],
      languages TEXT[],
      timezone TEXT,
      date_of_birth DATE,
      phone_number TEXT,
      social_links JSONB,
      preferences JSONB,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create user_roles table
    CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
      granted_by UUID REFERENCES profiles(id),
      granted_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(user_id, role)
    );

    -- Create posts table
    CREATE TABLE IF NOT EXISTS posts (
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

    -- Create groups table
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      external_link TEXT,
      member_count INTEGER DEFAULT 0,
      created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT groups_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
    );

    -- Create group_memberships table
    CREATE TABLE IF NOT EXISTS group_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(group_id, user_id)
    );

    -- Create post_likes table
    CREATE TABLE IF NOT EXISTS post_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    );
  `;
  
  return await executeRawSQL(schemaSQL, 'Creating database schema');
}

async function createIndexes() {
  const indexSQL = `
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
    CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN(skills);
    CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN(languages);
    
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
    CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
    
    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active);
    CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
    
    CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
    CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
    CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
    
    CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_group_memberships_is_active ON group_memberships(is_active);
    
    CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
  `;
  
  return await executeRawSQL(indexSQL, 'Creating database indexes');
}

async function setupRLS() {
  const rlsSQL = `
    -- Enable Row Level Security
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Anyone can view active posts" ON posts;
    DROP POLICY IF EXISTS "Users can create posts" ON posts;
    DROP POLICY IF EXISTS "Users can update own posts" ON posts;
    DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
    DROP POLICY IF EXISTS "Anyone can view active groups" ON groups;
    DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
    DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
    DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

    -- Create RLS policies for profiles
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);

    -- Create RLS policies for posts
    CREATE POLICY "Anyone can view active posts" ON posts
      FOR SELECT USING (is_active = true);
    
    CREATE POLICY "Users can create posts" ON posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own posts" ON posts
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own posts" ON posts
      FOR DELETE USING (auth.uid() = user_id);

    -- Create RLS policies for groups
    CREATE POLICY "Anyone can view active groups" ON groups
      FOR SELECT USING (is_active = true);

    -- Create RLS policies for post_likes
    CREATE POLICY "Anyone can view likes" ON post_likes
      FOR SELECT USING (true);
    
    CREATE POLICY "Users can like posts" ON post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can unlike posts" ON post_likes
      FOR DELETE USING (auth.uid() = user_id);
  `;
  
  return await executeRawSQL(rlsSQL, 'Setting up Row Level Security');
}

async function createTriggers() {
  const triggerSQL = `
    -- Create function to handle updated_at timestamp
    CREATE OR REPLACE FUNCTION handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers for updated_at
    DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();

    DROP TRIGGER IF EXISTS posts_updated_at ON posts;
    CREATE TRIGGER posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();

    DROP TRIGGER IF EXISTS groups_updated_at ON groups;
    CREATE TRIGGER groups_updated_at
      BEFORE UPDATE ON groups
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();

    -- Create function to automatically create profile on user signup
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO profiles (id, email, full_name)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
      );
      
      -- Assign default user role
      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.id, 'user');
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for automatic profile creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  `;
  
  return await executeRawSQL(triggerSQL, 'Creating database triggers');
}

async function testConnection() {
  console.log('\n🧪 Testing database connection...');
  
  try {
    // Test basic table access
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection working');
    return true;
  } catch (err) {
    console.error('❌ Connection test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Fixing Supabase Connection Issues');
  console.log('====================================\n');
  
  let success = true;
  
  // Step 1: Create complete schema
  success = await createCompleteSchema() && success;
  
  // Step 2: Create indexes
  success = await createIndexes() && success;
  
  // Step 3: Setup RLS
  success = await setupRLS() && success;
  
  // Step 4: Create triggers
  success = await createTriggers() && success;
  
  // Step 5: Test connection
  success = await testConnection() && success;
  
  console.log('\n📊 Setup Summary:');
  console.log('==================');
  
  if (success) {
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update auth service to use real database');
    console.log('2. Test user registration and login');
    console.log('3. Verify all features work correctly');
  } else {
    console.log('❌ Database setup encountered issues');
    console.log('\n📋 Manual intervention required:');
    console.log('1. Check Supabase dashboard for errors');
    console.log('2. Verify project settings and permissions');
    console.log('3. Consider recreating the Supabase project');
  }
}

main().catch(console.error);