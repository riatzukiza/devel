---
title: "Storage layout + retention + migrations (events/memories/summaries/tombstones/vectors) #cephalon #storage #retention #migrations"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-storage-schema.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-storage-schema-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.918Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-storage-schema.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-storage-schema.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-storage-schema.md`
# Storage layout + retention + migrations (events/memories/summaries/tombstones/vectors) #cephalon #storage #retention #migrations

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-storage-schema.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **append-only events**
- **memories that can be summarized + deleted**
- **aggregates for spam families**
- **context inclusion logs** (for access-driven GC)
- **hard deletes coordinated with vector ANN**
- **rolling schema migrations**
- Source of truth for “what happened”
- Can be retained longer than memories
- May store full content or a redacted stub depending on policy
- What the LLM sees (messages, summaries, aggregates, tool results)
- Embedding pointers + retrieval metadata live here
- Subject to GC + deletion

## Summary Snippets
- Below is a concrete storage model that supports:
- * **append-only events** * **memories that can be summarized + deleted** * **aggregates for spam families** * **context inclusion logs** (for access-driven GC) * **hard deletes coordinated with vector ANN** * **rolling schema migrations**

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
