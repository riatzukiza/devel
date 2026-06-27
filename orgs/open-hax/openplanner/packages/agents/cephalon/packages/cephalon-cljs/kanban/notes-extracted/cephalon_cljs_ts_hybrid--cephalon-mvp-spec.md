---
title: "Cephalon MVP spec notes #cephalon #agents #eidolon"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-mvp-spec.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-mvp-spec-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.949Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-spec.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-spec.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-spec.md`
# Cephalon MVP spec notes #cephalon #agents #eidolon

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-mvp-spec.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **Event**: anything that happens in the world or the system (Discord message, timer tick, tool result, internal reflection, admin command).
- **Message**: an LLM-provider message object (`role`, `content`, plus modality/tool fields).
- **Memory**: a *message + metadata* that is *indexed* (vector ANN + filters) and can be retrieved later.
- `id` (uuid)
- `timestamp` (ms)
- `cephalon_id` (e.g. `"Duck"`)
- `session_id` (facet/aspect id)
- `event_id` (source event)
- `role` (`user|assistant|system|developer|tool`)
- `kind` (`message|tool_call|tool_result|think|image|summary|admin`)
- `content` (text, structured payload, or pointer to blob)
- `source`

## Summary Snippets
- Below is a concrete way to *make your description executable* without losing the vibe: “always running mind” + “many sessions / facets” + “vector memory + persistent memory + recent events” + “event subscriptions with locks”.
- ---

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
