const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function fixUserRolesPolicy() {
  try {
    console.log('🔧 Fixing user_roles RLS policies...');
    
    // Drop the problematic policy
    const dropPolicySQL = `
      DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
      DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicySQL });
    if (dropError) {
      console.error('❌ Error dropping policies:', dropError.message);
      return;
    }
    
    console.log('✅ Dropped old policies');
    
    // Create simpler, non-recursive policies
    const createPolicySQL = `
      -- Allow everyone to view active user roles (no recursion)
      CREATE POLICY "Anyone can view user roles" ON public.user_roles
        FOR SELECT USING (is_active = true);
      
      -- Allow users to manage their own roles (for self-assignment)
      CREATE POLICY "Users can view own roles" ON public.user_roles
        FOR SELECT USING (user_id = auth.uid());
      
      -- Only allow INSERT/UPDATE/DELETE through service role or specific functions
      CREATE POLICY "Service role can manage user roles" ON public.user_roles
        FOR ALL USING (current_setting('role') = 'service_role');
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicySQL });
    if (createError) {
      console.error('❌ Error creating policies:', createError.message);
      return;
    }
    
    console.log('✅ Created new policies');
    
    // Test the fix
    const { data: testRoles, error: testError } = await supabase
      .from('user_roles')
      .select('user_id, role, is_active')
      .limit(5);
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Test successful! Found', testRoles?.length || 0, 'user roles');
      if (testRoles?.length > 0) {
        console.log('📋 Sample roles:', testRoles);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing policies:', error.message);
  }
}

fixUserRolesPolicy();