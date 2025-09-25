const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSpecificUser() {
  const userId = '2d3bb1bb-033a-4ef2-a4c9-4fca3677261e';
  
  console.log('🔍 Checking specific user:', userId);
  
  try {
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile found:', profile);
    }
    
    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('❌ User roles error:', rolesError);
    } else {
      console.log('✅ User roles found:', userRoles);
    }
    
    // Check if user_roles table is accessible at all
    const { data: allRoles, error: allRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (allRolesError) {
      console.error('❌ All user roles error:', allRolesError);
    } else {
      console.log('✅ Sample user roles:', allRoles);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificUser();