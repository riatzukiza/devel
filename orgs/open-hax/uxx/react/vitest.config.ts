import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@open-hax/uxx/tokens',
        replacement: fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
      },
      {
        find: '@open-hax/uxx/primitives',
        replacement: fileURLToPath(new URL('./src/primitives/index.ts', import.meta.url)),
      },
      {
        find: '@open-hax/uxx',
        replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    include: ['react/src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./react/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['react/src/**/*.tsx'],
      exclude: [
        'react/src/**/*.stories.tsx',
        'react/src/**/*.test.tsx',
        'react/src/**/index.ts',
      ],
    },
  },
});
