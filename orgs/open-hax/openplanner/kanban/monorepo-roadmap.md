---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-monorepo-roadmap-md"
title: "OpenPlanner Monorepo Roadmap"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.619Z"
source: "orgs/open-hax/openplanner/specs/monorepo-roadmap.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/monorepo-roadmap.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/monorepo-roadmap.md`

# OpenPlanner Monorepo Roadmap

Date: 2026-04-09
Status: active

## Purpose

Master roadmap for the OpenPlanner monorepo, integrating:
- Knoxx knowledge-ops corpus
- Graph-weaver surface layers
- Semantic graph builder
- Production vector search path
- Myrmex crawling orchestration
- Graph-runtime components

## Roadmap rules

1. Fibonacci points only for executable specs
2. No executable spec > 5 points
3. Runtime coherence before traversal cleverness
4. OpenPlanner is canonical graph truth
5. Production vector search requires Atlas local/cloud

## Program shape

```
P0  → P1A  → P1B  → P1C  → P2  → P3  → P4  → P5  → P6  → P7
     ↓       ↓              ↓
     tenant  graph-memory   retrieval
     found.  coherence      lake
```

## Milestones

| Phase | Name | Points | Exit signal |
|-------|------|--------|-------------|
| P0 | Landed baseline | ongoing | Current Knoxx runtime stays healthy while new work lands |
| P1A | Tenant foundation | 21 | Request-scoped identity, fail-closed enforcement, policy-backed tools |
| P1B | Graph-memory coherence | 35 | Canonical graph path is coherent end-to-end |
| P1C | Translation review | 15 | Client demo ready: routes + export + UI |
| P2 | Retrieval/lake convergence | 20 | Scoped retrieval and lake model match runtime truth |
| P3 | CMS/review/public boundary | 15 | Content lifecycle and review boundary are product-real |
| P4 | PII/audit/exposure | 10 | Sensitive-content handling is enforceable and auditable |
| P5 | Workbench/productization | 15 | UI reflects actual scope, review, and graph semantics |
| P6 | Deployment/provider portability | 20 | Atlas local/cloud deployment, provider abstraction |
| P7 | Advanced graph intelligence | 15 | Derived views, adaptive expansion, ACO traversal |

## P0 — Landed baseline / keep green

**Goal:** Maintain current Knoxx runtime health while new work lands.

**Active specs:**
- `knowledge-ops-clojure-backend-migration.md` (landed)
- `knowledge-ops-kms-query.md` (landed)
- `knowledge-ops-architecture-migration.md` (partial)

**Exit criteria:**
- Backend health route is stable
- Ingestion paths are writing
- OpenPlanner graph endpoints show real data

## P1A — Tenant foundation and runtime enforcement

**Goal:** Every protected request resolves org/user/membership context and fails closed.

**Active specs:**
- `knowledge-ops-multi-tenant-control-plane.md` (next epic)
- `knowledge-ops-mvp-phase1-epics.md` (next epic)

**Stories (21 points):**
1. Request-context resolution helpers (3)
2. Policy DB membership/policy lookup (5)
3. Runtime tool authorization from policy DB (5)
4. Scope memory/runs/documents by org (5)
5. Negative e2e tests for denial paths (3)

**Exit criteria:**
- All protected routes fail closed without context
- Tool execution is policy-backed
- Cross-org denial is tested

## P1B — Graph-memory runtime coherence

**Goal:** Canonical graph path is coherent end-to-end.

**Active specs:**
- `knowledge-ops-graph-memory-reconciliation.md` (epic)
- `knowledge-ops-graph-memory-roadmap.md` (roadmap)
- 10 child specs (see roadmap)

**Stories (35 points):**
- M0: Runtime unblockers (8 points)
  - `knowledge-ops-kms-openplanner-ingest-arity-fix.md` (2)
  - `knowledge-ops-knoxx-health-route-coherence.md` (3)
  - `knowledge-ops-myrmex-openplanner-write-recovery.md` (3)
- M1: Canonical graph proof (5)
  - `knowledge-ops-openplanner-graph-population-smoke.md` (5)
- M2: Workbench truth (5)
  - `knowledge-ops-graph-weaver-live-sync-truth.md` (5)
- M3: End-to-end guardrail (3)
  - `knowledge-ops-graph-memory-runtime-smoke-e2e.md` (3)
- M4: Contract freeze and docs (5)
  - `knowledge-ops-knoxx-graph-query-contract-v1.md` (3)
  - `knowledge-ops-docs-source-of-truth-normalization.md` (2)
- M5: Derived graph views (5)
  - `knowledge-ops-openplanner-derived-edge-projections-slice.md` (5)
- M6: Adaptive seam (2)
  - `knowledge-ops-adaptive-expand-policy-seam.md` (2)
- M7: Adaptive telemetry (2)
  - `knowledge-ops-adaptive-expand-policy-telemetry.md` (2)

**Exit criteria:**
- Producers can write into canonical graph
- OpenPlanner graph endpoints are populated and queryable
- Graph-Weaver reflects canonical truth or signals degraded fallback
- Knoxx graph contract is frozen against real behavior

**Package integration:**
- `packages/graph-weaver/specs/graph-layers-and-storage.md` - align with M2
- `packages/graph-runtime/specs/orchestrator-contract.md` - align with M0/M3

## P1C — Translation review (client priority)

**Goal:** Client demo ready with translation CRUD + export + UI.

**Active specs:**
- `knowledge-ops-translation-review-epic.md` (epic)

**Stories (15 points):**
1. Translation routes (5)
2. Translation export (2)
3. Translation review UI (5)
4. MT pipeline (3, deferrable)

**Dependencies:**
- MongoDB migration complete
- Translation routes require MongoDB

**Exit criteria:**
- Routes + Export + UI demo-ready
- ~12 points → 5 focused days

## P2 — Retrieval, lake, and ingestion convergence

**Goal:** Scoped retrieval and lake model match runtime truth.

**Active specs:**
- `knowledge-ops-role-scoped-lakes.md` (partial)
- `knowledge-ops-federated-lakes.md` (partial)
- `knowledge-ops-source-lakes-cross-lake-graph.md` (partial)
- `knowledge-ops-ingestion-pipeline.md` (partial)
- `knowledge-ops-ingestion-throttling.md` (backlog)

**Package integration:**
- `packages/myrmex/specs/decomposition-roadmap.md`
- `packages/myrmex/specs/runtime-surfaces.md`
- `packages/graph-weaver-aco/specs/myrmex-orchestrator.md`

**Stories (20 points):**
1. Role/lake scope enforcement (5)
2. Multi-lake query federation (5)
3. Cross-lake graph edges (5)
4. Ingestion throttling (5)

**Exit criteria:**
- Lake scope is a runtime boundary, not conceptual preset
- Federation queries respect lake boundaries
- Ingestion backpressure is observable

## P3 — CMS, review, and public/internal boundary

**Goal:** Content lifecycle and review boundary are product-real.

**Active specs:**
- `knowledge-ops-cms-data-model.md` (partial)
- `knowledge-ops-chat-widget-layers.md` (partial)
- `knowledge-ops-shibboleth-lite-labeling.md` (backlog)

**Stories (15 points):**
1. CMS lifecycle states (5)
2. Public/internal boundary (5)
3. Review handoff surfaces (5)

**Exit criteria:**
- Document lifecycle is product-surface, not loose routes
- Review workflow is central in Knoxx

## P4 — PII, audit, and exposure controls

**Goal:** Sensitive-content handling is enforceable and auditable.

**Active specs:**
- `knowledge-ops-pii-handling-protocol.md` (backlog)
- `knowledge-ops-exposure-monitor.md` (exploratory)

**Stories (10 points):**
1. PII classification pipeline (5)
2. Exposure monitoring surface (5)

**Exit criteria:**
- PII promises are enforceable
- Audit trail exists for sensitive content

## P5 — Workbench UX and productization

**Goal:** UI reflects actual scope, review, and graph semantics.

**Active specs:**
- `knowledge-ops-workbench-ui.md` (partial)
- `knowledge-ops-ui-design-system.md` (partial)
- `knowledge-ops-gardens.md` (partial)
- `knowledge-ops-chat-ui-library.md` (backlog)
- `knowledge-ops-demo-seed.md` (backlog)

**Stories (15 points):**
1. Context Bar shows resolved scope (5)
2. Garden views as first-class nav (5)
3. Chat UI library extraction (5)

**Exit criteria:**
- Workbench matches enforcement boundaries
- Operator surfaces are coherent

## P6 — Deployment, provider portability, and production vector search

**Goal:** Atlas local/cloud deployment for production; provider abstraction.

**Active specs:**
- `knowledge-ops-provider-abstraction.md` (exploratory)
- `knowledge-ops-multi-provider-epic.md` (exploratory)
- `knowledge-ops-deploy-self-hosted.md` (exploratory)
- `knowledge-ops-deploy-aws.md` (exploratory)
- `knowledge-ops-deploy-azure.md` (exploratory)
- `knowledge-ops-mongodb-vector-unification.md` (exploratory)
- `knowledge-ops-product-line.md` (exploratory)
- `2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md` (active)
- `2026-04-09-atlas-local-deployment-for-production-vector-search.md` (draft)

**Package integration:**
- `packages/graph-runtime/specs/deployment-lattice.md`

**Stories (20 points):**
1. Document vector search limitation (1)
2. AtlasCLI local deployment profile (3)
3. Vector search index bootstrap (2)
4. Production deployment runbook (2)
5. CI smoke test for Atlas local (2)
6. Semantic graph builder package (5)
7. HNSW index integration (5)

**Exit criteria:**
- Production can use native `$vectorSearch` without GPU/NPU
- Index management commands work
- Semantic graph builder is operational

## P7 — Advanced graph intelligence

**Goal:** Derived views, adaptive expansion, ACO traversal.

**Active specs:**
- `knowledge-ops-openplanner-derived-edge-projections-slice.md` (later)
- `knowledge-ops-adaptive-expand-policy-hook.md` (later epic)
- `knowledge-ops-adaptive-expand-policy-seam.md` (later)
- `knowledge-ops-adaptive-expand-policy-telemetry.md` (later)
- `knowledge-ops-adaptive-web-frontier-and-multiscale-backbone.md` (exploratory)

**Package integration:**
- `packages/graph-weaver-aco/specs/core-engine-contract.md`
- `packages/graph-weaver-aco/specs/frontier-and-pheromone-model.md`
- `packages/graph-runtime/specs/adaptive-frontier-salience-and-template-aware-pruning.md`

**Stories (15 points):**
1. Derived edge projections (5)
2. Adaptive policy hook (5)
3. ACO traversal engine (5)

**Exit criteria:**
- Graph intelligence is compounding improvement, not foundation patch

## Cross-cutting work

### Events and web edges

**Specs:**
- `openplanner-graph-events.md`
- `openplanner-web-edge-salience-and-backbone-projections.md`

**Integration:** Align with P2 retrieval/lake work

### Graph-weaver surface

**Specs:**
- `packages/graph-weaver/specs/graph-layers-and-storage.md`
- `packages/graph-weaver/specs/query-preview-and-mutation.md`
- `packages/graph-weaver/specs/service-surface.md`

**Integration:** Align with P1B graph-memory coherence

### Graph-weaver-aco crawling

**Specs:**
- `packages/graph-weaver-aco/specs/myrmex-orchestrator.md`
- `packages/graph-weaver-aco/specs/ethical-crawling-contract.md`
- `packages/graph-weaver-aco/specs/fetch-backend-contract.md`
- `packages/graph-weaver-aco/specs/pluggable-fetch-backend.md`

**Integration:** Align with P2 ingestion/retrieval

### Graph-runtime

**Specs:**
- `packages/graph-runtime/specs/orchestrator-contract.md`
- `packages/graph-runtime/specs/checkpoint-and-recovery.md`
- `packages/graph-runtime/specs/event-and-storage-flow.md`

**Integration:** Align with P1B runtime coherence, P2 ingestion

## Definition of done for current era

Treat the current OpenPlanner era as having crossed the main threshold when:

- P1A: Request-scoped tenancy and policy enforcement are real
- P1B: Graph-memory runtime coherence is real
- P1C: Translation review is demo-ready
- P2: Scoped retrieval and lake semantics are real
- P3: CMS/review/public boundaries are real
- P4: PII and audit guarantees are enforceable
- P6: Production vector search works without GPU/NPU

At that point, UI polish, portability, and graph intelligence become compounding improvements.

## What this roadmap says explicitly

1. Backend rewrite is no longer the main problem (P0 landed)
2. Next two real problems:
   - Tenant-aware enforcement (P1A)
   - Graph-memory coherence (P1B)
3. Retrieval/lake semantics only become product-real after P1A/P1B
4. CMS/public boundary and PII work depend on that foundation
5. Production vector search (P6) is critical for cloud deployment
6. Advanced graph intelligence (P7) is later than graph-memory coherence
