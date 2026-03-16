#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const scripts = [
  'scripts/social/post_bluesky.mjs',
  'scripts/social/post_discord.mjs',
  'scripts/social/post_x.mjs',
  'scripts/social/post_reddit.mjs',
];
const dry = process.argv.includes('--publish') ? [] : ['--dry-run'];
for (const script of scripts) {
  const res = spawnSync('node', [script, 'data/social_payloads.latest.json', ...dry], {stdio: 'inherit'});
  if (res.status !== 0) process.exit(res.status ?? 1);
}
