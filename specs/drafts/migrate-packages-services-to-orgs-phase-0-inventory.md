# Draft Spec (Phase 0): Inventory + classification map for `packages/*` + `services/*`

## Mission
Produce a complete, reviewable inventory of everything under `packages/*` and `services/*`, then classify each entry under the active placement contract:

- `packages/*` = rapid-prototyping birthplace by default
- `services/*` = runtime/devops/integration layer
- mature canonical homes live under one of:
  - `orgs/riatzukiza/*`
  - `orgs/octave-commons/*`
  - `orgs/open-hax/*`
  - `orgs/ussyverse/*`

This phase does **not** move code. It creates the classification map and migration order.

## Context / Current State
- This repo is a pnpm workspace with many local modules under `packages/*` and `services/*`.
- Some entries under `services/*` are already submodules, aliases, or runtime homes.
- The active contract now distinguishes:
  - prototype source under `packages/*`
  - canonical mature source under `orgs/*/*`
  - runtime/devops material under `services/*`

## Goals
1. Build an inventory table for each module under `packages/*` and `services/*`.
2. For each `packages/*` entry, decide whether it remains a prototype or should graduate to an org repo.
3. For each `services/*` entry, decide whether it is:
   - a runtime/devops home
   - a compatibility alias
   - a legacy source checkout that should be normalized
   - or a true exception that remains devel-local
4. Decide target org + repo name for canonical source entries.
5. Decide extraction strategy where promotion is needed:
   - history-preserving extraction
   - snapshot extraction
   - already-upstream / no extraction needed
6. Establish a migration order that respects dependencies and runtime coupling.

## Non-goals
- No upstream repo creation yet.
- No submodule operations yet.
- No workspace config changes yet.

## Deliverables
Create these artifacts in-repo:
1. `docs/migrations/packages-services-to-orgs/migration-map.yaml`
2. `docs/migrations/packages-services-to-orgs/inventory.md`
3. `docs/migrations/packages-services-to-orgs/migration-order.md`

### Suggested schema: `migration-map.yaml`
```yaml
packages/logger:
  stage: prototype
  target_org: riatzukiza
  repo: logger
  kind: node-lib
  extraction: snapshot
  notes: "workspace-focused tool; promote when timeline hygiene matters"

services/proxx:
  role: runtime-home
  canonical_source: orgs/open-hax/proxx
  notes: "runtime/devops home; not canonical source"
```

## Classification rubric
Use two explicit axes.

### 1) Identity / intent
- `riatzukiza`: mature internal devel-only integrations or personal tooling with independent timelines
- `octave-commons`: mature experimental, research, narrative-driven, or myth-encoded work
- `open-hax`: production-grade, portable, documented, community-useful products
- `ussyverse`: collective/community work not owned solely by one person

### 2) Runtime role
- `packages/*`: prototype or compatibility path
- `services/*`: runtime home, compatibility alias, or legacy path to normalize
- `orgs/*/*`: canonical mature source

## Open Questions
1. Should `packages/*` remain only for active prototypes, or also host compatibility symlinks after promotion?
2. For `octave-commons` candidates, what is the preferred standard doc name for intent/safety framing?
3. Which current `services/*` entries should remain long-term runtime homes, and which should become aliases or disappear?

## Risks
- Misclassifying a project’s org identity creates later churn.
- Treating a runtime home as canonical source will recreate split-brain deploy truth.
- pnpm workspace discovery can behave differently with symlinked compatibility paths.

## Implementation Steps
1. Enumerate directories under `packages/*` and `services/*`.
2. Detect:
   - package metadata (`package.json`, scripts, README/docs)
   - git status (plain dir, alias, submodule, nested repo)
   - current runtime role for `services/*`
3. Generate the inventory markdown.
4. Fill `migration-map.yaml` with org decisions and runtime-home decisions.
5. Compute dependency and rollout order.

## Affected Files (created only)
- `docs/migrations/packages-services-to-orgs/migration-map.yaml`
- `docs/migrations/packages-services-to-orgs/inventory.md`
- `docs/migrations/packages-services-to-orgs/migration-order.md`

## Definition of Done
- Every directory under `packages/*` and `services/*` is present in `migration-map.yaml`.
- Each `packages/*` entry has a stage decision and, when applicable, a target org + repo.
- Each `services/*` entry has a runtime-role classification.
- Migration order is documented.
