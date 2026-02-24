---
title: "Option A (recommended): WebSocket RPC + shared `cljc` protocol"
status: incoming
source_note: "pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-extensions.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Option A (recommended): WebSocket RPC + shared `cljc` protocol

## Context
- Source note: `pm2-clj-project/docs/notes/infrastructure/pm2-clj-dsl-extensions.md`
- Category: `infrastructure`

## Draft Requirements
- **Node (discord.js or shadow-cljs :node target)** = IO adapter + realtime
- **JVM Clojure** = agent brain (tools, router, state, logging, benchmarks)
- **WebSocket** between them = events + tool calls + streaming
- Works for **streaming** (voice chunks, partial STT, frequent state updates)
- You can do **request/response** *and* **pub/sub** on one connection
- You can keep your **agent system authoritative** in JVM without blocking Node
- message envelope
- op keywords
- `clojure.spec.alpha` validation (works in clj + cljs)
- **Transit** (best for keywordy Clojure data): great for clj + cljs; Node side can be cljs easily
- **JSON** (best if Node is TS/JS): simplest, but you’ll map keywords ↔ strings
- `:io.discord/event` — message create, slash command, voice state, etc.

## Summary Snippets
- If you’re in **shadow-cljs** and you want to “reach out to JVM Clojure”, the smoothest mental model is:
- > **ClojureScript cannot call JVM Clojure directly** (different runtimes), so you build a *boundary* — usually **WebSocket RPC** (or HTTP for simple calls). > Then you share *protocol + validation* in **`*.cljc`** so both sides stay in lockstep.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
