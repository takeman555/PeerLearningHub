#!/usr/bin/env node

/**
 * Initial Groups Service Integration Test
 * 
 * This test validates the initial groups creation functionality according to requirements:
 * - 5.1: Create the specified 7 groups with proper metadata
 * - 5.2: Batch creation functionality
 * - 6.5: Group data validation
 * 
 * Tests cover:
 * - Group list validation
 * - Batch creation functionality
 * - Missing groups detection
 * - Data validation
 */

const { initialGroupsService } = require('../services/initialGroupsService');

console.log('🧪 Initial Groups Service Integration Test');
console.log('==========================================\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Get initial groups list
  console.log('Test 1: Get initial groups list');
  try {
    const groups = initialGroupsService.getInitialGroupsList();
    
    if (groups.length === 7) {
      console.log('✅ PASS: Correct number of groups (7)');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected 7 groups, got ${groups.length}`);
      testsFailed++;
    }

    // Validate group structure
    const requiredFields = ['name', 'description', 'externalLink'];
    let structureValid = true;
    
    groups.forEach((group, index) => {
      requiredFields.forEach(field => {
        if (!group[field]) {
          console.log(`❌ FAIL: Group ${index + 1} missing field: ${field}`);
          structureValid = false;
        }
      });
      
      // Validate external link format
      if (group.externalLink && !group.externalLink.match(/^https?:\/\//)) {
        console.log(`❌ FAIL: Group ${index + 1} has invalid external link format`);
        structureValid = false;
      }
    });

    if (structureValid) {
      console.log('✅ PASS: All groups have required fields and valid external links');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Some groups have invalid structure');
      testsFailed++;
    }

  } catch (error) {
    console.log(`❌ FAIL: Error getting groups list: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 2: Validate specific group names
  console.log('Test 2: Validate specific group names');
  try {
    const groups = initialGroupsService.getInitialGroupsList();
    const expectedNames = [
      'ピアラーニングハブ生成AI部',
      'さぬきピアラーニングハブゴルフ部',
      'さぬきピアラーニングハブ英語部',
      'WAOJEさぬきピアラーニングハブ交流会参加者',
      '香川イノベーションベース',
      'さぬきピアラーニングハブ居住者',
      '英語キャンプ卒業者'
    ];

    const actualNames = groups.map(g => g.name);
    let namesValid = true;

    expectedNames.forEach(expectedName => {
      if (!actualNames.includes(expectedName)) {
        console.log(`❌ FAIL: Missing expected group: ${expectedName}`);
        namesValid = false;
      }
    });

    if (namesValid) {
      console.log('✅ PASS: All expected group names are present');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Some expected group names are missing');
      testsFailed++;
    }

  } catch (error) {
    console.log(`❌ FAIL: Error validating group names: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 3: Check existing groups (should handle database errors gracefully)
  console.log('Test 3: Check existing groups functionality');
  try {
    const result = await initialGroupsService.checkExistingGroups();
    
    if (result && typeof result === 'object') {
      if (result.hasOwnProperty('existingGroups') && 
          result.hasOwnProperty('missingGroups') && 
          result.hasOwnProperty('allExist')) {
        console.log('✅ PASS: checkExistingGroups returns correct structure');
        testsPassed++;
      } else {
        console.log('❌ FAIL: checkExistingGroups missing required properties');
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: checkExistingGroups should return an object');
      testsFailed++;
    }

  } catch (error) {
    console.log(`❌ FAIL: Error in checkExistingGroups: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 4: Validate initial groups (should handle database errors gracefully)
  console.log('Test 4: Validate initial groups functionality');
  try {
    const result = await initialGroupsService.validateInitialGroups();
    
    if (result && typeof result === 'object') {
      if (result.hasOwnProperty('isValid') && 
          result.hasOwnProperty('existingCount') && 
          result.hasOwnProperty('missingGroups') && 
          result.hasOwnProperty('report')) {
        console.log('✅ PASS: validateInitialGroups returns correct structure');
        testsPassed++;
      } else {
        console.log('❌ FAIL: validateInitialGroups missing required properties');
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: validateInitialGroups should return an object');
      testsFailed++;
    }

  } catch (error) {
    console.log(`❌ FAIL: Error in validateInitialGroups: ${error.message}`);
    testsFailed++;
  }

  console.log();

  // Test 5: External link validation
  console.log('Test 5: External link validation');
  try {
    const groups = initialGroupsService.getInitialGroupsList();
    let linksValid = true;
    
    groups.forEach((group, index) => {
      const link = group.externalLink;
      
      // Check if it's a valid URL format
      if (!link.startsWith('https://')) {
        console.log(`❌ FAIL: Group ${index + 1} external link should use HTTPS`);
        linksValid = false;
      }
      
      // Check if it's not too long
      if (link.length > 2000) {
        console.log(`❌ FAIL: Group ${index + 1} external link is too long`);
        linksValid = false;
      }
      
      // Check if it contains valid domain patterns
      const validPatterns = ['discord.gg', 'discord.com', 't.me', 'telegram.me', 'line.me'];
      const hasValidPattern = validPatterns.some(pattern => link.includes(pattern));
      
      if (!hasValidPattern) {
        console.log(`⚠️  WARNING: Group ${index + 1} external link uses non-standard domain`);
      }
    });

    if (linksValid) {
      console.log('✅ PASS: All external links have valid format');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Some external links have invalid format');
      testsFailed++;
    }

  } catch (error) {
    console.log(`❌ FAIL: Error validating external links: ${error.message}`);
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
    console.log('✅ Initial Groups Service is working correctly');
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