---
name: beat-discord
description: Stream an audio file into a Discord voice channel using @discordjs/voice.
---

# Skill: beat-discord

## Goal
Play a rendered audio file (Ogg/WAV) in a Discord voice channel via a discord.js bot.

## Use This Skill When
- A beat or audio file is ready and needs to be played in Discord.
- Building a Discord bot that responds to music commands.
- Chaining after beat-render.

## Do Not Use This Skill When
- Audio hasn't been rendered yet (use beat-compose + beat-render first).
- The bot is not connected to a guild/voice channel.

## Inputs
- `client`: an initialized `discord.js` Client with GUILD_VOICE_STATES intent.
- `guildId`, `channelId`: target voice channel identifiers.
- `audioPath`: path to .ogg or .wav file.

## Steps
1. Import `{ playInVoice }` from `packages/beat-agent/src/discord.js`.
2. Ensure the bot has `Connect` + `Speak` permissions in the target channel.
3. Call `await playInVoice({ client, guildId, channelId, audioPath })`.
4. The connection destroys itself when playback ends.

## Output
- Audio plays in the voice channel.
- Promise resolves on `AudioPlayerStatus.Idle`.

## Required env vars
- `DISCORD_TOKEN` — bot token (never hardcode).

## Notes
- `@discordjs/opus` must be installed for Opus encoding (already globally installed).
- Voice connections require the bot account to have joined the target server.
