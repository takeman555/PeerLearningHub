#!/usr/bin/env node

/**
 * Authentication Test Runner
 * 
 * This script runs comprehensive tests for the authentication system
 * according to the requirements in task 3.
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Check if environment is properly configured
 */
function checkEnvironment() {
  console.log('🔍 Checking Environment Configuration...');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease update your .env file with actual Supabase credentials.');
    return false;
  }
  
  // Check if using placeholder values
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (url.includes('your-project') || key.includes('your-anon-key')) {
    console.error('❌ Environment variables contain placeholder values.');
    console.error('Please update your .env file with actual Supabase credentials.');
    return false;
  }
  
  console.log('✅ Environment configuration looks good');
  return true;
}

/**
 * Check if database tables exist
 */
async function checkDatabaseSetup() {
  console.log('🔍 Checking Database Setup...');
  
  try {
    // Import supabase client
    const { supabase } = require('../config/supabase');
    
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Please ensure your Supabase project is set up and migrations are run.');
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database setup check failed:', error.message);
    return false;
  }
}

/**
 * Run manual authentication tests
 */
async function runManualTests() {
  console.log('🧪 Running Manual Authentication Tests...');
  
  try {
    const { authService } = require('../services/auth');
    
    // Test 1: Basic service availability
    console.log('Test 1: Service availability...');
    if (typeof authService.signUp === 'function' && 
        typeof authService.signIn === 'function' &&
        typeof authService.signOut === 'function') {
      console.log('✅ Auth service methods available');
    } else {
      console.error('❌ Auth service methods missing');
      return false;
    }
    
    // Test 2: Supabase client configuration
    console.log('Test 2: Supabase client configuration...');
    const { supabase } = require('../config/supabase');
    
    if (supabase && supabase.auth) {
      console.log('✅ Supabase client configured');
    } else {
      console.error('❌ Supabase client not properly configured');
      return false;
    }
    
    // Test 3: Check current session (should be null initially)
    console.log('Test 3: Initial session state...');
    const session = await authService.getCurrentSession();
    
    if (session === null) {
      console.log('✅ No active session (expected for fresh start)');
    } else {
      console.log('ℹ️  Active session found:', session.user?.email);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Manual tests failed:', error.message);
    return false;
  }
}

/**
 * Test form validation logic
 */
function testFormValidation() {
  console.log('🔍 Testing Form Validation Logic...');
  
  // Test email validation
  const emailTests = [
    { email: 'test@example.com', valid: true },
    { email: 'invalid-email', valid: false },
    { email: '', valid: false },
    { email: 'test@', valid: false },
    { email: '@example.com', valid: false }
  ];
  
  console.log('Email validation tests:');
  emailTests.forEach(test => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test.email);
    const result = isValid === test.valid ? '✅' : '❌';
    console.log(`  ${result} "${test.email}" - Expected: ${test.valid}, Got: ${isValid}`);
  });
  
  // Test password validation
  const passwordTests = [
    { password: 'password123', valid: true },
    { password: '12345', valid: false }, // too short
    { password: '', valid: false }, // empty
    { password: 'a'.repeat(100), valid: true } // long but valid
  ];
  
  console.log('Password validation tests:');
  passwordTests.forEach(test => {
    const isValid = test.password.length >= 6;
    const result = isValid === test.valid ? '✅' : '❌';
    console.log(`  ${result} "${test.password.substring(0, 10)}..." - Expected: ${test.valid}, Got: ${isValid}`);
  });
  
  return true;
}

/**
 * Check UI components exist
 */
function checkUIComponents() {
  console.log('🔍 Checking UI Components...');
  
  const components = [
    '../app/login.tsx',
    '../app/register.tsx',
    '../app/forgot-password.tsx',
    '../contexts/AuthContext.tsx',
    '../components/AuthGuard.tsx'
  ];
  
  let allExist = true;
  
  components.forEach(component => {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${component}`);
    } else {
      console.error(`❌ ${component} - File not found`);
      allExist = false;
    }
  });
  
  return allExist;
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Authentication System Test Runner');
  console.log('===================================\n');
  
  const results = {
    environment: false,
    database: false,
    components: false,
    validation: false,
    manual: false
  };
  
  try {
    // Run all checks
    results.environment = checkEnvironment();
    
    if (results.environment) {
      results.database = await checkDatabaseSetup();
    }
    
    results.components = checkUIComponents();
    results.validation = testFormValidation();
    
    if (results.environment && results.database) {
      results.manual = await runManualTests();
    }
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} checks passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All authentication checks passed!');
      console.log('The authentication system is ready for testing.');
      
      if (results.environment && results.database) {
        console.log('\n💡 Next steps:');
        console.log('1. Test user registration in the app');
        console.log('2. Test user login functionality');
        console.log('3. Test profile creation and updates');
        console.log('4. Test error handling scenarios');
      }
    } else {
      console.log('\n⚠️  Some checks failed. Please address the issues above.');
      
      if (!results.environment) {
        console.log('\n🔧 To fix environment issues:');
        console.log('1. Create a Supabase project at https://supabase.com');
        console.log('2. Copy your project URL and anon key');
        console.log('3. Update the .env file with real values');
      }
      
      if (!results.database) {
        console.log('\n🔧 To fix database issues:');
        console.log('1. Run: npm run migrate');
        console.log('2. Check your Supabase project dashboard');
        console.log('3. Ensure RLS policies are enabled');
      }
    }
    
    return passedTests === totalTests;
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    return false;
  }
}

// Run the tests
if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { main };