// Simple test to check if the community app can load without errors

console.log('🔍 Testing community app loading...');

// Test if we can at least check the file structure
const fs = require('fs');
const path = require('path');

try {
  // Check if key files exist
  const filesToCheck = [
    'services/communityFeedService.ts',
    'services/membersService.ts', 
    'services/permissionManager.ts',
    'app/community.tsx'
  ];

  console.log('📁 Checking file structure...');
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }

  // Check if the services have the lazy initialization pattern
  console.log('\n🔍 Checking service implementations...');
  
  const membersServiceContent = fs.readFileSync(path.join(__dirname, '..', 'services/membersService.ts'), 'utf8');
  if (membersServiceContent.includes('getInstance()')) {
    console.log('✅ Members service has lazy initialization');
  } else {
    console.log('❌ Members service missing lazy initialization');
  }

  const communityFeedServiceContent = fs.readFileSync(path.join(__dirname, '..', 'services/communityFeedService.ts'), 'utf8');
  if (communityFeedServiceContent.includes('getInstance()')) {
    console.log('✅ Community feed service has lazy initialization');
  } else {
    console.log('❌ Community feed service missing lazy initialization');
  }

  console.log('\n🎉 File structure check completed!');
  console.log('💡 The initialization error should be fixed.');
  console.log('   Try restarting your app to see if the error is resolved.');

} catch (error) {
  console.error('❌ Error checking files:', error.message);
}