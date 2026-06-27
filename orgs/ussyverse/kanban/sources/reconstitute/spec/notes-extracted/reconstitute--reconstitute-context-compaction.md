---
title: "Upgrade pass: token-budgeted context compaction (no message edits), per-session caps, dedupe + boilerplate drop"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-context-compaction.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Upgrade pass: token-budgeted context compaction (no message edits), per-session caps, dedupe + boilerplate drop

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-context-compaction.md`
- Category: `reconstitute`

## Draft Requirements
- **Budgeted context builder**
- caps by `CONTEXT_MAX_CHARS` and `CONTEXT_MAX_MESSAGES`
- optional `CONTEXT_MAX_TOKENS` (converted to chars via `CHARS_PER_TOKEN`, default `4`)
- **Per-session cap**
- limits how many message-groups can come from any single session (`PER_SESSION_MAX_IDS`)
- **Dedupe**
- drops duplicate message-groups by normalized hash
- **Boilerplate / low-signal trimming**
- optionally drops tiny “continue/ok” messages and common assistant boilerplate
- `reconstitute search "..."` now prints:
- `hits` (top 10)
- `stats` (how many candidates were considered vs selected; budget usage)

## Summary Snippets
- This pass adds **context compaction** while keeping **replay exactness** (we never modify message content—only decide which message-groups to include):
- * **Budgeted context builder**

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
