#!/usr/bin/env node
import fs from 'node:fs';

const TOKEN = process.env.X_USER_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run') || !TOKEN;
const payloadPath = process.argv[2] || 'data/social_payloads.latest.json';
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const x = payloads.x;

const body = { text: x.text };

if (DRY_RUN) {
  console.log(JSON.stringify({platform: 'x', dryRun: true, body, thread: x.thread}, null, 2));
  process.exit(0);
}

const resp = await fetch('https://api.x.com/2/tweets', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${TOKEN}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!resp.ok) throw new Error(`X post failed: ${resp.status} ${await resp.text()}`);
console.log(await resp.text());
