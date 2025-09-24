// Test the AuthService directly
const path = require('path');

// Mock React Native modules that are required by the auth service
global.console = {
  ...console,
  log: (...args) => console.log('[AUTH TEST]', ...args),
  error: (...args) => console.error('[AUTH ERROR]', ...args),
  warn: (...args) => console.warn('[AUTH WARN]', ...args),
};

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: async (key) => {
    console.log(`AsyncStorage.getItem called with key: ${key}`);
    return null;
  },
  setItem: async (key, value) => {
    console.log(`AsyncStorage.setItem called with key: ${key}`);
    return Promise.resolve();
  },
  removeItem: async (key) => {
    console.log(`AsyncStorage.removeItem called with key: ${key}`);
    return Promise.resolve();
  },
};

// Set up module mocking
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@react-native-async-storage/async-storage') {
    return { default: mockAsyncStorage };
  }
  return originalRequire.apply(this, arguments);
};

// Load environment variables
require('dotenv').config();

async function testAuthService() {
  console.log('🔧 Testing AuthService with Real Database');
  console.log('📍 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  
  try {
    // Import the auth service
    const { authService } = require('../services/auth');
    
    console.log('\n✅ AuthService imported successfully');
    
    // Test 1: Check current user (should be null initially)
    console.log('\n👤 Testing getCurrentUser...');
    const currentUser = await authService.getCurrentUser();
    console.log('Current user:', currentUser ? currentUser.email : 'None');
    
    // Test 2: Test sign up
    console.log('\n📝 Testing sign up...');
    const signUpResult = await authService.signUp({
      email: `testuser${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      fullName: 'Test User',
      country: 'Japan'
    });
    
    if (signUpResult.error) {
      console.error('❌ Sign up failed:', signUpResult.error.message);
    } else {
      console.log('✅ Sign up successful');
      console.log('📧 User email:', signUpResult.user?.email);
      console.log('🆔 User ID:', signUpResult.user?.id);
    }
    
    // Test 3: Test sign in with existing user
    console.log('\n🔐 Testing sign in...');
    const signInResult = await authService.signIn({
      email: 'testuser@gmail.com',
      password: 'TestPassword123!'
    });
    
    if (signInResult.error) {
      console.log('❌ Sign in failed:', signInResult.error.message);
      
      // If user doesn't exist, create one first
      if (signInResult.error.message.includes('Invalid email or password')) {
        console.log('\n👤 Creating user for sign in test...');
        const createResult = await authService.signUp({
          email: 'testuser@gmail.com',
          password: 'TestPassword123!',
          fullName: 'Test User',
          country: 'Japan'
        });
        
        if (createResult.error) {
          console.error('❌ User creation failed:', createResult.error.message);
        } else {
          console.log('✅ User created for testing');
        }
      }
    } else {
      console.log('✅ Sign in successful');
      console.log('📧 User email:', signInResult.user?.email);
      console.log('🆔 User ID:', signInResult.user?.id);
      
      // Test 4: Test sign out
      console.log('\n🚪 Testing sign out...');
      const signOutResult = await authService.signOut();
      
      if (signOutResult.error) {
        console.error('❌ Sign out failed:', signOutResult.error.message);
      } else {
        console.log('✅ Sign out successful');
      }
    }
    
    console.log('\n🎉 AuthService tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAuthService().catch(console.error);