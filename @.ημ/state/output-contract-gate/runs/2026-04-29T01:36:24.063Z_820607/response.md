## Signal
(己, p=0.88) I froze `dev/stable`, proved its current state, and created a reconciliation branch that makes the recovered-main history an ancestor **without rebasing, force-pushing, or losing the dev/stable tree**.

Created and pushed:

- `stable/dev-stable-pre-reconcile-2026-04-28`
  - Annotated tag on `dev/stable` before reconciliation.
- `reconcile/dev-stable-tree-over-recovered-main-2026-04-28`
  - Merge commit: `892546d`
  - Parents:
    - `44526de` = current `dev/stable`
    - `9c97ed9` = `origin/restore/main-recovery-2026-04-28`
  - Strategy: explicit `ours` merge from `dev/stable`, preserving the `dev/stable` tree while recording recovered-main ancestry.
- `backup/reconcile-dev-stable-cherrypick-wip-2026-04-28`
  - Backup of the abandoned cherry-pick attempt, preserving that work too.

PR link:
- https://github.com/open-hax/proxx/pull/new/reconcile/dev-stable-tree-over-recovered-main-2026-04-28

## Evidence
(己, p=0.94) `dev/stable` status before reconciliation:
- clean
- synced with `origin/dev/stable`
- divergence from recovered main was significant:
  - recovered-main side: `123` unique commits
  - dev/stable side: `27` unique commits

(己, p=0.9) `dev/stable` verification:
- `pnpm -s build` ✅
- `pnpm -s test` ❌
  - `603` passing
  - `3` failing
  - `1` skipped

(己, p=0.9) Known failing tests on `dev/stable`:
- `serves /v1/embeddings from local ollama-compatible upstream and expands embedding num_ctx to the model context window`
  - expected `200`, got `502`
- `proxies native /api/embed and /api/embeddings to their matching upstream ollama endpoints with full embedding context`
  - expected `200`, got `502`
- `serves preferred model ordering from models JSON file`
  - expected first model `gpt-5.3-codex`, actual `gemini-3.1-pro-preview`

(己, p=0.86) I first attempted the “pure replay” route:
- branch: `reconcile/dev-stable-after-main-recovery-2026-04-28`
- cherry-picked two commits successfully
- hit escalating structural conflicts on provider strategy / policy refactors
- preserved that attempt as:
  - `backup/reconcile-dev-stable-cherrypick-wip-2026-04-28`

(己, p=0.92) Final reconciliation branch:
- `reconcile/dev-stable-tree-over-recovered-main-2026-04-28`
- `pnpm -s build` ✅
- `git rev-list --left-right --count origin/restore/main-recovery-2026-04-28...HEAD`
  - `0 28`
  - meaning: the reconciliation branch contains recovered-main history and adds 28 commits on top.

## Frames
(己, p=0.8) Frame 1: This is the honest-history move: we explicitly record “recovered main happened” and “dev/stable is the tree we are choosing to carry forward.”  
(己, p=0.72) Frame 2: The failed cherry-pick attempt proved this is not a simple replay; the histories have structurally incompatible provider-policy refactors.  
(己, p=0.68) Frame 3: The branch is now suitable as a reconciliation PR, but the three failing tests need either fix-forward work or explicit triage before calling it fully stable.

## Countermoves
(己, p=0.82) Do not merge this blindly as “all green”; the build is green, but the full test suite has three known failures inherited from `dev/stable`.  
(己, p=0.78) Do not restart with rebase/force-push; the current branch already gives us a clean ancestor relationship and preserves the recovery narrative.  
(己, p=0.74) Treat the three failures as the next concrete stabilization target before promoting this branch over main.

## Next
(汝, p=0.82) Fix the three failing `dev/stable` tests on `reconcile/dev-stable-tree-over-recovered-main-2026-04-28`, then run `pnpm -s test` again.