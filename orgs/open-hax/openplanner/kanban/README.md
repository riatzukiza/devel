---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-readme-md"
title: "OpenPlanner Specs"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.618Z"
source: "orgs/open-hax/openplanner/specs/README.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/README.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/README.md`

# OpenPlanner Specs

Canonical spec registry for the OpenPlanner monorepo.

## Spec inventory by package

### Top-level specs (cross-cutting)

| Spec | Status | Scope | Roadmap |
|------|--------|-------|---------|
| `2026-03-27-dual-tier-semantic-memory.md` | active | storage | P1B (graph-memory) |
| `2026-04-05-mongodb-only-reversible-migration.md` | landed | storage | P0 |
| `2026-04-07-graph-stack-monorepo-cutover-pr-stack.md` | active | architecture | P0 |
| `2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md` | active | vector-search | P6 |
| `2026-04-09-atlas-local-deployment-for-production-vector-search.md` | draft | vector-search | P6 |
| `openplanner-graph-events.md` | active | events | P2 |
| `openplanner-web-edge-salience-and-backbone-projections.md` | active | graph | P7 |
| `semantic-gravity-and-daimoi-query-runtime.md` | draft | graph-runtime | P7 |

### packages/knoxx/specs (68 specs)

**Meta/roadmap docs:**
- `knowledge-ops-full-roadmap.md` - Master roadmap
- `knowledge-ops-roadmap-status.md` - Status matrix
- `knowledge-ops-graph-memory-roadmap.md` - Graph-memory tranche
- `knowledge-ops-consistency-review.md` - Naming/era normalization

**P1A - Tenant foundation:**
- `knowledge-ops-multi-tenant-control-plane.md` (next)
- `knowledge-ops-mvp-phase1-epics.md` (next)

**P1B - Graph-memory coherence:**
- `knowledge-ops-graph-memory-reconciliation.md` (epic)
- `knowledge-ops-kms-openplanner-ingest-arity-fix.md` (next)
- `knowledge-ops-knoxx-health-route-coherence.md` (next)
- `knowledge-ops-myrmex-openplanner-write-recovery.md` (next)
- `knowledge-ops-openplanner-graph-population-smoke.md` (next)
- `knowledge-ops-graph-weaver-live-sync-truth.md` (next)
- `knowledge-ops-graph-memory-runtime-smoke-e2e.md` (next)
- `knowledge-ops-knoxx-graph-query-contract-v1.md` (next)
- `knowledge-ops-docs-source-of-truth-normalization.md` (next)
- `knoxx-session-lake-graph-and-memory.md`

**P1C - Translation review (client priority):**
- `knowledge-ops-translation-review-epic.md` (epic)
- `knowledge-ops-translation-routes.md` (next)
- `knowledge-ops-translation-export.md` (next)
- `knowledge-ops-translation-review-ui.md` (next)
- `knowledge-ops-translation-mt-pipeline.md` (next)

**P2 - Retrieval/lake:**
- `knowledge-ops-role-scoped-lakes.md` (partial)
- `knowledge-ops-federated-lakes.md` (partial)
- `knowledge-ops-source-lakes-cross-lake-graph.md` (partial)
- `knowledge-ops-ingestion-pipeline.md` (partial)
- `knowledge-ops-ingestion-throttling.md` (backlog)

**P3 - CMS/review:**
- `knowledge-ops-cms-data-model.md` (partial)
- `knowledge-ops-chat-widget-layers.md` (partial)
- `knowledge-ops-shibboleth-lite-labeling.md` (backlog)

**P4 - PII/audit:**
- `knowledge-ops-pii-handling-protocol.md` (backlog)
- `knowledge-ops-exposure-monitor.md` (exploratory)

**P5 - Workbench/UI:**
- `knowledge-ops-workbench-ui.md` (partial)
- `knowledge-ops-ui-design-system.md` (partial)
- `knowledge-ops-gardens.md` (partial)
- `knowledge-ops-chat-ui-library.md` (backlog)
- `knowledge-ops-demo-seed.md` (backlog)

**P6 - Deployment/provider:**
- `knowledge-ops-provider-abstraction.md` (exploratory)
- `knowledge-ops-multi-provider-epic.md` (exploratory)
- `knowledge-ops-deploy-self-hosted.md` (exploratory)
- `knowledge-ops-deploy-aws.md` (exploratory)
- `knowledge-ops-deploy-azure.md` (exploratory)
- `knowledge-ops-mongodb-vector-unification.md` (exploratory)
- `knowledge-ops-product-line.md` (exploratory)

**P7 - Advanced graph:**
- `knowledge-ops-openplanner-derived-edge-projections-slice.md` (later)
- `knowledge-ops-adaptive-expand-policy-hook.md` (later epic)
- `knowledge-ops-adaptive-expand-policy-seam.md` (later)
- `knowledge-ops-adaptive-expand-policy-telemetry.md` (later)
- `knowledge-ops-adaptive-web-frontier-and-multiscale-backbone.md` (exploratory)

**R - Legacy/reference:**
- `knowledge-ops-legacy-ui-inventory.md`
- `knowledge-ops-deployment.md`
- `knowledge-ops-deploy-local.md`
- `knowledge-ops-integration.md`
- `knowledge-ops-platform-stack-architecture.md`
- `knowledge-ops-the-lake.md`
- `knowledge-ops-promethean-stack.md`
- `knowledge-ops-gap-analysis-prior-art.md`
- `knowledge-ops-architecture-migration.md` (partial)

**Landed/completed:**
- `knowledge-ops-clojure-backend-migration.md` (landed)
- `knowledge-ops-kms-query.md` (landed)

### packages/graph-weaver/specs (3 specs)

| Spec | Status | Scope | Roadmap |
|------|--------|-------|---------|
| `graph-layers-and-storage.md` | active | architecture | P1B |
| `query-preview-and-mutation.md` | active | API | P2 |
| `service-surface.md` | active | API | P2 |

### packages/graph-weaver-aco/specs (6 specs)

| Spec | Status | Scope | Roadmap |
|------|--------|-------|---------|
| `core-engine-contract.md` | active | ACO engine | P7 |
| `ethical-crawling-contract.md` | active | crawling | P2 |
| `fetch-backend-contract.md` | active | fetching | P2 |
| `frontier-and-pheromone-model.md` | active | ACO model | P7 |
| `myrmex-orchestrator.md` | active | orchestration | P2 |
| `pluggable-fetch-backend.md` | active | extensibility | P2 |

### packages/myrmex/specs (2 specs)

| Spec | Status | Scope | Roadmap |
|------|--------|-------|---------|
| `decomposition-roadmap.md` | active | crawling | P2 |
| `runtime-surfaces.md` | active | API | P2 |

### packages/graph-runtime/specs (5 specs)

| Spec | Status | Scope | Roadmap |
|------|--------|-------|---------|
| `adaptive-frontier-salience-and-template-aware-pruning.md` | active | traversal | P7 |
| `checkpoint-and-recovery.md` | active | reliability | P2 |
| `deployment-lattice.md` | active | deployment | P6 |
| `event-and-storage-flow.md` | active | storage | P2 |
| `orchestrator-contract.md` | active | orchestration | P2 |

### packages/cephalon/specs (many extracted notes)

Cephalon specs are primarily notes-extracted artifacts from session history. They represent:
- Hybrid TS/CLJS architecture explorations
- Brain daemon concepts
- ECS key systems
- Storage schema evolution

These are **not** on the current Knoxx product roadmap. They represent research/precursor work for future agent-runtime capabilities.

## Specs NOT in any roadmap

The following specs exist but are not referenced in any active roadmap:

1. **packages/cephalon/specs/** - All cephalon specs are orphaned from active roadmaps
2. **packages/graph-runtime/specs/** - Not integrated into knowledge-ops-full-roadmap
3. **packages/myrmex/specs/** - Partially integrated via P1B recovery specs

## Package-level roadmaps

| Package | Roadmap doc | Parent roadmap |
|---------|-------------|----------------|
| knoxx | `knowledge-ops-full-roadmap.md` | self-contained |
| knoxx | `knowledge-ops-graph-memory-roadmap.md` | P1B sub-roadmap |
| graph-weaver | none | should align with P1B/P2 |
| graph-weaver-aco | none | should align with P2/P7 |
| myrmex | `decomposition-roadmap.md` | orphaned |
| graph-runtime | none | orphaned |
| cephalon | none | research corpus |

## Recommendations

1. **Integrate graph-runtime/myrmex specs into knowledge-ops-full-roadmap**
   - graph-runtime orchestrator should be P2
   - myrmex decomposition should be P2

2. **Create graph-weaver roadmap**
   - Currently has specs but no execution ordering
   - Should reference P1B/P2 milestones

3. **Archive cephalon specs**
   - Move to `packages/cephalon/specs/archive/`
   - Mark as research corpus, not active product work

4. **Align vector search specs**
   - `2026-04-07-semantic-graph-builder...` is P6
   - `2026-04-09-atlas-local-deployment...` is P6
   - Both depend on P1B (graph-memory coherence) completing first
