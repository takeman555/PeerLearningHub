const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('🚀 Creating test user and profile...');
  
  try {
    // Create a test user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return false;
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          email: 'test@example.com',
          full_name: 'Test User',
          is_active: true
        }
      ]);

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return false;
    }

    console.log('✅ Profile created');

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: authUser.user.id,
          role: 'user',
          is_active: true
        }
      ]);

    if (roleError) {
      console.error('❌ Error creating user role:', roleError);
      return false;
    }

    console.log('✅ User role created');

    // Test the permission system
    console.log('🔍 Testing permission system...');
    
    const { data: profile, error: testError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        is_active,
        user_roles!inner(role, is_active)
      `)
      .eq('id', authUser.user.id)
      .eq('is_active', true)
      .single();

    if (testError || !profile) {
      console.error('❌ Error testing profile:', testError);
      return false;
    }

    console.log('✅ Profile test successful:', {
      id: profile.id,
      email: profile.email,
      roles: profile.user_roles.map(ur => ur.role)
    });

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

if (require.main === module) {
  createTestUser().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { createTestUser };