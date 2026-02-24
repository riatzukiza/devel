---
title: "1) Repo dependency: git deps (fastest) + later Clojars (optional)"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-cli.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 1) Repo dependency: git deps (fastest) + later Clojars (optional)

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-cli.md`
- Category: `infrastructure`

## Draft Requirements
- **`octave-commons/promethean-agent-system`** = the reusable library (tools, agents, router, benchmarks, etc.)
- **`octave-commons/promethean-duck`** = the Discord app that *depends on* the library and defines Duck via DSL
- `promethean.discord.dsl` (macros)
- `promethean.discord.runtime` (JDA wiring + event -> bus)
- `promethean.discord.tools` (stock tools: send message, join voice, speak, etc.)
- Define a bot + handlers declaratively
- Handlers can call tools / spawn agent loops
- Voice/text are just “sources” feeding the same agent runtime
- Discord events become **inputs** into the same loop you already scaffolded
- You can start with **text only** and still be “live” immediately
- Voice becomes another module (or another event source) when ready
- `discljord` is great for Discord API, async-first — but it explicitly says **no voice (for now)**. ([GitHub][4])

## Summary Snippets
- Yep — the clean way is **2 repos**:
- 1. **`octave-commons/promethean-agent-system`** = the reusable library (tools, agents, router, benchmarks, etc.) 2. **`octave-commons/promethean-duck`** = the Discord app that *depends on* the library and defines Duck via DSL

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
