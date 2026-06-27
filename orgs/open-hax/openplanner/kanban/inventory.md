---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-inventory-md"
title: "OpenPlanner Spec Inventory"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.615Z"
source: "orgs/open-hax/openplanner/specs/inventory.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/inventory.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/inventory.md`

# OpenPlanner Spec Inventory

Date: 2026-04-09
Status: active

## Purpose

Consolidated inventory of all specs across the openplanner monorepo for roadmap planning and gap analysis.

## Spec Count Summary

| Category | Count | Has Roadmap |
| --------------- | -------- | ------------- |
| Top-level specs | 7 | No |
| Package specs (knoxx) | 55 | Yes (knowledge-ops-full-roadmap) |
| Package specs (other) | 18 | Partial/No |
| Orphaned specs | ~90 | 0 | No |

## Top-Level Specs

| Spec | Status | Priority | Notes |
|------|--------| -------- | ------- |
| `2026-03-27-dual-tier-semantic-memory.md` | active | P2 | Dual-tier memory architecture |
| `2026-04-05-mongodb-only-reversible-migration.md` | active | P0 | Migration documentation |
| `2026-04-07-graph-stack-monorepo-cutover-pr-stack.md` | active | P0 | PR stack for graph work |
| `2026-04-07-semantic-graph-builder-and-vexx-boundary-reduction.md` | active | P6 | Canonical semantic graph builder |
| `openplanner-graph-events.md` | active | P2 | Event schema |
| `openplanner-web-edge-salience-and-backbone-projections.md` | active | P2 | Web edge model |
| `2026-04-09-atlas-local-deployment-for-production-vector-search.md` | draft | P6 | Production vector search |

## Package Specs: knnoxx

See `packages/knoxx/specs/README.md` for full index.

### Status Summary

| Status | Count | Notes |
| -------- | ----- | ------- |
| landed | 4 | Core implementation complete |
| partial | 25 | Key pieces implemented, needs completion |
| next | 8 | Next priority items |
| backlog | 5 | Real but not immediate |
| exploratory | 13 | Future research |
| legacy-donor | 8 | Reference material only |

### Category Breakdown

| Category | Specs |
| --------------- | -------------------------------------------------- |
| Architecture | `knowledge-ops-architecture-migration.md` |
| Backend | `knowledge-ops-clojure-backend-migration.md` |
| Control Plane | `knowledge-ops-multi-tenant-control-plane.md`, `knowledge-ops-mvp-phase1-epics.md` |
| Graph Memory | `knowledge-ops-graph-memory-*.md` (6 specs) |
| Retrieval | `knowledge-ops-kms-query.md`, `knowledge-ops-role-scoped-lakes.md`, `knowledge-ops-federated-lakes.md`, `knowledge-ops-source-lakes-cross-lake-graph.md` |
| Ingestion | `knowledge-ops-ingestion-pipeline.md`, `knowledge-ops-ingestion-throttling.md` |
| Translation | `knowledge-ops-translation-*.md` (4 specs) |
| CMS | `knowledge-ops-cms-data-model.md`, `knowledge-ops-chat-widget-layers.md` |
| Compliance | `knowledge-ops-pii-handling-protocol.md`, `knowledge-ops-exposure-monitor.md` |
| Deployment | `knowledge-ops-deploy-*.md` (multiple) |
| Product | `knowledge-ops-product-line.md`, `knowledge-ops-knoxx-opinionated-distribution.md` |
| UI | `knowledge-ops-workbench-ui.md`, `knowledge-ops-ui-design-system.md`, `knowledge-ops-chat-ui-library.md`, `knowledge-ops-demo-seed.md`, `knowledge-ops-gardens.md` |
| Testing | `knowledge-ops-consistency-review.md` |

## Package Specs: graph-weaver

| Spec | Status | Roadmap |
|------|--------| --------- |
| `graph-layers-and-storage.md` | active | None (orphaned) |
| `query-preview-and-mutation.md` | active | None (orphaned) |
| `service-surface.md` | active | None (orphaned) |

## Package Specs: graph-weaver-aco

| Spec | Status | Roadmap |
|------| -------- | --------- |
| `core-engine-contract.md` | active | None (orphaned) |
| `ethical-crawling-contract.md` | active | None (orphaned) |
| `fetch-backend-contract.md` | active | None (orphaned) |
| `frontier-and-pheromone-model.md` | active | None (orphaned) |
| `myrmex-orchestrator.md` | active | None (orphaned) |
| `pluggable-fetch-backend.md` | active | None (orphaned) |

## Package Specs: myrmex

| Spec | Status | Roadmap |
|------| --------| --------- |
| `decomposition-roadmap.md` | active | None (orphaned) |
| `runtime-surfaces.md` | active | None (orphaned) |

## Package Specs: graph-runtime

| Spec | Status | Roadmap |
|------| -------- | --------- |
| `adaptive-frontier-salience-and-template-aware-pruning.md` | active | None (orphaned) |
| `checkpoint-and-recovery.md` | active | None (orphaned) |
| `deployment-lattice.md` | active | None (orphaned) |
| `event-and-storage-flow.md` | active | None (orphaned) |
| `orchestrator-contract.md` | active | None (orphaned) |

## Orphaned Specs (not in any roadmap)

All cephalon specs (many files) - research/precursor artifacts
All graph-runtime specs (5 files) - graph traversal work
All myrmex specs (2 file) - crawling decomposition

## Recommendations

1. **Integrate graph-runtime/myrmex specs into main roadmap** - Add to P2 as sub-components
2. **Create package roadmaps for graph-weaver and graph-weaver-aco** - Define execution order
3. **Archive cephalon specs** - Mark as research/precursor material

