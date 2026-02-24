---
title: "Event-ish durable indexing: active-queue + inflight leases + slow-scan"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-event-indexing.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Event-ish durable indexing: active-queue + inflight leases + slow-scan

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-event-indexing.md`
- Category: `reconstitute`

## Draft Requirements
- **Session list refresh** (cheap): detect which sessions changed via `updatedAt/lastMessageAt` → enqueue those sessions
- **Durable active queue** (LevelDB): “sessions likely to have new messages”
- **Inflight leases** (LevelDB): claim sessions for indexing; if the process dies, leases expire and the session is re-queued
- **Slow-scan** (bounded): occasionally enqueue sessions that haven’t been checked in a while (catches missed updates/new sessions)
- **Incremental cursor** per session: only index new messages
- The indexer detects session changes via `listSessions()` metadata (cheap).
- Changed sessions get queued immediately.
- Per-session cursor ensures we only embed/index the new tail.
- Cursor, backoff, inflight leases, and queue pointers are all persisted in LevelDB.
- Restart resumes automatically.
- `idx:wal:<sid>:<msgIndex>` stores the embedding vector (or a hash + serialized float array)
- after successful upsert, WAL entries are deleted

## Summary Snippets
- Here’s the upgrade you asked for: the indexer becomes **“mostly event-driven”** without needing OpenCode push events:
- * **Session list refresh** (cheap): detect which sessions changed via `updatedAt/lastMessageAt` → enqueue those sessions * **Durable active queue** (LevelDB): “sessions likely to have new messages” * **Inflight leases** (LevelDB): claim sessions for indexing; if the process dies, leases expire and the session is re-queued * **Slow-scan** (bounded): occasionally enqueue sessions that haven’t been checked in a while (catches missed updates/new sessions) * **Incremental cursor** per session: only index new messages

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
