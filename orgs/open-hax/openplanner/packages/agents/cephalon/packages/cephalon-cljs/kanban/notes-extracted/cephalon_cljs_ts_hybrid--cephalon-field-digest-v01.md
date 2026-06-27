---
title: "Field Digest v0.1: deterministic “state vector” that doesn’t churn #eidolon #field_digest #nexus"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-field-digest-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-field-digest-v01-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.904Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-field-digest-v01.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-field-digest-v01.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-field-digest-v01.md`
# Field Digest v0.1: deterministic “state vector” that doesn’t churn #eidolon #field_digest #nexus

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-field-digest-v01.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- changes *when it should* (incidents, pressure, new focus)
- doesn’t change every tick (no embedding churn)
- can be hashed and used as a lineage key
- can be fed into both **embedding** and **query** prompts
- It is **not** a narrative summary of recent messages.
- It is **not** a dump of persistent memories.
- It is an engineered “feature vector” in text form.
- “This text, as seen under these conditions.”
- `time_bucket` (e.g. 1h or 15m)
- `cephalon_id`, `session_id`, `circuit_id`
- `focus` (short string / “current contract” label)
- `subscriptions` (channel IDs or event filters)

## Summary Snippets
- You want a **small, stable, deterministic transformer** that turns “whatever the cephalon knows right now” into a **Field Digest** that:
- * changes *when it should* (incidents, pressure, new focus) * doesn’t change every tick (no embedding churn) * can be hashed and used as a lineage key * can be fed into both **embedding** and **query** prompts

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
