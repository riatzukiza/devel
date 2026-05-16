---
name: music-export
description: Export generated music artifacts to multiple formats (MIDI, WAV, Ogg, MP3, ABC notation, JSON score).
---

# Skill: music-export

## Goal
Convert beat-agent output to whatever format a downstream consumer needs.

## Use This Skill When
- Output is needed in a format other than MIDI (WAV, MP3, Ogg, ABC).
- Archiving a generated composition to disk with metadata.
- Sharing a beat as a file attachment in Discord.

## Do Not Use This Skill When
- Only Ogg for Discord playback is needed (use beat-render directly).

## Format Matrix
| Target | Tool | Notes |
|---|---|---|
| `.mid` | midi-writer-js | Native output of beat-compose |
| `.wav` | fluidsynth + soundfont | Requires fluidsynth binary |
| `.ogg` | fluent-ffmpeg libopus | From WAV; Discord-ready |
| `.mp3` | fluent-ffmpeg libmp3lame | Needs libmp3lame build |
| `.abc` | abcjs | Render score notation |
| `.json` | custom serializer | Full score as structured data |

## Steps
1. Start from `.mid` (always the canonical intermediate).
2. For WAV: `fluidsynth -F out.wav soundfont.sf2 input.mid`.
3. For Ogg: `wavToOgg(wavPath)` from beat-render.
4. For MP3: `ffmpeg(wav).audioCodec('libmp3lame').save(mp3Path)`.
5. For ABC: use `abcjs` to generate notation string, write `.abc` file.
6. Attach file to Discord reply: `interaction.editReply({ files: [filePath] })`.

## Output
- File at requested path.
- Discord attachment if in bot context.
