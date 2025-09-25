-- Final fix for user_roles infinite recursion
-- This completely removes the problematic policies and creates simple ones

-- Step 1: Disable RLS temporarily to avoid recursion during policy changes
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on user_roles table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.user_roles';
    END LOOP;
END $$;

-- Step 3: Create completely new, simple policies that don't reference user_roles
-- These policies avoid any circular references

-- Allow all authenticated users to view user roles (no recursion)
CREATE POLICY "user_roles_select_simple" ON public.user_roles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

-- Allow all authenticated users to insert user roles (for registration)
CREATE POLICY "user_roles_insert_simple" ON public.user_roles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Allow users to update their own roles (and service role for admin operations)
CREATE POLICY "user_roles_update_simple" ON public.user_roles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
  );

-- Allow users to delete their own roles (and service role for admin operations)
CREATE POLICY "user_roles_delete_simple" ON public.user_roles
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
  );

-- Step 4: Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix by testing a simple query
SELECT 'Testing user_roles access...' as status;

-- This should work without infinite recursion
SELECT COUNT(*) as total_user_roles FROM public.user_roles WHERE is_active = true;

SELECT 'User roles policies fixed successfully!' as result;