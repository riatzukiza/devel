---
title: "Write-ahead log (WAL) so indexing survives crashes *mid-batch* without re-embedding"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-wal-durability.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Write-ahead log (WAL) so indexing survives crashes *mid-batch* without re-embedding

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-wal-durability.md`
- Category: `reconstitute`

## Draft Requirements
- Before upserting a batch to Chroma, we **persist a WAL record** in LevelDB containing:
- ids, documents, metadatas
- embeddings (stored compactly as base64-encoded float32)
- `cursor_after` (so we can advance the session cursor during recovery)
- On startup and every tick, the indexer **replays WAL**:
- re-upserts batches (idempotent via Chroma upsert)
- advances the session cursor to `max(cursor, cursor_after)`
- deletes the WAL record
- **after embedding but before upsert** → WAL replays, no lost compute
- **after upsert but before deleting WAL** → WAL replays upsert again (safe), then deletes
- **No re-embedding** if the process is killed after embeddings are computed.
- **Safe idempotent replays** (Chroma upsert).

## Summary Snippets
- This upgrade makes the indexer **durable at the batch level**:
- * Before upserting a batch to Chroma, we **persist a WAL record** in LevelDB containing:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
