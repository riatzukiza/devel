# Draft Spec (Phase 4): Governance + polish gates + cleanup after migration

## Mission
After project placement is normalized, establish:
1. a stable lifecycle contract
2. polish gates for each org namespace
3. drift detection so source truth, runtime truth, and compatibility paths do not diverge

## Context / Current State
- `packages/*` is the default prototype layer.
- `orgs/*/*` holds canonical mature projects.
- `services/*` holds runtime/devops/integration material.
- Migration work is only successful if the workspace keeps those roles legible over time.

## Goals
1. Document the lifecycle:
   - **Prototype**: real directory under `packages/*`
   - **Promoted source**: canonical repo under `orgs/<org>/<repo>`
   - **Runtime home**: operator/deploy surface under `services/*` when needed
   - **Alias**: explicitly managed compatibility path only when it still has value
2. Add promotion checklists per target org:
   - **riatzukiza**: minimal docs, license, basic build reproducibility, independent timeline
   - **open-hax**: README, examples, tests, CI, clear API, sensible defaults, production readiness
   - **octave-commons**: intent note, safe-use framing, clear research/artifact positioning
   - **ussyverse**: contribution/governance notes, ownership clarity, collaboration expectations
3. Make drift detectable:
   - alias correctness
   - submodule initialization
   - canonical source vs runtime-home mapping correctness
   - no accidental duplicate workspace discovery
4. Clean up workspace docs and config so the placement contract is discoverable and consistent.

## Non-goals
- Forcing every prototype to be polished prematurely.
- Making `devel` own a service's only real deploy contract when that service should be independently reusable.

## Open Questions
1. Should promoted packages always leave behind compatibility aliases, or should that be opt-in?
2. Do we want an explicit quarantine marker for prototypes to avoid accidental publish/release?
3. Should runtime-home metadata live only in `migration-map.yaml`, or also in a dedicated `runtime-homes.yaml`?

## Risks
- Over-enforcement can slow down prototyping.
- Under-enforcement recreates split-brain source/deploy truth.
- Historical docs can silently reintroduce obsolete assumptions.

## Implementation Plan
1. Expand the migration docs into a durable placement/governance guide.
2. Add promotion checklists covering all four org namespaces.
3. Strengthen link/runtime-home drift detection.
4. Update repository indexes and workflow docs to point at canonical source plus runtime home intentionally.

## Affected Files
- `docs/migrations/packages-services-to-orgs/README.md`
- `docs/migrations/packages-services-to-orgs/promotion-checklists.md`
- `docs/reference/devel-placement-contract.md`
- `pnpm-workspace.yaml`
- optional CI / pre-push checks for alias/runtime-home correctness

## Verification
- `links:check` (or equivalent) passes.
- workspace install/build remains consistent.
- fresh clone with submodules and runtime-home docs is understandable and reproducible.

## Definition of Done
- Governance and promotion docs exist for all four org namespaces.
- Drift detection covers aliases and runtime-home/source mappings.
- The workspace contract remains: prototype in `packages/*`, identity in `orgs/*/*`, operations in `services/*`.
