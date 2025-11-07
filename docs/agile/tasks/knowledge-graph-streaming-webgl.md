---
title: Knowledge Graph Streaming WebGL Frontend
status: todo
priority: high
labels: [knowledge-graph, streaming, websocket, webgl]
uuid: 28c7cc0a-4a94-4f8a-8c20-4fa542b2d8f1
created_at: 2025-11-06T00:00:00.000Z
---

## 🎯 Summary
Design and implement a streaming knowledge graph experience for the devel workspace. Replace JSON-oriented storage with a normalized schema, provide a WebSocket API that streams only the visible slice of the graph, and deliver a high-performance WebGL frontend with physics-driven visualization and zoom controls.

## ✅ Requirements
- Normalized relational schema for nodes/edges (no JSON columns) with attribute tables.
- WebSocket backend that streams node/edge batches based on viewport, anchor node, and zoom level.
- Repository-wide ingestion config (YAML) and CLI updates for full docs/ processing.
- WebGL viewer (React + sigma.js) with physics, anchor start, zoom controller, and incremental loading.
- Protocol for viewport updates (`viewport`, `node_batch`, `edge_batch`, `stats`) using binary-friendly framing (MessagePack acceptable).
- Caching/index strategy compatible with SQLite; extensible to MongoDB/Redis later.

## 📦 Deliverables
1. Database migration scripts and repository updates to new schema.
2. `@promethean-os/knowledge-graph-api` package exposing WebSocket server and query utilities.
3. YAML-driven CLI workflow for repository scans and graph cache priming.
4. `promethean/sites/knowledge-graph-viewer` app using Vite + React + sigma.js.
5. Integration tests ensuring viewport-triggered streaming returns correct nodes/edges.
6. Documentation covering API protocol, deployment, and local dev instructions.

## 🗺️ Execution Plan

### Phase 1 — Storage & Ingestion
- Migrate SQLite schema to structured tables (`nodes`, `edges`, `node_attributes`, `edge_attributes`, `edge_line_numbers`).
- Update `GraphRepository` to read/write via new schema and remove JSON serialization.
- Extend CLI with `--config`, `--include`, `--exclude`, `--anchor`, `--radius`, `--concurrency` options.
- Introduce `knowledge-graph.config.yaml` for repository scanning defaults (docs/**, submodules, ignores).
- Add metrics hooks for ingestion throughput.

### Phase 2 — Streaming Backend
- Scaffold `@promethean-os/knowledge-graph-api` with Bun + `ws` server.
- Implement viewport subscription manager translating camera state into spatial/graph queries.
- Add SQL helpers for radius/neighbor queries and adjacency caching.
- Encode `node_batch`/`edge_batch`/`stats` messages (MessagePack), ensure backpressure handling.
- Provide heartbeat and reconnect semantics; document protocol.

### Phase 3 — WebGL Frontend
- Create Vite + React + TypeScript app under `promethean/sites/knowledge-graph-viewer`.
- Integrate `graphology` + `sigma.js` with Web Worker ForceAtlas2 physics.
- Implement WebSocket client: send anchor request on load, stream viewport updates on zoom/pan.
- Add UI controls: zoom slider, physics toggle, anchor navigator, search bar.
- Manage graph cache with eviction for off-screen nodes; render incremental batches smoothly.
- Ship e2e smoke test (Playwright) validating streaming interaction.

### Phase 4 — Integration & Docs
- Wire CLI ingestion output to streaming backend startup pipeline.
- Provide deployment scripts (Bun service + static site build).
- Document local dev flow, protocol reference, and scaling considerations.
- Conduct load tests simulating large graphs and high zoom activity; tune batch sizes.

## 🔄 Dependencies & Risks
- Large dataset query performance — address via indexes and optional caching layers.
- WebSocket stability under frequent viewport updates — implement debounce/backpressure.
- Physics layout cost — offload to worker and allow user to pause.

## 📌 Acceptance Criteria
- Frontend loads anchor view within 2 seconds, shows responsive zoom/physics.
- Streaming protocol keeps UI under 200ms latency for viewport updates at standard graph sizes (10k+ nodes).
- No JSON column usage remains in persistence layer; schema documented and migratable.
- CLI can rebuild graph for entire repo using YAML config without manual tweaks.
