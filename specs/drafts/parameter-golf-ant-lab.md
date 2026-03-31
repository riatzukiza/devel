# Parameter Golf Ant Lab (Draft) — 2026-03-18

## Goal
Stand up a lightweight experiment lab so ant-colony-style search can begin exploring Parameter Golf and Presence design space immediately, even before heavy GPU runs are automated.

## Why now
The user wants scaffolding first, not perfect theory later.
We need a system that can:
- define a decision space,
- propose candidate recipes,
- ingest observed results,
- update pheromones,
- emit the next wave of candidate experiments.

## Scope for this first pass
Implement a local CLI and lab-file format that supports:
1. initializing one or more built-in profiles,
2. generating candidate experiment batches,
3. recording results and updating pheromones,
4. printing current status and strongest paths.

## Non-goals
- Running full Parameter Golf training automatically in this pass.
- Integrating directly with cluster schedulers.
- Training Presence models in this pass.
- Solving Shibboleth sidecar evaluation end-to-end in this pass.

## Output artifacts
- `src/parameter-golf-ant-lab/` CLI + logic
- `labs/parameter-golf-ant-lab/` initialized lab state
- `package.json` script for the CLI
- tests for init/step/record/status workflow

## Profiles

### 1. `board`
Competition-facing decision space using knobs mostly available in the current upstream trainer.
Examples:
- `NUM_LAYERS`
- `MODEL_DIM`
- `NUM_KV_HEADS`
- `MLP_MULT`
- learning-rate related knobs
- sequence/batch size knobs

Objective weighting should favor:
- lower `val_bpb`
- staying under artifact cap
- lower wallclock

### 2. `presence`
Research-facing decision space for the future tiny safe Presence artifact.
Examples:
- backbone family
- graph serializer
- instruction mix
- safety mix
- classifier head type
- quantization recipe
- lens/shared-head count

Objective weighting should favor:
- decent compression
- good sidecar safety/utility
- tiny bytes
- graph-task usefulness

## Data model

### Config
- profile metadata
- RNG seed
- ACO hyperparameters (evaporation, deposit, ants per step)
- decision dimensions and allowed values
- objective metric weights and normalization targets

### State
- pheromone table per dimension/value
- proposed candidate history
- evaluation history
- current step counter
- best-so-far summary

### Suggestions
Per step, emit:
- machine-readable JSON with candidate recipes
- human-readable Markdown summary
- runnable shell/env snippets where applicable

## Scoring
Support weighted composite objectives with target/baseline normalization.
Examples:
- minimize `val_bpb`
- minimize `bytes_total`
- minimize `wallclock_seconds`
- maximize `macro_f1`
- minimize `benign_fpr`
- maximize `graph_utility`

## Phase plan

### Phase 1 — Lab spine
- define types
- built-in profiles
- init command
- step/propose command

### Phase 2 — Pheromone updates
- record command
- evaporation + deposit logic
- status summaries

### Phase 3 — Lab initialization
- create tracked lab directory under `labs/parameter-golf-ant-lab`
- initialize `board` and `presence`
- generate first candidate wave

### Phase 4 — Verification
- add CLI tests
- run the tests
- inspect generated artifacts

## Definition of done
- We can run a command to initialize the lab.
- We can generate a first wave of ant proposals.
- We can ingest at least one mock result and see pheromones change.
- Lab artifacts are human-readable enough to use as an experiment notebook.
