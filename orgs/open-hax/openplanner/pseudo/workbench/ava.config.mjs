// AVA config for TypeScript tests with tsx
export default {
  files: ['src/tests/**/*.test.ts', 'tests/**/*.test.ts'],
  timeout: '30s',
  failFast: false,
  extensions: {
    ts: 'module'
  },
  nodeArguments: ['--import=tsx'],
  environmentVariables: {
    NODE_ENV: 'test',
  },
};
