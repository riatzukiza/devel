#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outDir = join(repoRoot, 'dist', 'eta-mu-themes');
const { etaMuThemes } = await import('../dist/tokens/src/eta-mu-theme.js');

mkdirSync(outDir, { recursive: true });

for (const theme of Object.values(etaMuThemes)) {
  writeFileSync(join(outDir, `${theme.name}.json`), `${JSON.stringify(theme, null, 2)}\n`);
  console.log(`Generated dist/eta-mu-themes/${theme.name}.json`);
}
