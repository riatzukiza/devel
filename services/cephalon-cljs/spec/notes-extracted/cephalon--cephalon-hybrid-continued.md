---
title: "`services/cephalon-ts`"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-continued.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# `services/cephalon-ts`

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-continued.md`
- Category: `cephalon`

## Draft Requirements
- your **typescript cephalon** runtime (discord/tools loop, cli, etc.).
- still outputs **both esm + cjs**, so it can be consumed from the cljs runtime.
- a more complete **clojurescript cephalon** core (ecs-ish structure, systems, context assembler, session plumbing).
- **now boots the typescript runtime automatically** via `promethean.bridge.cephalon-ts` at startup:
- pulls token from `discord_token` (or `discord_bot_token`).
- calls `createcephalonapp` and `.start()`.
- pulled in your more complete packages:
- `@promethean-os/event`
- `@promethean-os/fsm`
- `@promethean-os/utils`
- `@promethean-os/persistence` (plus small stubs to satisfy workspace deps)
- added minimal workspace stubs so installs don’t fail:

## Summary Snippets
- ([past chat][1])([past chat][1])([past chat][1])([past chat][1])([past chat][1])
- * your **typescript cephalon** runtime (discord/tools loop, cli, etc.). * still outputs **both esm + cjs**, so it can be consumed from the cljs runtime.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
