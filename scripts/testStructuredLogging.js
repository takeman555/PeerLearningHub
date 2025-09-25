#!/usr/bin/env node

/**
 * Test Script for Structured Logging System
 */

async function testStructuredLogging() {
  console.log('🧪 Testing Structured Logging System...');
  
  try {
    // Import the validation function
    const { validateStructuredLogging } = require('./validateStructuredLogging');
    
    // Run validation
    await validateStructuredLogging();
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testStructuredLogging();
}

module.exports = { testStructuredLogging };
