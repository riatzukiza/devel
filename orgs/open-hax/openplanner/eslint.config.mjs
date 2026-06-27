import js from '@eslint/js';
import functional from 'eslint-plugin-functional';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

const sourceFiles = ['src/**/*.{ts,tsx,js,mjs}', 'tests/**/*.{ts,tsx,js,mjs}', 'packages/**/*.{ts,tsx,js,mjs}'];

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/target/**',
      '**/node_modules/**',
      '**/.shadow-cljs/**',
      '**/.clj-kondo/**',
      '**/.lsp/**',
      '**/coverage/**',
      '**/*.cjs',
      'archive/**',
      'pseudo/**',
      'packages/agents/**',
      '**/.worktrees/**',
      '**/.venv/**',
      '**/public/**',
      'openplanner-lake/**',
      'workspace/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: sourceFiles,
    plugins: {
      functional,
      sonarjs,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Downgrade general JS/TS correctness rules to warnings for now: this
      // lint profile is a migration-risk surface, not yet a hard quality gate.
      'no-undef': 'off',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // Migration-risk metrics. These are warnings first so the existing TS can
      // report its Clojure-porting hazards without blocking unrelated work.
      complexity: ['warn', { max: 12 }],
      'sonarjs/cognitive-complexity': ['warn', 18],
      'max-lines': ['warn', { max: 450, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true }],
      'max-len': ['warn', {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: false,
      }],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],

      // Functional-programming migration warnings: these flag code that tends to
      // become painful when translated to smaller Clojure/CLJS pure functions.
      'functional/no-let': 'warn',
      'functional/no-loop-statements': 'warn',
      'functional/immutable-data': 'off',
      'functional/no-try-statements': 'warn',
      // Type-aware immutability checks stay off until package tsconfigs are
      // normalized enough for parserServices across the workspace.
      'functional/prefer-immutable-types': 'off',
      'functional/prefer-readonly-type': 'warn',

      // Side-effect and mutability smoke alarms.
      'no-var': 'warn',
      'prefer-const': 'warn',
      'no-param-reassign': 'warn',
      'no-return-assign': 'warn',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement',
          message: 'Loop-heavy code is harder to port to Clojure; prefer map/filter/reduce or extracted reducers.',
        },
        {
          selector: 'ClassDeclaration, ClassExpression',
          message: 'Class-based state is harder to port to Clojure; prefer data + pure functions.',
        },
        {
          selector: "CallExpression[callee.name='require']",
          message: 'CommonJS require hides dependency boundaries; prefer explicit ESM imports.',
        },
      ],

      // TypeScript migration hygiene.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,js,mjs}', '**/*.test.{ts,tsx,js,mjs}', '**/*.spec.{ts,tsx,js,mjs}'],
    rules: {
      'max-lines-per-function': ['warn', { max: 140, skipBlankLines: true, skipComments: true, IIFEs: true }],
      'functional/no-let': 'off',
      'functional/immutable-data': 'off',
      'functional/prefer-immutable-types': 'off',
      'functional/prefer-readonly-type': 'off',
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='setTimeout'][arguments.0.type='Identifier']",
          message: 'Avoid unbounded sleeps in tests; prefer explicit readiness probes.',
        },
      ],
    },
  },
  {
    files: ['packages/graph/graph-claim-core/**/*.{js,mjs}'],
    rules: {
      // Generated shadow-cljs output and package metadata are not TS migration targets.
      'max-lines': 'off',
      'max-len': 'off',
    },
  },
];
