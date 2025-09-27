#!/usr/bin/env node

/**
 * Super Admin Creation Script
 * 
 * This script creates a super admin user for testing next phase features.
 * Super admins can access all development features including:
 * - Dashboard
 * - Projects
 * - Peer Learning Sessions
 * - Accommodation Booking
 * - Activity History
 * - Admin Dashboard
 * 
 * Usage: node scripts/createSuperAdmin.js [email] [password] [full_name]
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin(email, password, fullName) {
  console.log('🔧 Creating Super Admin User');
  console.log('============================');
  console.log(`Email: ${email}`);
  console.log(`Full Name: ${fullName}`);
  
  try {
    // Create auth user
    console.log('\n📝 Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'super_admin'
      }
    });
    
    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      return false;
    }
    
    console.log('✅ Auth user created successfully');
    console.log(`   User ID: ${authData.user.id}`);
    
    // Create profile
    console.log('\n📝 Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        role: 'super_admin',
        show_in_community: true,
        membership_status: 'lifetime',
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select();
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      
      // Try to delete the auth user if profile creation failed
      console.log('🔄 Cleaning up auth user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }
    
    console.log('✅ Profile created successfully');
    
    // Verify the user can access next phase features
    console.log('\n🔍 Verifying super admin permissions...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, show_in_community, membership_status')
      .eq('id', authData.user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Failed to verify user:', verifyError.message);
      return false;
    }
    
    console.log('✅ Super admin verification successful:');
    console.log(`   ID: ${verifyData.id}`);
    console.log(`   Name: ${verifyData.full_name}`);
    console.log(`   Email: ${verifyData.email}`);
    console.log(`   Role: ${verifyData.role}`);
    console.log(`   Community Display: ${verifyData.show_in_community}`);
    console.log(`   Membership: ${verifyData.membership_status}`);
    
    console.log('\n🎉 Super Admin created successfully!');
    console.log('\nNext Phase Features Access:');
    console.log('✅ Dashboard');
    console.log('✅ Projects');
    console.log('✅ Peer Learning Sessions');
    console.log('✅ Accommodation Booking');
    console.log('✅ Activity History');
    console.log('✅ Admin Dashboard');
    
    console.log('\n📱 Login Instructions:');
    console.log(`1. Open the PeerLearningHub app`);
    console.log(`2. Navigate to login screen`);
    console.log(`3. Use credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`4. You should see all next phase features on the home screen`);
    
    return true;
  } catch (error) {
    console.error('❌ Super admin creation failed:', error.message);
    return false;
  }
}

async function listExistingSuperAdmins() {
  console.log('\n👑 Existing Super Admins:');
  console.log('========================');
  
  try {
    const { data: superAdmins, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Failed to fetch super admins:', error.message);
      return;
    }
    
    if (superAdmins.length === 0) {
      console.log('   No super admins found');
    } else {
      superAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.full_name} (${admin.email})`);
        console.log(`      ID: ${admin.id}`);
        console.log(`      Created: ${new Date(admin.created_at).toLocaleString()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Failed to list super admins:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--list') {
    await listExistingSuperAdmins();
    return;
  }
  
  if (args.length < 3) {
    console.log('Usage: node scripts/createSuperAdmin.js <email> <password> <full_name>');
    console.log('       node scripts/createSuperAdmin.js --list');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/createSuperAdmin.js admin@example.com password123 "Super Admin"');
    console.log('  node scripts/createSuperAdmin.js --list');
    process.exit(1);
  }
  
  const [email, password, fullName] = args;
  
  if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
  }
  
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
  }
  
  if (!fullName || fullName.trim().length === 0) {
    console.error('❌ Full name is required');
    process.exit(1);
  }
  
  const success = await createSuperAdmin(email, password, fullName.trim());
  
  if (success) {
    await listExistingSuperAdmins();
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the script
main();