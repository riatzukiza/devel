#!/usr/bin/env node
import fs from 'node:fs';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DRY_RUN = process.argv.includes('--dry-run') || !TOKEN || !CHANNEL_ID;
const payloadPath = process.argv[2] || 'data/social_payloads.latest.json';
const payloads = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const discord = payloads.discord;

const body = {
  content: discord.content,
  embeds: discord.embed ? [{
    title: discord.embed.title,
    description: discord.embed.description,
  }] : [],
  allowed_mentions: { parse: [] },
};

if (DRY_RUN) {
  console.log(JSON.stringify({platform: 'discord', dryRun: true, channelId: CHANNEL_ID, body}, null, 2));
  process.exit(0);
}

const resp = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
  method: 'POST',
  headers: {
    authorization: `Bot ${TOKEN}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!resp.ok) throw new Error(`Discord post failed: ${resp.status} ${await resp.text()}`);
console.log(await resp.text());
