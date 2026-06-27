---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction-md"
title: "Epic: Semantic Graph Builder + Vexx Boundary Reduction"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.620Z"
source: "orgs/open-hax/openplanner/specs/2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md`

# Epic: Semantic Graph Builder + Vexx Boundary Reduction

## Status

Draft

## Summary

Replace online HTTP+JSON cosine matrix scoring as the primary clustering path with a canonical offline semantic graph builder that:

- reads graph node embeddings from OpenPlanner storage,
- builds approximate neighbor candidates locally,
- exact-reranks only those candidates in large batches,
- persists a sparse symmetric weighted `k`-NN graph into OpenPlanner,
- materializes cluster memberships from that graph,
- leaves `vexx` as an optional batched exact-rerank engine instead of the main JSON matrix microservice.

The immediate target is to make clustering workable at `100k-500k` nodes without first rewriting OpenPlanner in Clojure.

## Problem statement

Current semantic clustering is bottlenecked by both asymptotics and transport overhead.

### Current runtime shape

- `packages/eros-eris-field-app` builds semantic edges for fresh embeddings.
- `packages/eros-eris-field` offloads cosine matrix scoring to `vexx` when configured.
- `packages/vexx` exposes `POST /v1/cosine/matrix` and `POST /v1/cosine/topk` over HTTP+JSON.
- OpenPlanner persists semantic edges into `graph_semantic_edges` and reuses them for graph/layout/search surfaces.

Relevant files:

- `packages/eros-eris-field-app/src/index.ts`
- `packages/eros-eris-field/src/semantic.ts`
- `packages/vexx/src/vexx/api/routes.clj`
- `packages/vexx/src/vexx/native.clj`
- `packages/vexx/native/src/vexx_cosine_runtime.cpp`
- `src/routes/v1/graph.ts`
- `src/lib/mongo-vectors.ts`

### Current bottlenecks

1. The current `matrix(left, right)` API ships full embedding matrices over HTTP+JSON.
2. The peer side is resent for every chunk.
3. The current edge builder still thinks in terms of scored matrix rows plus thresholds, not a canonical neighbor graph.
4. The transport boundary is expensive before native compute even starts.
5. All-pairs style thinking does not scale to hundreds of thousands of nodes.

Representative JSON request sizes for `1024`-dimensional embeddings:

- `32 x 1000 x 1024` -> about `19.44 MiB`
- `64 x 2000 x 1024` -> about `38.87 MiB`
- `64 x 3700 x 1024` -> about `70.89 MiB`
- `128 x 4000 x 1024` -> about `77.75 MiB`

At `100k` nodes and `1024` dims:

- all-pairs exact work is on the order of `10.24e12` dot-product terms,
- reranking only `k=64` shortlisted neighbors is about `6.55e9` terms,
- reduction is about `1563x`.

At `200k` nodes the reduction is about `3125x`.

This means transport fixes alone are insufficient. We need a sparse-neighbor graph build pipeline.

## Goals

1. Make semantic clustering practical for `100k-500k` graph nodes.
2. Stop shipping large embedding tensors over HTTP+JSON on the clustering hot path.
3. Keep OpenPlanner as the canonical source of truth for embeddings, graph edges, and clustering metadata.
4. Produce a canonical sparse weighted semantic graph that layout and query surfaces can reuse.
5. Support exact cosine weights on final edges, even if candidate generation is approximate.
6. Preserve a path toward a future Clojure-native graph runtime without blocking immediate gains on that rewrite.

## Non-goals

- Rewriting the OpenPlanner API server into Clojure before improving clustering.
- Reimplementing the `vexx` NPU runtime in TypeScript as the first step.
- Putting Redis in the synchronous scoring path.
- Building a full all-pairs semantic graph.
- Treating thresholded cosine edges as the canonical clustering graph.

## Design rules

1. OpenPlanner remains the canonical lake and metadata authority.
2. Semantic clustering is a build pipeline, not a request-time feature.
3. Approximation is allowed only for candidate generation.
4. Final edge weights must come from exact cosine on normalized vectors.
5. The canonical graph must be sparse, degree-controlled, symmetric, and versioned.
6. `vexx` should operate on local buffers, registered slabs, or IDs into a shared region, not raw JSON vectors by value.
7. Redis may orchestrate background work later, but must not be required for the core hot path.

## Decision

### 1. Introduce a canonical offline semantic graph builder

Add a new background package:

- `packages/semantic-graph-builder`

This worker is responsible for building the global semantic graph from persisted embeddings. It is not part of the request path of the OpenPlanner API server.

### 2. Build a sparse `k`-NN graph, not thresholded all-pairs edges

The builder must produce a sparse weighted neighbor graph using:

- normalized embeddings,
- approximate candidate generation,
- exact rerank of shortlisted candidates,
- symmetrization,
- bounded degree.

Default graph shape:

- `k_out = 32` or `64` per node,
- candidate factor `5x-10x` final `k`,
- union or capped-union symmetrization,
- optional mutual-edge preference to suppress hubs.

The current `attractAbove` and `repelBelow` thresholds may remain useful for local layout force tuning, but they must not define the canonical graph backbone.

### 3. Use local ANN candidate generation

The builder should create a local ANN candidate index over normalized embeddings.

Preferred first implementation:

- HNSW-compatible ANN index,
- implemented with a mature local library such as Faiss `IndexHNSWFlat` or `hnswlib`.

Why:

- good recall-speed tradeoff,
- practical at `100k-500k` scale,
- supports local batch processing,
- avoids per-node remote database queries,
- does not require shipping embeddings over the network.

MongoDB native vector search may still be used for online search surfaces, but it should not be the primary engine for canonical global graph construction.

### 4. Exact-rerank shortlisted candidates in large local batches

After ANN candidate generation, the builder exact-reranks the shortlist on original normalized vectors.

Provider order:

1. local in-process exact rerank over memory-mapped float32 slabs,
2. optional `vexx` lower-overhead slab-based rerank provider,
3. existing HTTP+JSON `vexx` endpoints only as fallback/debug path.

The main performance win comes from local batch operations over contiguous arrays.

### 5. Materialize cluster memberships from the canonical graph

Run Leiden on the canonical weighted semantic graph and persist cluster membership state.

Default clustering output:

- node -> cluster ID,
- graph version,
- clustering version,
- cluster size,
- optional parent/community labels in future phases.

Leiden is preferred over Louvain because the output communities are more reliable as connected graph partitions.

### 6. Keep online semantic edges provisional

`packages/eros-eris-field-app` may continue to build local/provisional semantic edges for visible or fresh nodes.

However:

- those edges are not the canonical clustering graph,
- the offline builder output supersedes them for global graph structure,
- the layout worker should be able to consume canonical graph versions when available.

## Canonical data flow

### Build input

Source of truth:

- `graph_node_embeddings` in MongoDB,
- filtered by `embedding_model`, `embedding_dimensions`, project/lake, and graph node kind when needed.

The builder exports a per-run local snapshot under:

- `openplanner-lake/jobs/semantic-graph/<run-id>/`

Suggested artifacts:

- `ids.jsonl` or `ids.bin`
- `embeddings.f32`
- `manifest.json`
- `ann-index.*`
- `candidate-recall-sample.json`
- `clusters.jsonl`

### Build steps

1. Read node IDs and embeddings from OpenPlanner.
2. Normalize embeddings once.
3. Write a contiguous float32 slab and ID mapping.
4. Build ANN index over the slab.
5. For each node, query `candidate_factor * k` ANN neighbors.
6. Exact-rerank that shortlist on normalized vectors.
7. Emit final top-`k` neighbors with exact cosine weights.
8. Symmetrize into a sparse weighted graph.
9. Run Leiden.
10. Persist graph edges and cluster memberships back into OpenPlanner.

### Persisted outputs

Use existing collection when possible:

- `graph_semantic_edges`

Add new collections:

- `graph_cluster_memberships`
- `semantic_graph_runs`

Suggested `semantic_graph_runs` fields:

- `run_id`
- `embedding_model`
- `embedding_dimensions`
- `node_count`
- `final_k`
- `candidate_factor`
- `candidate_engine`
- `rerank_provider`
- `graph_version`
- `clustering_version`
- `status`
- `started_at`
- `finished_at`
- `metrics`

Suggested `graph_cluster_memberships` fields:

- `node_id`
- `graph_version`
- `clustering_version`
- `cluster_id`
- `cluster_size`
- `embedding_model`
- `updated_at`

## Vexx boundary redesign

### Immediate rule

The canonical builder must not depend on `POST /v1/cosine/matrix` with raw by-value JSON embeddings.

### Tactical plan

Phase 1 may bypass `vexx` entirely for exact rerank if local SIMD/BLAS is sufficient.

Phase 2 may add a lower-overhead `vexx` contract for batched rerank:

- register a shared embedding slab,
- send query/candidate ID ranges or offsets,
- return top-`k` neighbors and scores,
- use Unix domain sockets or another local IPC transport for control,
- keep bulk tensors out of JSON.

Possible API shapes:

- `POST /v2/slabs/register`
- `POST /v2/cosine/topk-by-slab`
- `POST /v2/cosine/rerank-by-id`

The important change is not just `protobuf instead of JSON`. The important change is `IDs or shared memory instead of by-value tensors`.

## Redis position

Redis is explicitly rejected for the synchronous scoring path.

Why:

- it adds another hop,
- it adds more serialization,
- it adds queue/ack/retry complexity,
- it does not fix the `O(n^2)` graph-build problem,
- it does not solve repeated large tensor transfer.

Redis is acceptable only for background orchestration later, for example:

- scheduling rebuilds,
- retrying failed runs,
- publishing progress,
- coordinating cluster-wide workers.

Even in that role, queue payloads should contain run/job references, not raw embedding arrays.

## Alternatives considered

### Bigger HTTP batches to Vexx

Rejected as the main fix.

Reason:

- larger batches increase NPU utilization,
- but they also increase request size into the tens of MiB,
- and they still resend peer embeddings repeatedly.

### Redis queue + worker

Rejected for the hot path.

Reason:

- solves durability and orchestration,
- does not solve transport volume or algorithmic cost,
- likely worsens end-to-end latency and system complexity.

### Full OpenPlanner rewrite in Clojure first

Rejected as a prerequisite.

Reason:

- desirable long-term direction,
- much higher time-to-value than adding a builder pipeline now.

### Reimplement NPU path in TypeScript first

Rejected as a prerequisite.

Reason:

- duplicates existing native investment,
- still would not solve canonical graph construction alone.

---

## Stories

### S1: Scaffold `packages/semantic-graph-builder` (2 SP)

Create the package skeleton with TypeScript, configure build tooling, and add the CLI entrypoint that parses config and connects to MongoDB.

**Acceptance:**

- `packages/semantic-graph-builder` exists with `package.json`, `tsconfig.json`, and `src/index.ts`.
- `pnpm install` resolves from workspace root.
- Running the package with no args prints usage and exits 0.
- MongoDB connection string is read from env and validated on startup.

---

### S2: Export normalized embedding slabs (3 SP)

Add an export step that reads all `graph_node_embeddings` from MongoDB, normalizes them once, and writes a contiguous `embeddings.f32` slab + `ids.bin` ID mapping + `manifest.json` to the job directory.

**Acceptance:**

- `semantic-graph-builder export` reads from MongoDB and writes `embeddings.f32`, `ids.bin`, `manifest.json` to `openplanner-lake/jobs/semantic-graph/<run-id>/`.
- The slab is `float32` contiguous with shape `[n, dims]` in row-major order.
- Embeddings are L2-normalized.
- `manifest.json` records `run_id`, `node_count`, `dimensions`, `embedding_model`, and `created_at`.
- Works on a test snapshot of at least 1k nodes.

---

### S3: Build local HNSW index over the slab (5 SP)

Add an ANN index build step that reads the `embeddings.f32` slab and constructs an HNSW index using `hnswlib-node` (or Faiss if that proves more practical at workspace scale). Save the index to the job directory.

**Acceptance:**

- `semantic-graph-builder build-index` reads the slab and writes an HNSW index artifact.
- Index is queryable: given a node offset, it returns approximate neighbor offsets and distances.
- Build completes for a 50k-node slab in reasonable time (< 5 min on available hardware).
- `candidate_factor` and `k_out` are configurable via CLI flags.

---

### S4: ANN neighbor query + exact rerank (3 SP)

Add a step that queries `candidate_factor * k` ANN neighbors per node from the HNSW index, then exact-reranks the shortlist on the original normalized slab using local dot-product. Emit top-`k` neighbors per node with exact cosine weights.

**Acceptance:**

- `semantic-graph-builder query-neighbors` reads the slab + index and writes per-node top-`k` neighbor lists with exact cosine scores.
- The exact-rerank step uses local float32 dot-product, not HTTP calls.
- No raw embedding JSON is sent over the network.
- Output is a candidate edge list (node offset pairs + weight).

---

### S5: Symmetrize + persist sparse semantic graph (3 SP)

Symmetrize the directed top-`k` edge list into a sparse undirected graph (union or capped-union). Write edges into `graph_semantic_edges` in MongoDB with `graph_version` tag. Write run metadata into `semantic_graph_runs`.

**Acceptance:**

- `semantic-graph-builder persist-edges` reads the candidate edge list, symmetrizes it, and upserts into `graph_semantic_edges` with a `graph_version` field.
- `semantic_graph_runs` collection receives a new document with `run_id`, `node_count`, `final_k`, `status`, `started_at`, `finished_at`.
- Degree distribution is bounded: no node exceeds `2 * k_out` after symmetrization.
- Idempotent: running persist-edges twice with the same `graph_version` does not duplicate edges.

---

### S6: Run Leiden clustering + persist memberships (3 SP)

Add a Leiden clustering step over the persisted symmetric weighted graph. Persist cluster memberships into `graph_cluster_memberships` with `graph_version` and `clustering_version`.

**Acceptance:**

- `semantic-graph-builder cluster` reads the symmetric edges from MongoDB, runs Leiden, and persists memberships.
- `graph_cluster_memberships` documents contain `node_id`, `graph_version`, `clustering_version`, `cluster_id`, `cluster_size`, `embedding_model`, `updated_at`.
- Memberships are reproducible for a fixed graph snapshot and configuration.
- The Leiden implementation is a local JS/TS library (e.g., `leidenalg` WASM wrapper or a port), not a remote service call.

---

### S7: Graph-version-aware semantic-edge reads (3 SP)

Add `graph_version` filtering to the OpenPlanner `graph_semantic_edges` query path in `src/routes/v1/graph.ts`. When a canonical graph version is available,prefer edges from that version over provisional edges. Fall back to provisional edges when no canonical version exists.

**Acceptance:**

- `GET /v1/graph/semantic-edges` accepts an optional `graph_version` query parameter.
- When provided, returns only edges matching that version.
- When omitted, returns the latest canonical version if one exists, otherwise falls back to provisional edges.
- Existing callers that do not pass `graph_version` continue to work unchanged.

---

### S8: Cluster membership query surface (2 SP)

Expose a query endpoint for cluster memberships in the OpenPlanner API.

**Acceptance:**

- `GET /v1/graph/clusters` returns cluster summaries (cluster_id, size, graph_version, clustering_version).
- `GET /v1/graph/clusters/:cluster_id/members` returns node IDs in that cluster.
- `GET /v1/graph/nodes/:node_id/cluster` returns the cluster for a specific node.
- Endpoints are read-only and do not modify graph state.

---

### S9: Layout worker consumes canonical graph edges (3 SP)

Wire the graph layout worker to consume canonical semantic graph edges when available, instead of always reading provisional edges. This lets layout quality benefit from the offline builder output.

**Acceptance:**

- Layout worker checks for a canonical `graph_version` in `semantic_graph_runs` (status=complete).
- If found, reads edges matching that version from `graph_semantic_edges`.
- If not found, falls back to provisional edges (current behavior).
- Layout output quality is at least as good as current on the same node set.

---

### S10: Vexx slab-based rerank protocol (5 SP)

Add a `v2` API to `vexx` that accepts slab references and ID ranges instead of raw embedding JSON. This includes slab registration, topk-by-slab, and rerank-by-id endpoints over a more efficient transport (Unix domain socket or binary HTTP body).

**Acceptance:**

- `POST /v2/slabs/register` accepts a slab descriptor (path, shape, dtype) and returns a slab ID.
- `POST /v2/cosine/topk-by-slab` accepts slab ID + query offset range + `k`, returns top-k results.
- No raw embedding arrays appear in JSON request bodies.
- Existing `v1` endpoints remain functional for backward compatibility.
- The `semantic-graph-builder` can optionally use this as its rerank provider instead of local dot-product.

---

### S11: Incremental delta updates for new nodes (3 SP)

Add an incremental update path: when new embeddings appear, run a lightweight ANN query against the existing index to find their neighbors, exact-rerank locally, and append edges rather than rebuilding the entire graph.

**Acceptance:**

- `semantic-graph-builder update-delta` detects new node embeddings since the last run.
- New nodes are queried against the existing ANN index (rebuilt if index is stale).
- New edges are appended to `graph_semantic_edges` with the same `graph_version`.
- Does not rebuild the entire graph when < 5% of nodes are new.
- A full rebuild can still be triggered manually.

---

### S12: Background orchestration via Redis (optional) (3 SP)

Add optional Redis-based orchestration for scheduling semantic graph rebuilds, retrying failed runs, and publishing progress. Queue payloads contain run/job references only — never raw embedding arrays.

**Acceptance:**

- When `REDIS_URL` is configured, the builder publishes progress events to a Redis stream.
- A rebuild can be triggered by enqueuing a job reference.
- Failed runs are retried up to a configurable limit.
- When `REDIS_URL` is not configured, the builder works standalone (current behavior).
- No raw embedding data passes through Redis at any point.

---

## Verification

### Correctness

- On a `50k-100k` snapshot, ANN candidate recall against an exact sample is acceptable for the chosen `candidate_factor`.
- Final graph edges are produced from exact cosine on normalized vectors.
- `graph_semantic_edges` degree distribution is bounded and sparse.
- Leiden memberships are reproducible for a fixed graph snapshot and configuration.

### Performance

- Canonical build path performs no bulk raw embedding JSON POSTs.
- Exact rerank operates on local slabs or slab-referenced regions.
- Build time for a `50k-100k` snapshot is materially lower than the current HTTP matrix approach.
- CPU time spent in JSON serialization/deserialization on clustering path is near-zero relative to current baseline.

### Product quality

- The resulting graph exhibits stronger local cluster cohesion than the current thresholded edge path.
- Layout quality improves when driven from the canonical semantic graph.
- Search/query surfaces can reuse the same graph version without ambiguity.

## Definition of done

- OpenPlanner can build a canonical semantic graph for at least `100k` nodes without all-pairs exact scoring.
- The canonical builder uses ANN candidate generation plus exact rerank.
- `graph_semantic_edges` stores versioned sparse semantic edges from that build.
- `graph_cluster_memberships` stores queryable cluster IDs.
- The clustering path no longer depends on shipping raw embedding matrices over HTTP+JSON.

## Affected files

### New

- `packages/semantic-graph-builder/*`

### Existing likely touch points

- `packages/eros-eris-field/src/semantic.ts`
- `packages/eros-eris-field-app/src/index.ts`
- `packages/vexx/src/vexx/api/routes.clj`
- `packages/vexx/src/vexx/server.clj`
- `packages/vexx/src/vexx/native.clj`
- `src/routes/v1/graph.ts`
- `src/lib/mongo-vectors.ts`
- `src/lib/mongodb.ts`

## Recommendation

Treat this as the next canonical graph architecture for OpenPlanner:

- OpenPlanner stores embeddings and graph state.
- A dedicated offline builder constructs the real semantic neighbor graph.
- `vexx` is retained as an accelerator option, but bulk JSON matrix transport is no longer the center of the design.

This is the shortest path that both respects the current stack and actually gives the graph a chance to cluster at scale.