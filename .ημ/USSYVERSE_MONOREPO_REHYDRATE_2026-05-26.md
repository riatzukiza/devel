# Ussyverse monorepo child submodule rehydrate — 2026-05-26

## Decision

The `orgs/ussyverse/monorepo/projects/**` child project repos are supposed to be present as child submodules. The prior recursive fork-tax blocker interpreted their deletion-only status defensively as remote-wipe candidates; after user confirmation and direct inspection, they were treated as dehydrated/incomplete working tree checkouts instead.

## Repair performed

- Scope: `orgs/ussyverse/monorepo` only.
- Preflight direct child submodule classification: `{'deletion-only': 96, 'mixed-dirty': 1}`.
- Restored deletion-only child worktrees with per-child `git restore --staged --worktree -- .`.
- Removed one stale, zero-byte lock file from `orgs/ussyverse/monorepo/.git/modules/projects/web-apps/templeossy/index.lock` after checking for active git processes.
- Initialized nested `projects/ai-agents/hermes-agent/tinker-atropos` successfully.

## Verification

- Post-repair direct child classification: `{'clean': 97}`.
- `git -C orgs/ussyverse/monorepo status --short` is clean.
- `git status --short -- orgs/ussyverse/monorepo` at the devel REDACTED_SECRET is clean.

## Residual blockers

- Direct child `projects/ai-agents/mcpussy` remains uninitialized because `https://github.com/mojomast/mcpussy.git` and `git@github.com:mojomast/mcpussy.git` were not accessible in this environment.
- `projects/ai-agents/ralphussy` contains 3 gitlink entries but no `.gitmodules`, so recursive `git submodule status --recursive` still reports missing mappings for nested swarm worker paths. Parent ralphussy status itself is clean.

No repo-wide reset/clean was performed.
