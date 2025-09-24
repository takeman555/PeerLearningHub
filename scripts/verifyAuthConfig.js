require('dotenv').config();

console.log('🔧 Verifying Authentication Configuration');
console.log('=====================================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || '❌ Not set');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');

// Check mock auth conditions
const conditions = {
  hasPlaceholder: process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder'),
  isTestEnv: process.env.NODE_ENV === 'test',
  missingUrl: !process.env.EXPO_PUBLIC_SUPABASE_URL,
  missingKey: !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
};

console.log('\n🔍 Mock Auth Conditions:');
console.log('- URL contains "placeholder":', conditions.hasPlaceholder ? '❌ Yes' : '✅ No');
console.log('- NODE_ENV is "test":', conditions.isTestEnv ? '❌ Yes' : '✅ No');
console.log('- Missing SUPABASE_URL:', conditions.missingUrl ? '❌ Yes' : '✅ No');
console.log('- Missing SUPABASE_ANON_KEY:', conditions.missingKey ? '❌ Yes' : '✅ No');

const USE_MOCK_AUTH = conditions.hasPlaceholder || conditions.isTestEnv || conditions.missingUrl || conditions.missingKey;

console.log('\n🎯 Final Result:');
console.log('USE_MOCK_AUTH:', USE_MOCK_AUTH ? '❌ TRUE (Mock will be used)' : '✅ FALSE (Real DB will be used)');

if (USE_MOCK_AUTH) {
  console.log('\n⚠️  MOCK AUTHENTICATION WILL BE USED');
  console.log('To use real database authentication:');
  console.log('1. Ensure EXPO_PUBLIC_SUPABASE_URL does not contain "placeholder"');
  console.log('2. Ensure EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
  console.log('3. Ensure NODE_ENV is not "test"');
} else {
  console.log('\n✅ REAL DATABASE AUTHENTICATION WILL BE USED');
  console.log('Your app is configured to use the actual Supabase database.');
  console.log('Users can register and sign in with real accounts.');
}

console.log('\n📱 App Behavior:');
console.log('- User registration: ' + (USE_MOCK_AUTH ? 'Mock (simulated)' : 'Real (creates actual users)'));
console.log('- User sign in: ' + (USE_MOCK_AUTH ? 'Mock (simulated)' : 'Real (validates against database)'));
console.log('- Session management: ' + (USE_MOCK_AUTH ? 'Mock (in-memory)' : 'Real (persistent)'));
console.log('- Profile data: ' + (USE_MOCK_AUTH ? 'Mock (temporary)' : 'Real (stored in database)'));

console.log('\n🎉 Configuration verification complete!');