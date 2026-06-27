# Consolidation Map

## Purpose

Record the path by which Cephalon was reassembled into a single canonical repo.

## Canonical now

- `orgs/octave-commons/cephalon/packages/cephalon-ts`
- `orgs/octave-commons/cephalon/packages/cephalon-cljs`
- `orgs/octave-commons/cephalon/packages/cephalon-clj`
- `orgs/octave-commons/cephalon/recovered/cephalon-clj`

## Former stragglers

### Moved into this repo
- `packages/cephalon-clj` → `orgs/octave-commons/cephalon/packages/cephalon-clj`
- `recovered/cephalon-clj` → `orgs/octave-commons/cephalon/recovered/cephalon-clj`

### Previously migrated here
- `packages/cephalon-ts` → `orgs/octave-commons/cephalon/packages/cephalon-ts`
- `services/cephalon-cljs` → `orgs/octave-commons/cephalon/packages/cephalon-cljs`

## Current interpretation

### `cephalon-ts`
The most immediately user-facing head path:
- bot identities
- hive runtime
- tool execution
- UI/server surfaces
- memory integrations

### `cephalon-cljs`
The richest doc+runtime extraction of the always-running mind model:
- ECS world
- event bus
- eidolon / nexus / vector memory concepts
- extensive note corpus

### `cephalon-clj`
A JVM Clojure precursor that should be treated as:
- a smaller skeleton
- a precursor runtime
- a source of simpler architecture choices

### `recovered/cephalon-clj`
A partially lost but valuable branch preserving the shape of:
- `cephalon-clj-brain`
- `cephalon-clj-discord-io`
- `cephalon-clj-shared`
- two-process RPC thinking
- MCP subcommand work

## Doctrine

From this point on, Cephalon-related consolidation should land in this repo first, then fan out into neighboring repos only when the boundaries are clear.
