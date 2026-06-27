---
title: "Eidolon v0.1 continuation: field-digest, circuit lenses, prompt blocks, and retrieval mechanics #eidolon #cephalon #duck"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-eidolon-v01-continuation.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-eidolon-v01-continuation-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.948Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-eidolon-v01-continuation.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-eidolon-v01-continuation.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-eidolon-v01-continuation.md`
# Eidolon v0.1 continuation: field-digest, circuit lenses, prompt blocks, and retrieval mechanics #eidolon #cephalon #duck

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-eidolon-v01-continuation.md`
- Category: `cephalon`

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
