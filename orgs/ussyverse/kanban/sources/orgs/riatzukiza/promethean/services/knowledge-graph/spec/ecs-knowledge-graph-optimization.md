# ECS-driven Knowledge Graph Optimization Plan

## Context

- Goal: optimize `@promethean-os/knowledge-graph` build/persistence and enable efficient frontend updates by leveraging the ECS utilities in `packages/ds/src/ecs.ts`.
- Service entry points already cover ingest/build (`src/builder.ts`), persistence (`src/database/database.ts`, `src/database/repository.ts`), and UI rendering (`packages/knowledge-graph-ui/src/GraphCanvas.tsx`).
- ECS baseline: archetype implementation in `packages/ds/src/ecs.ts` (not yet wired into knowledge-graph).

## Relevant Code & References

- ECS primitives and change-tracking: `packages/ds/src/ecs.ts:4-465` (entity masks, archetype moves, changed sets) and deprecated wrappers at `packages/ds/src/ecs.ts:467-753`.
- Graph build pipeline: `services/knowledge-graph/src/builder.ts:49-190` (repository scan, per-file processing), `:252-358` (link/import/dependency edge creation), `:549-579` (related edges/embeddings), and path resolution guards at `:352-545`.
- Persistence and schema: `services/knowledge-graph/src/database/database.ts:1-313` (SQLite setup, migrations, performance pragmas) and repo adapter at `services/knowledge-graph/src/database/repository.ts:1-323` (node/edge CRUD, queries).
- Migration entrypoint: `services/knowledge-graph/src/database/migrate.ts:1-26` (CLI runner).
- Frontend graph rendering and layout tuning: `services/knowledge-graph/packages/knowledge-graph-ui/src/GraphCanvas.tsx:1-390` (cytoscape element derivation, collision/Barnes-Hut), plus supporting label/type helpers in `packages/knowledge-graph-ui/src/labels.ts` and `types.ts`.

## Existing Issues / PRs

- No open issues/PRs reviewed for this task; surface any blockers encountered during implementation.

## Requirements

- Preserve current database schema compatibility; migrations must remain idempotent and safe on existing `knowledge-graph.db` files.
- Introduce an ECS-backed state layer (built on `packages/ds/src/ecs.ts`) that can mirror nodes/edges and emit change ticks to the UI without breaking CLI/HTTP exporters.
- Keep build pipeline fast: avoid extra full-graph rewrites when only incremental changes occur; prefer per-entity/component updates.
- Ensure frontend can subscribe to ECS change sets to animate/layout only touched nodes/edges while retaining saved positions.
- Maintain tracing/logging parity with existing `Logger` usage; do not regress error handling on file/path resolution.
- Add tests to validate migrations, ECS state projections, and UI serialization where feasible (CLI/HTTP may be stubbed with fakes).

## Definition of Done

- Design and land an ECS state module that ingests `GraphRepository` outputs into `World`/`WorldWrapper`, exposing queries for UI and export paths.
- Database migration flow remains automatic via `db:migrate`; add coverage that migrations run once and preserve data.
- Frontend update path can process ECS change ticks (changed mask/rows) to refresh only affected cytoscape elements; document usage in UI README/specs.
- New/updated tests cover ECS graph projection and migration safety (e.g., vitest units around state diffs and migration idempotence).
- Specs updated here remain linked from other docs if cross-referenced.

## Proposed Phases

1. **State Layer Design**: sketch ECS component types for nodes, edges, metadata (ids, type, payloads, layout), and map repository rows into ECS entities; define queries for UI filters and change detection.
2. **Persistence Integration**: add an adapter that streams repository changes into ECS world during `KnowledgeGraphBuilder` runs; ensure migrations still run once (`Database.migrate()`), with tests.
3. **Frontend Wiring**: expose ECS-backed graph serialization endpoint or file for the SPA; update UI to consume ECS queries (e.g., `changed` masks) to patch cytoscape elements incrementally.
4. **Validation**: add vitest coverage for ECS diffing and migration idempotence; run package-scoped build/test/lint as appropriate.

## Notes / Risks

- ECS double-buffer semantics (prev/next) require explicit `beginTick`/`endTick`; ensure builder and UI adapt to tick lifecycle to avoid stale reads.
- Large graphs may need batching; consider `batchInsert` in `Database` and ECS `addComponent` path performance.
- Keep deprecated ECS wrappers untouched; prefer functional APIs if extending `ecs.ts`.
