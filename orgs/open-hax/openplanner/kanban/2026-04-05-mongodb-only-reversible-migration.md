---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-2026-04-05-mongodb-only-reversible-migration-md"
title: "MongoDB-only reversible migration for OpenPlanner"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.617Z"
source: "orgs/open-hax/openplanner/specs/2026-04-05-mongodb-only-reversible-migration.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/2026-04-05-mongodb-only-reversible-migration.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/2026-04-05-mongodb-only-reversible-migration.md`

# MongoDB-only reversible migration for OpenPlanner

## Context

We want to remove ChromaDB from the runtime path and make MongoDB the single persistence system, while preserving a reversible migration path back to the legacy DuckDB + Chroma layout.

Workspace research found an existing upstream spec here:

- `orgs/open-hax/knoxx/specs/knowledge-ops-mongodb-vector-unification.md`

That spec establishes the long-term target architecture:

- DuckDB removed
- ChromaDB removed
- MongoDB stores structured records and vectors
- native MongoDB search/vector-search (`$search`, `$vectorSearch`, `mongot`) preferred when available

## What is implemented now

### Reversible migration commands

OpenPlanner now exposes explicit reversible migration commands in `src/migrate.ts`:

- `duckdb-to-mongo`
- `mongo-to-duckdb`
- `chroma-to-mongo`
- `mongo-to-chroma`
- `legacy-to-mongo`
- `mongo-to-legacy`
- `export-jsonl`

### MongoDB-only runtime path

When `OPENPLANNER_STORAGE_BACKEND=mongodb`:

- event/document/session/lake storage reads and writes use MongoDB
- vector persistence uses MongoDB collections, not ChromaDB
- semantic compaction writes compacted packs into MongoDB
- ChatGPT import jobs can ingest into Mongo-backed runtime
- health output reports Mongo vector collections

### Mongo vector collections

MongoDB runtime uses two collections:

- `MONGODB_VECTOR_HOT_COLLECTION` default `event_chunks`
- `MONGODB_VECTOR_COMPACT_COLLECTION` default `compacted_vectors`

These collections store:

- chunk/document text
- embedding arrays
- search metadata
- parent/chunk identifiers
- timestamps and tier markers

## Important caveat

### Current Mongo vector query mode is native-first, with compatibility fallback

The runtime now replaces ChromaDB storage with MongoDB storage, and Mongo mode now attempts native `$vectorSearch` against MongoDB search indexes.

Because the current OpenPlanner embedding contract allows:

- `OLLAMA_EMBED_MODEL`
- `OLLAMA_EMBED_MODEL_BY_PROJECT`
- `OLLAMA_EMBED_MODEL_BY_SOURCE`
- `OLLAMA_EMBED_MODEL_BY_KIND`

this means the hot tier may contain mixed embedding dimensions.

MongoDB native vector indexes require fixed dimensions per indexed field/collection.
So Mongo mode now partitions vector data by `(tier, model, dimensions)` into dedicated collections, creates per-partition vector indexes, and fan-outs queries across partitions.

## Decision

Current implementation uses option 2:

- model/dimension-partitioned Mongo vector collections
- native `$vectorSearch` per partition
- query fan-out across partitions
- fallback to application-side cosine scan if `mongot`/search indexes are unavailable or not ready

This preserves:

- no Chroma runtime dependency in Mongo mode
- reversible migration safety
- existing embedding-model override behavior
- stable API response shapes

## Verification status

Verified locally:

- `npm run build`
- `npm test`

## Follow-up

If we want the spec-complete end state, the next change should be:

- harden migration safety when moving mixed-profile Mongo tiers back into Chroma
- validate per-partition `$vectorSearch` index readiness and recovery behavior in production
- remove the application-side cosine fallback once `mongot` availability is guaranteed
