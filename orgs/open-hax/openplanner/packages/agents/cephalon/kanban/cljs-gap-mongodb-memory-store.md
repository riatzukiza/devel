---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cljs-gap-mongodb-memory-store-md"
title: "CLJS Critical Gap — MongoDB Memory Store"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.911Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-mongodb-memory-store.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-mongodb-memory-store.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cljs-gap-mongodb-memory-store.md`

# CLJS Critical Gap — MongoDB Memory Store

**Parent:** `cljs-ts-feature-parity-audit.md`
**Story Points:** 2
**Status:** done
**Priority:** critical

## Implementation

Created `packages/cephalon-cljs/src/promethean/memory/mongodb_store.cljs` with:
- `make-mongodb-store` — factory function
- `initialize` — connect and create indexes
- `close` — close connection
- `put-memory!` — store memory with upsert
- `get-memory` — retrieve by ID
- `find-recent` — get recent memories for session
- `find-by-tags` — query by tags
- `delete-memory!` — soft delete
- `stats` — store statistics

## Problem

CLJS only has an in-memory store. TS has `MongoDBMemoryStore` for persistent storage. Without MongoDB support, CLJS cannot:
- Persist memories across restarts
- Share memories between cephalons
- Support long-running production deployments

## Goal

Implement MongoDB memory store for CLJS.

## Scope

### In Scope
- Create `memory/mongodb_store.cljs`
- Connection management
- Collection namespacing (per cephalon/bot)
- CRUD operations for memories
- Query operations (by tags, by session, by time range)

### Out of Scope
- Vector store (ChromaDB)
- Memory compaction (separate concern)
- Migration from in-memory

## Design

### MongoDB Store Protocol

```clojure
(defprotocol MongoDBMemoryStore
  (initialize [this]
    "Connect to MongoDB and ensure indexes.")
  (close [this]
    "Close connection.")
  (put-memory! [this memory]
    "Store a memory record.")
  (get-memory [this id]
    "Get a memory by ID.")
  (find-memories [this query opts]
    "Find memories matching query.")
  (find-recent [this session-id limit]
    "Get recent memories for a session.")
  (delete-memory! [this id]
    "Delete a memory by ID."))
```

### Configuration

```clojure
{:mongodb/uri "mongodb://localhost:27017"
 :mongodb/database "cephalon"
 :mongodb/collection "memories"
 :mongodb/cephalon-id "duck"}
```

### Collection Schema

```javascript
// MongoDB document
{
  _id: ObjectId,
  memory_id: String,          // UUID
  memory_ts: Number,          // Timestamp
  memory_cephalon_id: String, // Cephalon name
  memory_session_id: String,  // Session name
  memory_kind: String,        // "discord", "tool_result", etc.
  memory_role: String,        // "user", "assistant", etc.
  memory_text: String,        // Content
  memory_tags: [String],      // Tags
  memory_meta: Object         // Metadata
}
```

### Indexes

```javascript
// Ensure these indexes
db.memories.createIndex({ memory_cephalon_id: 1, memory_session_id: 1, memory_ts: -1 })
db.memories.createIndex({ memory_tags: 1 })
db.memories.createIndex({ memory_id: 1 }, { unique: true })
```

## Tasks

- [ ] Add MongoDB dependency to `deps.edn` (or `package.json` for Node.js driver)
- [ ] Create `memory/mongodb_store.cljs`
- [ ] Implement connection management
- [ ] Implement `put-memory!` and `get-memory`
- [ ] Implement `find-recent` with session scoping
- [ ] Implement `find-memories` with tag filtering
- [ ] Add index creation on initialize
- [ ] Wire into `main.cljs` config
- [ ] Add integration tests

## Acceptance Criteria

- [ ] `memory/mongodb_store.cljs` exists
- [ ] Memories persist across restarts
- [ ] Queries work by session, tags, and time range
- [ ] Connection handles errors gracefully
- [ ] Integration tests pass

## Dependencies

- MongoDB Node.js driver (`mongodb` npm package)

## Blocking

- Blocks production deployment of CLJS runtime
