# Draft Spec (Phase 2): Migrate `packages/*` -> `orgs/<org>/*` as submodules and leave package compatibility paths when useful

## Mission
Promote selected `packages/*` modules into canonical submodules under:

`orgs/<org>/<repo>`

...while keeping `packages/<name>` available for active prototypes and, when justified, compatibility paths.

This phase targets **packages only**.

## Context / Current State
- `packages/*` is now the default birthplace for new work.
- Canonical mature homes live under one of:
  - `orgs/riatzukiza/*`
  - `orgs/octave-commons/*`
  - `orgs/open-hax/*`
  - `orgs/ussyverse/*`
- Some promoted packages may keep a `packages/<name>` compatibility path, but that is optional and should be justified.

## Goals
1. For each `packages/<name>` chosen in Phase 0 mapping:
   - ensure an upstream repo exists under the chosen org
   - convert it to a git submodule at `orgs/<org>/<repo>`
   - optionally replace `packages/<name>` with a compatibility symlink when keeping that path has value
2. Keep the workspace green after each migration.
3. Preserve build/test behavior.

## Non-goals
- Services/runtime-home migration (Phase 3).
- Large polish refactors beyond what is needed to make the promotion real.

## Extraction & submodule strategy
Per module, choose one:

### Strategy A — History-preserving extraction
Use `git filter-repo` or `git subtree split` when history matters.

### Strategy B — Snapshot extraction
Create the upstream repo with an initial import commit when speed matters more than history.

Then:
- `git submodule add <upstream> orgs/<org>/<repo>`
- optionally create `packages/<name>` symlink to `orgs/<org>/<repo>`

## Ordering
- Migrate packages in dependency order (leaf deps first).
- When two packages are tightly coupled, migrate them in a controlled batch and verify after each sub-step.

## Open Questions
1. Should package scopes remain stable even when the upstream repo moves to a different org?
   - Recommendation: yes, unless there is a strong reason to rename.
2. Should every promoted package retain a compatibility path in `packages/*`, or only operator-facing ones?
3. For `ussyverse` candidates, what minimum governance signal is required before promotion?

## Risks
- pnpm may see duplicates if both canonical and compatibility paths are treated as primary.
- Git submodule churn can confuse tooling if `.gitmodules` is not kept consistent.
- Promoting too early can freeze a project that should still be prototyped in `packages/*`.

## Implementation Phases (within Phase 2)
### Phase 2.1 — Pilot migration
- Pick 1–2 low-dependency packages.
- Validate: upstream creation -> submodule -> optional compatibility path -> build/test.

### Phase 2.2 — Bulk migration
- Migrate remaining packages in dependency order.
- Verify after each move.

### Phase 2.3 — Stabilize
- Remove obsolete workspace config assumptions.
- Ensure `links.yaml` only contains intentional compatibility paths.

## Affected Files
- `.gitmodules`
- `packages/*` (for promoted modules, either replaced with symlinks or retired as source homes)
- `orgs/<org>/*`
- `docs/migrations/packages-services-to-orgs/links.yaml`
- `pnpm-workspace.yaml`

## Verification
For each migrated package:
- `pnpm --filter <pkgName> build`
- `pnpm --filter <pkgName> test` (if present)

At the end of phase:
- workspace install/build/test remains green
- optional fresh-clone verification with `--recurse-submodules`

## Definition of Done
- All packages selected for promotion are present as submodules under `orgs/<org>/...`.
- Any retained `packages/<name>` compatibility paths are explicit and documented.
- `packages/*` remains available as the workspace’s default prototype layer.
