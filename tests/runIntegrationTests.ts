/**
 * Integration Test Runner
 * 
 * This script runs all integration tests for the community management updates
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2
 * 
 * Tests include:
 * - Community functionality integration tests
 * - Group management integration tests
 * - Combined workflow tests
 */

import { runCommunityFunctionalityIntegrationTests } from './communityFunctionality.integration.test';
import { runGroupManagementIntegrationTests } from './groupManagement.integration.test';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 second timeout for full test suite
  continueOnFailure: true, // Continue running tests even if some fail
  generateReport: true // Generate detailed test report
};

// Test results interface
interface TestSuiteResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

// Main test runner
async function runAllIntegrationTests(): Promise<boolean> {
  console.log('🚀 Starting Community Management Integration Test Suite');
  console.log('======================================================');
  console.log(`Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`Continue on failure: ${TEST_CONFIG.continueOnFailure}`);
  console.log(`Generate report: ${TEST_CONFIG.generateReport}\n`);

  const testSuites: TestSuiteResult[] = [];
  const overallStartTime = Date.now();

  // Test Suite 1: Community Functionality Integration Tests
  console.log('📋 Test Suite 1: Community Functionality Integration');
  console.log('====================================================');
  
  const communityStartTime = Date.now();
  let communityPassed = false;
  let communityError: string | undefined;

  try {
    communityPassed = await runCommunityFunctionalityIntegrationTests();
  } catch (error: any) {
    communityError = error?.message || 'Unknown error';
    console.error('Community functionality tests failed with error:', communityError);
  }

  const communityDuration = Date.now() - communityStartTime;
  testSuites.push({
    name: 'Community Functionality Integration',
    passed: communityPassed,
    duration: communityDuration,
    error: communityError
  });

  console.log(`\n⏱️  Community tests completed in ${communityDuration}ms`);
  console.log(`📊 Result: ${communityPassed ? '✅ PASSED' : '❌ FAILED'}`);

  // Decide whether to continue based on configuration
  if (!communityPassed && !TEST_CONFIG.continueOnFailure) {
    console.log('\n🛑 Stopping test execution due to failure (continueOnFailure = false)');
    return false;
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test Suite 2: Group Management Integration Tests
  console.log('📋 Test Suite 2: Group Management Integration');
  console.log('=============================================');
  
  const groupStartTime = Date.now();
  let groupPassed = false;
  let groupError: string | undefined;

  try {
    groupPassed = await runGroupManagementIntegrationTests();
  } catch (error: any) {
    groupError = error?.message || 'Unknown error';
    console.error('Group management tests failed with error:', groupError);
  }

  const groupDuration = Date.now() - groupStartTime;
  testSuites.push({
    name: 'Group Management Integration',
    passed: groupPassed,
    duration: groupDuration,
    error: groupError
  });

  console.log(`\n⏱️  Group management tests completed in ${groupDuration}ms`);
  console.log(`📊 Result: ${groupPassed ? '✅ PASSED' : '❌ FAILED'}`);

  console.log('\n' + '='.repeat(60) + '\n');

  // Generate final report
  const overallDuration = Date.now() - overallStartTime;
  const passedSuites = testSuites.filter(suite => suite.passed).length;
  const totalSuites = testSuites.length;
  const overallPassed = passedSuites === totalSuites;

  console.log('📊 Final Integration Test Report');
  console.log('================================');
  
  testSuites.forEach(suite => {
    const status = suite.passed ? '✅ PASSED' : '❌ FAILED';
    const duration = `${suite.duration}ms`;
    console.log(`${status} ${suite.name} (${duration})`);
    
    if (suite.error) {
      console.log(`   Error: ${suite.error}`);
    }
  });

  console.log(`\n📈 Overall Results:`);
  console.log(`   Test Suites: ${passedSuites}/${totalSuites} passed`);
  console.log(`   Total Duration: ${overallDuration}ms`);
  console.log(`   Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

  if (overallPassed) {
    console.log('\n🎉 All integration tests passed successfully!');
    console.log('\n✅ Community Management Requirements Validated:');
    console.log('   - 2.1: Member-only post creation flow ✅');
    console.log('   - 2.2: Permission system integration ✅');
    console.log('   - 3.1: Member list display with database ✅');
    console.log('   - 3.2: Member profile data retrieval ✅');
    console.log('   - 4.1: External link display and functionality ✅');
    console.log('   - 4.2: External link validation and new tab opening ✅');
    console.log('   - 5.1: Creation of the specified groups ✅');
    console.log('   - 5.2: Group creation with proper metadata ✅');
    console.log('   - 6.1: Admin-only group management permissions ✅');
    console.log('   - 6.2: Permission denial for non-admins ✅');
    
    console.log('\n🔧 Integration Systems Verified:');
    console.log('   - Database connectivity and operations ✅');
    console.log('   - Authentication and permission systems ✅');
    console.log('   - External link validation and handling ✅');
    console.log('   - Error handling and recovery ✅');
    console.log('   - Performance and concurrent operations ✅');
    console.log('   - Complete user workflows ✅');
  } else {
    console.log('\n⚠️  Some integration tests failed.');
    console.log('\n🔧 Common Issues and Solutions:');
    console.log('   1. Database Setup:');
    console.log('      - Run migrations: npm run migrate');
    console.log('      - Check database connection: npm run setup:supabase');
    console.log('      - Verify environment variables');
    
    console.log('   2. Test Data:');
    console.log('      - Create test users in database');
    console.log('      - Update TEST_CONFIG with actual user IDs');
    console.log('      - Ensure test database is properly seeded');
    
    console.log('   3. Permissions:');
    console.log('      - Verify user roles are properly set');
    console.log('      - Check admin permissions in database');
    console.log('      - Run permission tests: npm run test:permissions-integration');
    
    console.log('   4. Network:');
    console.log('      - Check internet connectivity for external link tests');
    console.log('      - Verify firewall settings');
    console.log('      - Test individual services separately');
  }

  // Generate detailed report if requested
  if (TEST_CONFIG.generateReport) {
    await generateDetailedReport(testSuites, overallDuration, overallPassed);
  }

  return overallPassed;
}

/**
 * Generate detailed test report
 */
async function generateDetailedReport(
  testSuites: TestSuiteResult[], 
  totalDuration: number, 
  overallPassed: boolean
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      overallPassed,
      totalDuration,
      testSuites: testSuites.map(suite => ({
        name: suite.name,
        passed: suite.passed,
        duration: suite.duration,
        error: suite.error || null
      })),
      summary: {
        totalSuites: testSuites.length,
        passedSuites: testSuites.filter(s => s.passed).length,
        failedSuites: testSuites.filter(s => !s.passed).length,
        averageDuration: Math.round(totalDuration / testSuites.length)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage()
      }
    };

    const reportJson = JSON.stringify(report, null, 2);
    
    // In a real implementation, you might write this to a file
    console.log('\n📄 Detailed Test Report Generated');
    console.log('==================================');
    console.log('Report data available in memory (would be saved to file in production)');
    console.log(`Report size: ${reportJson.length} characters`);
    
    // Log key metrics
    console.log('\n📊 Key Metrics:');
    console.log(`   Average test duration: ${report.summary.averageDuration}ms`);
    console.log(`   Memory usage: ${Math.round(report.environment.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`   Node.js version: ${report.environment.nodeVersion}`);
    console.log(`   Platform: ${report.environment.platform} ${report.environment.arch}`);
    
  } catch (error) {
    console.error('Failed to generate detailed report:', error);
  }
}

/**
 * Run specific test suite by name
 */
async function runSpecificTestSuite(suiteName: string): Promise<boolean> {
  console.log(`🎯 Running specific test suite: ${suiteName}`);
  console.log('=' .repeat(50 + suiteName.length));

  switch (suiteName.toLowerCase()) {
    case 'community':
    case 'community-functionality':
      return await runCommunityFunctionalityIntegrationTests();
      
    case 'group':
    case 'group-management':
      return await runGroupManagementIntegrationTests();
      
    default:
      console.error(`Unknown test suite: ${suiteName}`);
      console.log('Available test suites:');
      console.log('  - community (or community-functionality)');
      console.log('  - group (or group-management)');
      return false;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const suiteName = args[0];
    const success = await runSpecificTestSuite(suiteName);
    process.exit(success ? 0 : 1);
  } else {
    const success = await runAllIntegrationTests();
    process.exit(success ? 0 : 1);
  }
}

// Export for use in other files and run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error in test runner:', error);
    process.exit(1);
  });
}

export {
  runAllIntegrationTests,
  runSpecificTestSuite,
  TEST_CONFIG
};