# Cephalon CLJS Implementation Surfaces

## Purpose

Name the parts of the ClojureScript package that still carry the strongest “brain daemon” architecture.

## Executable spine

### `src/promethean/main.cljs`
The main executable composition root.

It currently:
- resolves runtime config from env
- creates adapters, clients, and stores
- initializes the world
- bootstraps Cephalon + Sentinel entities/systems
- runs a fixed-timestep ECS loop
- starts filesystem and Discord adapters
- optionally boots the TypeScript cephalon bridge

This is the package’s clearest answer to “how does the mind stay alive between user turns?”

## World and stepping

### `src/promethean/ecs/world.cljs`
Defines the world shape and environment placement.

### `src/promethean/ecs/tick.cljs`
Executes systems over time.

Together, these files make the CLJS branch feel like a long-lived organism rather than a request/response wrapper.

## System decomposition

### Route / memory / eidolon / sentinel / cephalon / effects
The package’s major load-bearing systems live under `src/promethean/sys/`.

Especially important:
- `sys/route.cljs` — event routing into session-like processing
- `sys/memory.cljs` — ingestion into memory state
- `sys/eidolon.cljs` and `sys/eidolon_vectors.cljs` — retrieval/index maintenance
- `sys/sentinel.cljs` — note/sentinel behavior
- `sys/cephalon.cljs` — thought/tool behavior tied to the cephalon entity
- `sys/effects.cljs` — effect queue flushing and result/error feedback

## Effect layer

### `src/promethean/sys/effects.cljs`
One of the cleanest architecture files in the family.

It preserves:
- queued effects with IDs
- bounded concurrency
- promise execution with timeout handling
- result/error events appended back into the world
- retained completed history for later inspection

This is one of the best places to study Cephalon as an event-native agent runtime.

## Eidolon and memory surfaces

### `src/promethean/memory/*`
Memory schemas, storage, dedupe, and tags.

### `src/promethean/contracts/memory_record.cljs`
Boundary adapter for canonical cross-strata memory records.

Why it matters:
- it translates between canonical boundary memory records and CLJS-local memory shapes
- it explicitly handles both the newer namespaced memory schema and older local memory-model/store shapes

### `src/promethean/eidolon/*`
Embedding, similarity, vector-store, nexus keys, and nexus indexing surfaces.

These namespaces carry much of the family’s long-running semantic memory ambition.

## Adapters and tool surfaces

### `src/promethean/adapters/*`
Filesystem and Discord surfaces.

### `src/promethean/tools/*`
Tool registry and definitions inside the CLJS branch.

### `src/promethean/openplanner/client.cljs`
OpenPlanner bridge surface.

## TS bridge

### `src/promethean/bridge/cephalon_ts.cljs`
The explicit bridge into the TypeScript runtime.

Why it matters:
- it proves the family was already trying to compose languages rather than forcing a single-language answer
- it gives the CLJS branch a way to remain the always-running mind while borrowing the stronger TS service runtime
- it now carries explicit helpers for converting CLJS internal events to canonical boundary envelopes and back again, with optional TS-side normalization when the TS runtime exports it

## Note corpus as architecture surface

The package is inseparable from:
- `docs/notes/cephalon/*`
- `docs/notes/cephalon_cljs_ts_hybrid/*`
- `spec/notes-extracted/*`

Those files are not mere commentary. They are part of the package’s effective architecture memory.

## Practical reading advice

If you only have one hour, read in this order:
1. `src/promethean/main.cljs`
2. `src/promethean/sys/effects.cljs`
3. `src/promethean/sys/cephalon.cljs`
4. `src/promethean/context/assembler.cljs`
5. `src/promethean/eidolon/*`
6. the `docs/notes/cephalon/` spec cluster
