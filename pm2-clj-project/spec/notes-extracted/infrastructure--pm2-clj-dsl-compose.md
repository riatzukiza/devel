---
title: "Why WS + Transit is the smoothest for CLJS↔CLJ"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-compose.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Why WS + Transit is the smoothest for CLJS↔CLJ

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-compose.md`
- Category: `infrastructure`

## Draft Requirements
- **shared `*.cljc` protocol + validation**
- **WebSocket (or TCP) boundary**
- **Transit encoding** (keeps keywords/maps pleasant)
- Works for **streaming** events (chat, voice chunks later, partial transcripts).
- Lets you do **RPC + pub/sub** over the same pipe.
- With Transit you keep Clojure-y data without fighting JSON stringification.
- `discord.js` latest shown as **14.25.1** on npm/docs. ([npm][2])
- discord.js docs currently indicate **Node 22.12+** requirement. ([discord.js][3])
- Voice support is via `@discordjs/voice`. ([Discord.js Guide][4])
- write macros in **Clojure** (`.clj`), used by CLJS via `:require-macros` / `:refer-macros`
- runtime is CLJS (`.cljs`)
- `promethean.discord.dsl` (macros like `def-discord-bot`, `def-command`)

## Summary Snippets
- Yep — if the Discord process is **ClojureScript on Node (shadow-cljs :node-script)**, the smoothest path to JVM Clojure is:
- * **shared `*.cljc` protocol + validation** * **WebSocket (or TCP) boundary** * **Transit encoding** (keeps keywords/maps pleasant)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
