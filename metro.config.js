/**
 * Metro Configuration for PeerLearningHub
 * Optimized for development and production builds with Hermes compatibility
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Basic configuration
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'webp',
  'json',
];

// Hermes-specific optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Disable some optimizations that can cause issues with Hermes
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Ensure polyfills are loaded first - CRITICAL for Hermes compatibility
config.serializer.getModulesRunBeforeMainModule = () => [
  require.resolve('./polyfills.js'),
  require.resolve('react-native-url-polyfill/auto'),
];

// Additional resolver configuration to prioritize our polyfills
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx'];

// Additional resolver configuration for better compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
