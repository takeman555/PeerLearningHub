-- Add community display settings and membership status to profiles table

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_in_community BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'free' CHECK (membership_status IN ('free', 'premium', 'lifetime'));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_community_display 
ON profiles (show_in_community, membership_status) 
WHERE show_in_community = true;

-- Update existing users to have premium status if they have posts (assuming they are active users)
UPDATE profiles 
SET membership_status = 'premium'
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM posts 
  WHERE created_at > NOW() - INTERVAL '30 days'
);

-- Add RLS policies for the new columns
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to update their own community display settings
CREATE POLICY "Users can update their own community settings" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy to allow reading community display settings for community members
CREATE POLICY "Community members can view display settings" ON profiles
  FOR SELECT USING (
    show_in_community = true AND 
    membership_status IN ('premium', 'lifetime')
  );

-- Add comment for documentation
COMMENT ON COLUMN profiles.show_in_community IS 'Whether the user wants to be displayed in the community member list';
COMMENT ON COLUMN profiles.membership_status IS 'User membership status: free, premium, or lifetime';