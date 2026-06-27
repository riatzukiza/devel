# Ownership, Collision, and Observer Spec

## Purpose

Join three pieces that were previously scattered:
- immutable owner semantics
- collision / absorption behavior
- Static Observer governance using SNR bands

## Source anchors

- `docs/snr-metrics.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-design-hole-responses-field-and-collisions.md`
- `orgs/octave-commons/fork_tales/docs/notes/system_design/2026-02-20-hybrid-field-graph-formalism.md`
- `specs/daimoi-core-spec.md`

## Ownership axiom

A daimon's owner is not inferred from color, path, or later neighborhood.
It is a first-class field.

### Rule
- owner is set at emission time
- owner changes only through an explicit event
- ownership history is append-only

### Why
The upstream note is explicit: immutable owner semantics are necessary so daimoi can form transient response nexus between otherwise disconnected graphs.

## Collision categories

### 1. Deflection
- packets do not merge
- trajectories change
- state remains separate
- use when semantic incompatibility is high or policy forbids absorption

### 2. Absorption
- receiving nexus/presence takes in the daimon
- the probability distribution collapses to a single interpreted intent
- wallet state changes on the receiver side

### 3. Intent exchange
The design-hole note suggests a partial-transfer model:
- two bodies exchange integer units of intent
- the effect on each probability distribution depends on ratio received / stored

## Recommended event schema

```text
daimoi.emit
  daimon_id
  owner_presence_id
  seed_embedding_ref
  intent_units

daimoi.collide
  left_id
  right_id
  collision_type
  distance

daimoi.absorb
  daimon_id
  absorber_id
  resolved_intent
  units_transferred

daimoi.transfer
  from_id
  to_id
  units
  type_delta

daimoi.owner_handoff
  daimon_id
  from_owner
  to_owner
  reason
```

## Static Observer role

The observer does not invent meaning.
It measures whether the daimoi population is behaving coherently relative to the field.

### Signals from `snr-metrics.md`
- density-derived length scale `ℓ`
- spatial noise (`N_space`)
- field-following alignment (`S_alignment`)
- motion noise (`N_motion`)
- combined `SNR`

### Governance bands
- **Quiet** — exploration may widen
- **Normal** — standard motion policy
- **Noisy** — clamp harder to field lines
- **Critical** — trigger redistribution / stabilization

## Observer event contract

```text
observer.sample
  timestamp
  population_size
  lambda
  ell
  N_space
  N_motion
  S_alignment
  SNR
  band

observer.band_change
  from_band
  to_band
  cause

observer.redistribution_request
  band
  affected_region
  rationale
```

## Joining collision semantics to observer governance

### Policy suggestion
When band worsens:
- reduce exploration noise
- favor deflection over messy absorption in unstable zones
- route new daimoi emissions toward under-populated regions

When band improves:
- allow broader exploration
- tolerate more cross-cluster mixing
- permit expensive semantic probing missions

## Minimal truth-preserving interpretation

Facts recoverable from sources:
- daimoi ownership should be explicit
- collisions should not be hand-waved
- absorption collapses ambiguity into a resolved intent
- the observer regulates by measurable coherence, not arbitrary vibes

Interpretation chosen here:
- events and governance should be explicit enough to support later simulation or UI work without re-deriving basic rules from prose.
