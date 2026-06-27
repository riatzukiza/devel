---
uuid: "orgs-open-hax-openplanner-pseudo-graph-runtime-kanban-orgs-open-hax-openplanner-pseudo-graph-runtime-specs-runtime-surfaces-md"
title: "Runtime Surfaces Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:41.144Z"
source: "orgs/open-hax/openplanner/pseudo/graph-runtime/specs/runtime-surfaces.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/pseudo/graph-runtime/specs/runtime-surfaces.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/pseudo/graph-runtime/kanban/runtime-surfaces.md`

# Runtime Surfaces Spec

## Purpose

Bridge the gap between the abstract `SPEC.md` runtime model and the concrete surfaces that existed inside `fork_tales`.

This document answers:

> If `graph-runtime` was real inside the old experiment, where did it leak through the walls?

## Source anchors

- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-hybrid-field-graph-formalism.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-design-hole-responses-field-and-collisions.md`
- `orgs/octave-commons/fork_tales/part64/code/world_web/server.py`
- `orgs/octave-commons/fork_tales/part64/docker-compose.yml`
- `orgs/octave-commons/fork_tales/mcp-lith-nexus/`
- `session-ses_3208.md` in the devel workspace

## Surface 1 — Catalog and Lith Nexus

### Abstract model
- TruthGraph / ViewGraph
- Nexus nodes and edges
- explainable graph state

### Concrete Fork Tales surfaces
- `part64` exposed catalog payloads that included a `nexus_graph`
- `mcp-lith-nexus` explicitly re-used the Python-side snapshot instead of inventing a parallel index
- `session-ses_3208.md` records a live restored catalog with concrete node/file-node counts after hardening `lith_nexus_index.py`

### Contract
Any future `graph-runtime` implementation should expose at least:
- a **canonical graph snapshot**
- a **queryable node/edge surface**
- a **provenance-preserving path** back to raw sources

## Surface 2 — Simulation Parameters

### Abstract model
- daimoi motion
- nexus friction / drag
- pressure and saturation

### Concrete Fork Tales surfaces
`part64/docker-compose.yml` already surfaced runtime knobs such as:
- `SIMULATION_WS_STREAM_DAIMOI_FRICTION`
- `SIMULATION_WS_STREAM_DAIMOI_ORBIT_DAMPING`
- `SIMULATION_WS_STREAM_NEXUS_FRICTION`
- `SIMULATION_WS_STREAM_NEXUS_MAX_SPEED_SCALE`
- `SIMULATION_WS_STREAM_NEXUS_STATIC_FRICTION`
- `SIMULATION_WS_STREAM_NEXUS_QUADRATIC_DRAG`

### Contract
A rebuilt runtime should keep its tunable physics legible as:
- named parameters
- bounded ranges
- environment or config surface
- event-visible changes when parameters shift

## Surface 3 — Presence Layer

### Abstract model
- presences as policy-bearing influences with needs, masks, and mass

### Concrete Fork Tales surfaces
- `.opencode/agent/presence.*.md` defines multiple specialized presences
- the presence docs encode role, mission, non-goals, constraints, and deliverables
- these are effectively runtime actors even when presented as agent files

### Contract
A future runtime should treat presence definitions as first-class resources with:
- declared role
- allowed interfaces
- hard constraints
- event-visible decisions

## Surface 4 — Event Explainability

### Abstract model
- field dynamics should be attributable to presences and ledgered events

### Concrete Fork Tales surfaces
- `mcp-lith-nexus` and the catalog machinery already moved toward first-class fact graph exposure
- session artifacts repeatedly emphasize explicit event emission, counts, and replayable surfaces

### Contract
No hidden state transitions:
- important runtime changes should emit events
- graph deltas should be inspectable
- explanations should be possible post hoc

## Surface 5 — Resource Topology

### Abstract model
- resources are graph-local, pressure-bearing reservoirs
- price and scarcity are topological, not global-only

### Concrete Fork Tales surfaces
The exact economy was not fully separated, but the runtime already encoded:
- CPU/GPU/NPU-oriented simulation parameters
- resource-specific tuning surfaces
- host/runtime topology through compose and service layout

### Contract
A real implementation should eventually expose:
- per-resource local pressure
- reservoir capacities
- saturation-aware routing costs
- resource-specific traces for decisions

## Minimal service surface for a rebuilt runtime

A `graph-runtime` service family should eventually provide:

1. `runtime.snapshot` — full or sampled viewgraph snapshot
2. `runtime.node.get` — node with local neighborhood and pressure/resource state
3. `runtime.presence.list` / `runtime.presence.get`
4. `runtime.daimoi.stream` — stream of daimoi movement/collision events
5. `runtime.params.get` / `runtime.params.set` with audit trail
6. `runtime.explain` — ranked contributing events / presences for a chosen state change

## Why this matters

The original experiment was powerful precisely because the graph was not just storage and not just UI. It was trying to be:
- memory substrate
- routing substrate
- resource substrate
- explanation substrate

This spec preserves that four-way coupling so later extraction work does not flatten it into a generic graph database with a particle gimmick on top.
