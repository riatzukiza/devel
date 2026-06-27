# Daimoi Extraction Roadmap Spec

## Goal

Turn the daimoi concept from a dense `fork_tales` subsystem into a standalone implementation without losing the semantics that make it interesting.

## Upstream source classes

### Class A — runtime code
- `daimoi_probabilistic.py`
- `daimoi_quadtree.py`
- `daimoi_collision_semantics.py`
- constants/profile definitions

### Class B — design notes
- hybrid field/graph formalism
- field and collision clarifications
- sigil / visual language notes

### Class C — later decomposition notes
- `specs/daimoi-core-spec.md`
- session artifacts mentioning daimoi walkers and nexus indexing

## Proposed extraction phases

### Phase 1 — semantics freeze
Produce stable docs for:
- field model
- ownership rules
- collision taxonomy
- observer metrics

### Phase 2 — type system
Define a minimal standalone TypeScript or Clojure model for:
- Daimon
- FieldCell / SparseField
- CollisionEvent
- ObserverSnapshot
- DaimonProfile

### Phase 3 — deterministic engine
Implement:
- bounded step loop
- sparse neighbor query
- force accumulation
- collision resolution
- event emission

### Phase 4 — observability
Implement:
- SNR computation
- band changes
- metrics export
- replayable event log

### Phase 5 — integration
Bind daimoi to:
- presence systems
- graph-runtime substrate
- visual/UI layers
- retrieval walkers where appropriate

## Non-goals for the first extraction
- full Part64 parity
- recreating every visual treatment from Fork Tales UI
- baking narrative metaphors into core engine code

## Done conditions

A first serious extraction is done when:
- a standalone engine can emit, step, collide, and observe daimoi
- ownership and intent units are explicit in types/events
- SNR bands can be computed on a live population
- docs and code agree on the core invariants

## Warning

If the extraction keeps only motion math and discards ownership, intent wallets, and observer governance, it will preserve the costume and lose the organism.
