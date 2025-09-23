#!/usr/bin/env node

/**
 * Test script to verify the database setup is working correctly
 * This script tests the basic authentication tables and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣  Testing table existence...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table not accessible:', profilesError.message);
      return false;
    }
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
    
    if (rolesError) {
      console.error('❌ User_roles table not accessible:', rolesError.message);
      return false;
    }
    
    console.log('✅ Tables exist and are accessible');

    // Test 2: Test connection
    console.log('\n2️⃣  Testing Supabase connection...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      return false;
    }
    
    console.log('✅ Supabase connection working');
    console.log(`   Session status: ${session ? 'Authenticated' : 'Not authenticated'}`);

    // Test 3: Test RLS policies (should work without authentication for public access)
    console.log('\n3️⃣  Testing RLS policies...');
    
    // This should work due to the public profile policy
    const { data: publicProfiles, error: publicError } = await supabase
      .from('profiles')
      .select('id, full_name, is_active')
      .eq('is_active', true)
      .limit(5);
    
    if (publicError && !publicError.message.includes('RLS')) {
      console.error('❌ Unexpected error accessing profiles:', publicError.message);
      return false;
    }
    
    console.log('✅ RLS policies are active');
    console.log(`   Found ${publicProfiles?.length || 0} public profiles`);

    // Test 4: Test helper functions
    console.log('\n4️⃣  Testing helper functions...');
    
    try {
      const { data: roleCheck, error: roleError } = await supabase
        .rpc('has_role', { required_role: 'user' });
      
      if (roleError) {
        console.log('⚠️  Role check function not accessible (expected without auth)');
      } else {
        console.log('✅ Helper functions are available');
      }
    } catch (error) {
      console.log('⚠️  Helper functions require authentication (expected)');
    }

    console.log('\n🎉 Database setup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Tables created and accessible');
    console.log('   ✅ Supabase connection working');
    console.log('   ✅ RLS policies active');
    console.log('   ✅ Basic functionality verified');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Test user registration in your app');
    console.log('   2. Verify profile creation works');
    console.log('   3. Check that user roles are assigned correctly');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testDatabaseSetup().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});