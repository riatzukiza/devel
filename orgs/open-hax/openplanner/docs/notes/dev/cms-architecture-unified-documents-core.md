---
original_name: "2026.04.11.13.09.10.md"
title: "CMS Architecture Unified with Documents Core"
summary: "Documents the CMS as a thin layer over documents.ts with unified event storage, indexing, gardens, and publication gaps."
category: "dev"
created: "2026-04-11"
---

## CMS Architecture: ✅ Fully Unified

**CMS is a pure thin view-layer over the `documents.ts` core.**  It imports `documentToEvent`, `getDocumentById`, `persistAndMaybeIndex`, and `rowToDocument` directly from `documents.ts` — there is **zero separate storage**. Every CMS write goes through the exact same `persistAndMaybeIndex` → `upsertEvent` → `mongo.events` + `indexTextInMongoVectors` hot tier pipeline as raw document writes. 

### CMS is `documents.ts` + a tenant/garden abstraction

The `toCmsDocument()` function just re-shapes a `DocumentRecord` into a CMS-flavored response with `tenant_id`, `doc_id`, `last_reviewed_at`, etc. — nothing new is stored.  `tenantProject()` maps `tenant_id` → `project` field, so the CMS tenant model is just the existing project scoping system.

### The Garden Publication System
The most interesting CMS-specific logic is `POST /cms/publish/:id/:garden_id`.  It:
1. Validates the target garden exists and is `"active"` in `mongo.gardens`
2. Writes `garden_publications[]` array into `extra.metadata` of the event
3. Queues `translation_jobs` into a `translation_jobs` collection (one per target language from `garden.target_languages`)
4. Sets `visibility: "public"` via `persistAndMaybeIndex`

This means **translation jobs live in MongoDB** but the translation worker side is not visible in OpenPlanner — it's presumably a separate consumer job.

### Remaining CMS gaps

| Item | Status |
|---|---|
| All reads/writes use `mongo.events` | ✅ Unified |
| Vector indexing on write | ✅ Via `persistAndMaybeIndex` |
| Garden validation | ✅ Against `mongo.gardens` |
| Translation job queuing | ✅ Queued to `translation_jobs` collection |
| **Translation job worker** | 🔴 Not in OpenPlanner — consumer not found |
| **`POST /cms/draft`** AI content | ⚠️ Generates skeleton markdown only — `aiModel` is `null`, no actual LLM call wired |
| **`DELETE /cms/documents/:id`** | ⚠️ Archives rather than deletes — correct behavior but worth noting semantically |

***

## System-Wide Unified Picture

The three pillars are **already on one store**:

```
mongo.events         ← documents (kind: docs/code/config/data)
                     ← graph nodes (kind: graph.node)
                     ← graph edges (kind: graph.edge) [legacy fallback]
mongo.hotVectors     ← document chunks + graph node embeddings (hot tier)
mongo.compactVectors ← semantic compaction packs (compact tier)
mongo.compacted      ← compaction pack metadata
mongo.graphEdges     ← structural graph edges (primary)
mongo.graphSemanticEdges ← kNN semantic similarity edges
mongo.graphNodeEmbeddings ← per-node embeddings for graph weaver
mongo.gardens        ← CMS publication targets
translation_jobs     ← CMS translation queue
```

**The unification spec is already implemented in OpenPlanner.**  The only remaining structural gaps are:

1. 🔴 **Knoxx ingestion** still has Qdrant config — needs to POST to `/v1/documents` instead
2. 🔴 **Translation worker** — `translation_jobs` collection gets written but nothing processes it
3. ⚠️ **`/cms/draft`** — AI drafting is a skeleton (no LLM call, just markdown template)
4. ❓ **CLJS client** — unread, may have stale endpoint references
