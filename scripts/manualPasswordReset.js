#!/usr/bin/env node

/**
 * Manual Password Reset Guide for Supabase
 * 
 * When email links don't work, use this guide to manually reset passwords
 */

console.log('🔑 Manual Password Reset for tizuka0@gmail.com');
console.log('==============================================\n');

console.log('📋 Step-by-Step Instructions:');
console.log('');
console.log('1. Open Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/swyvpiyfmwozhlvbewhi/auth/users');
console.log('');
console.log('2. Find the user tizuka0@gmail.com in the list');
console.log('');
console.log('3. Click on the user row to open user details');
console.log('');
console.log('4. In the user details page:');
console.log('   • Look for "Reset Password" button');
console.log('   • OR look for "Update User" section');
console.log('   • Set a new password directly');
console.log('');
console.log('5. Alternative method:');
console.log('   • Click the "..." menu next to the user');
console.log('   • Select "Reset Password"');
console.log('   • Enter a new password');
console.log('');

console.log('🔧 Fix Email Confirmation Issue:');
console.log('');
console.log('While you\'re in the dashboard:');
console.log('1. Find tizuka0@gmail.com in the users list');
console.log('2. Check if "Email Confirmed" shows as false');
console.log('3. If false, click "..." menu → "Confirm email"');
console.log('4. This will manually confirm the email');
console.log('');

console.log('⚙️  Disable Email Confirmation for Development:');
console.log('');
console.log('1. Go to Authentication → Settings');
console.log('2. Scroll to "User Signups" section');
console.log('3. Turn OFF "Enable email confirmations"');
console.log('4. Turn OFF "Enable phone confirmations"');
console.log('5. Click "Save"');
console.log('');

console.log('🧪 Test New Settings:');
console.log('');
console.log('After making these changes:');
console.log('1. Try logging in with tizuka0@gmail.com and new password');
console.log('2. If it works, you\'re all set!');
console.log('3. If not, create a new test user to verify settings');
console.log('');

console.log('🆘 If Dashboard Access Fails:');
console.log('');
console.log('Create a new user for testing:');
console.log('• Use a different email (e.g., test@example.com)');
console.log('• Use a simple password (e.g., "password123")');
console.log('• With email confirmation disabled, it should work immediately');
console.log('');

console.log('📱 Quick Test in App:');
console.log('');
console.log('1. Start the app: npm start');
console.log('2. Go to registration screen');
console.log('3. Register with: test@example.com / password123');
console.log('4. Should login immediately without email confirmation');
console.log('');