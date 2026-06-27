---
uuid: "eta-mu-quality-ratchet"
title: "Eta-mu Quality Ratchet — Delinting, Warning Cleanup, and Testing"
status: accepted
priority: P0
labels: ["epics", "quality", "lint", "warnings", "testing", "coverage", "26sp"]
created_at: "2026-05-31T00:45:00Z"
source: "user-request:2026-05-31"
points: 26
category: epics
---

# Eta-mu Quality Ratchet — Delinting, Warning Cleanup, and Testing

> Source: user request, 2026-05-31
> Board source: `orgs/open-hax/eta-mu/kanban/`
> Process: one PR per child task, OpenCode PR review required, CodeRabbit automatic review observed but not manually spammed
> Points: 26

## Purpose

Make eta-mu boringly reliable after the CLJS runtime cutover: every common local and CI path should have an explicit lint/warning/test gate, every known warning class should have an owner, and startup regressions like missing generated extension targets should be caught before users hit them.

This epic is a ratchet, not a cosmetic cleanup. Each child task should reduce the set of allowed warnings, flaky tests, stale generated artifacts, or unverified startup paths.

## Quality thesis

> Warnings are work items. Missing generated runtime files are regressions. Tests must prove the shipped package, not only the source tree.

Recent work proved the CLJS runtime path and added a 90% runtime line/statement coverage gate. The next layer is to bring the broader eta-mu repo into the same discipline:

- extension builds should not emit surprise infer warnings forever;
- default/beta CLI startup should smoke-test built-in extension package metadata;
- lint/test scripts should be discoverable and CI-owned;
- coverage should expand beyond the first runtime CLJS ratchet;
- failures should be recorded as blockers instead of hidden behind broad rebuilds.

## Process constraints

- One PR per child task.
- Work from clean task worktrees branched from current `origin/main`.
- Keep path-scoped staging; do not stage root or nested `receipts.edn` unless the PR explicitly owns receipts.
- Keep package names, binaries, extension names, and public exports stable unless a task explicitly changes them.
- OpenCode PR code review is required before merge.
- CodeRabbit runs automatically; do not manually request review after every push. If automatic reruns are quota/usage-credit blocked after fixes, document addressed findings in a PR comment and proceed only when branch protection, CI, and OpenCode are green.

## Child tasks

1. `kanban/tasks/eta-mu-quality-ratchet-baseline-inventory.md`
   - Establish the current lint/warning/test/coverage baseline and blocker ledger.

2. `kanban/tasks/eta-mu-quality-ratchet-extension-warning-cleanup.md`
   - Remove or explicitly classify CLJS extension build warnings, starting with `task_timing.cljs` and `lib/eta_mu/opencode.cljs` infer warnings.

3. `kanban/tasks/eta-mu-quality-ratchet-cli-startup-smoke.md`
   - Add smoke coverage so `eta-mu-beta`/package startup cannot regress on missing extension dist targets such as `cljs-lisp-decomp-nudge/index.ts`.

4. `kanban/tasks/eta-mu-quality-ratchet-lint-gates.md`
   - Define and wire repo-local lint/format/static checks for TypeScript, markdown, workflows, package metadata, and CLJS boundaries.

5. `kanban/tasks/eta-mu-quality-ratchet-test-suite-hardening.md`
   - Stabilize the full test matrix, isolate known flaky/local-environment failures, and make failure output actionable.

6. `kanban/tasks/eta-mu-quality-ratchet-coverage-expansion.md`
   - Expand meaningful coverage gates beyond `packages/eta-mu-runtime` while avoiding noisy shadow-cljs branch/function false precision.

## Acceptance criteria

- [ ] A baseline report names every current lint, warning, coverage, and test gate plus known blockers.
- [ ] Extension build warnings are either eliminated or tracked with task-level owner/justification and no silent drift.
- [ ] CLI/package startup smoke tests catch missing built-in extension dist paths before release/local beta use.
- [ ] Repo-local lint and workflow checks are scriptable and documented.
- [ ] Full test-suite failures are reproducible, classified, and either fixed or recorded with a narrow blocker.
- [ ] Coverage gates cover the CLJS runtime and at least one additional high-value package/surface.
- [ ] CI and PR workflow require OpenCode review and expose quality summaries.

## Verification map

Use the narrowest relevant gate per child task, then run broader gates before merge when package metadata, workflows, or startup behavior changed.

Baseline candidate commands:

```bash
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime cljs:coverage
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-extensions test
pnpm --dir packages/eta-mu-extensions build
pnpm --filter @open-hax/eta-mu-cli test
pnpm test
pnpm coverage
git diff --check
```

Add task-specific gates such as `actionlint`, package smoke tests, or markdown lint only in the task that owns wiring those tools.

## Known starting signals

- `packages/eta-mu-runtime` CLJS coverage currently enforces >=90% statements/lines and was above that gate in the 2026-05-31 coverage ratchet baseline.
- `packages/eta-mu-extensions build` currently completes but emits CLJS infer warnings in `task_timing.cljs` and `lib/eta_mu/opencode.cljs`.
- `eta-mu-beta` previously failed when the primary checkout was stale and `dist/pi/cljs-lisp-decomp-nudge/index.ts` was absent; rebuilding `packages/eta-mu-extensions` regenerated the target.
- Root and nested receipt ledgers are intentionally dirty during agent work and must not be swept into quality PRs accidentally.
