# Technical Architecture (High Level)

This document was created with the assistance of an AI.

## Design requirements
- Deterministic simulation (as much as practical) for:
  - reproducible witness logs
  - debugging
  - “miracle verification” consistency

## Core subsystems
- World simulation (time-stepped)
- Agent system (needs, behavior, relationships)
- Economy/production
- Event system (incidents, councils, rifts)
- Miracle system (casts, costs, verification, fallout)
- Lore system (omens, texts, symbolic overlays)
- Save/load + replay (“witness logs”)

## Data model sketch (conceptual)
- `WorldState`:
  - time, phase, seed
  - regions: thinness/containment/attention
  - settlement: buildings/resources/policies
  - agents: needs/traits/relationships/beliefs
  - pantheon: gods/relationships/interdicts
  - chaos: butterflies/anomalies

## Observability (must-have)
- Event log with causal links
- Deterministic seed tracking per incident
- Replay chunking for performance

## Engine/platform notes
Not decided here; spec assumes the simulation and content pipelines are engine-agnostic.
