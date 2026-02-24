---
title: "Drop-in replacement script"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-cljs-orchestrator.md"
extracted_at: "2026-02-12T03:01:25Z"
---

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
