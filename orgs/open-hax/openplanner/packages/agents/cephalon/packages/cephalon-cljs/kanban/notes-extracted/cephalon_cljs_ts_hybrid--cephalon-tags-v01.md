---
title: "Deterministic tags v0.1: ontology, generator pipeline, validators, and nexus integration #tags #nexus #eidolon"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-tags-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-tags-v01-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.935Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-tags-v01.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-tags-v01.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-tags-v01.md`
# Deterministic tags v0.1: ontology, generator pipeline, validators, and nexus integration #tags #nexus #eidolon

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-tags-v01.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- Help embeddings “carry circumstance” (Eidolon lens)
- Create **nexus keys** so retrieval can expand structurally (daimoi walkers)
- **deterministic**
- **bounded** (small, stable set per memory)
- **typed** (so they’re usable as keys, not vibes)
- **composable** (so meaning can drift by recombining tags over time)
- `src/discord`
- `src/tool`
- `tool/discord.send_message`
- `tool/fs.read`
- `chan/343179912196128792`
- `file/ext/clj`

## Summary Snippets
- You want `generated_tags` to do **two jobs** at once:
- 1. Help embeddings “carry circumstance” (Eidolon lens) 2. Create **nexus keys** so retrieval can expand structurally (daimoi walkers)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
