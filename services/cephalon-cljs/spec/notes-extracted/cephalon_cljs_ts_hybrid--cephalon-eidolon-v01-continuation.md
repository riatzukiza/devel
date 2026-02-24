---
title: "Eidolon v0.1 continuation: field-digest, circuit lenses, prompt blocks, and retrieval mechanics #eidolon #cephalon #duck"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-eidolon-v01-continuation.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Eidolon v0.1 continuation: field-digest, circuit lenses, prompt blocks, and retrieval mechanics #eidolon #cephalon #duck

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-eidolon-v01-continuation.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- keep the “meaning can drift over time” property
- avoid preamble dominance
- make multi-embedding-per-document tractable
- make circuits/lenses first-class, without multiplying infra 8× unless you want to
- `field_version` (int)
- `cephalon_id`, `session_id`, `circuit_id`
- `time_bucket` (e.g. hour/day) to avoid infinite churn
- `health` (green/yellow/red + 1–3 error fingerprints)
- `pressure` (discord rate, tool queue sizes)
- `focus` (1–2 lines: what this session is doing)
- `environment` (host/service names if relevant)
- `tags` (controlled-ish vocabulary)

## Summary Snippets
- You’ve basically described **Eidolon as “state-conditioned embedding space”** plus **Nexus as “shared metadata topology”**. The next iteration is to make that *operationally clean*:
- * keep the “meaning can drift over time” property * avoid preamble dominance * make multi-embedding-per-document tractable * make circuits/lenses first-class, without multiplying infra 8× unless you want to

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
