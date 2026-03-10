#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SERVICE = process.env.BLUESKY_SERVICE || 'https://bsky.social';
const IDENTIFIER = process.env.BLUESKY_IDENTIFIER;
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;
const DRY_RUN = process.argv.includes('--dry-run') || !IDENTIFIER || !PASSWORD;
const payloadPath = process.argv[2] || 'data/social_payloads.latest.json';
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const post = payloads.bluesky;

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

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

let embed;
if (post.image) {
  const bytes = fs.readFileSync(post.image.path);
  const uploadResp = await fetch(`${SERVICE}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      'content-type': post.image.mimeType || mimeFor(post.image.path),
      authorization: `Bearer ${session.accessJwt}`,
    },
    body: bytes,
  });
  if (!uploadResp.ok) throw new Error(`Bluesky image upload failed: ${uploadResp.status}`);
  const blob = await uploadResp.json();
  embed = {
    $type: 'app.bsky.embed.images',
    images: [{
      alt: post.image.alt || 'Hormuz Risk Clock image',
      image: blob.blob || blob,
    }],
  };
}

const record = {
  repo: session.did,
  collection: 'app.bsky.feed.post',
  record: {
    $type: 'app.bsky.feed.post',
    text: post.text,
    createdAt: new Date().toISOString(),
    ...(embed ? {embed} : {}),
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
