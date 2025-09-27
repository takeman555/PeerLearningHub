/**
 * Metro Configuration for PeerLearningHub
 * Optimized for development and production builds
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

config.serializer.getModulesRunBeforeMainModule = () => [
  require.resolve('./utils/globalEventPatch'),
];

module.exports = config;
