---
uuid: "eta-mu-quality-ratchet-baseline-inventory"
title: "Eta-mu Quality Ratchet — Baseline Inventory"
status: review
priority: P0
labels: ["tasks", "quality", "baseline", "lint", "testing", "3sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 3
category: tasks
---

# Eta-mu Quality Ratchet — Baseline Inventory

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Baseline report: `docs/eta-mu-quality-ratchet-baseline-inventory.md`
> Points: 3

## Purpose

Create a truthful, reproducible quality baseline before cleanup begins so future PRs know which warnings/tests are regressions and which are known blockers.

## Scope

- lint/test/build/coverage command inventory
- warning baseline for CLJS extension/runtime builds
- known local-vs-CI blocker ledger
- package/surface ownership map for quality gates
- no source behavior changes except docs/task metadata

## Work items

- [x] Enumerate existing package scripts for lint, test, typecheck, build, and coverage.
- [x] Run the current high-value gates and capture pass/fail/warning summaries.
- [x] Record known warnings with exact files, warning classes, and proposed owners.
- [x] Record known flaky/local-environment failures separately from product regressions.
- [x] Produce a short baseline report under `docs/`.
- [x] Update this task with verification evidence.

## Acceptance criteria

- [x] A docs baseline report exists and names commands, outcomes, warning counts, and blockers.
- [x] Baseline distinguishes source failures from local environment/generated-dist issues.
- [x] The next cleanup tasks have enough evidence to avoid rediscovering the same warnings.
- [x] No unrelated workspace dirt is staged.

## Verification

```bash
git diff --stat
git diff --check
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime cljs:coverage
pnpm --dir packages/eta-mu-extensions test
pnpm --dir packages/eta-mu-extensions build
pnpm --filter @open-hax/eta-mu-cli test
pnpm test
```

## Verification results

- `pnpm install --frozen-lockfile`: passed with workspace-bin warnings for not-yet-built `dist/*` CLIs.
- `pnpm --dir packages/eta-mu-runtime cljs:verify`: passed; boundary scanner reported `checked: 35`, `extern: 5`.
- `pnpm --dir packages/eta-mu-runtime cljs:coverage`: passed; statements/lines 93.77%, above the >=90% gate.
- `pnpm --dir packages/eta-mu-extensions test`: passed; 72 tests, 195 assertions, 0 warnings.
- `pnpm --dir packages/eta-mu-extensions build`: passed with 210 CLJS infer warnings concentrated in `task_timing.cljs` and `lib/eta_mu/opencode.cljs`.
- `pnpm --filter @open-hax/eta-mu-cli test` after install only: failed from missing built workspace package entries; passed after building CLI dependency artifacts.
- `pnpm test`: passed; noted as not covering the CLI test suite.
- `pnpm typecheck`: failed after install only from missing CLI build artifacts; passed after building CLI dependency artifacts.
- `git diff --check`: passed for this task's docs/kanban changes.
