---
title: "Storage layout + retention + migrations (events/memories/summaries/tombstones/vectors) #cephalon #storage #retention #migrations"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-storage-schema.md"
extracted_at: "2026-02-12T03:01:25Z"
---

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
