---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-coverage-workflow-md"
title: "Coverage Workflow and Runtime Thresholds"
status: review
priority: P1
labels: ["tasks", "coverage", "runtime", "cljs", "ratchet", "3sp"]
created_at: "2026-05-29T04:29:39.347Z"
source: "orgs/open-hax/eta-mu/specs/coverage-workflow.md"
category: "tasks"
---

> Source: `orgs/open-hax/eta-mu/specs/coverage-workflow.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/coverage-workflow.md`

# Coverage Workflow and Runtime Thresholds

## Context

Original eta-mu had partial coverage workflow scaffolding, but the root `coverage` script still pointed at the absorbed `agentd` service and did not enforce the CLJS runtime rewrite. The runtime now needs a real coverage ratchet with a hard 90% floor for the migrated CLJS implementation.

## Scope

- Add a reproducible root `pnpm coverage` command.
- Add `packages/eta-mu-runtime` CLJS coverage reporting through c8 over shadow-cljs generated runtime files.
- Enforce at least 90% statement and line coverage for `eta_mu.runtime*` CLJS runtime files.
- Publish the runtime coverage summary and artifact in CI.
- Keep existing extension coverage reporting separate; extension branch/function metrics remain noisy and are not part of this ratchet.

## Work items

- [x] Replace stale root coverage script with the eta-mu runtime coverage command.
- [x] Add runtime CLJS coverage script with c8 reporters: text, lcov, json-summary.
- [x] Add 90% statement/line threshold enforcement.
- [x] Add focused shape/message tests to lift runtime CLJS line coverage above 90%.
- [x] Add CI step summary and coverage artifact upload for runtime CLJS coverage.
- [x] Ignore local `coverage/` report directories.

## Acceptance criteria

- [x] `pnpm coverage` reports eta-mu-runtime CLJS coverage and fails below 90% lines/statements.
- [x] CI runs the runtime coverage ratchet on PRs and pushes to `main`.
- [x] Coverage report has nonzero totals and includes `eta_mu.runtime*` CLJS files.
- [x] Runtime tests still pass outside coverage mode.
- [x] No unrelated workspace dirt is staged.

## Verification

```bash
pnpm install --offline --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:coverage
pnpm coverage
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
git diff --check
```

Optional host-local workflow lint used during this slice: `actionlint .github/workflows/coverage.yml`.

## Baseline after ratchet

Runtime CLJS coverage after adding shape/message coverage:

- Statements: 93.77% (1853/1976)
- Lines: 93.77% (1853/1976)
- Functions: 74.46% (70/94)
- Branches: 61.49% (222/361)

The enforced threshold is intentionally line/statement coverage because shadow-cljs-generated branch/function ranges are not stable enough to use as a 90% merge gate yet.
