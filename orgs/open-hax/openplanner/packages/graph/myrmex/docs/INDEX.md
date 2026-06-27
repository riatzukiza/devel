# Myrmex Docs Index

This repo is the **foraging orchestrator** that binds a richer extraction backend to the ACO traversal brain.

## Reading order

1. `../README.md` — quick orientation
2. `FORK_TALES_SOURCE_MAP.md` — upstream origins and surrounding specs
3. `OPENCODE_SESSION_PROVENANCE.md` — recovery trail
4. `../specs/orchestrator-contract.md` — core class and lifecycle contract
5. `../specs/adaptive-frontier-salience-and-template-aware-pruning.md` — scoring, template memory, and adaptive frontier contract
6. `../specs/event-and-storage-flow.md` — how page events move into Proxx/OpenPlanner surfaces
7. `../specs/checkpoint-and-recovery.md` — checkpoint intent and current gap
8. `../specs/deployment-lattice.md` — compose/env/dependency shape
9. `SEED_CATALOG.md` — curated seed sets for Knoxx / Proxx websearch bootstrap

## Position in the family

- `graph-weaver-aco` = traversal brain
- `myrmex` = orchestrator / colony foreman
- `graph-weaver` = service/UI graph surface

## Core idea

Myrmex does not replace the ant colony.
It teaches the colony how to bite through harder pages and how to carry what it finds back into the lake.
