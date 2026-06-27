#!/usr/bin/env node
/**
 * CI deploy: copies built runtime.js files into the e2e extensions dir
 * so that `pnpm exec pi` in the e2e package can load them.
 *
 * Mirrors what build.mjs does locally to ~/.pi/agent/extensions/cljs-<name>/
 * but targets packages/eta-mu-extensions-e2e/extensions/cljs-<name>/ instead.
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT  = path.resolve(__dirname, '..');
const E2E_ROOT  = path.resolve(PKG_ROOT, '..', 'eta-mu-extensions-e2e');
const TARGET    = path.join(PKG_ROOT, 'target', 'runtime');
const EXT_DIR   = path.join(E2E_ROOT, 'extensions');

if (!existsSync(TARGET)) {
  console.error('target/runtime not found — run pnpm build first');
  process.exit(1);
}

for (const name of readdirSync(TARGET)) {
  const runtime = path.join(TARGET, name, 'runtime.js');
  if (!existsSync(runtime)) continue;
  const dest = path.join(EXT_DIR, `cljs-${name}`);
  mkdirSync(dest, { recursive: true });
  copyFileSync(runtime, path.join(dest, 'runtime.js'));
  writeFileSync(
    path.join(dest, 'index.ts'),
    'import runtime from "./runtime.js";\nexport default runtime;\n',
    'utf8'
  );
  console.log(`  deployed cljs-${name}`);
}
console.log('deploy-ci: done');
