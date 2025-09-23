#!/usr/bin/env node

/**
 * Basic Supabase Connection Test
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection');
console.log('==============================');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicConnection() {
  console.log('\n🔍 Testing basic connection...');
  
  try {
    // Test auth endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Basic Supabase connection successful!');
    console.log('📋 Session data:', data.session ? 'Active session' : 'No active session');
    
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function testSignUp() {
  console.log('\n🧪 Testing user registration...');
  
  const testEmail = `testuser${Math.floor(Math.random() * 1000)}@gmail.com`;
  const testPassword = 'testpassword123';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (error) {
      if (error.message.includes('profiles') || error.message.includes('table')) {
        console.log('⚠️  Registration works, but profiles table needs to be created');
        console.log('📝 The user was created in auth.users, but profile creation failed');
        return 'partial';
      }
      console.error('❌ Registration failed:', error.message);
      return false;
    }
    
    console.log('✅ User registration successful!');
    console.log('📧 User created:', data.user?.email);
    
    // Clean up - sign out
    await supabase.auth.signOut();
    
    return true;
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    return false;
  }
}

async function main() {
  // Test basic connection
  const connected = await testBasicConnection();
  if (!connected) {
    console.log('\n❌ Basic connection failed. Check your Supabase credentials.');
    process.exit(1);
  }
  
  // Test registration
  const registrationResult = await testSignUp();
  
  if (registrationResult === true) {
    console.log('\n🎉 All tests passed! Your Supabase setup is working correctly.');
  } else if (registrationResult === 'partial') {
    console.log('\n⚠️  Partial success: Authentication works, but database tables need setup.');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Run the following SQL to create the profiles table:');
    console.log(`
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT,
  bio TEXT,
  skills TEXT[],
  languages TEXT[],
  timezone TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  social_links JSONB,
  preferences JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
    `);
  } else {
    console.log('\n❌ Tests failed. Please check your Supabase configuration.');
  }
}

main().catch(console.error);