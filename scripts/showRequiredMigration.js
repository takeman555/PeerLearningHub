#!/usr/bin/env node

/**
 * Show Required Migration Script
 * 
 * This script displays the SQL that needs to be executed manually
 * in Supabase SQL Editor to enable phase management features.
 */

const fs = require('fs');
const path = require('path');

function showMigrationSQL() {
  console.log('📋 Required Database Migration for Phase Management');
  console.log('===================================================');
  
  console.log('\n🔧 Please execute the following SQL in Supabase SQL Editor:');
  console.log('-----------------------------------------------------------');
  
  const migrationSQL = `
-- Phase Management Database Migration
-- Execute this SQL in Supabase SQL Editor

-- 1. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
ADD COLUMN IF NOT EXISTS show_in_community BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'free' CHECK (membership_status IN ('free', 'premium', 'lifetime'));

-- 2. Make email column nullable if it exists and is required
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 3. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_community_display 
ON profiles (show_in_community, membership_status) 
WHERE show_in_community = true;

-- 4. Ensure foreign key relationship between posts and profiles exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Ensure foreign key relationship between post_likes and profiles exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'post_likes_user_id_fkey' 
        AND table_name = 'post_likes'
    ) THEN
        ALTER TABLE post_likes DROP CONSTRAINT post_likes_user_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. Update existing users with default values
UPDATE profiles 
SET 
    role = COALESCE(role, 'user'),
    show_in_community = COALESCE(show_in_community, true),
    membership_status = COALESCE(membership_status, 'premium')
WHERE role IS NULL OR show_in_community IS NULL OR membership_status IS NULL;

-- 7. Create or update RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 8. Create or update RLS policies for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts or admins can delete any" ON posts;

-- Create comprehensive RLS policies for posts
CREATE POLICY "Users can view all posts" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts or admins can delete any" ON posts
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 9. Create or update RLS policies for post_likes table
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON post_likes;

-- Create comprehensive RLS policies for post_likes
CREATE POLICY "Users can view all likes" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON post_likes
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 10. Add comments for documentation
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or super_admin';
COMMENT ON COLUMN profiles.show_in_community IS 'Whether the user wants to be displayed in the community member list';
COMMENT ON COLUMN profiles.membership_status IS 'User membership status: free, premium, or lifetime';

-- 11. Create a function to validate data integrity
CREATE OR REPLACE FUNCTION validate_community_data_integrity()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_posts INTEGER;
    orphaned_likes INTEGER;
BEGIN
    -- Check for orphaned posts (posts without valid user_id)
    SELECT COUNT(*) INTO orphaned_posts
    FROM posts p
    LEFT JOIN profiles pr ON p.user_id = pr.id
    WHERE pr.id IS NULL;
    
    -- Check for orphaned likes (likes without valid user_id or post_id)
    SELECT COUNT(*) INTO orphaned_likes
    FROM post_likes pl
    LEFT JOIN profiles pr ON pl.user_id = pr.id
    LEFT JOIN posts p ON pl.post_id = p.id
    WHERE pr.id IS NULL OR p.id IS NULL;
    
    -- Return true if no orphaned records found
    RETURN (orphaned_posts = 0 AND orphaned_likes = 0);
END;
$$;

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_community_data_integrity() TO authenticated;

-- 13. Run integrity check
SELECT validate_community_data_integrity() as integrity_check_passed;
`;

  console.log(migrationSQL);
  
  console.log('\n📋 Steps to Execute:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your PeerLearningHub project');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Create a new query');
  console.log('5. Copy and paste the SQL above');
  console.log('6. Click "Run" to execute');
  console.log('7. Verify the result shows "integrity_check_passed: true"');
  
  console.log('\n✅ After Migration:');
  console.log('- Run: node scripts/directSchemaCheck.js (to verify schema)');
  console.log('- Run: node scripts/createSuperAdmin.js admin@example.com password123 "Super Admin"');
  console.log('- Run: node scripts/testNextPhaseAccess.js (to test access control)');
}

function main() {
  showMigrationSQL();
}

main();