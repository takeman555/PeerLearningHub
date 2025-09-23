#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Run this script to verify your Supabase configuration
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔍 Checking Supabase Environment Configuration...\n');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Please create a .env file in the PeerLearningHub directory');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

const config = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    config[key.trim()] = value.trim();
  }
});

// Check required variables
const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
];

let allConfigured = true;

console.log('📋 Configuration Status:');
console.log('========================');

requiredVars.forEach(varName => {
  const value = config[varName];
  const isConfigured = value && 
    value !== 'https://your-project.supabase.co' && 
    value !== 'your-anon-key' &&
    value !== 'your-anon-key-here' &&
    value !== 'https://your-project-id.supabase.co';

  if (isConfigured) {
    console.log(`✅ ${varName}: Configured`);
    if (varName === 'EXPO_PUBLIC_SUPABASE_URL') {
      const projectId = value.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (projectId) {
        console.log(`   Project ID: ${projectId[1]}`);
      }
    }
  } else {
    console.log(`❌ ${varName}: ${value || 'Not set'}`);
    allConfigured = false;
  }
});

console.log('\n📊 Summary:');
console.log('===========');

if (allConfigured) {
  console.log('✅ All required environment variables are configured!');
  console.log('🚀 You can now test your Supabase connection in the app.');
  console.log('\nNext steps:');
  console.log('1. Start your development server: npm start');
  console.log('2. Open the app and use the "Test Connection" button');
  console.log('3. If the test passes, you can proceed with database setup');
} else {
  console.log('❌ Some environment variables need to be configured.');
  console.log('\nTo fix this:');
  console.log('1. Go to https://supabase.com and create a new project');
  console.log('2. Get your project URL and anon key from the API settings');
  console.log('3. Update the .env file with your actual values');
  console.log('4. Run this script again to verify');
}

console.log('\n📖 For detailed setup instructions, see: SUPABASE_SETUP_GUIDE.md');