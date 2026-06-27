---
title: "Drop-in replacement script"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-cljs-orchestrator.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-hybrid-cljs-orchestrator-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.957Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-hybrid-cljs-orchestrator.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-hybrid-cljs-orchestrator.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-hybrid-cljs-orchestrator.md`
# Drop-in replacement script

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-cljs-orchestrator.md`
- Category: `cephalon`

## Draft Requirements
- It **does not** parse `opencode session list --format json` at all.
- It reads the **per-session JSON files** that OpenCode stores under `~/.local/share/opencode/storage/session/` (which are independent JSON documents), then exports only the ones whose `directory` is inside `~/devel`. ([Basehub Forums][3])

## Summary Snippets
- Your error is coming from **`opencode session list --format json` not actually producing valid JSON** (it’s getting cut off / mixed with non-JSON), so `jq` hits EOF mid-parse.
- You can skip `session list` entirely and instead read OpenCode’s **on-disk session metadata** (which is stored as individual JSON files under `~/.local/share/opencode/storage/`) and then only `opencode export` the sessions whose `directory` is under `~/devel`. This is also faster + more reliable. ([OpenCode][1]) (And `opencode export <sessionID>` is the supported way to dump a session as JSON.) ([OpenCode][2])

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
