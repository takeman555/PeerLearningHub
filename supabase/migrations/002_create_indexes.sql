-- Create indexes for optimal query performance
-- This migration adds basic indexes as specified in task 2

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON profiles USING GIN(languages);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_at ON user_roles(granted_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_active_verified ON profiles(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON user_roles(user_id, is_active);

-- Add comments for documentation
COMMENT ON INDEX idx_profiles_email IS 'Fast lookup by email address';
COMMENT ON INDEX idx_profiles_skills IS 'GIN index for array operations on skills';
COMMENT ON INDEX idx_profiles_languages IS 'GIN index for array operations on languages';
COMMENT ON INDEX idx_user_roles_user_id IS 'Fast lookup of user roles by user ID';
COMMENT ON INDEX idx_profiles_active_verified IS 'Composite index for active and verified users';