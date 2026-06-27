# @open-hax/openplanner-store-cache

ClojureScript cache protocol, schemas, and adapter package for OpenPlanner store projections.

This package establishes the shared pattern for cache-backed stores:

- `openplanner.stores.cache.protocol` owns the small cache protocol.
- `openplanner.stores.cache.schema` owns data-first contracts for cache entries and projection envelopes.
- `openplanner.stores.cache.adapters.*` owns backend-specific adapters.
- `openplanner.stores.cache.layered` composes hot/warm/durable-ish cache layers.
- `openplanner.stores.cache.boundary` is the JS/CLJS export boundary.

The important semantic rule: **a cache value is a projection of a canonical store object**. Redis/LMDB/etc. are not truth; they are hot read models with source refs, schema versions, and watermarks.

## Naming pattern

Use backend adapter namespaces when the code is about a physical store:

- `openplanner.stores.cache.adapters.memory`
- `openplanner.stores.cache.adapters.redis`
- `openplanner.stores.cache.adapters.lmdb`

Use domain namespaces when the code is about an OpenPlanner domain:

- `openplanner.stores.events.schema`
- `openplanner.stores.events.projections.session-index`
- `openplanner.stores.events.sources.hot`
- `openplanner.stores.events.sources.warm`
- `openplanner.stores.events.durable.mongo`

That keeps the dependency direction clean: domain stores depend on protocols and schemas, while adapters depend only on their driver-shaped clients/handles.

## Current adapters

This package includes only adapters already exercised by OpenPlanner today:

- memory LRU/TTL
- Redis-client TTL cache
- LMDB-handle TTL cache
- layered cache promotion

Future adapters like MongoDB, PostgreSQL, ChromaDB, DuckDB, and SQLite should be added when a real domain store needs them. Do not add empty adapter namespaces just to reserve names.

## I/O lifecycle

Connection lifecycle remains at the application edge. Adapters wrap caller-owned clients/handles:

- Redis adapter requires a connected node-redis client.
- LMDB adapter requires an opened LMDB database handle.
- Memory adapter owns only its atom.

## Projection envelope

Use `projectionEnvelope` / `projection-envelope` to make Redis values legible as projections:

```clojure
{:projection/name :openplanner.sessions/session-index
 :projection/version 1
 :projection/source-store :mongo
 :projection/source-collection "events"
 :projection/source-key "session:abc"
 :projection/watermark "events:177884..."
 :projection/value {...}}
```

This lets downstream trigger/action systems audit where a cached value came from and whether it is stale.
