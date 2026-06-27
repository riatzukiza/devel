import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);
const storybookDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(storybookDir, '..', '..');
const reactEntry = require.resolve('react');
const reactJsxRuntime = require.resolve('react/jsx-runtime');
const reactJsxDevRuntime = require.resolve('react/jsx-dev-runtime');
const reactDomEntry = require.resolve('react-dom');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => 
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  viteFinal: async (config) => {
    const existingAliases = Array.isArray(config.resolve?.alias)
      ? config.resolve.alias
      : Object.entries(config.resolve?.alias ?? {}).map(([find, replacement]) => ({
          find,
          replacement,
        }));

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          { find: '@open-hax/uxx/tokens', replacement: resolve(repoRoot, 'tokens/src/index.ts') },
          { find: '@open-hax/uxx/primitives', replacement: resolve(repoRoot, 'react/src/primitives/index.ts') },
          { find: '@open-hax/uxx', replacement: resolve(repoRoot, 'src/index.ts') },
          { find: 'react/jsx-runtime', replacement: reactJsxRuntime },
          { find: 'react/jsx-dev-runtime', replacement: reactJsxDevRuntime },
          { find: 'react-dom', replacement: reactDomEntry },
          { find: 'react', replacement: reactEntry },
          ...existingAliases,
        ],
      },
      define: {
        ...config.define,
        'process.env': {},
      },
    };
  },
};

export default config;
