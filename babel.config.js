module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure polyfills are loaded first
      [
        'module-resolver',
        {
          alias: {
            // Force polyfill loading
            './polyfills': './polyfills.js',
          },
        },
      ],
    ],
  };
};