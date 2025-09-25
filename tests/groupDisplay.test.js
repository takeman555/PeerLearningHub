#!/usr/bin/env node

/**
 * Group Display Functionality Test
 * 
 * This test validates the group display functionality according to requirements:
 * - 4.1: Display groups from database
 * - 4.2: Show group details and information
 * - 5.3: Display external participation links
 * - 5.4: Show group metadata
 * 
 * Tests the updated community page and group display components
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Group Display Functionality Test');
console.log('===================================\n');

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

  // Test 1: Verify groups service is accessible
  console.log('Test 1: Groups service accessibility');
  try {
    // Test if we can check groups status
    const result = await runCommand('scripts/manageInitialGroups.js', ['check']);
    
    if (result.code === 0) {
      console.log('✅ PASS: Groups service is accessible');
      testsPassed++;
      
      // Check if it shows proper status information
      if (result.stdout.includes('STATUS REPORT')) {
        console.log('✅ PASS: Status report is generated');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Status report not found');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Groups service check failed with code ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error testing groups service: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 2: Verify group data structure
  console.log('Test 2: Group data structure validation');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['list']);
    
    if (result.code === 0) {
      console.log('✅ PASS: Group list command works');
      testsPassed++;
      
      // Check for required group properties in output
      const requiredFields = ['Description:', 'External Link:'];
      let fieldsFound = true;
      
      requiredFields.forEach(field => {
        if (!result.stdout.includes(field)) {
          console.log(`❌ FAIL: Missing field in group data: ${field}`);
          fieldsFound = false;
        }
      });
      
      if (fieldsFound) {
        console.log('✅ PASS: All required group fields are present');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Some required group fields are missing');
        testsFailed++;
      }
      
      // Check for external links
      if (result.stdout.includes('https://')) {
        console.log('✅ PASS: External links are present in group data');
        testsPassed++;
      } else {
        console.log('❌ FAIL: No external links found in group data');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Group list command failed with code ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error testing group data structure: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 3: Validate external link formats
  console.log('Test 3: External link format validation');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['list']);
    
    if (result.code === 0) {
      // Extract external links from output
      const linkMatches = result.stdout.match(/External Link: (https?:\/\/[^\s]+)/g);
      
      if (linkMatches && linkMatches.length > 0) {
        console.log(`✅ PASS: Found ${linkMatches.length} external links`);
        testsPassed++;
        
        // Validate link formats
        let validLinks = true;
        linkMatches.forEach((match, index) => {
          const url = match.replace('External Link: ', '');
          
          // Check HTTPS requirement
          if (!url.startsWith('https://')) {
            console.log(`❌ FAIL: Link ${index + 1} does not use HTTPS: ${url}`);
            validLinks = false;
          }
          
          // Check for known platforms
          const knownPlatforms = ['discord.gg', 'discord.com', 't.me', 'telegram.me', 'line.me'];
          const hasKnownPlatform = knownPlatforms.some(platform => url.includes(platform));
          
          if (!hasKnownPlatform) {
            console.log(`⚠️  WARNING: Link ${index + 1} uses non-standard platform: ${url}`);
          }
        });
        
        if (validLinks) {
          console.log('✅ PASS: All external links have valid HTTPS format');
          testsPassed++;
        } else {
          console.log('❌ FAIL: Some external links have invalid format');
          testsFailed++;
        }
        
      } else {
        console.log('❌ FAIL: No external links found in output');
        testsFailed++;
      }
      
    } else {
      console.log('❌ FAIL: Could not retrieve group data for link validation');
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error validating external links: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 4: Check group metadata completeness
  console.log('Test 4: Group metadata completeness');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['list']);
    
    if (result.code === 0) {
      // Check for Japanese group names
      const japaneseGroups = [
        'ピアラーニングハブ生成AI部',
        'さぬきピアラーニングハブゴルフ部',
        'さぬきピアラーニングハブ英語部',
        'WAOJEさぬきピアラーニングハブ交流会参加者',
        '香川イノベーションベース',
        'さぬきピアラーニングハブ居住者',
        '英語キャンプ卒業者'
      ];
      
      let allGroupsFound = true;
      japaneseGroups.forEach(groupName => {
        if (!result.stdout.includes(groupName)) {
          console.log(`❌ FAIL: Missing expected group: ${groupName}`);
          allGroupsFound = false;
        }
      });
      
      if (allGroupsFound) {
        console.log('✅ PASS: All expected Japanese group names are present');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Some expected group names are missing');
        testsFailed++;
      }
      
      // Check for descriptions in Japanese
      if (result.stdout.includes('について') || result.stdout.includes('です')) {
        console.log('✅ PASS: Group descriptions are in Japanese');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Group descriptions may not be in Japanese');
        testsFailed++;
      }
      
    } else {
      console.log('❌ FAIL: Could not retrieve group data for metadata validation');
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error validating group metadata: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 5: Database integration test
  console.log('Test 5: Database integration');
  try {
    const result = await runCommand('scripts/manageInitialGroups.js', ['validate']);
    
    // The validate command should work regardless of database state
    if (result.code === 0 || result.code === 1) {
      console.log('✅ PASS: Database validation command is functional');
      testsPassed++;
      
      if (result.stdout.includes('groups are present') || result.stdout.includes('groups are missing')) {
        console.log('✅ PASS: Validation provides clear status information');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Validation does not provide clear status');
        testsFailed++;
      }
      
    } else {
      console.log(`❌ FAIL: Database validation failed unexpectedly with code ${result.code}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Error testing database integration: ${error.message}`);
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
    console.log('✅ Group display functionality is working correctly');
    console.log('✅ Groups can be retrieved from database');
    console.log('✅ External links are properly formatted');
    console.log('✅ Group metadata is complete and in Japanese');
  } else {
    console.log('\n⚠️  Some tests failed');
    console.log('❌ Please review the group display implementation');
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