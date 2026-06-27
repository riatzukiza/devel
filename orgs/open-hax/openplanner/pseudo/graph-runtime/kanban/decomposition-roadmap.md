---
uuid: "orgs-open-hax-openplanner-pseudo-graph-runtime-kanban-orgs-open-hax-openplanner-pseudo-graph-runtime-specs-decomposition-roadmap-md"
title: "Decomposition Roadmap Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:41.143Z"
source: "orgs/open-hax/openplanner/pseudo/graph-runtime/specs/decomposition-roadmap.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/pseudo/graph-runtime/specs/decomposition-roadmap.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/pseudo/graph-runtime/kanban/decomposition-roadmap.md`

# Decomposition Roadmap Spec

## Goal

Decompose the graph-native substrate from the original `fork_tales` experiment into individually comprehensible services without losing the core coupling of semantics, resources, and topology.

## North star

> What wants to exist separately, must be cut free — but not cut stupidly.

The substrate should decompose into **clear contracts**, not into amnesiac fragments.

## Proposed service boundaries

### 1. TruthGraph Ledger
**Responsibility**
- immutable raw objects
- provenance edges
- append-only event history
- snapshot manifests

**Potential outputs**
- `truth.node`
- `truth.edge`
- `truth.event`
- `truth.snapshot`

### 2. ViewGraph Compiler
**Responsibility**
- coarsen TruthGraph into operational ViewGraph
- maintain bundle membership + reconstruction metadata
- expose sampled / compressed graph for UI and runtime loops

**Potential outputs**
- `view.snapshot`
- `view.bundle`
- `view.expand`

### 3. Presence Runtime
**Responsibility**
- load presence manifests
- maintain current needs, masks, priorities, and masses
- execute policy hooks or advisory loops

**Potential outputs**
- `presence.state`
- `presence.need`
- `presence.priority`
- `presence.violation`

### 4. Daimoi Engine
**Responsibility**
- emit, move, collide, absorb, or deflect daimoi
- maintain owner / wallet / intent semantics
- expose observer-facing telemetry

**Potential outputs**
- `daimoi.emit`
- `daimoi.move`
- `daimoi.collide`
- `daimoi.absorb`
- `daimoi.band_change`

### 5. Reservoir Economy
**Responsibility**
- track local resource reservoirs
- compute pressure, scarcity, and local price
- publish congestion-aware edge costs

**Potential outputs**
- `reservoir.update`
- `pressure.update`
- `price.update`

### 6. Lith / Nexus API Layer
**Responsibility**
- query surface over the canonical graph
- graph resource creation
- neighborhood traversal
- human/tool-facing graph APIs

**Potential outputs**
- `nexus.snapshot`
- `nexus.query`
- `nexus.resource`

## Dependency graph

```text
TruthGraph Ledger
    ↓
ViewGraph Compiler ──────┐
    ↓                    │
Presence Runtime         │
Daimoi Engine            │
Reservoir Economy        │
    ↓                    │
Lith / Nexus API Layer ◄─┘
```

## Extraction principles

1. **Do not copy giant coupled files wholesale.**
2. **Keep source maps and provenance explicit.**
3. **Separate runtime state from narrative dressing.**
4. **Preserve event visibility.**
5. **Avoid turning the system into generic CRUD plus pretty graph paint.**

## Acceptance criteria for a successful decomposition

- each service can name its inputs and outputs in one page
- each service has a bounded storage contract
- the old `fork_tales` source anchors are recorded
- a human can explain how a daimoi, a presence, and a nexus state change relate
- the explanation path is shorter than reopening a 300KB Part64 file

## Immediate next cuts

### Cut A — document first
Done in part by this repo:
- substrate formalism
- source map
- runtime surfaces
- provenance trail

### Cut B — extract daimoi fully
Downstream home:
- `octave-commons/daimoi`

### Cut C — extract presence/simulacron framing
Downstream home:
- `octave-commons/simulacron`

### Cut D — reconnect graph traversal / ingestion layer
Downstream homes:
- `octave-commons/graph-weaver`
- `octave-commons/graph-weaver-aco`
- `octave-commons/myrmex`

## Open questions

- How much of the economy model should remain continuous vs graph-discrete?
- Should ViewGraph compilation happen continuously or in bounded rebuild passes?
- Are presences purely advisory, or can some become execution-authorized under explicit contracts?
- Which runtime traces are cheap enough to retain permanently, and which should be summarized?

## Status

This is a design roadmap, not an implementation claim. Its purpose is to keep future cuts crisp and honest.
