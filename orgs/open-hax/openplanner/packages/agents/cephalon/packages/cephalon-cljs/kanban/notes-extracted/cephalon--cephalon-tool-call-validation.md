---
title: "1) One envelope, one decision"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-tool-call-validation.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-tool-call-validation-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.914Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-tool-call-validation.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-tool-call-validation.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-tool-call-validation.md`
# 1) One envelope, one decision

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-tool-call-validation.md`
- Category: `cephalon`

## Draft Requirements
- **Mode A: tool call** (JSON object)
- **Mode B: assistant message** (plain text)
- Must be a **single JSON object**.
- No arrays at top-level.
- No markdown fences.
- No extra keys beyond `type/name/args` (unless you *explicitly* allow `idempotency_key` / `trace_id`).
- leading whitespace + prose
- code fences
- multiple JSON objects
- trailing commentary
- Find the **first `{`**
- Parse the **first complete JSON object** (balanced braces, string-aware)

## Summary Snippets
- Define exactly two output modes:
- * **Mode A: tool call** (JSON object) * **Mode B: assistant message** (plain text)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
