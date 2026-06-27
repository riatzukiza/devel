---
title: "v1 effects runner: async-safe results, `:effects/pending`, inflight limits (pure `shadow-cljs`) #shadowcljs #ecs #effects"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/v1-effects-runner.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# v1 effects runner: async-safe results, `:effects/pending`, inflight limits (pure `shadow-cljs`) #shadowcljs #ecs #effects

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/v1-effects-runner.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- effects get **deduped + tracked** in `:effects/pending`
- runner starts up to **N inflight** effects per tick
- when an effect resolves, it **pushes a `*.result` / `*.error` event** back into the world (via `world*`)
- systems (Sentinel/Cephalon) can now reliably react to `:fs/read.result`, `:llm/chat.result`, etc.
- It **does not block ticks**.
- Results appear as events like:
- `:fs/read.result`
- `:fs/write.result`
- `:llm/chat.result`
- and matching `*.error` events
- It is **bounded** (`retain-completed`) so `:effects/pending` doesn’t grow forever.
- `:fs/read.result` → sentinel calls LLM

## Summary Snippets
- This iteration makes effects “real”:
- * effects get **deduped + tracked** in `:effects/pending` * runner starts up to **N inflight** effects per tick * when an effect resolves, it **pushes a `*.result` / `*.error` event** back into the world (via `world*`) * systems (Sentinel/Cephalon) can now reliably react to `:fs/read.result`, `:llm/chat.result`, etc.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
