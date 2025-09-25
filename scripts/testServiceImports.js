// Test script to check if services can be imported without errors

console.log('🔍 Testing service imports...');

try {
  console.log('1. Testing permission manager import...');
  const { permissionManager } = require('../services/permissionManager');
  console.log('✅ Permission manager imported successfully');

  console.log('2. Testing members service import...');
  const { membersService } = require('../services/membersService');
  console.log('✅ Members service imported successfully');

  console.log('3. Testing community feed service import...');
  const { communityFeedService } = require('../services/communityFeedService');
  console.log('✅ Community feed service imported successfully');

  console.log('4. Testing service method calls...');
  
  // Test that methods exist
  if (typeof membersService.getActiveMembers === 'function') {
    console.log('✅ membersService.getActiveMembers method exists');
  } else {
    console.log('❌ membersService.getActiveMembers method missing');
  }

  if (typeof communityFeedService.getPosts === 'function') {
    console.log('✅ communityFeedService.getPosts method exists');
  } else {
    console.log('❌ communityFeedService.getPosts method missing');
  }

  console.log('\n🎉 All service imports successful!');
  console.log('The initialization error should be fixed.');

} catch (error) {
  console.error('❌ Error importing services:', error.message);
  console.error('Stack trace:', error.stack);
}