---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-eta-mu-charter-v1-md"
title: "eta-mu charter v1"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.349Z"
source: "orgs/open-hax/eta-mu/specs/eta-mu-charter-v1.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/eta-mu-charter-v1.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/eta-mu-charter-v1.md`

# eta-mu charter v1

Status: active working charter
Date: 2026-04-05
License: GPL-3.0-only

## Thesis

`eta-mu` is the auditable orchestration substrate for `devel`.

Its job is to sense latent field state, reveal the right panels, choose deliberate movement, commit on breath, and preserve enough receipts that its agency can be audited without being flattened.

This repo is not meant to be "the place where every absorbed package goes forever."
It is meant to be the canonical home of that orchestration loop.

## Core

The core of `eta-mu` is the smallest set of layers required to make the loop real.

### 1. Contract kernel

Canonical home:

- `pi/`

This is the constitutional layer:

- contract grammar
- runtime skills
- eta/mu/pi boundary rules
- truth and receipt discipline
- panel and operator vocabulary

If `eta-mu` loses this layer, it loses its identity.

### 2. View and intake layer

Canonical home:

- `packages/eta-mu-docs`

This layer turns artifacts into an inspectable view surface.
It is the rebuildable projection of what can be extracted from the field.

### 3. Truth layer

Canonical home:

- `packages/eta-mu-truth`

This layer binds claims to proof and receipts.
It does not generate movement by itself.
It audits movement and preserves judged state.

### 4. Movement layer

Canonical home:

- `packages/eta-mu-runtime`

This is the seeded movement kernel.
It must do the following:

- maintain explicit latent belief state
- select visible panels
- rank typed `mu` candidates
- run cheap and deep loops
- emit breath-bounded episode state
- compile movement into machine-readable action envelopes

The scaffold now exists, but persistent state, real event ingestion, and vault-specific actuation still need to be wired on top of it before the layer is complete.

### 5. Council surface

Canonical home:

- `services/eta-mu-truth-workbench`

This service is the operator face of the system.
It should become the council surface that shows:

- field pressure
- proposed movement
- truth and receipts
- trajectory and review debt
- current vault episodes

### 6. Runtime and deploy home

Canonical home:

- `services/eta-mu`

This is the operational shell that deploys and runs the control plane.

## Core invariants

These rules define the system more than any package name does.

1. `eta` is observational.
Raw intake is not silently rewritten into certainty.

2. `mu` is movement.
Movement is typed, situated, and chosen under pressure.

3. `pi` is durable episode state.
Breath turns continuous sensing into auditable episodes.

4. Truth audits movement.
Truth does not originate movement.

5. One living vault is worth more than ten speculative surfaces.
Prove the loop in one real place before scaling it across the cathedral.

## Satellites

Satellites are useful systems connected to `eta-mu` without defining its core identity.

### First-party actuator satellite

- `packages/eta-mu-github`

This is the first strong actuator surface.
It turns GitHub events into seeds, summaries, gates, and actions.
It is important, but it is not the whole of `eta-mu`.

### Core-adjacent substrate satellite

- `packages/presence-core`

This package belongs to the extracted substrate line and should stay aligned with `eta-mu`, but the first living proof of the system does not depend on a full presence stack landing first.

### Radar and signal satellites

- `packages/signal-contracts`
- `packages/signal-radar-core`
- `packages/signal-source-utils`
- `packages/signal-watchlists`

These are currently housed here, but they are not the long-term definition of `eta-mu`.
Current migration intent points toward normalization into an `eta-mu-radar` line under `open-hax`.

### Absorbed OpenHax legacy satellites

- `packages/opencode-reactant`
- `services/agentd`
- `shared/js/opencode-events`
- `packages/kanban`

These are absorbed legacy or transitional surfaces.
They may remain temporarily, but they are not the canonical answer to "what is eta-mu?"

`packages/kanban` deserves special handling:

- the workspace-canonical board already lives at `devel/packages/kanban`
- the repo-local copy should be treated as legacy cargo until it is either normalized, rehomed, or removed

## First living vault

The first living vault is:

- `open-hax/proxx`

This is the first place where `eta-mu` should become indisputably real.

### Why `proxx`

`proxx` already has the shape needed for proof:

- GitHub workflows
- staging and production promotion gates
- review-thread pressure
- deploy and verification checks
- runtime and analytics state
- cheap-model execution surfaces

### What success looks like

For `open-hax/proxx`, `eta-mu` must reliably do the full loop:

1. ingest issue, PR, review, check, and deploy events as seeds
2. maintain explicit promotion stage and review debt
3. emit typed action batches instead of freeform intent
4. post cheap summaries and block reasons when movement is not justified
5. open or update the `staging` to `main` promotion PR when gates pass
6. emit receipts for every significant transition
7. surface the live episode on the council UI
8. close the episode only after production verification

### What does not count

The following do not count as proof of the system:

- a repo that only comments on PRs
- a truth workbench with no movement layer
- a dashboard with no typed action engine
- a speculative multi-vault rollout before one vault is stable

## Repo consequences

This charter implies the following decisions for the repo.

### Keep canonical

- `pi/`
- `packages/eta-mu-docs`
- `packages/eta-mu-truth`
- `packages/eta-mu-runtime`
- `services/eta-mu-truth-workbench`
- `services/eta-mu`
- `packages/eta-mu-github` as the first actuator surface

### Treat as transitional or satellite

- absorbed OpenHax app surfaces
- repo-local kanban copy
- radar and signal packages that want their own line

### Sequence matters

Do these in order:

1. build the movement layer
2. prove the first living vault in `open-hax/proxx`
3. stabilize the council surface around real receipts and movement
4. then rename, split, and clean fossilized `openhax` branding

Naming cleanup without this sequence is cosmetics without crystallization.

## Source anchors

This charter compresses the strongest intent found in these sources:

- `docs/notes/2026.03.06.21.16.05.md`
- `spec/2026-03-09-eta-mu-openplanner-myth.md`
- `specs/eta-mu-extraction-vault.md`
- `orgs/ussyverse/docs/eta-mu-pi-charter.md`
- `specs/drafts/eta-mu-pi-proactive-agent-v0-2026-03-23.md`
- `specs/drafts/eta-mu-devel-control-plane-v0-2026-03-23.md`
- `docs/migrations/packages-services-to-orgs/migration-map.yaml`

## One sentence

`eta-mu` is the system that senses pressure, chooses what to reveal, moves deliberately, commits on breath, and leaves enough trace that the cathedral can trust its own motion.
