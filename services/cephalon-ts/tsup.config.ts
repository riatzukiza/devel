import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Disable dts generation for now - tsconfig include issues
  sourcemap: true,
  splitting: false,
  clean: true,
  target: 'node20',
  outDir: 'dist',
});
