---
title: "v2 wiring: effect-id routing + Discord adapter + session queue stores full events #shadowcljs #ecs #effects #discord"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-zip-analysis.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# v2 wiring: effect-id routing + Discord adapter + session queue stores full events #shadowcljs #ecs #effects #discord

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-zip-analysis.md`
- Category: `cephalon`

## Draft Requirements
- every async effect has an `:effect/id`
- Sentinel + Session store `:*/awaiting` = that id
- they only accept `*.result` / `*.error` events whose `:effect-id` matches
- session queues store **full event maps** (not ids), so events don’t “evaporate” after a tick
- Sentinel + Cephalon can safely run concurrently without stealing each other’s async responses.
- Effects are fully async-safe (results always come back as events with `:effect-id`).
- Sessions receive real Discord events (if bot token + intents are enabled).
- Janitor posts to channel `450688080542695436` by default (override by changing `:cephalon/policy`).
- `sys.memory.ingest` — create memories for events, dedupe discord, derive nexus keys
- `sys.eidolon.search` — vector seeds + daimoi expansion → `related`
- Replace `build-messages` to assemble:
- `[...related ...persistent ...recent]`

## Summary Snippets
- This pass makes the runtime *stop guessing* which result belongs to whom:
- * every async effect has an `:effect/id` * Sentinel + Session store `:*/awaiting` = that id * they only accept `*.result` / `*.error` events whose `:effect-id` matches * session queues store **full event maps** (not ids), so events don’t “evaporate” after a tick

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
