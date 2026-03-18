# Draft Spec (Phase 4): Governance + polish gates + cleanup after migration

## Mission
After packages/services are migrated to canonical `orgs/` submodules with compatibility symlinks, establish:
1) a stable governance model (prototype → promoted)
2) polish gates for open-hax
3) cleanup so the workspace remains ergonomic and maintainable.

## Context / Current State
- Phase 1 introduces link tooling + conventions.
- Phase 2/3 migrate actual modules.
- After migration, maintenance risk shifts to keeping conventions consistent (and preventing “mystery copies” / drift).

## Goals
1. Document the lifecycle:
   - **Prototype**: real directory under `packages/` or `services/` tracked in this monorepo.
   - **Candidate**: inventory + mapping decision exists; minimal docs.
   - **Promoted**: lives under `orgs/<org>/<repo>` with upstream; symlink exists at original path.
2. Add “promotion checklists” per target org:
   - **riatzukiza**: minimal docs, license, basic build reproducibility.
   - **open-hax**: README, examples, tests, CI, clear API, sensible defaults.
   - **octave-commons**: intent note + safe use framing; avoid tactical harm enablement.
3. Make drift detectable:
   - CI/job (or local script) that verifies:
     - symlinks match manifest
     - no duplicate workspaces due to symlink+canonical double-discovery
     - submodules are initialized
4. Clean up workspace config and docs:
   - remove redundant explicit workspace paths
   - ensure `REPOSITORY_INDEX.md` (or equivalent) points at canonical locations

## Non-goals
- Forcing every existing module to be polished.
- Rewriting package naming / scopes.

## Open Questions
1. Should we introduce an explicit “quarantine” namespace for prototypes (e.g. `@workspace/*`) to prevent accidental publish?
2. Should we enforce license uniformity across extracted repos (GPLv3) immediately or gradually?
3. Do we want a bot/script to open issues in upstream repos for missing polish items?

## Risks
- Over-enforcement slows prototyping.
  - Mitigation: governance rules should be advisory except for link correctness + workspace green.
- “Myth-coded” framing could confuse well-meaning users.
  - Mitigation: keep intent/safety docs clear; avoid operational details that enable harm.

## Implementation Plan
1. Add docs:
   - `docs/migrations/packages-services-to-orgs/README.md` expanded into a short guide.
   - `docs/migrations/packages-services-to-orgs/promotion-checklists.md`
2. Strengthen tooling:
   - `links:check` becomes mandatory in CI (if CI exists) or as a pre-push hook.
3. Workspace hygiene:
   - ensure pnpm discovery does not double-count packages.
   - ensure Nx project generation (if used) respects canonical locations.

## Affected Files
- `docs/migrations/packages-services-to-orgs/README.md`
- `docs/migrations/packages-services-to-orgs/promotion-checklists.md` (new)
- `.hooks/**` or pre-push hook config (optional)
- `pnpm-workspace.yaml` (final cleanup)
- `REPOSITORY_INDEX.md` (optional updates)

## Verification
- `pnpm run links:check` passes.
- `pnpm -w install` produces a consistent lockfile.
- A fresh clone with `--recurse-submodules` works and `pnpm install` succeeds.

## Definition of Done
- Governance/promotion docs exist.
- Link drift detection is in place.
- Workspace config is simplified and stable.
