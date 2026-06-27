---
title: "Embedding Scheduler v0.1: cost-aware, state-aware, deterministic #embeddings #scheduler #eidolon #qwen3-embedding:0.6b"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-embedding-scheduler-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-embedding-scheduler-v01-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.947Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-embedding-scheduler-v01.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-embedding-scheduler-v01.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-embedding-scheduler-v01.md`
# Embedding Scheduler v0.1: cost-aware, state-aware, deterministic #embeddings #scheduler #eidolon #qwen3-embedding:0.6b

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-embedding-scheduler-v01.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- deterministic priorities
- bounded backlogs
- lineage caps (so “many times” doesn’t become “infinite”)
- backpressure behavior during flood
- summary/aggregate preference (so you embed *compressed meaning*, not raw noise)
- `embed.canonical(memory_id)`
- `embed.eidolon(memory_id, circuit_id, field_digest_hash)`
- `embed.summary(memory_id)` *(usually canonical + eidolon, but you can treat as high-priority)*
- `embed.aggregate(memory_id)` *(same)*
- `embed.reembed_content(content_id, reason)` *(optional “refresh lane” job)*
- `vector_id`
- `embedding_model`

## Summary Snippets
- You want to embed **everything the agent has seen**, possibly many times as context changes. That’s workable if embedding becomes a *scheduled service* with:
- * deterministic priorities * bounded backlogs * lineage caps (so “many times” doesn’t become “infinite”) * backpressure behavior during flood * summary/aggregate preference (so you embed *compressed meaning*, not raw noise)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
