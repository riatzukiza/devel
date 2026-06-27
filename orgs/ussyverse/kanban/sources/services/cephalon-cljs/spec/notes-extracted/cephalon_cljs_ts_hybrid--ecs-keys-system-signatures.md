---
title: "Implementation details v0: ECS keys + system signatures + effect pipeline (pure `shadow-cljs`) #ecs #shadowcljs #promethean"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/ecs-keys-system-signatures.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Implementation details v0: ECS keys + system signatures + effect pipeline (pure `shadow-cljs`) #ecs #shadowcljs #promethean

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/ecs-keys-system-signatures.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- `:discord.message/new`
- `:fs.file/created`
- `:fs.file/modified`
- `:timer/tick`
- `:memory/created` (after normalization + tagging)
- `:eidolon/indexed` (nexus updated)
- `:embedding/job.enqueued`
- `:embedding/job.done`
- `:cephalon/session.ready`
- `:llm/response`
- `:tool/called`
- `:tool/result`

## Summary Snippets
- You’ll go fastest if you treat **systems as mostly pure** and push side effects through a **command buffer** (“effects”), like a game engine. That keeps the simulation deterministic, debuggable, and replayable—even though you’re talking to OpenAI-compatible APIs and Discord.
- ---

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
