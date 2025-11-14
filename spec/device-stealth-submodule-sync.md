# Device/stealth Submodule Sync

## Code & Config References
- `.gitmodules:1-42` — top-level submodule definitions for all external repos that must be committed and pushed.
- `orgs/riatzukiza/promethean/.gitmodules:1-115` — nested Promethean package submodules that inherit the same workflow requirements.

## Existing Issues
- None referenced; no blocking GH issues identified for this workflow.

## Existing PRs
- None referenced; work to remain on `device/stealth` until requested otherwise.

## Requirements
1. Traverse every submodule (including nested ones) and verify the checkout is on `device/stealth` (create/track branch when missing).
2. Commit all working tree changes inside each submodule with clear messages while preserving user modifications.
3. Ensure every submodule defines a `riatzukiza` remote pointing at the appropriate GitHub repository; create the repo via `gh repo create riatzukiza/<name>` when it does not exist.
4. Push `device/stealth` for each submodule (and parent repo) to the `riatzukiza` remote, guaranteeing refs are up to date.

## Definition of Done
- All submodules (root + nested) have clean working trees on `device/stealth`.
- Every submodule repo has a configured `riatzukiza` remote URL and, when needed, an actual GitHub repo created via `gh`.
- All commits are pushed to the `riatzukiza` remote on `device/stealth`.
- Root repository reflects updated submodule SHAs and is itself pushed.

## Plan by Phases

**Phase 1 – Audit & Branch Validation**
- Use `git submodule foreach --recursive` to capture branch + status per module.
- Record modules diverging from `device/stealth` and determine whether branch creation is necessary.

**Phase 2 – Commit Outstanding Changes**
- For each dirty module, stage intentional changes, craft commit messages summarizing the work, and ensure no staged data is lost.

**Phase 3 – Remote Alignment**
- Enumerate `git remote` entries per module; add `riatzukiza` remote with the correct SSH URL (or create the remote repo first when absent).

**Phase 4 – Push & Verification**
- Push `device/stealth` to the `riatzukiza` remote recursively, then update the root repo’s submodule pointers and push the parent branch.

## Change Log (2025-11-12)
- Audited 48 submodules (root + Promethean packages) to confirm device/stealth state and identify pending work.
- Committed Promethean Nx script cleanup + pm2 docs and advanced parent pointer to integrate the changes.
- Added `riatzukiza` remotes everywhere via a scripted `git submodule foreach` pass (no new repos required, all existed already).
- Pushed Promethean and root `device/stealth` branches to `riatzukiza`/origin after verifying clean statuses.
- Introduced `.hooks/pre-push-typecheck.sh` and installed it into every repo’s `.git/hooks/pre-push` to enforce `pnpm nx run-many -t typecheck --all` (with fallbacks) before any push.
- Added `bin/install-pre-push-hooks.sh` plus a `pnpm postinstall` hook so every clone/submodule automatically installs the tracked hook.
- Expanded Nx generation to include every submodule (recursive) and appended a `typecheck` target so the pre-push hook can rely on `pnpm nx run-many -t typecheck --all` consistently.
