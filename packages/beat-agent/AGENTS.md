# beat-agent

Node.js beat-making package. Agent entry point for MIDI composition, audio rendering,
and Discord voice streaming.

## Layout
- `src/compose.js` — Scribbletune/Tonal composition helpers
- `src/midi.js` — MIDI file write/read (midi-writer-js, @tonejs/midi)
- `src/render.js` — FFmpeg render pipeline (MIDI → WAV → Ogg)
- `src/discord.js` — Discord voice channel streaming
- `src/index.js` — Unified API surface

## Skills
See `devel/.agents/skills/beat-compose/`, `beat-render/`, `beat-discord/`.

## Rules
- All compose functions are pure: (params) → MIDI bytes or file path.
- Rendering is side-effectful; isolate in render.js.
- Discord streaming requires a voice channel ID and a rendered Ogg file.
- Never embed secrets; read from process.env.
