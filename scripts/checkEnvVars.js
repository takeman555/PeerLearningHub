#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * 
 * This script checks if environment variables are properly loaded
 */

require('dotenv').config();

console.log('🔍 Environment Variables Check');
console.log('==============================');

const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalVars = [
  'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_APP_VERSION',
  'NODE_ENV',
  'EXPO_PUBLIC_REVENUECAT_API_KEY_IOS'
];

console.log('\n📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (varName.includes('KEY') ? `${value.substring(0, 20)}...` : value) : 
    'Not set';
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const displayValue = value || 'Not set';
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔧 Recommendations:');
const missingRequired = requiredVars.filter(varName => !process.env[varName]);
if (missingRequired.length > 0) {
  console.log('❌ Missing required variables:', missingRequired.join(', '));
  console.log('   Please check your .env file');
} else {
  console.log('✅ All required variables are set');
}

console.log('\n📁 Environment file check:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development'];
envFiles.forEach(fileName => {
  const filePath = path.join(process.cwd(), fileName);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${fileName}: ${exists ? 'Found' : 'Not found'}`);
});