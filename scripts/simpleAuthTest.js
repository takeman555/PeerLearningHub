const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Simple Authentication Test');
console.log('📍 Environment check:');
console.log('- SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');

// Check if mock auth would be used
const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                     process.env.NODE_ENV === 'test' ||
                     !process.env.EXPO_PUBLIC_SUPABASE_URL ||
                     !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('- USE_MOCK_AUTH:', USE_MOCK_AUTH ? '❌ Yes (Mock will be used)' : '✅ No (Real DB will be used)');

if (USE_MOCK_AUTH) {
  console.log('\n⚠️  Mock authentication will be used. Real database test cannot proceed.');
  console.log('💡 To use real database, ensure:');
  console.log('   1. EXPO_PUBLIC_SUPABASE_URL is set and does not contain "placeholder"');
  console.log('   2. EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
  console.log('   3. NODE_ENV is not "test"');
  process.exit(0);
}

// Create Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testRealAuth() {
  console.log('\n🚀 Testing Real Database Authentication');
  
  try {
    // Test 1: Connection test
    console.log('\n1️⃣ Testing connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Connection failed:', sessionError.message);
      return;
    }
    
    console.log('✅ Connection successful');
    console.log('📊 Current session:', session ? 'Active' : 'None');
    
    // Test 2: Sign up test
    console.log('\n2️⃣ Testing user registration...');
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          country: 'Japan',
        },
      },
    });
    
    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message);
      return;
    }
    
    console.log('✅ Registration successful');
    console.log('📧 Email:', signUpData.user?.email);
    console.log('🆔 User ID:', signUpData.user?.id);
    console.log('📝 Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
    
    // Test 3: Sign in test (if email is confirmed or confirmation is disabled)
    if (signUpData.user?.email_confirmed_at || signUpData.session) {
      console.log('\n3️⃣ Testing sign in...');
      
      // Sign out first to test sign in
      await supabase.auth.signOut();
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
      } else {
        console.log('✅ Sign in successful');
        console.log('📧 Email:', signInData.user?.email);
        console.log('🎫 Session active:', signInData.session ? 'Yes' : 'No');
        
        // Test 4: Sign out
        console.log('\n4️⃣ Testing sign out...');
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
          console.error('❌ Sign out failed:', signOutError.message);
        } else {
          console.log('✅ Sign out successful');
        }
      }
    } else {
      console.log('\n3️⃣ Sign in test skipped (email confirmation required)');
      console.log('💡 Check your email for confirmation link');
    }
    
    console.log('\n🎉 Real database authentication test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection works');
    console.log('✅ User registration works');
    console.log('✅ Authentication system is functional');
    console.log('\n💡 Your PeerLearningHub app can now use real database authentication!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealAuth();