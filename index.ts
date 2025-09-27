// CRITICAL: Load Hermes-compatible polyfills before ANYTHING else
require('./polyfills.js');

// Additional safety check - ensure our polyfills are active
if (typeof global !== 'undefined' && !global.window) {
  // Verify our Event implementation is in place
  if (!global.Event || typeof global.Event.NONE === 'undefined') {
    console.error('❌ Event polyfill failed to load properly');
  } else {
    console.log('✅ Event polyfill verification passed');
  }
}

// Import and register the Expo Router entry point
import 'expo-router/entry';
