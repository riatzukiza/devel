---
title: "Durable + fault-tolerant background indexing for the MCP server"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-background-indexer.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Durable + fault-tolerant background indexing for the MCP server

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-background-indexer.md`
- Category: `reconstitute`

## Draft Requirements
- **run continuously** in the background (polling OpenCode)
- be **stopped/started** without losing progress (cursor state persisted in LevelDB)
- be **fault tolerant** (per-session backoff + idempotent Chroma upserts)
- index **incrementally** (only new messages since last cursor)
- expose **control + status tools** over MCP
- New `BackgroundIndexer` that polls OpenCode sessions and upserts new message docs into Chroma.
- Per-session durable cursor stored in LevelDB: `idx:session:<id>` (JSON).
- New MCP tools:
- `indexer_start(poll_ms?)`
- `indexer_stop()`
- `indexer_status()`
- `indexer_tick(max_sessions?)` (one-shot work cycle)

## Summary Snippets
- This upgrades the MCP server so indexing can:
- * **run continuously** in the background (polling OpenCode) * be **stopped/started** without losing progress (cursor state persisted in LevelDB) * be **fault tolerant** (per-session backoff + idempotent Chroma upserts) * index **incrementally** (only new messages since last cursor) * expose **control + status tools** over MCP

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
