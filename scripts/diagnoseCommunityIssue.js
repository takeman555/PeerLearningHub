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

async function diagnoseCommunityIssue() {
  console.log('🔍 Community Management Diagnostic Tool');
  console.log('=====================================\n');
  
  let issuesFound = 0;
  let recommendations = [];

  // Test 1: Check if posts table exists (count method)
  console.log('1. Testing posts table existence...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Posts table does not exist');
      issuesFound++;
      recommendations.push('Create the posts table using the Supabase SQL editor');
    } else {
      console.log('✅ Posts table exists');
    }
  } catch (err) {
    console.log('❌ Error checking posts table:', err.message);
    issuesFound++;
  }

  // Test 2: Check if posts table is queryable
  console.log('\n2. Testing posts table queryability...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        console.log('❌ Posts table exists but is not in schema cache');
        issuesFound++;
        recommendations.push('Restart PostgREST service or refresh schema cache in Supabase dashboard');
      } else {
        console.log('❌ Posts table query error:', error.message);
        issuesFound++;
      }
    } else {
      console.log('✅ Posts table is queryable');
    }
  } catch (err) {
    console.log('❌ Error querying posts table:', err.message);
    issuesFound++;
  }

  // Test 3: Check profiles table
  console.log('\n3. Testing profiles table...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(1);

    if (error) {
      console.log('❌ Profiles table error:', error.message);
      issuesFound++;
    } else {
      console.log('✅ Profiles table is working');
      if (data.length === 0) {
        console.log('⚠️  No profiles found - you may need to create test users');
        recommendations.push('Create test user profiles for testing');
      }
    }
  } catch (err) {
    console.log('❌ Error with profiles table:', err.message);
    issuesFound++;
  }

  // Test 4: Check user_roles table
  console.log('\n4. Testing user_roles table...');
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .limit(1);

    if (error) {
      console.log('❌ User roles table error:', error.message);
      issuesFound++;
    } else {
      console.log('✅ User roles table is working');
      if (data.length === 0) {
        console.log('⚠️  No user roles found - you may need to assign roles to users');
        recommendations.push('Assign roles to test users');
      }
    }
  } catch (err) {
    console.log('❌ Error with user_roles table:', err.message);
    issuesFound++;
  }

  // Summary
  console.log('\n📋 Diagnostic Summary');
  console.log('====================');
  console.log(`Issues found: ${issuesFound}`);
  
  if (issuesFound === 0) {
    console.log('🎉 All tests passed! The community management system should work.');
  } else {
    console.log('\n💡 Recommendations to fix issues:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n🔧 Quick Fix Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL to refresh the schema:');
    console.log(`
-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Or recreate the posts table if needed
DROP TABLE IF EXISTS public.posts CASCADE;

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
    
    console.log('\n4. After running the SQL, restart your app and try again');
  }
}

diagnoseCommunityIssue();