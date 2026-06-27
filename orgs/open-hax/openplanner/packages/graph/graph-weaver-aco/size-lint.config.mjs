export default {
  includePaths: ['src'],
  ignoreDirectories: ['node_modules', 'dist', 'build', '.git'],
  ignoreSuffixes: ['.d.ts'],
  thresholdsByExtension: {
    '.ts': { warn: 350, error: 500 },
    '.tsx': { warn: 350, error: 500 },
  },
};
