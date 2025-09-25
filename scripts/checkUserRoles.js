const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserRoles() {
  try {
    console.log('🔍 Checking database setup...');
    
    // Check if tables exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
      return;
    }
    
    console.log('✅ Profiles found:', profiles?.length || 0);
    if (profiles?.length > 0) {
      console.log('📋 Sample profiles:', profiles);
    }
    
    // Check user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, is_active')
      .limit(10);
    
    if (rolesError) {
      console.error('❌ User roles table error:', rolesError.message);
      return;
    }
    
    console.log('✅ User roles found:', userRoles?.length || 0);
    if (userRoles?.length > 0) {
      console.log('📋 Sample user roles:', userRoles);
    }
    
    // Check groups table
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, is_active')
      .limit(5);
    
    if (groupsError) {
      console.error('❌ Groups table error:', groupsError.message);
      return;
    }
    
    console.log('✅ Groups found:', groups?.length || 0);
    if (groups?.length > 0) {
      console.log('📋 Sample groups:', groups.map(g => g.name));
    }
    
    // Check auth.users (this might not work due to RLS)
    console.log('\n🔍 Checking auth users...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ No authenticated user found');
    } else {
      console.log('✅ Current user:', authData.user?.id);
      
      // Check if current user has roles
      const { data: currentUserRoles, error: currentRolesError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', authData.user.id);
      
      if (currentRolesError) {
        console.error('❌ Current user roles error:', currentRolesError.message);
      } else {
        console.log('📋 Current user roles:', currentUserRoles);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkUserRoles();