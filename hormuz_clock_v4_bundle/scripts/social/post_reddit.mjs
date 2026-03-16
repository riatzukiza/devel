#!/usr/bin/env node
import fs from 'node:fs';
import { URLSearchParams } from 'node:url';

const TOKEN = process.env.REDDIT_ACCESS_TOKEN;
const SUBREDDIT = process.env.REDDIT_SUBREDDIT;
const KIND = process.env.REDDIT_KIND || 'self';
const DRY_RUN = process.argv.includes('--dry-run') || !TOKEN || !SUBREDDIT;
const payloadPath = process.argv[2] || 'data/social_payloads.latest.json';
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const reddit = payloads.reddit;

const form = new URLSearchParams({
  sr: SUBREDDIT,
  kind: KIND,
  title: reddit.title,
  text: reddit.body,
  api_type: 'json',
});

if (DRY_RUN) {
  console.log(JSON.stringify({platform: 'reddit', dryRun: true, subreddit: SUBREDDIT, kind: KIND, title: reddit.title}, null, 2));
  process.exit(0);
}

const resp = await fetch('https://oauth.reddit.com/api/submit', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${TOKEN}`,
    'content-type': 'application/x-www-form-urlencoded',
    'user-agent': 'hormuz-clock-bot/0.1',
  },
  body: form.toString(),
});
if (!resp.ok) throw new Error(`Reddit post failed: ${resp.status} ${await resp.text()}`);
console.log(await resp.text());
