# Submodule sync: device/stealth (2025-11-20)

## Context
- Root branch: `device/stealth`, ahead of origin by 14 commits.
- Staged root changes: `.gitmodules` updates (new open-hax submodules and riatzukiza/openhax) and submodule pointer adjustments.
- Dirty submodule: `orgs/riatzukiza/promethean` has modified submodule pointers.

## Relevant files/paths
- `.gitmodules` lines 53-96: new entries for `orgs/open-hax/codex`, `orgs/open-hax/openhax`, `orgs/open-hax/plugins/codex`, `orgs/riatzukiza/openhax`, and related open-hax submodules.
- `orgs/riatzukiza/promethean` submodules with changes (tsconfig build info files):
  - `packages/github-sync/tsconfig.tsbuildinfo`
  - `pipelines/boardrev/tsconfig.tsbuildinfo`
  - `pipelines/codemods/tsconfig.tsbuildinfo`
  - `pipelines/codepack/tsconfig.tsbuildinfo`
  - `pipelines/semverguard/tsconfig.tsbuildinfo`
  - `pipelines/sonarflow/tsconfig.tsbuildinfo`

## Existing issues/PRs
- Not checked; assume no blocking issues for submodule sync.

## Definition of done
- All dirty submodules commit their pending changes to branch `device/stealth` and are pushed to origin.
- Root repo updates submodule pointers and `.gitmodules` are committed on `device/stealth` and pushed.
- `git status` clean at root and all submodules.

## Requirements
- "Commit all gits as submodules, and recursively commit and push all submodule content to device/stealth."

## Nx typecheck debugging (2025-11-20)
- Nx project graph failed due to duplicate project name `@promethean-os/pantheon-ecs` (paths: `packages/pantheon-ecs` and `experimental/pantheon/packages/ecs`).
- Added `experimental/pantheon/packages/ecs/project.json` with unique name `experimental-pantheon-ecs` to dedupe graph.
- `pnpm nx affected -t typecheck --base origin/device/stealth --head HEAD --verbose` now builds the graph; current failing target `@promethean-os/discord` hits TS rootDir/include errors when importing from `packages/persistence`.
- Promethean push currently blocked by typecheck; use `SKIP_PREPUSH_TYPECHECK=1` if bypass is needed until discord tsconfig/imports are fixed.
- Submodule `experimental/pantheon` (branch `device/stealth`) pushed with commit `a8e159d` containing the project.json addition.
