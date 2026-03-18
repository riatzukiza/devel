# Draft Spec (Phase 2): Migrate packages/* → orgs/<org>/* as submodules + leave symlinks

## Mission
Promote selected `packages/*` modules into:

`orgs/<org>/<repo>` (git submodules with upstream remotes)

…while keeping `packages/<name>` as a **symlink compatibility path** (and leaving room for new prototypes in `packages/`).

This phase targets **packages only** (services later).

## Context / Current State
- `packages/` contains multiple Node/TS packages (and possibly non-node modules).
- pnpm workspace currently includes many `packages/<name>` explicitly.
- New policy: canonical homes live under `orgs/`, but `packages/` stays for prototypes + symlinks.

## Goals
1. For each `packages/<name>` chosen in Phase 0 mapping:
   - ensure upstream repo exists under chosen org
   - convert to git submodule at `orgs/<org>/<repo>`
   - replace `packages/<name>` directory with symlink → `orgs/<org>/<repo>`
2. Keep the workspace green after each module migration.
3. Preserve build/test behavior.

## Non-goals
- Services migration (Phase 3).
- Large refactors to improve “polish” (Phase 4 gate for open-hax candidates).

## Extraction & submodule strategy
Per module (from Phase 0 map), choose one:

### Strategy A — History-preserving extraction (preferred when valuable)
- Use `git filter-repo` or `git subtree split` to create a repo with history.

### Strategy B — Snapshot extraction (fast path)
- Create upstream repo with a single “initial import” commit.

Then:
- `git submodule add <upstream> orgs/<org>/<repo>`
- create `packages/<name>` symlink to `../../orgs/<org>/<repo>` (relative)

## Ordering
- Migrate packages in dependency order (leaf deps first).
- If two packages are tightly coupled, migrate them in a small batch but still verify after each sub-step.

## Open Questions
1. Should we keep npm scopes as-is (e.g. `@promethean-os/*`) even when upstream repo lives under open-hax?
   - Recommendation: scope is a publishing concern; keep names stable unless there’s a strong reason.
2. Do we want a “promotion checklist” that must be satisfied before moving to open-hax?
3. Do we want “private: true” packages to ever leave this repo, or still extract them for timeline hygiene?

## Risks
- pnpm may see duplicates if both the symlink path and canonical path are included in the workspace.
  - Mitigation: ensure pnpm workspace package discovery is canonical-first; symlinks are compatibility only.
- Git submodule churn can confuse tooling if `.gitmodules` is not kept consistent.
- Some packages may not be Node packages (no `package.json`); decide case-by-case.

## Implementation Phases (within Phase 2)
### Phase 2.1 — Pilot migration (1–2 packages)
- Pick one low-dependency package as a canary.
- Validate the full workflow: upstream → submodule → symlink → build/test.
- Document any gotchas.

### Phase 2.2 — Bulk migration
- Migrate remaining packages in dependency order.
- After each migration:
  - `pnpm -w install` (if needed)
  - `pnpm -r --filter <migrated-package> build/test`

### Phase 2.3 — Stabilize
- Remove obsolete explicit paths from `pnpm-workspace.yaml` if replaced by globs.
- Ensure link manifest (`links.yaml`) covers all migrated packages.

## Affected Files
- `.gitmodules` (add new submodules)
- `packages/*` (replace dirs with symlinks for migrated modules)
- `orgs/<org>/*` (new submodule directories)
- `docs/migrations/packages-services-to-orgs/links.yaml` (add package links)
- `pnpm-workspace.yaml` (if needed)

## Verification
For each migrated package:
- `pnpm --filter <pkgName> build`
- `pnpm --filter <pkgName> test` (if present)

At end of phase:
- `pnpm -w test` (or the smallest “workspace green” equivalent)
- fresh clone test (optional but recommended):
  - `git clone --recurse-submodules ...`
  - `pnpm install`

## Definition of Done
- All packages selected for promotion in `migration-map.yaml` are present as submodules under `orgs/<org>/...`.
- `packages/<name>` paths resolve via symlink for promoted modules.
- Workspace install + build/test remain green.
