# Retrieval Walkers Spec

## Purpose

Document the second life of daimoi in the later decomposition work: not only as simulation packets, but as **bounded graph-walk retrieval agents**.

## Source anchors

- `orgs/octave-commons/cephalon/packages/cephalon-cljs/docs/notes/cephalon/cephalon-daimoi-v01.md`
- `orgs/octave-commons/cephalon/packages/cephalon-cljs/docs/notes/cephalon/cephalon-nexus-index-v01.md`
- `orgs/octave-commons/cephalon/packages/cephalon-cljs/docs/notes/cephalon/cephalon-field-digest-v01.md`
- `session-ses_3df5.md`
- `docs/opencode-session-ses_3e34.md`

## Core recovery

Later notes reused the name `daimoi` for a retrieval mechanism with the following properties:
- deterministic
- budgeted
- bounded expansion
- summary/aggregate-preferring
- structurally guided by nexus keys

That means daimoi evolved into a second useful abstraction:

> a daimon can be understood either as a packet in semantic field space, or as a budgeted walker through associative graph space.

## Minimal graph model

From the recovered note:
- memories and summaries are nodes
- nexus keys are nodes
- edges are `memory ↔ key`
- walkers expand through this bipartite structure

## Why this reuse is not accidental

The reuse works because both meanings share the same invariant:
- bounded motion through a structured field
- attraction toward certain regions
- controlled exploration under budget
- interpretable traces rather than opaque jumps

## Suggested contract

A future daimoi library should probably support two families:

### 1. Field daimoi
- spatial / packet / collision dynamics

### 2. Retrieval daimoi
- graph walking over typed associative surfaces

## Shared trait surface

```ts
interface DaimoiBudget {
  maxSteps: number
  maxNeighbors: number
  exploration: number
  summaryBias: number
}
```

## Retrieval walker outputs

A retrieval daimon should emit:
- visited nodes
- triggering keys
- candidate scores
- explanation reasons
- budget spent

## Why this matters for the repo

Without this spec, the later retrieval meaning of daimoi gets lost and future readers may think the term only refers to simulation particles.

But the corpus clearly shows a semantic migration:
- early `fork_tales`: packet/field dynamics
- later Cephalon notes: graph-walk retrieval glue

Both belong in the conceptual dossier.
