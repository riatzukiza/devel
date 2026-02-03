// AVA configuration for cephalon-ts
// Only runs tests within this package directory

export default {
  files: [
    'build/**/*.test.js',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  nodeArguments: [
    '--no-warnings',
  ],
  timeout: '2m',
  environmentVariables: {
    NODE_ENV: 'test',
  },
};
