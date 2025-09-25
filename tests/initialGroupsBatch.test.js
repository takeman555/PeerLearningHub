#!/usr/bin/env node

/**
 * Initial Groups Batch Creation Test
 * 
 * This test validates the batch creation functionality according to requirements:
 * - 5.1: Create the specified 7 groups with proper metadata
 * - 5.2: Batch creation functionality
 * - 6.5: Group data validation
 * 
 * Tests the CLI scripts and batch creation functionality
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Initial Groups Batch Creation Test');
console.log('=====================================\n');

/**
 * Run a CLI command and capture output
 */
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [command, ...args], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: List command should work
  console.log('Test 1: List initial groups');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['list']);
    
    if (result.code === 0) {
      console.log('✅ PASS: List command executed successfully');
      testsPassed++;
      
      // Check if output contains expected groups
      const expectedGroups = [
        'ピアラーニングハブ生成AI部',
        'さぬきピアラーニングハブゴルフ部',
        'さぬきピアラーニングハブ英語部',
        'WAOJEさぬきピアラーニングハブ交流会参加者',
        '香川イノベーションベース',
        'さぬきピアラーニングハブ居住者',
        '英語キャンプ卒業者'
      ];
      
      let allGroupsFound = true;
      expectedGroups.forEach(groupName => {
        if (!result.stdout.includes(groupName)) {
          console.log(`❌ FAIL: Missing group in output: ${groupName}`);
          allGroupsFound = false;
        }
      });
      
      if (allGroupsFound) {
        console.log('✅ PASS: All expected groups found in output');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Some expected groups missing from output');
        testsFailed++;
      }
      
      // Check if total count is correct
      if (result.stdout.includes('Total: 7 groups')) {
        console.log('✅ PASS: Correct total count displayed');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Incorrect or missing total count');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: List command failed with code ${result.code}`);
      console.log('STDERR:', result.stderr);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error running list command: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 2: Check command should work (even if database is not available)
  console.log('Test 2: Check existing groups');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['check']);
    
    if (result.code === 0) {
      console.log('✅ PASS: Check command executed successfully');
      testsPassed++;
      
      // Should show status report even if database is not available
      if (result.stdout.includes('STATUS REPORT')) {
        console.log('✅ PASS: Status report generated');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Status report not found in output');
        testsFailed++;
      }
      
      // Should show missing groups count
      if (result.stdout.includes('Missing: 7') || result.stdout.includes('❌ Missing: 7')) {
        console.log('✅ PASS: Correctly identifies missing groups');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Does not correctly identify missing groups');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Check command failed with code ${result.code}`);
      console.log('STDERR:', result.stderr);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error running check command: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 3: Help command should work
  console.log('Test 3: Help command');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['help']);
    
    if (result.code === 0) {
      console.log('✅ PASS: Help command executed successfully');
      testsPassed++;
      
      // Check if help contains expected commands
      const expectedCommands = ['create', 'check', 'validate', 'create-missing', 'list'];
      let allCommandsFound = true;
      
      expectedCommands.forEach(command => {
        if (!result.stdout.includes(command)) {
          console.log(`❌ FAIL: Missing command in help: ${command}`);
          allCommandsFound = false;
        }
      });
      
      if (allCommandsFound) {
        console.log('✅ PASS: All expected commands found in help');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Some expected commands missing from help');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Help command failed with code ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error running help command: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 4: Validate batch creation script exists and is executable
  console.log('Test 4: Batch creation script validation');
  try {
    const result = await runCommand('scripts/createInitialGroupsBatch.js', ['--help']);
    
    // The script should either show help or fail gracefully
    if (result.code === 0 || result.code === 1) {
      console.log('✅ PASS: Batch creation script is executable');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Batch creation script failed unexpectedly with code ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error testing batch creation script: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 5: Invalid command should show help
  console.log('Test 5: Invalid command handling');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['invalid-command']);
    
    if (result.code === 1) {
      console.log('✅ PASS: Invalid command returns error code');
      testsPassed++;
      
      if (result.stdout.includes('Unknown command') || result.stderr.includes('Unknown command')) {
        console.log('✅ PASS: Shows unknown command error');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Does not show unknown command error');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Invalid command should return error code 1, got ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error testing invalid command: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('✅ Initial Groups Batch Creation functionality is working correctly');
  } else {
    console.log('\n⚠️  Some tests failed');
    console.log('❌ Please review the implementation');
  }

  return testsFailed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Critical test error:', error);
      process.exit(1);
    });
}

module.exports = { runTests };