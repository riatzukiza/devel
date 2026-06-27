---
title: "Retention + compaction in a multi-session scheduler (no starvation, immediate benefits) #cephalon #scheduler #gc #retention"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-retention-scheduler.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Retention + compaction in a multi-session scheduler (no starvation, immediate benefits) #cephalon #scheduler #gc #retention

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-retention-scheduler.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- human messages
- admin commands
- anything that might respond outward immediately
- janitor aggregation updates
- periodic reports
- subscription management
- compaction planning + commit
- embedding generation
- outbox draining (vector deletes)
- retention cleanup (events payload redaction, etc.)
- `queue[]` of events to process
- `priority_class`: `interactive | operational | maintenance`

## Summary Snippets
- You’ve now got: **many queued sessions**, **limited concurrency**, **dedupe + aggregates**, **access-driven compaction**, and **variable context windows**. The missing piece is: *how do we run maintenance (GC/embeddings/outbox) without starving interactive sessions, while still letting every session benefit from compaction immediately?*
- ---

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
