# Annotated Source Excerpts

This file pulls a few **load-bearing upstream excerpts** into one readable place so a contributor does not have to immediately dive into the full Part64 runtime.

## 1. Core physics knobs (`constants.py`)

Upstream source:
- `orgs/octave-commons/fork_tales/part64/code/world_web/constants.py`

Recovered values:

```python
DAIMO_FORCE_KAPPA = 0.22   # lower-bounded at 0.02
DAIMO_DAMPING = 0.88       # clamped into [0.0, 0.99]
DAIMO_DT_SECONDS = 0.2     # clamped into [0.02, 0.4]
DAIMO_MAX_TRACKED_ENTITIES = 280  # lower-bounded at 24
```

### Why these matter
- `kappa` = effective attraction / coupling strength
- `damping` = how quickly velocity decays
- `dt` = integration timestep
- `max_tracked_entities` = practical bound for neighbor consideration

These are exactly the kinds of knobs a future standalone engine should expose with explicit ranges and defaults.

## 2. Canonical daimoi profile table (`constants.py`)

Upstream defines six canonical profile rows:

| id | name | ctx | base_budget | w | temperature |
|---|---|---:|---:|---:|---:|
| `daimo:core` | Core Daimoi | `主` | 9.0 | 1.00 | 0.34 |
| `daimo:resource` | Resource Daimoi | `資` | 12.0 | 1.05 | 0.28 |
| `daimo:self` | Self Daimoi | `己` | 7.0 | 0.90 | 0.42 |
| `daimo:you` | You Daimoi | `汝` | 7.0 | 0.88 | 0.48 |
| `daimo:they` | They Daimoi | `彼` | 6.0 | 0.84 | 0.56 |
| `daimo:world` | World Daimoi | `世` | 8.0 | 0.94 | 0.40 |

### Reading
- `ctx` ties daimoi to the corpus's context grammar
- `base_budget` suggests not all daimoi are equally provisioned
- `temperature` hints at exploration variance or behavioral softness
- `w` appears to be a weighting / influence scalar

This profile table is one of the strongest clues that daimoi were not intended as generic particles; they were a **typed cast**.

## 3. Collision semantics excerpt (`daimoi_collision_semantics.py`)

Upstream source:
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_collision_semantics.py`

Key recovered ideas from the function surface:
- compare seed/current embedding matrices (`ss`, `sc`, `cs`, `cc`)
- derive `semantic_affinity`
- split effects into **transfer** and **repulsion** terms
- bias exchange by relative size
- update package distributions (`alpha_pkg`) and message distributions (`alpha_msg`)
- allow special-case resource transfer when emission/absorption thresholds are crossed

### Why this matters
The collision system is not just positional bounce. It mixes:
- geometry
- semantic affinity
- typed package distributions
- budget / size asymmetry
- special-case resource emission logic

In other words: collision is where the field physics meets meaning and economy.

## 4. Quadtree excerpt (`daimoi_quadtree.py`)

Upstream source:
- `orgs/octave-commons/fork_tales/part64/code/world_web/daimoi_quadtree.py`

The quadtree layer provides:
- `rect_intersects_circle`
- `quadtree_build`
- `quadtree_query_radius`
- `quadtree_semantic_aggregate`

### Why this matters
This shows daimoi were never meant to be simulated by brute force only.
The design already wanted:
- bounded neighborhood queries
- hierarchical aggregation
- semantic summaries over spatial partitions

That means a future implementation should treat spatial indexing as **core architecture**, not as an optional later optimization.

## 5. Runtime exposure clues (`simulation.py` and docker-compose)

Other recovered clues:
- runtime summaries already emit a `daimoi_probabilistic` structure
- the compose/runtime layer exposes `SIMULATION_WS_STREAM_DAIMOI_FRICTION` and `SIMULATION_WS_STREAM_DAIMOI_ORBIT_DAMPING`
- resource-oriented daimoi exist (`resource_daimoi`)

### Reading
Daimoi were not a hidden math toy. They were already part of the observable simulation surface.

## 6. Interpretation

Facts:
- there are explicit daimoi profiles
- there are explicit motion parameters
- there is collision logic richer than bounce/merge
- there is explicit spatial indexing
- there are runtime knobs and summaries

Interpretive compression:
- the original system treated daimoi as a **typed packet ecology**, not as anonymous particles and not as mere retrieval tokens.
