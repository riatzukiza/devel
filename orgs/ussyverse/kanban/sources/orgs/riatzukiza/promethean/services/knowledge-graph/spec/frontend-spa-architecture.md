# SPA Architecture & API Design

## Context

- Goal: deliver a web SPA for knowledge-graph exploration/editing.
- Repo currently exposes DB + CLI only; needs HTTP API for SPA (#8) and supporting infra (#11).

## Assumptions

- Backend: Node 22, SQLite via existing Database/GraphRepository.
- Auth: start unauthenticated/local; add token-based auth later.
- Transport: REST (JSON); GraphQL deferred.
- CORS enabled for SPA origin; rate limiting not initially required.

## API Surface (v1)

- Base: `/api`.
- Health: `GET /api/health` (ok, version, db path).
- Nodes:
  - `GET /api/nodes` — query params: `type`, `search`, `limit`, `offset`, `orderBy` (whitelist), returns `{nodes,totalCount,hasMore}`.
  - `GET /api/nodes/:id` — returns node or 404.
  - `POST /api/nodes` — body `{id,type,data,metadata}`; validates required fields.
  - `PATCH /api/nodes/:id` — partial update of `data`/`metadata`.
  - `DELETE /api/nodes/:id` — cascades edges (db FK or repo logic).
- Edges:
  - `GET /api/edges` — query params: `type`, `source`, `target`, `limit`, `offset`, `orderBy`; returns `{edges,totalCount,hasMore}`.
  - `GET /api/edges/:id` — returns edge or 404.
  - `POST /api/edges` — body `{id,source,target,type,data}`; rejects unknown node ids.
  - `PATCH /api/edges/:id` — partial update.
  - `DELETE /api/edges/:id`.
- Graph queries:
  - `GET /api/graphs/connected?nodeId=...&depth=...` — returns `{nodes,edges}` using fixed CTE.
  - `GET /api/graphs/mermaid?direction=LR` — returns mermaid string for current graph.
- Rebuild:
  - `POST /api/rebuild` — triggers graph rebuild on the server; SPA reloads `/graph.ndjson` after success.

## Data Contracts

- Node type: `documentation|code|package|repository|web_resource|person|project`.
- Edge type: `links_to|references|imports|depends_on|contains|authored_by|belongs_to`.
- Embedding edges: precomputed ANN edges use type `related` with `data.method: "embedding"`; frontend renders them with a dedicated magenta color to indicate semantic similarity.
- Metadata: `createdAt`, `updatedAt`, `source`, optional `checksum`, `size`.
- Validation: whitelist columns in filters/orderBy (reuse repository guards); limit pagination to 1000.

## Error Model

- JSON errors: `{error:{code,message,details?}}`; 4xx for validation/not found, 5xx for unexpected.
- Migration failures should be surfaced (do not mask as already exists).

## Architecture

- HTTP server layer (Express/Fastify/Koa) with router modules: nodes, edges, graphs, health.
- Services wrap `GraphRepository` to avoid SQL leakage into handlers; in-memory adapter remains for tests.
- DTO mappers: DB ⇄ API shapes (Date ↔ ISO strings).
- Config: env for DB path, port, CORS origins, log level.
- Logging: reuse Logger; add request logging middleware.
- Testing: API contract tests (supertest/vitest) covering CRUD, validation, pagination, connected graph/mermaid.

## Definition of Done

- Endpoints above implemented with validation and error handling.
- SPA can consume list/detail and mutation endpoints.
- CI runs API tests; docs describe routes, payloads, and env vars.
