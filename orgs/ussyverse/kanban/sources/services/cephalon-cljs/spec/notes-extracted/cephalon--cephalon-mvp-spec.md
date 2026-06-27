---
title: "Cephalon MVP spec notes #cephalon #agents #eidolon"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-mvp-spec.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Cephalon MVP spec notes #cephalon #agents #eidolon

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-mvp-spec.md`
- Category: `cephalon`

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
