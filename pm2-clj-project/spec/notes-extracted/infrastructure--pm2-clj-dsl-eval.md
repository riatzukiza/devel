---
title: "Tonight’s MVP: a performer Duck that can talk + do a few fun tools"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-eval.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Tonight’s MVP: a performer Duck that can talk + do a few fun tools

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-eval.md`
- Category: `infrastructure`

## Draft Requirements
- `play_sfx {name}`
- `say {text}` (forces TTS output even if the model tries to ramble)
- `persona_set {mode}` (e.g. `duckman`, `scrooge`, `narrator`, `gremlin`)
- `cooldown_set {ms}` (so you can hot-tune spam)
- `chat_send {channel, text}` (optional, for captions / punchlines)
- JSON `{"tool_calls":[{"name":"play_sfx","arguments":{...}}]}`
- or a single-line `CALL play_sfx {"name":"rimshot"}`
- If someone starts speaking while Duck is outputting TTS:
- stop current playback
- cancel any in-flight LLM request (AbortController)
- drop queued replies (or keep only latest)
- Single-file queue for TTS playback so it never overlaps itself.

## Summary Snippets
- ([Past chat][1])([Past chat][2])([Past chat][1])([Past chat][3])([Past chat][1])
- Hell yeah. If the goal is **“Duck is live in Discord tonight”**, I’d go for a tight MVP that’s **stable + funny + low-latency**, and leave the deeper hierarchy/bench stuff for tomorrow.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
