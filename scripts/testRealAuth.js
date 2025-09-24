const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Real Database Authentication');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not found');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing database connection...');
  
  try {
    // Test basic connection by trying to access auth
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function testUserSignUp() {
  console.log('\n👤 Testing user sign up...');
  
  const testEmail = `testuser${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName,
          country: 'Japan',
        },
      },
    });

    if (error) {
      console.error('❌ Sign up failed:', error.message);
      return null;
    }

    console.log('✅ Sign up successful');
    console.log('📧 User email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    console.log('📝 Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    
    return data.user;
  } catch (error) {
    console.error('❌ Sign up error:', error.message);
    return null;
  }
}

async function testUserSignIn(email, password) {
  console.log('\n🔐 Testing user sign in...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in failed:', error.message);
      return null;
    }

    console.log('✅ Sign in successful');
    console.log('📧 User email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    console.log('⏰ Session expires at:', data.session?.expires_at);
    
    return data;
  } catch (error) {
    console.error('❌ Sign in error:', error.message);
    return null;
  }
}

async function testProfilesTable() {
  console.log('\n📋 Testing profiles table access...');
  
  try {
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️  Profiles table not accessible:', error.message);
      console.log('💡 This is expected if the table hasn\'t been created yet');
      return false;
    }

    console.log('✅ Profiles table accessible');
    return true;
  } catch (error) {
    console.log('⚠️  Profiles table error:', error.message);
    return false;
  }
}

async function testSignOut() {
  console.log('\n🚪 Testing sign out...');
  
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out failed:', error.message);
      return false;
    }

    console.log('✅ Sign out successful');
    return true;
  } catch (error) {
    console.error('❌ Sign out error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Real Database Authentication Tests\n');
  
  // Test 1: Database connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Database connection failed. Cannot proceed with other tests.');
    return;
  }
  
  // Test 2: Profiles table access
  await testProfilesTable();
  
  // Test 3: User sign up
  const user = await testUserSignUp();
  if (!user) {
    console.log('\n❌ Sign up failed. Cannot test sign in.');
    return;
  }
  
  // Test 4: User sign in (if email confirmation is not required)
  if (user.email_confirmed_at) {
    const signInData = await testUserSignIn(user.email, 'TestPassword123!');
    
    if (signInData) {
      // Test 5: Sign out
      await testSignOut();
    }
  } else {
    console.log('\n📧 Email confirmation required. Sign in test skipped.');
    console.log('💡 Check your email and confirm the account to test sign in.');
  }
  
  console.log('\n🎉 Real database authentication tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Database connection: ✅');
  console.log('- User registration: ✅');
  console.log('- Email confirmation: ' + (user?.email_confirmed_at ? '✅' : '⏳ Pending'));
  console.log('\n💡 Next steps:');
  console.log('1. Check your email for confirmation link');
  console.log('2. Create the profiles table if needed');
  console.log('3. Test sign in after email confirmation');
}

// Run the tests
runTests().catch(console.error);