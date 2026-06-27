# Daimoi Field Model Spec

## Purpose

Specify the minimal operational model for daimoi as they appear across the `fork_tales` runtime notes and later decomposition work.

## Source anchors

- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-hybrid-field-graph-formalism.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-design-hole-responses-field-and-collisions.md`
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_probabilistic.py`
- `orgs/octave-commons/fork_tales/part64/code/world_web/constants.py`
- `specs/daimoi-core-spec.md`

## Core claim

A daimon is not just a particle and not just a message.
It is a **budgeted intent carrier** moving through a sparse field whose topology is shaped by presences, nexus relationships, and noise.

## State model

```ts
interface Daimon {
  id: string
  ownerPresenceId: string
  seedEmbedding: number[]
  mantleEmbedding: number[]
  intentEmbedding: number[]
  intentUnits: number
  typeDistribution: number[]
  position: { x: number; y: number }
  velocity: { vx: number; vy: number }
  energy: number
}
```

## The three embedding influences

The design-hole note makes a useful distinction:

1. **Seed embedding** — what the originating presence emitted
2. **Mantle embedding** — what nearby packets / environment have deposited onto it
3. **Intent embedding** — weighted average of the intents currently carried in the wallet

### Operational reading
- seed = identity bias
- mantle = accumulated context
- intent = immediately actionable semantic load

## Motion model

A practical motion step should combine:

- field-following force
- semantic gravity toward relevant nexus or presences
- noise / exploration term
- friction / damping
- previous velocity

```text
new_velocity = (old_velocity + field_force + gravity_force + noise_force) * damping
new_position = old_position + new_velocity * dt
```

## Field deposition

From the design-hole note:
- the winds come from daimoi movement
- field signals decay over time
- the implementation may be sparse rather than a dense grid

### Minimal contract
A runtime implementation should support:
- local vector deposition by moving daimoi
- time decay of field influence
- sparse lookup by cell / bucket / tree index
- readout of local field direction for observers and walkers

## Friction hierarchy

Recovered design intent distinguishes different friction regimes:
- **presences**: highest friction
- **nexus**: high friction, no self-propulsion
- **daimoi**: lower friction, self-propelled by field + gravity + noise

This matters because it separates:
- stable anchors
- slow structural drift
- fast packet motion

## Intent wallets

The design-hole note repeatedly frames daimoi as carrying integer units of intent.

### Minimal semantics
- a daimon carries `intentUnits: Int`
- each unit belongs to a weighted intent distribution
- on absorption or collision, units can transfer and shift probabilities
- the distribution is not decorative; it affects later emission and interpretation

## Role of presences

Presences do not merely receive daimoi.
They:
- emit daimoi with seed embeddings
- bias the field through need / mass / meaning
- interpret absorbed signals through their own semantic lens

That means daimoi are the moving layer between:
- presence intent
- field topology
- nexus interaction

## Minimal implementation hooks

A future standalone engine should expose:
- `emitDaimon(presence, wallet)`
- `stepField(dt)`
- `sampleField(position)`
- `queryNearby(position, radius)`
- `applyCollision(a, b | nexus)`
- `observeDaimon(id)`

## Why this matters

In the original corpus, daimoi were easy to mythologize and hard to rebuild.
This spec compresses the invariant:

> daimoi are budgeted moving intent-carriers in a decaying sparse field, owned by presences, interpreted through lenses, and governed by collisions plus observability.
