import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/octavia.*.test.ts', 'tests/pm2-clj.*.test.ts'],
    globals: false,
  },
});
