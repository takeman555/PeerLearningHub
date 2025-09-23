#!/usr/bin/env node

/**
 * Script to help disable email confirmation in Supabase for development
 * 
 * This script provides instructions for disabling email confirmation
 * in your Supabase project to make development easier.
 */

console.log('🔧 Supabase Email Confirmation Setup for Development');
console.log('================================================\n');

console.log('To disable email confirmation for easier development:');
console.log('');
console.log('1. Go to your Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/swyvpiyfmwozhlvbewhi');
console.log('');
console.log('2. Navigate to: Authentication → Settings');
console.log('');
console.log('3. Scroll down to "User Signups" section');
console.log('');
console.log('4. Turn OFF the following settings:');
console.log('   ❌ Enable email confirmations');
console.log('   ❌ Enable phone confirmations');
console.log('   ❌ Double confirm email changes');
console.log('');
console.log('5. Click "Save" at the bottom');
console.log('');
console.log('After this change:');
console.log('✅ New users can sign up and login immediately');
console.log('✅ No email confirmation required');
console.log('✅ Development becomes much easier');
console.log('');
console.log('⚠️  Remember to re-enable these settings in production!');
console.log('');

// Check current user status
console.log('📋 Current User Status Check');
console.log('===========================');
console.log('');
console.log('To check if tizuka0@gmail.com is confirmed:');
console.log('1. Go to Authentication → Users in Supabase Dashboard');
console.log('2. Find tizuka0@gmail.com in the user list');
console.log('3. Check the "Email Confirmed" column');
console.log('');
console.log('If not confirmed, you can:');
console.log('• Click the "..." menu next to the user');
console.log('• Select "Confirm email"');
console.log('• Or disable email confirmation as described above');
console.log('');

console.log('🔑 Password Reset Options');
console.log('========================');
console.log('');
console.log('Option 1: Use the app\'s forgot password feature');
console.log('Option 2: Reset via Supabase Dashboard:');
console.log('  1. Go to Authentication → Users');
console.log('  2. Click on tizuka0@gmail.com');
console.log('  3. Click "Reset Password"');
console.log('  4. Set a new password');
console.log('');

console.log('🚀 Quick Test');
console.log('=============');
console.log('After making these changes, try:');
console.log('1. Register a new test user');
console.log('2. Login immediately (no email confirmation needed)');
console.log('3. Test all authentication features');
console.log('');