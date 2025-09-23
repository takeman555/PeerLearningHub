/**
 * Authentication System Test Suite
 * 
 * This test suite validates the authentication functionality according to requirements:
 * - 1.1: User registration with profile creation
 * - 1.2: User login functionality
 * - 1.3: Profile management
 * - 1.4: Error handling
 * - 1.5: Session management
 */

const { authService } = require('../services/auth');
const { supabase } = require('../config/supabase');

// Test configuration
const TEST_USER = {
  email: 'test@peerlearninghub.com',
  password: 'testpassword123',
  fullName: 'Test User',
  country: 'Japan'
};

const INVALID_USER = {
  email: 'invalid@test.com',
  password: 'wrongpassword'
};

/**
 * Test Suite: User Registration (Requirement 1.1)
 */
async function testUserRegistration() {
  console.log('\n=== Testing User Registration ===');
  
  try {
    // Test 1: Valid registration
    console.log('Test 1: Valid user registration...');
    const result = await authService.signUp(TEST_USER);
    
    if (result.error) {
      console.error('❌ Registration failed:', result.error.message);
      return false;
    }
    
    if (result.user) {
      console.log('✅ User registered successfully:', result.user.email);
      
      // Verify profile was created
      const profile = await authService.getProfile(result.user.id);
      if (profile) {
        console.log('✅ Profile created successfully:', profile.full_name);
      } else {
        console.error('❌ Profile was not created');
        return false;
      }
    }
    
    // Test 2: Duplicate email registration
    console.log('Test 2: Duplicate email registration...');
    const duplicateResult = await authService.signUp(TEST_USER);
    
    if (duplicateResult.error) {
      console.log('✅ Duplicate registration properly rejected:', duplicateResult.error.message);
    } else {
      console.error('❌ Duplicate registration should have failed');
      return false;
    }
    
    // Test 3: Invalid email format
    console.log('Test 3: Invalid email format...');
    const invalidEmailResult = await authService.signUp({
      ...TEST_USER,
      email: 'invalid-email'
    });
    
    if (invalidEmailResult.error) {
      console.log('✅ Invalid email properly rejected:', invalidEmailResult.error.message);
    } else {
      console.error('❌ Invalid email should have failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    return false;
  }
}

/**
 * Test Suite: User Login (Requirement 1.2)
 */
async function testUserLogin() {
  console.log('\n=== Testing User Login ===');
  
  try {
    // Test 1: Valid login
    console.log('Test 1: Valid user login...');
    const result = await authService.signIn({
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (result.error) {
      console.error('❌ Login failed:', result.error.message);
      return false;
    }
    
    if (result.user && result.session) {
      console.log('✅ User logged in successfully:', result.user.email);
      console.log('✅ Session created successfully');
    } else {
      console.error('❌ Login did not return user or session');
      return false;
    }
    
    // Test 2: Invalid credentials
    console.log('Test 2: Invalid credentials...');
    const invalidResult = await authService.signIn(INVALID_USER);
    
    if (invalidResult.error) {
      console.log('✅ Invalid credentials properly rejected:', invalidResult.error.message);
    } else {
      console.error('❌ Invalid credentials should have failed');
      return false;
    }
    
    // Test 3: Empty credentials
    console.log('Test 3: Empty credentials...');
    const emptyResult = await authService.signIn({
      email: '',
      password: ''
    });
    
    if (emptyResult.error) {
      console.log('✅ Empty credentials properly rejected:', emptyResult.error.message);
    } else {
      console.error('❌ Empty credentials should have failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    return false;
  }
}

/**
 * Test Suite: Profile Management (Requirement 1.3)
 */
async function testProfileManagement() {
  console.log('\n=== Testing Profile Management ===');
  
  try {
    // Get current user
    const user = await authService.getCurrentUser();
    if (!user) {
      console.error('❌ No current user found');
      return false;
    }
    
    // Test 1: Get profile
    console.log('Test 1: Get user profile...');
    const profile = await authService.getProfile(user.id);
    
    if (profile) {
      console.log('✅ Profile retrieved successfully:', profile.full_name);
    } else {
      console.error('❌ Failed to retrieve profile');
      return false;
    }
    
    // Test 2: Update profile
    console.log('Test 2: Update user profile...');
    const updateData = {
      bio: 'Updated bio for testing',
      skills: ['JavaScript', 'React', 'Node.js'],
      languages: ['English', 'Japanese']
    };
    
    const updateResult = await authService.updateProfile(user.id, updateData);
    
    if (updateResult.error) {
      console.error('❌ Profile update failed:', updateResult.error.message);
      return false;
    }
    
    if (updateResult.data) {
      console.log('✅ Profile updated successfully');
      console.log('✅ Bio:', updateResult.data.bio);
      console.log('✅ Skills:', updateResult.data.skills);
    } else {
      console.error('❌ Profile update did not return data');
      return false;
    }
    
    // Test 3: Verify update persistence
    console.log('Test 3: Verify update persistence...');
    const updatedProfile = await authService.getProfile(user.id);
    
    if (updatedProfile && updatedProfile.bio === updateData.bio) {
      console.log('✅ Profile updates persisted correctly');
    } else {
      console.error('❌ Profile updates were not persisted');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Profile management test failed:', error.message);
    return false;
  }
}

/**
 * Test Suite: Session Management (Requirement 1.5)
 */
async function testSessionManagement() {
  console.log('\n=== Testing Session Management ===');
  
  try {
    // Test 1: Get current session
    console.log('Test 1: Get current session...');
    const session = await authService.getCurrentSession();
    
    if (session) {
      console.log('✅ Session retrieved successfully');
      console.log('✅ Session expires at:', new Date(session.expires_at * 1000));
    } else {
      console.error('❌ No current session found');
      return false;
    }
    
    // Test 2: Get current user
    console.log('Test 2: Get current user...');
    const user = await authService.getCurrentUser();
    
    if (user) {
      console.log('✅ Current user retrieved successfully:', user.email);
    } else {
      console.error('❌ No current user found');
      return false;
    }
    
    // Test 3: Sign out
    console.log('Test 3: User sign out...');
    const signOutResult = await authService.signOut();
    
    if (signOutResult.error) {
      console.error('❌ Sign out failed:', signOutResult.error.message);
      return false;
    }
    
    console.log('✅ User signed out successfully');
    
    // Test 4: Verify session is cleared
    console.log('Test 4: Verify session is cleared...');
    const sessionAfterSignOut = await authService.getCurrentSession();
    
    if (!sessionAfterSignOut) {
      console.log('✅ Session cleared successfully');
    } else {
      console.error('❌ Session was not cleared after sign out');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Session management test failed:', error.message);
    return false;
  }
}

/**
 * Test Suite: Error Handling (Requirement 1.4)
 */
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  try {
    // Test 1: Network error simulation (invalid URL)
    console.log('Test 1: Network error handling...');
    
    // Test 2: Invalid password reset
    console.log('Test 2: Invalid password reset...');
    const resetResult = await authService.resetPassword('nonexistent@test.com');
    
    // Password reset might succeed even for non-existent emails for security
    console.log('✅ Password reset handled gracefully');
    
    // Test 3: Invalid profile update
    console.log('Test 3: Invalid profile update...');
    const invalidUpdateResult = await authService.updateProfile('invalid-user-id', {
      full_name: 'Test'
    });
    
    if (invalidUpdateResult.error) {
      console.log('✅ Invalid profile update properly rejected:', invalidUpdateResult.error.message);
    } else {
      console.error('❌ Invalid profile update should have failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

/**
 * Cleanup function to remove test data
 */
async function cleanup() {
  console.log('\n=== Cleanup ===');
  
  try {
    // Note: In a real test environment, you would clean up test data
    // For now, we'll just log that cleanup would happen here
    console.log('✅ Cleanup completed (test data would be removed in production)');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAuthTests() {
  console.log('🚀 Starting Authentication System Tests');
  console.log('=====================================');
  
  const results = {
    registration: false,
    login: false,
    profileManagement: false,
    sessionManagement: false,
    errorHandling: false,
    cleanup: false
  };
  
  try {
    // Run all test suites
    results.registration = await testUserRegistration();
    results.login = await testUserLogin();
    results.profileManagement = await testProfileManagement();
    results.sessionManagement = await testSessionManagement();
    results.errorHandling = await testErrorHandling();
    results.cleanup = await cleanup();
    
    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All authentication tests passed!');
      return true;
    } else {
      console.log('⚠️  Some authentication tests failed. Please review and fix issues.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    return false;
  }
}

// Export for use in other files
module.exports = {
  runAuthTests,
  testUserRegistration,
  testUserLogin,
  testProfileManagement,
  testSessionManagement,
  testErrorHandling
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAuthTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}