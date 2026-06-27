# OpenPlanner Kafka Workers

Actual Clojure workers for the OpenPlanner Kafka/Redpanda event spine.

Principles:

- Worker jobs live here in Clojure, not TypeScript.
- TypeScript may remain a thin API boundary while the existing OpenPlanner API is TypeScript.
- Kafka consumers, replay processors, projection workers, embedding schedulers, and hot-path jobs should be Clojure by default.
- Dry-run first for replay or repair jobs; mutating runs must be explicit.

## Jobs

```bash
clojure -M:audit
clojure -M:replay
clojure -M:graph-edges-backfill
clojure -M:check
```

The container image AOT-compiles `openplanner.kafka.jobs` and runs it with `java` directly so long-lived workers do not pay repeated Clojure CLI/classpath startup cost.

## Key environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `OPENPLANNER_KAFKA_ENABLED` | `false` | enable worker loop |
| `OPENPLANNER_KAFKA_BROKERS` | `redpanda:9092` | Kafka bootstrap brokers |
| `OPENPLANNER_KAFKA_EVENTS_RAW_TOPIC` | `openplanner.events.raw` | raw event topic |
| `OPENPLANNER_KAFKA_REPLAY_DRY_RUN` | `true` | replay reads without Mongo writes |
| `OPENPLANNER_KAFKA_REPLAY_START_OFFSET` | `earliest` | replay start offset |
| `OPENPLANNER_KAFKA_REPLAY_END_OFFSET` | `latest` | replay end offset at worker start |
| `OPENPLANNER_KAFKA_REPLAY_MAX_MESSAGES` | `1000` | replay safety cap |
| `OPENPLANNER_GRAPH_EDGES_BACKFILL_LIMIT` | `0` | maximum historical `graph.edge` events to scan; `0` means no limit |
| `OPENPLANNER_GRAPH_EDGES_BACKFILL_BATCH_SIZE` | `1000` | Mongo bulk upsert batch size for graph edge projection rebuilds |
| `OPENPLANNER_GRAPH_EDGES_BACKFILL_LOG_EVERY` | `1000` | progress log interval for graph edge backfill |
| `MONGODB_GRAPH_EDGES_COLLECTION` | `graph_edges` | target graph edge projection collection |

The replay worker currently rebuilds the raw Mongo `events` projection idempotently by event id. Derived graph projection replay comes next.

`graph-edges-backfill` is the first derived projection worker. It scans historical `graph.edge` events from Mongo, extracts `extra.source_node_id`, `extra.target_node_id`, and `extra.edge_type`/`extra.edge_kind`, and idempotently upserts `source||target||kind` rows into `graph_edges`.
