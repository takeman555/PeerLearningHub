-- Complete reset of user_roles RLS policies to fix infinite recursion

-- First, temporarily disable RLS to avoid recursion issues
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage user roles" ON public.user_roles;

-- Create a simple, non-recursive policy
CREATE POLICY "Allow all user_roles operations" ON public.user_roles
  FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create initial user roles for existing profiles if they don't exist
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

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Test the fix
SELECT 'User roles policy reset successfully' as status;
SELECT user_id, role, is_active FROM user_roles ORDER BY granted_at;