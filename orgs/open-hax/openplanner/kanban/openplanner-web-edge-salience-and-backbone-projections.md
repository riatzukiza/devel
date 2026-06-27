---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-openplanner-web-edge-salience-and-backbone-projections-md"
title: "OpenPlanner Web Edge Salience + Backbone Projections"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.619Z"
source: "orgs/open-hax/openplanner/specs/openplanner-web-edge-salience-and-backbone-projections.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/openplanner-web-edge-salience-and-backbone-projections.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/openplanner-web-edge-salience-and-backbone-projections.md`

# OpenPlanner Web Edge Salience + Backbone Projections

## Status
Draft

## Parent specs

- `orgs/open-hax/knoxx/specs/knowledge-ops-adaptive-web-frontier-and-multiscale-backbone.md`
- `orgs/octave-commons/myrmex/specs/adaptive-frontier-salience-and-template-aware-pruning.md`

## Purpose

Define how OpenPlanner should store raw web edge receipts while materializing derived projections for:

1. frontier scoring,
2. template memory,
3. page productivity,
4. backbone extraction,
5. query surfaces.

---

## Design rule

OpenPlanner is the canonical lake.
Derived pruning/scoring state must be **recomputable** and **non-destructive**.

Append-only raw receipts remain the evidence base.
Projection tables/materialized views provide stateful derived intelligence.

---

## Required raw entities

Raw append-only event stream remains authoritative for:

- `graph.node` web page observations
- `graph.edge` observed link relations
- fetch metadata
- extraction metadata
- discovery channel metadata

---

## Derived projection families

## 1. `web_edge_receipts_v1`

Normalized projection of raw observed edges.

Suggested columns:

- `source_node_id`
- `target_node_id`
- `source_url`
- `target_url`
- `source_host`
- `target_host`
- `discovery_channel`
- `anchor_text`
- `anchor_context`
- `dom_path`
- `block_signature`
- `block_role`
- `observed_at`
- `source_event_id`

## 2. `web_host_block_memory_v1`

Host-local template memory.

Suggested columns:

- `host`
- `block_signature`
- `pages_seen`
- `host_coverage`
- `dominant_target_hosts`
- `dominant_target_prefixes`
- `historical_yield`
- `role`
- `role_confidence`
- `updated_at`

## 3. `web_page_productivity_v1`

Adaptive page yield / importance state.

Suggested columns:

- `node_id`
- `url`
- `host`
- `visits`
- `new_targets_first_seen`
- `retained_targets`
- `recent_new_outlink_rate`
- `neighbor_new_outlink_rate`
- `opic_cash`
- `opic_history`
- `importance_score`
- `updated_at`

## 4. `web_edge_salience_v1`

Derived edge-scoring state.

Suggested columns:

- `source_node_id`
- `target_node_id`
- `content_block_score`
- `template_repeat_penalty`
- `source_productivity_score`
- `neighbor_productivity_score`
- `target_novelty_score`
- `target_class_bonus`
- `host_diversity_bonus`
- `action_penalty`
- `follow_score`
- `score_version`
- `updated_at`

## 5. `web_backbone_membership_v1`

Membership of aggregated edges in derived sparse views.

Suggested columns:

- `source_node_id`
- `target_node_id`
- `backbone_name`
- `keep`
- `keep_reason`
- `local_significance_p`
- `salience_rank_source`
- `salience_rank_target`
- `bridge_rescue`
- `updated_at`

---

## Required derived views

OpenPlanner should support at least these derived edge views:

- `raw`
- `discovery`
- `structural`
- `evidence`
- `bridge`

### `raw`
All observed edges.

### `discovery`
Edges optimized for expected new useful discovery.

### `structural`
Template-corrected site topology edges.

### `evidence`
Persistent / repeated / corroborated edges.

### `bridge`
Rare but strategic cross-host / cross-topic connectors.

---

## Query contract

OpenPlanner should expose view-aware graph queries.

Examples:

```http
GET /v1/graph/export?projects=web&edgeView=raw
GET /v1/graph/export?projects=web&edgeView=discovery
GET /v1/graph/export?projects=web&edgeView=bridge
```

Additional future surfaces:

```http
GET /v1/web/frontier/scores?host=github.blog
GET /v1/web/backbone/stats?backbone=discovery
GET /v1/web/block-memory?host=example.com
GET /v1/web/page-productivity?url=https://example.com/page
```

The graph workbench should be able to request both:

- raw graph truth
- a declared derived default view

without ambiguity.

---

## Aggregation rule

Projections should aggregate repeated observations over time rather than replacing them.

For `(source,target)` maintain at least:

- observation count
- last observed time
- distinct source pages / hosts / block signatures
- cumulative salience
- temporal persistence
- downstream productivity proxy

This aggregate is the input to backbone extraction.

---

## Backbone extraction contract

Projection workers should support local-significance edge filtering such as:

- disparity filter,
- noise-corrected backbone,
- hybrid significance + bridge rescue.

Bridge rescue should be explicit and queryable, not an invisible side effect.

---

## Failure semantics

If a derived projection is stale or unavailable, OpenPlanner must report it explicitly.

Examples:

- `webEdgeSalience.ok = false`
- `webBackboneProjection.ok = false`
- `reason = projection_lagging`
- `reason = score_version_mismatch`

No silent fallback from derived view to raw view without a surfaced flag.

---

## Phases

### Phase 1 — Projection tables

- add normalized edge receipt projection
- add page productivity projection
- add host block memory projection

### Phase 2 — Salience materialization

- compute `web_edge_salience_v1`
- persist score versioning and timestamps

### Phase 3 — Backbone materialization

- compute multi-backbone memberships
- expose edge-view selection in graph export/query

### Phase 4 — Explainability surfaces

- add endpoints for explaining why an edge is kept/hidden/scored
- surface projection health and lag

---

## Verification

1. Raw receipts remain queryable after backbone generation.
2. Derived views can be regenerated from raw receipts.
3. `edgeView=raw` and `edgeView=discovery` return meaningfully different edge sets.
4. Bridge edges can be explained as bridge rescues rather than hidden heuristics.
5. Projection health is explicit when stale or broken.

---

## Definition of done

This spec is complete when OpenPlanner can act as:

- the canonical raw evidence lake for web link observations,
- the materialization engine for edge salience and backbone views,
- the explainable query surface for both raw and derived web graph structure.
