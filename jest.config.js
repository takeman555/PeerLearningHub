module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/tests/**/*.spec.{js,ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-transform-class-properties', { loose: true }],
        '@babel/plugin-transform-private-methods'
      ]
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-purchases|@supabase|expo)/)',
  ],
  collectCoverageFrom: [
    'services/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  globals: {
    __DEV__: true,
  },
};