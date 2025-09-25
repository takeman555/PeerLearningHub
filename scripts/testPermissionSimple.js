const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPermissionSystem() {
  console.log('🚀 Testing permission system with simple queries...');
  
  try {
    // Test 1: Check profiles table
    console.log('🔍 Test 1: Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`✅ Profiles found: ${profiles.length}`);
      if (profiles.length > 0) {
        console.log('📋 Sample profile:', {
          id: profiles[0].id,
          email: profiles[0].email,
          is_active: profiles[0].is_active
        });
      }
    }

    // Test 2: Check user_roles table
    console.log('🔍 Test 2: Checking user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.error('❌ Roles error:', rolesError);
    } else {
      console.log(`✅ Roles found: ${roles.length}`);
      if (roles.length > 0) {
        console.log('📋 Sample role:', {
          user_id: roles[0].user_id,
          role: roles[0].role,
          is_active: roles[0].is_active
        });
      }
    }

    // Test 3: Try to join tables manually
    if (profiles.length > 0 && roles.length > 0) {
      console.log('🔍 Test 3: Manual join test...');
      const testUserId = profiles[0].id;
      
      const { data: userRoles, error: joinError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', testUserId)
        .eq('is_active', true);

      if (joinError) {
        console.error('❌ Join error:', joinError);
      } else {
        console.log(`✅ User roles for ${testUserId}:`, userRoles);
      }
    }

    // Test 4: Simulate permission check
    console.log('🔍 Test 4: Simulating permission check...');
    
    if (profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_active')
        .eq('id', testUserId)
        .eq('is_active', true)
        .single();

      if (profileError) {
        console.error('❌ Profile lookup error:', profileError);
        return false;
      }

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', testUserId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('❌ Roles lookup error:', rolesError);
        return false;
      }

      console.log('✅ Permission check simulation successful:');
      console.log('👤 Profile:', profile);
      console.log('🔑 Roles:', userRoles);

      // Determine user role
      const activeRoles = userRoles.map(ur => ur.role);
      let userRole = 'guest';
      
      if (activeRoles.includes('admin') || activeRoles.includes('super_admin')) {
        userRole = 'admin';
      } else if (activeRoles.includes('user') || activeRoles.includes('moderator')) {
        userRole = 'member';
      }

      console.log(`🎯 Determined role: ${userRole}`);
      
      // Check if can view members
      const canViewMembers = userRole === 'member' || userRole === 'admin';
      console.log(`👥 Can view members: ${canViewMembers}`);

      return true;
    } else {
      console.log('⚠️ No profiles found to test with');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  testPermissionSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPermissionSystem };