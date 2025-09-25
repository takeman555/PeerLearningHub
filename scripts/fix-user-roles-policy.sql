-- Fix user_roles RLS policies to prevent infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

-- Create simpler, non-recursive policies
-- Allow everyone to view active user roles (no recursion)
CREATE POLICY "Anyone can view user roles" ON public.user_roles
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Create a function to safely manage user roles
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, new_role TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  current_user_roles TEXT[];
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- If no authenticated user, deny
  IF current_user_id IS NULL THEN
    RETURN 'Error: Authentication required';
  END IF;
  
  -- Get current user's roles (bypass RLS by using security definer)
  SELECT ARRAY_AGG(role) INTO current_user_roles
  FROM user_roles 
  WHERE user_id = current_user_id AND is_active = true;
  
  -- Check if current user is admin or super_admin
  IF NOT (current_user_roles && ARRAY['admin', 'super_admin']) THEN
    RETURN 'Error: Admin privileges required';
  END IF;
  
  -- Validate the new role
  IF new_role NOT IN ('user', 'moderator', 'admin', 'super_admin') THEN
    RETURN 'Error: Invalid role';
  END IF;
  
  -- Insert or update the role
  INSERT INTO user_roles (user_id, role, granted_by)
  VALUES (target_user_id, new_role, current_user_id)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    granted_by = current_user_id,
    granted_at = NOW();
  
  RETURN 'Success: Role assigned';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;

-- Create initial user roles for existing profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Assign 'user' role to all profiles that don't have any roles
  FOR profile_record IN 
    SELECT p.id 
    FROM profiles p 
    LEFT JOIN user_roles ur ON p.id = ur.user_id 
    WHERE ur.user_id IS NULL
  LOOP
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (profile_record.id, 'user', true)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
  
  -- Make the first profile an admin if no admin exists
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin' AND is_active = true) THEN
    INSERT INTO user_roles (user_id, role, is_active)
    SELECT id, 'admin', true 
    FROM profiles 
    ORDER BY created_at 
    LIMIT 1
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;
  END IF;
END $$;

-- Test the fix
SELECT 'User roles created successfully' as status;
SELECT user_id, role, is_active FROM user_roles ORDER BY granted_at;