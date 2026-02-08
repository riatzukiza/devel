import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/.cache/**',
      'node_modules/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        allowDefaultProject: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      functional,
      import: importPlugin,
      sonarjs,
      promise,
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 100, IIFEs: true }],
      'max-params': ['warn', 4],
      complexity: ['error', 15],
      
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      
      'no-var': 'error',
      'prefer-const': 'error',
      'import/no-dynamic-require': 'error',
      
      'functional/no-let': 'error',
      'functional/no-try-statements': 'warn',
      'functional/immutable-data': ['warn', { ignoreClasses: 'fieldsOnly' }],
      'functional/no-loop-statements': 'warn',
      
      'promise/no-return-wrap': 'warn',
      'promise/param-names': 'warn',
      
      'import/first': 'warn',
      'import/no-default-export': 'warn',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
