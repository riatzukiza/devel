# Kafka, Graph Streaming, and Projection Cache Architecture

Status: draft-accepted-for-implementation
Date: 2026-05-16

## Muse compression

OpenPlanner is not a game engine. The graph does not need to be physically accurate at every frame. The raw full-graph view is a weather map: useful for spotting storms, continents, and strange attractors, but not the primary instrument of understanding.

The primary instrument should become the selective graph explorer: a rich, queryable, source-grounded lens that lets a human or agent see meaning clusters, provenance, and drift without dragging 60k nodes and 250k edges through every request.

So the system should stop treating snapshots as the unit of truth. Truth is the event stream plus canonical stores. Views are projections. Layout is a projection. Embeddings are projections. Semantic clusters are projections. Caches are projections. The stack should move from “ask Mongo to rebuild the world” to “consume the river, maintain materialized lenses, stream deltas.”

## Intent

Build OpenPlanner around an append-only, replayable event backbone with durable workers and projection caches:

- Kafka/Redpanda is the long-term spine for events, audit logs, replay, and high-throughput fanout.
- REST APIs should read cached/materialized projections and enqueue/emit work, not do heavy embedding or graph mutation inline.
- Graph consumers should receive deltas, tiles, neighborhoods, and semantic clusters, not whole snapshots by default.
- The raw full graph remains available as an audit/overview surface, but it is explicitly approximate and sampled.
- `GraphExplorer.tsx` becomes the important tool: selective, semantic, source-grounded, expandable, and rich enough to reveal cluster evolution without eye-candy overload.

## Current anchors

- Existing cache package: `packages/stores/cache/`
  - memory LRU/TTL
  - Redis TTL
  - LMDB TTL
  - layered hot/warm cache promotion
  - projection envelopes with source store/key/watermark semantics
- Current graph size pressure: approximately 60k nodes and 250k edges.
- Current graph export path: `GET /v1/graph/export`.
- Current sampled raw view path: `POST /v1/graph/view`.
- Current focused explorer path: Knoxx `GraphExplorer.tsx` calls graph-weaver `focusedGraphView(...)`.
- Existing performance audit already called out missing queue depth, backpressure, histograms, and worker isolation.

## Architectural doctrine

### 0. Worker language policy

OpenPlanner worker jobs are Clojure by default.

The existing REST API is TypeScript, so a thin TypeScript API shim may publish accepted events to Kafka. But Kafka consumers, replay jobs, projection workers, embedding schedulers, graph materializers, repair jobs, and other hot-path/background jobs should be written in actual JVM Clojure unless there is a concrete reason not to.

This is not aesthetic preference only. The worker layer is where data contracts, replay determinism, idempotency, and operational correctness matter most. Clojure data-first code is the default medium for that work.

### 1. Kafka is the river, Mongo is not the river

Mongo remains a canonical query store for present state and durable materialized documents, but Kafka/Redpanda becomes the replayable event/audit substrate.

Recommended local/prod-compatible choice: Redpanda first. It gives Kafka protocol semantics with lower local ops friction.

Core topics:

| Topic | Purpose | Retention |
| --- | --- | --- |
| `openplanner.events.raw` | accepted external/user/system events | long/audit |
| `openplanner.events.normalized` | validated, schema-versioned events | long/audit |
| `openplanner.graph.edge-claims` | proposed/supported/refuted relation claims | long/audit |
| `openplanner.graph.nodes` | node upserts/tombstones | compacted + audit mirror |
| `openplanner.graph.edges` | edge upserts/tombstones | compacted + audit mirror |
| `openplanner.embedding.requests` | embedding work requests | short/medium |
| `openplanner.embedding.results` | embedding materialization results | medium |
| `openplanner.graph.layout.deltas` | layout position updates | compacted |
| `openplanner.graph.semantic.deltas` | semantic edge/cluster changes | compacted + medium |
| `openplanner.projection.invalidations` | cache/materialized-view invalidations | short |
| `openplanner.worker.heartbeats` | worker health/backpressure | short |

### 2. Workers own expensive transformations

REST should not be the place where the graph becomes meaningful. Workers should do that.

Worker classes:

| Worker | Consumes | Produces | Notes |
| --- | --- | --- | --- |
| event normalizer | `events.raw` | `events.normalized` | validates schemas and tenant/auth metadata |
| event writer | `events.normalized` | Mongo events | idempotent writes by event id |
| graph projector | `events.normalized`, `edge-claims` | `graph.nodes`, `graph.edges`, Mongo graph collections | derives canonical graph records |
| embedding worker | `embedding.requests` | `embedding.results`, Mongo vector collections | owns NPU/GPU/embedding backpressure |
| semantic worker | `embedding.results`, `graph.edges` | `graph.semantic.deltas` | builds/decays semantic edges and clusters |
| layout worker | `graph.nodes`, `graph.edges`, semantic deltas | `graph.layout.deltas`, Mongo layout overrides | approximate, bounded, optional |
| projection warmer | invalidations + hot query traces | cache writes | keeps common graph views/searches warm |
| audit/replay worker | selected topics | reports/checkpoints | validates that projections can be rebuilt |

### 3. Views are cacheable projections, not truth

Use `packages/stores/cache` projection envelopes everywhere a route returns derived graph data.

Projection envelope minimum:

```edn
{:projection/name "openplanner.graph/view"
 :projection/version 1
 :projection/source-store "mongodb|kafka|materialized-view"
 :projection/source-key "stable-query-or-tile-key"
 :projection/watermark "topic:partition:offset or mongo-cluster-time"
 :projection/value {...}}
```

Immediate route cache targets:

- `GET /v1/graph/export`
- `POST /v1/graph/view`
- graph-weaver `graphView(...)`
- graph-weaver `focusedGraphView(...)`
- GraphExplorer node previews
- semantic/vector query results keyed by normalized query + model + scope + watermarks

### 4. Stop shipping whole graph snapshots by default

Snapshot export remains an escape hatch. Normal consumers should use one of these forms:

| Shape | Use case | Payload behavior |
| --- | --- | --- |
| neighborhood | selected root + distance | bounded nodes/edges |
| semantic cluster | topic/embedding cell | compact representative nodes + expansion links |
| tile | viewport or semantic-space cell | stable, cacheable tile id |
| delta stream | live graph/layout evolution | node/edge/layout upserts since cursor |
| audit sample | high-level health/cluster drift | sampled, approximate, cheap |

Future streaming API sketches:

```http
GET /v1/graph/stream?cursor=...&project=...&kinds=node,edge,layout,semantic
Accept: text/event-stream
```

```graphql
subscription GraphDeltas($cursor: String, $scope: GraphScope!) {
  graphDeltas(cursor: $cursor, scope: $scope) {
    cursor
    kind
    node { id label kind }
    edge { source target kind }
    layout { id x y }
    semantic { clusterId score }
  }
}
```

### 5. GraphExplorer should become the crown jewel

`GraphExplorer.tsx` should evolve from “focused WebGL graph + GraphQL panel” into the actual workbench:

- root-node search with semantic suggestions
- neighborhood expansion and collapse
- cluster summaries generated from compacted view nodes
- evidence/source preview inline
- time slider for cluster evolution
- semantic diff: “what changed since last week?”
- provenance overlays for relation claims
- queue/cache health badges for stale/approximate projections
- saved lenses: reusable graph questions, not just visual states

The raw full graph can stay beautiful. But the selective explorer should become truthful, fast, and deep.

## Immediate quick win now landed

`src/routes/v1/graph.ts` now uses `@open-hax/openplanner-store-cache` for in-process projection caching around:

- `GET /v1/graph/export`
- `POST /v1/graph/view`

Environment knobs:

| Variable | Default | Meaning |
| --- | ---: | --- |
| `OPENPLANNER_GRAPH_PROJECTION_CACHE_MAX_ENTRIES` | `128` | memory LRU size |
| `OPENPLANNER_GRAPH_PROJECTION_CACHE_TTL_MS` | `60000` | default cache TTL |
| `OPENPLANNER_GRAPH_EXPORT_CACHE_TTL_MS` | `120000` | export projection TTL |
| `OPENPLANNER_GRAPH_VIEW_CACHE_TTL_MS` | `60000` | sampled view projection TTL |
| `OPENPLANNER_GRAPH_VIEW_BUILD_TIMEOUT_MS` | `8000` | fail-open timeout for raw sampled graph view builds |
| `OPENPLANNER_METRICS_MONGO_REFRESH_MS` | `60000` | minimum interval for Mongo count gauges during Prometheus scrapes |
| `OPENPLANNER_KAFKA_ENABLED` | `false` | enable API event mirroring to Kafka/Redpanda |
| `OPENPLANNER_KAFKA_BROKERS` | `redpanda:9092` | Kafka bootstrap brokers |
| `OPENPLANNER_KAFKA_EVENTS_RAW_TOPIC` | `openplanner.events.raw` | raw accepted event topic |
| `OPENPLANNER_KAFKA_PUBLISH_MODE` | `detached` | `detached` fail-open publish or `await` publish before API response |
| `OPENPLANNER_KAFKA_REPLAY_DRY_RUN` | `true` | replay worker reads without writing Mongo by default |
| `OPENPLANNER_KAFKA_REPLAY_START_OFFSET` | `earliest` | replay start offset, or `latest`/numeric |
| `OPENPLANNER_KAFKA_REPLAY_END_OFFSET` | `latest` | replay end offset captured at worker start, or numeric |
| `OPENPLANNER_KAFKA_REPLAY_MAX_MESSAGES` | `1000` | replay safety cap per run |
| `OPENPLANNER_HEALTH_DEEP_DEFAULT` | `false` | make `/v1/health` run expensive dependency checks by default |
| `OPENPLANNER_HEALTH_MONGO_TIMEOUT_MS` | `1500` | bounded Mongo ping timeout for shallow health |

Metrics emitted and now exposed at the Prometheus scrape path `GET /v1/metrics`:

- `openplanner_projection_cache_hits_total{projection=...}`
- `openplanner_projection_cache_misses_total{projection=...}`
- `openplanner_projection_cache_writes_total{projection=...}`
- `openplanner_projection_cache_inflight_hits_total{projection=...}`
- `openplanner_projection_cache_errors_total{projection=...,operation=...}`
- `openplanner_kafka_enabled{client=...}`
- `openplanner_kafka_connected{client=...}`
- `openplanner_kafka_events_published_total{topic=...}`
- `openplanner_kafka_errors_total{operation=...,topic=...}`

This is deliberately not the final architecture. It is a pressure valve: repeated export/view calls stop stampeding Mongo while the Kafka/streaming worker design is built. If the raw sampled view cannot build quickly, it now fails open with an explicitly degraded empty/seed-only view instead of holding the request until Mongo times out.

## Implementation phases

### Phase 0: stabilize read pressure

- Cache expensive graph projections with projection envelopes.
- Emit cache hit/miss/write metrics.
- Add Grafana panels for cache ratio and graph route latency.
- Keep TTLs short enough that stale graph eye-candy is acceptable.

### Phase 1: introduce Redpanda/Kafka backbone

Initial skeleton is now in place:

- `services/openplanner/compose/kafka.yml` defines a profile-gated `redpanda` broker.
- `OPENPLANNER_KAFKA_ENABLED=true` enables API mirroring to Kafka.
- `src/plugins/kafka-events.ts` wires the optional event bus into Fastify.
- `src/lib/kafka-events.ts` publishes accepted `/v1/events` batches to `openplanner.events.raw` using KafkaJS.
- `packages/workers/kafka` contains the first actual Clojure worker package.
- `clj -M:audit` joins a consumer group and emits audit heartbeats.

Replay skeleton now exists too:

- `packages/workers/kafka/src/openplanner/kafka/jobs.clj` reads `openplanner.events.raw` over a bounded offset window.
- Default mode is `OPENPLANNER_KAFKA_REPLAY_DRY_RUN=true` so operators can inspect replay coverage without touching Mongo.
- With dry-run disabled, it idempotently upserts raw events into the Mongo `events` collection using event id as the stable key.
- `services/openplanner/compose/kafka.yml` includes a one-shot Clojure `openplanner-kafka-event-replay-worker` under the separate `kafka-replay` profile.

Next work:

- Extend replay beyond raw event upserts into derived graph node/edge projections.
- Add replay checkpoints/manifests so bounded ranges can be recorded as audit artifacts.
- Add DLQ/error topics once workers become mutating processors instead of audit-only consumers.
- Decide compaction/retention per topic after observing real throughput.

### Phase 2: move embedding out of API ownership

- API emits `embedding.requests`.
- Embedding worker owns batching, retries, model choice, and backpressure.
- Results are idempotently written and emitted as `embedding.results`.
- API reports queued/materialized status separately.

### Phase 3: graph deltas and materialized lenses

- Graph projector emits node/edge/layout/semantic deltas.
- Graph-weaver consumes deltas instead of pulling full exports.
- Add `/v1/graph/deltas` and/or SSE stream with cursors.
- Keep `/v1/graph/export` as audit/debug only.

### Phase 4: make GraphExplorer the main instrument

- Add saved lenses and semantic cluster expansion.
- Prefer compacted view nodes and source previews over full graph rendering.
- Show approximation/staleness explicitly.
- Add “cluster evolution” and “why is this connected?” panels.

## Backpressure rules

- If embedding queue lag is high, API still accepts events but marks embeddings delayed.
- If graph projection lag is high, GraphExplorer returns stale cached projections with visible staleness metadata.
- If Mongo latency rises, workers reduce batch size and pause optional layout/semantic jobs.
- `/v1/health` is shallow by default so Docker/readiness checks do not call embeddings or index introspection under load; use `/v1/health?deep=true` for dependency audits.
- If layout workers are behind, only layout freshness degrades; truth queries continue.
- If Kafka is unavailable, API can write Mongo directly in degraded mode and records a replay gap receipt.

## What not to do

- Do not add more REST replicas to hide synchronous work.
- Do not make plain Redis Pub/Sub the durable work queue.
- Do not make every UI route ask for the whole graph.
- Do not treat layout coordinates as truth.
- Do not make the embedding processor compete with request latency.
- Do not cache raw truth as if it were canonical; cache projections with source refs and watermarks.

## North star

OpenPlanner should feel less like a dashboard querying a database and more like a living observatory over a replayable river: events enter, workers metabolize them, projections bloom, and explorers inspect meaning at the scale they actually need.
