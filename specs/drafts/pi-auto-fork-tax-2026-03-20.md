# Spec Draft: Pi-driven auto fork tax orchestration

## Context
Build a cron-driven replacement for the old file-watch autocommit flow, inspired by `orgs/octave-commons/promethean/services/autocommit/` but oriented around periodic Π snapshots, chained PRs, pi-based review, and submodule fork/origin normalization.

## Goals
- Run on a 6-hour cron cadence, not filesystem watch events.
- Use `pi` with the production Open Hax proxy (`https://ussy.promethean.rest`) for code review output.
- Open a PR for each automated snapshot.
- Target the most recent compatible snapshot branch when possible.
- Normalize submodule remotes so foreign repos use an owned fork as `origin` and the original repo as `upstream`.

## Safety protocol
1. **Cron, not watch**: run as a one-shot command from cron/systemd timer.
2. **Artifact guards first**: respect the new pre-commit/pre-push oversized-artifact guards before any commit or push.
3. **Quiescence gate**: compare two working-tree snapshots before acting; refuse while the tree is still changing.
4. **Dirty-submodule gate**: refuse snapshotting if submodules are dirty unless explicitly overridden.
5. **No auto-merge**: the automation opens PRs and optionally comments with pi review; humans merge.
6. **Chain only when safe**: target the previous snapshot branch only if its recorded head is an ancestor of the current head; otherwise fall back to the current branch.
7. **Dedicated automation clone preferred**: snapshot commits mutate the checked-out branch, so cron should run in a dedicated clone/worktree rather than an interactive development clone.

## Open questions
- Should recursive submodule Π commits become part of the automated cycle, or remain manual until a stronger quiescence protocol lands?
- Which owner should receive forks for foreign orgs by default when no per-owner override exists? Current draft uses `riatzukiza`.
- Should the reviewer post a PR comment, a review, or both?
- Should PRs target the previous snapshot branch even after merges, or should the chain periodically roll forward to a human branch?

## Phase plan
### Phase 1 — Foundations
- Add root CLI under `src/auto-fork-tax/`.
- Implement submodule inventory and fork/origin planning.
- Implement pi-backed PR review command.
- Emit cron entry and state-file metadata.

### Phase 2 — Snapshot PR flow
- Create one-shot `snapshot-pr` and `cycle` commands.
- Push snapshot branch + tag and open PR.
- Persist last snapshot branch/head/tag/PR in `.ημ/auto-fork-tax/state.json`.

### Phase 3 — Fork normalization rollout
- Apply `ensure-forks --apply` across the submodule fleet.
- Add owner overrides where the default fork owner is wrong.
- Document any local-only/file-backed submodules that should stay out of GitHub fork management.

### Phase 4 — Ops integration
- Add cron/systemd timer examples.
- Add review-agent posting mode and optional status labels.
- Consider a dedicated automation clone/worktree bootstrap script.

## Affected files
- `src/auto-fork-tax/**`
- `package.json`
- `specs/drafts/pi-auto-fork-tax-2026-03-20.md`

## Definition of done
- `tsx src/auto-fork-tax/cli.ts inventory` reports a fork/origin plan.
- `tsx src/auto-fork-tax/cli.ts review-pr ...` can generate a pi review via the production Open Hax proxy.
- `tsx src/auto-fork-tax/cli.ts snapshot-pr --apply` can create a snapshot branch, tag, and PR in a dedicated automation clone.
- `tsx src/auto-fork-tax/cli.ts cron-entry` emits a 6-hour cron line.
