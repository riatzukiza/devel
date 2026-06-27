#!/usr/bin/env node

const path = require('node:path');
const fs = require('node:fs');

const compiledCli = path.resolve(__dirname, '../dist/cli.cjs');

if (!fs.existsSync(compiledCli)) {
  console.error('[cephalon] Missing build output:', compiledCli);
  console.error('[cephalon] Run `pnpm --dir orgs/octave-commons/cephalon/packages/cephalon-ts build` first.');
  process.exit(1);
}

require(compiledCli);
