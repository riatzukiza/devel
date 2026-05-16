## Signal

(己, p=0.98) `@orgs/open-hax/openplanner/packages/graph/` currently has six graph packages. They form a stack:

```text
graph-weaver-aco       = tiny ACO crawler brain
myrmex                 = richer crawl/orchestration layer that uses ACO + ShuvCrawl + OpenPlanner writes
graph-weaver           = live graph service/UI/GraphQL/audit surface
webgl-graph-view       = low-level WebGL renderer used by graph-weaver UI
eros-eris-field        = physics/layout simulation engine
eros-eris-field-app    = service loop that applies eros-eris-field to Graph Weaver/OpenPlanner layouts
```

### `eros-eris-field`

(己, p=0.97) This is the **pure simulation/math library** for graph layout.

Main logic:

- Takes particles/nodes with positions and velocities.
- Applies Barnes-Hut/quadtree long-range repulsion.
- Applies grid/local repulsion so nodes do not collapse into each other.
- Applies structural spring forces for graph edges.
- Applies semantic attraction/repulsion based on similarity.
- Applies boundary pressure to keep the graph in a soft circular field.
- Integrates velocity/position with damping.

Key source files:

- `src/sim.ts`
  - `stepField(...)`
  - core force integration loop
- `src/quadtree.ts`
  - Barnes-Hut quadtree for approximate N-body repulsion
- `src/semantic.ts`
  - semantic edge/cosine helper logic
- `src/graph-ant.ts`
  - graph-ant trail/field primitives
- `src/types.ts`
  - `Particle`, `SpringEdge`, `SemanticEdge`, `FieldConfig`, etc.

Important distinction:

```text
eros-eris-field does not own graph truth.
It only computes movement/field dynamics over graph-like inputs.
```

### `eros-eris-field-app`

(己, p=0.96) This is the **layout worker/microservice** that uses `eros-eris-field` against the live Graph Weaver/OpenPlanner graph.

Main logic:

- Polls Graph Weaver GraphQL for the current graph view.
- Converts Graph Weaver nodes into simulation particles.
- Converts structural graph edges into springs.
- Fetches/hydrates node previews/content when needed.
- Computes or retrieves embeddings.
- Builds semantic force pairs.
- Runs `stepField(...)`.
- Writes updated layout positions back through Graph Weaver:

```graphql
layoutUpsertPositions(inputs: [NodePositionInput!]!): Int!
```

Current semantic-force direction:

- It now reads/writes OpenPlanner semantic force surfaces rather than treating semantic similarity as durable graph truth.
- It can use Vexx/OpenPlanner-backed comparisons depending on config and current implementation path.

Key source:

- `src/index.ts`

Runtime role:

```text
graph-weaver gives it nodes/edges
eros-eris-field-app simulates better positions
graph-weaver stores positions in node.data.pos
UI renders those positions
```

### `graph-weaver`

(己, p=0.99) This is the **main live graph workbench**: service, GraphQL API, static UI, graph store integration, OpenPlanner bridge, audit overlays.

Main logic areas:

#### 1. Graph source loading

It can build the graph from different sources depending on `GRAPH_WEAVER_LOCAL_SOURCE`:

- `openplanner-graph`
  - recommended mode
  - fetches bounded graph export from OpenPlanner
- `repo`
  - scans local filesystem for imports, markdown links, dependencies
- `openplanner-lakes`
  - aggregates multiple OpenPlanner project/lake graphs
- `none`
  - manual/user overlay only

Key files:

- `src/openplanner-graph.ts`
  - OpenPlanner `/v1/graph/export` ingestion
  - preserves OpenPlanner `data.pos` layout when present
- `src/scan.ts`
  - local repo scan mode
- `src/imports.ts`
  - import/dependency extraction
- `src/markdown.ts`
  - markdown link extraction
- `src/lakes.ts`
  - OpenPlanner lake aggregation

#### 2. Multi-layer graph model

(己, p=0.96) Graph Weaver treats graph data as layers:

```ts
"local" | "web" | "user" | "semantic" | "presence" | "transient" | "field" | "daimoi"
```

Layer meanings:

- `local`
  - repo/filesystem/code graph
- `web`
  - discovered external web graph
- `user`
  - manual/user-added nodes and edges
- `semantic`
  - compatibility/audit semantic graph surfaces
- `presence`
  - system/process/resource/muse presence nodes
- `transient`
  - transient semantic circuit edges
- `daimoi`
  - query-born daimoi trail observations overlay
- `field`
  - Barnes-Hut/quadtree semantic field cells and force samples overlay

Key files:

- `src/graph.ts`
- `src/store.ts`
- `src/mongo-graph-store.ts`

#### 3. Persistence

(己, p=0.95) Graph Weaver can use Mongo persistence and/or OpenPlanner.

Important Mongo-backed Graph Weaver/audit reads include:

- Graph Weaver node/edge stores
- daimoi trail snapshots from `graph_daimoi_trails`
- semantic field cells from `graph_semantic_field_cells`
- semantic field multipole force samples from `graph_semantic_force_samples`

Key file:

- `src/mongo-graph-store.ts`

#### 4. GraphQL API

(己, p=0.98) `graph-weaver` exposes the UI/service API through GraphQL.

Major queries/mutations include:

- `graphView`
- `focusedGraphView`
- `node`
- `nodePreview`
- `edges`
- `neighbors`
- `searchNodes`
- `presences`
- `semanticEdges`
- `daimoiSnapshots`
- `semanticFieldOverlay`
- `layoutUpsertPositions`
- user node/edge mutations
- presence upsert
- semantic edge reinforce/decay

Key file:

- `src/graphql.ts`

#### 5. Server/runtime

(己, p=0.97) The server:

- starts HTTP static UI
- starts GraphQL endpoint
- starts websocket change notifications
- loads config
- starts/stops ACO web crawler when web mode enabled
- rebuilds local/OpenPlanner graph sources
- serves node previews
- manages semantic transient edge decay timer
- handles layout persistence
- exposes health/status routes

Key file:

- `src/server.ts`

#### 6. Frontend UI

(己, p=0.97) The browser UI:

- fetches `graphView`
- renders with `webgl-graph-view`
- displays legend/filter controls
- lets user inspect nodes/edges
- supports GraphQL-backed node preview
- overlays daimoi audit nodes/trails
- overlays semantic field cells/multipole force samples
- maintains filters across websocket ticks now

Key files:

- `public/index.html`
- `public/app.js`
- `public/style.css`

Important current behavior:

```text
semantic_field_cell = rendered node
semantic_field_child = visual containment edge
semantic_field_multipole = visual force-sample edge
```

Those are field/audit overlay structures, not truth edges.

### `graph-weaver-aco`

(己, p=0.97) This is the **small ant-colony web traversal engine**.

Main logic:

- Maintains a frontier of URLs.
- Spawns “ants” that choose next URLs.
- Chooses next URL using pheromone and heuristic weighting:

```text
weight = pheromone^alpha × heuristic^beta
```

- Heuristic prefers:
  - novelty
  - stale pages worth revisiting
  - host balance
- Respects robots.txt.
- Applies per-host pacing.
- Limits concurrency.
- Fetches pages through a pluggable fetch backend.
- Extracts outgoing links.
- Emits events:
  - page fetched
  - error
  - robots blocked
  - etc.
- Evaporates pheromone over time.
- Deposits pheromone after useful traversal.

Key files:

- `src/GraphWeaverAco.ts`
  - main long-running crawler loop
- `src/aco.ts`
  - URL choice/weighting
- `src/frontier.ts`
  - URL frontier state
- `src/fetch-backend.ts`
  - simple fetch backend
- `src/robots.ts`
  - robots.txt cache/checks
- `src/url.ts`
  - URL normalization/link extraction

Role:

```text
graph-weaver-aco knows crawling mechanics.
It does not know OpenPlanner truth semantics.
```

### `myrmex`

(己, p=0.95) This is the **richer web graph orchestrator** built on top of `graph-weaver-aco`.

Main logic:

- Uses `GraphWeaverAco` as the traversal brain.
- Uses ShuvCrawl as a richer fetch/extraction backend.
- Routes page/error/checkpoint events.
- Stores discovered graph nodes/edges.
- Writes graph events into OpenPlanner `/v1/events`.
- Supports checkpointing/recovery.
- Applies crawl backpressure when OpenPlanner writes are slow/failing.
- Pauses/resumes crawling based on downstream pressure.
- Maintains heartbeat metrics:
  - activity
  - frontier pressure
  - queue pressure
  - error pressure
  - pacing multiplier
  - state: `resting`, `working`, `surge`, `strained`

Key files:

- `src/Myrmex.ts`
  - orchestrator and heartbeat/backpressure logic
- `src/graph-store.ts`
  - OpenPlanner/Proxx graph event write path
- `src/event-router.ts`
  - event handling/routing
- `src/checkpoint.ts`
  - checkpoint manager
- `src/shuvcrawl-client.ts`
  - ShuvCrawl API client
- `src/shuvcrawl-backend.ts`
  - ShuvCrawl-backed fetch backend
- `src/main.ts`
  - runtime entrypoint

Role distinction from `graph-weaver-aco`:

```text
graph-weaver-aco = traversal kernel
myrmex = production-ish crawl orchestrator with extraction, storage, backpressure, checkpoints
```

### `webgl-graph-view`

(己, p=0.98) This is the **low-level browser renderer**.

Main logic:

- Owns a WebGL canvas.
- Converts graph nodes/edges into GPU buffers.
- Draws:
  - edges as lines
  - nodes as points
  - halos/selection highlights
  - optional overlay points
- Supports:
  - pan
  - zoom
  - fit-to-graph
  - picking/click selection
  - dense graph adaptive frame pacing/DPR cap
- Accepts styling callbacks:
  - `nodeStyle(node)`
  - `edgeStyle(edge)`
  - `haloStyle(node)`

Key files:

- `src/WebGLGraphView.ts`
  - main renderer class
- `src/renderer.ts`
  - drawing/render helpers
- `src/geometry.ts`
  - geometry/buffer conversion helpers
- `src/interaction.ts`
  - mouse interaction/picking
- `src/shaders.ts`
  - WebGL shaders
- `src/types.ts`
  - public renderer types

Role:

```text
webgl-graph-view has no OpenPlanner semantics.
It just draws graph-shaped data fast.
```

## Evidence

(己, p=1.0) I checked the package READMEs and source files under:

- `packages/graph/eros-eris-field`
- `packages/graph/eros-eris-field-app`
- `packages/graph/graph-weaver`
- `packages/graph/graph-weaver-aco`
- `packages/graph/myrmex`
- `packages/graph/webgl-graph-view`

(己, p=0.97) Key files read or inspected include:

- `eros-eris-field/src/sim.ts`
- `eros-eris-field-app/src/index.ts`
- `graph-weaver/src/server.ts`
- `graph-weaver/src/graphql.ts`
- `graph-weaver/src/mongo-graph-store.ts`
- `graph-weaver-aco/src/GraphWeaverAco.ts`
- `myrmex/src/Myrmex.ts`
- `webgl-graph-view/src/WebGLGraphView.ts`

## Frames

(世, p=0.94) The packages split cleanly into four conceptual layers:

```text
Traversal:
  graph-weaver-aco
  myrmex

Graph service / audit UI:
  graph-weaver

Rendering:
  webgl-graph-view

Simulation / layout:
  eros-eris-field
  eros-eris-field-app
```

(世, p=0.92) The durable truth boundary still lives outside most of these packages, primarily in OpenPlanner core routes/collections. The graph packages mostly visualize, crawl, simulate, or project.

(己, p=0.9) The confusing overlap is that several packages use “graph edges,” but not all graph-shaped edges mean the same thing:

```text
OpenPlanner edge claim = truth/evidence lifecycle
Graph Weaver edge = render/query relation
Semantic transient edge = conductance circuit
Semantic field multipole = force sample between cells
WebGL edge = drawable line segment
ACO edge = discovered hyperlink/traversal relation
```

## Countermoves

(己, p=0.95) Do not treat every edge in these packages as a TruthGraph edge.

(己, p=0.94) Especially:

- `semantic_field_multipole` in Graph Weaver is a rendered force-sample relation.
- `semantic_field_child` is quadtree containment.
- `semantic_transient` is a decaying circuit.
- `hyperlink`/web edges from ACO/Myrmex are crawl observations.
- durable relation truth should still go through OpenPlanner edge claims.

(己, p=0.9) If the UI currently labels all of these as just “edges,” that is semantically too flat.

## Next

(己, p=0.88) Add a small “edge ontology” legend/document in `packages/graph/graph-weaver` that explicitly separates truth edges, observation edges, circuit edges, field-force samples, and render-only edges.