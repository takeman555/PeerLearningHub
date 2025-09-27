const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Sign In with Existing User');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignInWithKnownUser() {
  console.log('\n🔐 Testing sign in with known user...');
  
  // Try with a confirmed test user
  const testEmail = 'member1@example.com';
  const testPassword = 'password123';
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      
      // If user doesn't exist, try to create one
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n👤 User doesn\'t exist. Creating test user...');
        return await createTestUser(testEmail, testPassword);
      }
      
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

async function createTestUser(email, password) {
  console.log('\n👤 Creating test user...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Test User',
          country: 'Japan',
        },
      },
    });

    if (error) {
      console.error('❌ User creation failed:', error.message);
      return null;
    }

    console.log('✅ Test user created successfully');
    console.log('📧 User email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    
    return data;
  } catch (error) {
    console.error('❌ User creation error:', error.message);
    return null;
  }
}

async function testProfileCreation(userId, userEmail) {
  console.log('\n📋 Testing profile creation...');
  
  try {
    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('✅ Profile already exists');
      console.log('👤 Full name:', existingProfile.full_name);
      console.log('🌍 Country:', existingProfile.country);
      return existingProfile;
    }

    // Create new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail,
        full_name: 'Test User',
        country: 'Japan',
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation failed:', error.message);
      return null;
    }

    console.log('✅ Profile created successfully');
    console.log('👤 Full name:', data.full_name);
    console.log('🌍 Country:', data.country);
    
    return data;
  } catch (error) {
    console.error('❌ Profile creation error:', error.message);
    return null;
  }
}

async function testCompleteAuthFlow() {
  console.log('\n🔄 Testing complete authentication flow...');
  
  // Step 1: Sign in or create user
  const authData = await testSignInWithKnownUser();
  if (!authData || !authData.user) {
    console.log('❌ Authentication failed');
    return;
  }
  
  // Step 2: Create or verify profile
  const profile = await testProfileCreation(authData.user.id, authData.user.email);
  if (!profile) {
    console.log('❌ Profile creation failed');
    return;
  }
  
  // Step 3: Test session management
  console.log('\n🎫 Testing session management...');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('❌ Session retrieval failed:', error.message);
    return;
  }
  
  if (session) {
    console.log('✅ Session active');
    console.log('⏰ Expires at:', session.expires_at);
    console.log('🔑 Access token length:', session.access_token.length);
  } else {
    console.log('⚠️  No active session');
  }
  
  // Step 4: Test sign out
  console.log('\n🚪 Testing sign out...');
  const { error: signOutError } = await supabase.auth.signOut();
  
  if (signOutError) {
    console.error('❌ Sign out failed:', signOutError.message);
  } else {
    console.log('✅ Sign out successful');
  }
  
  console.log('\n🎉 Complete authentication flow test completed!');
}

// Run the complete test
testCompleteAuthFlow().catch(console.error);