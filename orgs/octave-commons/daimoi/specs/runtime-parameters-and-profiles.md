# Runtime Parameters and Profiles Spec

## Purpose

Pin down the most immediately recoverable operational parameters for a standalone daimoi engine.

## Source anchors

- `orgs/octave-commons/fork_tales/part64/code/world_web/constants.py`
- `orgs/octave-commons/fork_tales/part64/docker-compose.yml`
- `orgs/octave-commons/fork_tales/part64/code/world_web/simulation.py`

## Core motion parameters

### Canonical recovered defaults

| parameter | recovered default | bounds / notes |
|---|---:|---|
| `DAIMO_FORCE_KAPPA` | `0.22` | floor `0.02` |
| `DAIMO_DAMPING` | `0.88` | clamped to `0.0..0.99` |
| `DAIMO_DT_SECONDS` | `0.2` | clamped to `0.02..0.4` |
| `DAIMO_MAX_TRACKED_ENTITIES` | `280` | floor `24` |

### Stream/runtime tuning clues

| env var | recovered value / role |
|---|---|
| `SIMULATION_WS_STREAM_DAIMOI_FRICTION` | recovered in compose; additional UI/stream motion tuning |
| `SIMULATION_WS_STREAM_DAIMOI_ORBIT_DAMPING` | recovered in compose; orbit / stabilization tuning |

## Profile table

The upstream profile definitions suggest this minimum shape:

```ts
interface DaimonProfile {
  id: string
  name: string
  ctx: string
  baseBudget: number
  weight: number
  temperature: number
}
```

### Recovered baseline profiles

```ts
const DEFAULT_PROFILES = [
  { id: "daimo:core", name: "Core Daimoi", ctx: "主", baseBudget: 9.0, weight: 1.0, temperature: 0.34 },
  { id: "daimo:resource", name: "Resource Daimoi", ctx: "資", baseBudget: 12.0, weight: 1.05, temperature: 0.28 },
  { id: "daimo:self", name: "Self Daimoi", ctx: "己", baseBudget: 7.0, weight: 0.9, temperature: 0.42 },
  { id: "daimo:you", name: "You Daimoi", ctx: "汝", baseBudget: 7.0, weight: 0.88, temperature: 0.48 },
  { id: "daimo:they", name: "They Daimoi", ctx: "彼", baseBudget: 6.0, weight: 0.84, temperature: 0.56 },
  { id: "daimo:world", name: "World Daimoi", ctx: "世", baseBudget: 8.0, weight: 0.94, temperature: 0.4 },
]
```

## Interpretation of fields

### `ctx`
Binds a profile into the corpus's context grammar:
- `主` core / anchor / operator-center
- `己` self
- `汝` you / counterpart
- `彼` third party / others
- `世` world
- `資` resource-facing class

### `baseBudget`
Likely governs how much intent / resource / processing latitude a daimon class begins with.

### `temperature`
Best read as exploration softness / stochasticity.
Lower = more stable, higher = more exploratory or noisy.

### `weight`
Best read as class-level influence or coupling bias.

## Contract for future standalone engines

A serious daimoi engine should:
- expose profiles as data, not hidden constants
- validate motion parameters against explicit bounds
- allow runtime overrides with audit events
- distinguish simulation-core parameters from stream/render parameters

## Required runtime endpoints or config surfaces

At minimum:
- `profiles.list`
- `profiles.get`
- `params.get`
- `params.set` with event trail
- `observer.snapshot`

## Warning

If future extraction only copies the numeric defaults but loses the typed profile table, it will erase one of the strongest signals that the original system treated daimoi as a cast, not a homogeneous swarm.
