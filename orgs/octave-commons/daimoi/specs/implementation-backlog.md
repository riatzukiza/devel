# Implementation Backlog

## Goal

Turn the dossier into a runnable extraction without skipping the conceptual invariants.

## Phase 0 — keep the doctrine honest
- [ ] finish the doc dossier
- [ ] add more annotated upstream excerpts
- [ ] add one glossary / terminology page if needed

## Phase 1 — minimal standalone types
- [ ] `Daimon`
- [ ] `DaimonProfile`
- [ ] `SparseField`
- [ ] `CollisionEvent`
- [ ] `ObserverSnapshot`

## Phase 2 — deterministic stepping
- [ ] field sampling
- [ ] damping + timestep integration
- [ ] bounded neighbor queries via quadtree
- [ ] collision dispatch

## Phase 3 — governance
- [ ] SNR computation
- [ ] band assignment
- [ ] redistribution advisory hooks

## Phase 4 — eventing
- [ ] append-only event log
- [ ] replay / snapshot model
- [ ] observer and collision event schemas

## Phase 5 — integration
- [ ] hook into `graph-runtime`
- [ ] define `simulacron` cast interactions with daimoi
- [ ] add visual/debug views that preserve the visual grammar
- [ ] evaluate whether retrieval walkers belong in this repo or an adjacent package

## Sharp warning

A tempting but bad extraction path is:
- copy force math
- add random particles to canvas
- call it done

That would lose:
- typed profiles
- ownership semantics
- observer governance
- packet/intention framing
- the actual reason this concept survived the decomposition
