import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/octavia.*.test.ts'],
    globals: false,
  },
});
