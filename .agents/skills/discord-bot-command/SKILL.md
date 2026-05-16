---
name: discord-bot-command
description: Scaffold a discord.js slash command handler that triggers a beat-agent pipeline.
---

# Skill: discord-bot-command

## Goal
Create a new Discord slash command that calls beat-agent functions and replies with audio or beat info.

## Use This Skill When
- Building or extending a Discord music bot.
- Wiring a user-facing command to the beat pipeline.
- Adding `/beat`, `/play`, `/vibe`, or similar commands.

## Do Not Use This Skill When
- No Discord bot context exists.
- The task is pure music generation without a bot.

## Inputs
- Command name and description.
- Pipeline to invoke: any combination of beat-theory / beat-compose / beat-render / beat-discord.
- Options: any slash command options (key, mood, bpm, etc.).

## Steps
1. Create `commands/<name>.js` with:
   - `data`: `SlashCommandBuilder` with options.
   - `execute(interaction)`: parse options → call pipeline → reply.
2. Register command in `deploy-commands.js`.
3. Add handler in `bot.js` `interactionCreate` listener.
4. Test: `/name` in Discord → bot joins VC and plays or replies with embed.

## Template
```js
import { SlashCommandBuilder } from 'discord.js';
import { drumClip, melodyClip, writeClipsToMidi } from '../../packages/beat-agent/src/index.js';
import { wavToOgg } from '../../packages/beat-agent/src/render.js';
import { playInVoice } from '../../packages/beat-agent/src/discord.js';

export const data = new SlashCommandBuilder()
  .setName('beat')
  .setDescription('Generate and play a beat')
  .addStringOption(o => o.setName('mood').setDescription('Vibe').setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply();
  const mood = interaction.options.getString('mood') ?? 'chill';
  // ... call pipeline ...
  await interaction.editReply({ content: `Playing: ${mood} beat` });
}
```
