---
title: "Full initial files: runnable brain daemon skeleton (pure `shadow-cljs`, Node) #shadowcljs #ecs #runtime"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/brain-daemon-skeleton.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Full initial files: runnable brain daemon skeleton (pure `shadow-cljs`, Node) #shadowcljs #ecs #runtime

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/brain-daemon-skeleton.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- a tick loop
- an effects runner (FS + LLM)
- a sentinel for `docs/notes` frontmatter tagging
- a session router + simple cephalon stub that builds a context and calls chat
- maintain `:effects/pending` in world: `{effect-id {:effect ... :status ...}}`
- when you enqueue an effect, insert into pending
- `sys.effects.flush` starts pending effects (if not started) and on resolve pushes a result event into `:events/out`
- executes async effects
- emits `:fs/read.result`, `:llm/chat.result` etc into the next tick reliably
- supports tool call execution hooks
- and adds a tiny debug inspector (queue lengths, last events) so the dev workflow feels good immediately.

## Summary Snippets
- I’m going to assume “continue” means: **stop abstracting and give me concrete file contents** you can drop in and iterate. Below are full-file replacements for a minimal, runnable skeleton:
- * a tick loop * an effects runner (FS + LLM) * a sentinel for `docs/notes` frontmatter tagging * a session router + simple cephalon stub that builds a context and calls chat

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
