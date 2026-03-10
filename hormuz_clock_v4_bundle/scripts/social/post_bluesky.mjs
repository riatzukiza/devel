#!/usr/bin/env node
import fs from 'node:fs';

const SERVICE = process.env.BLUESKY_SERVICE || 'https://bsky.social';
const IDENTIFIER = process.env.BLUESKY_IDENTIFIER;
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;
const DRY_RUN = process.argv.includes('--dry-run') || !IDENTIFIER || !PASSWORD;
const payloadPath = process.argv[2] || 'data/social_payloads.latest.json';
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const post = payloads.bluesky;

if (DRY_RUN) {
  console.log(JSON.stringify({platform: 'bluesky', dryRun: true, service: SERVICE, post}, null, 2));
  process.exit(0);
}

const loginResp = await fetch(`${SERVICE}/xrpc/com.atproto.server.createSession`, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({identifier: IDENTIFIER, password: PASSWORD}),
});
if (!loginResp.ok) throw new Error(`Bluesky login failed: ${loginResp.status}`);
const session = await loginResp.json();

const record = {
  repo: session.did,
  collection: 'app.bsky.feed.post',
  record: {
    $type: 'app.bsky.feed.post',
    text: post.text,
    createdAt: new Date().toISOString(),
  },
};

const createResp = await fetch(`${SERVICE}/xrpc/com.atproto.repo.createRecord`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${session.accessJwt}`,
  },
  body: JSON.stringify(record),
});
if (!createResp.ok) throw new Error(`Bluesky post failed: ${createResp.status}`);
console.log(await createResp.text());
