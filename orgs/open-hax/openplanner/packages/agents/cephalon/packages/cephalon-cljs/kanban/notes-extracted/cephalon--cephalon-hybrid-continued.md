---
title: "`services/cephalon-ts`"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-continued.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-hybrid-continued-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.725Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-hybrid-continued.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-hybrid-continued.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-hybrid-continued.md`
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
