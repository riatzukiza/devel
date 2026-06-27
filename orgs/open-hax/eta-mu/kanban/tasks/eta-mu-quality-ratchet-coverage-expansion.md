---
uuid: "eta-mu-quality-ratchet-coverage-expansion"
title: "Eta-mu Quality Ratchet — Coverage Expansion"
status: todo
priority: P1
labels: ["tasks", "quality", "coverage", "cljs", "testing", "5sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 5
category: tasks
---

# Eta-mu Quality Ratchet — Coverage Expansion

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Points: 5

## Purpose

Extend coverage discipline beyond the first `packages/eta-mu-runtime` CLJS ratchet without creating fake precision from noisy generated metrics.

## Starting baseline

`packages/eta-mu-runtime` currently gates CLJS line and statement coverage at 90% and was above that gate in the 2026-05-31 coverage ratchet baseline. `packages/eta-mu-extensions` has a coverage script, but raw c8 defaults can produce zero totals unless shadow-cljs generated runtime files are explicitly included.

## Scope

- `packages/eta-mu-extensions` meaningful c8 include/exclude configuration
- additional TypeScript/Vitest package coverage where stable
- coverage summaries and artifacts in CI
- documented threshold choices per package
- no branch/function 90% gate unless measured ranges are stable

## Work items

- [ ] Establish nonzero coverage totals for `packages/eta-mu-extensions` by targeting generated `eta_mu.extensions*` files and excluding tests.
- [ ] Decide an initial threshold per package based on measured baseline, with a plan to ratchet upward.
- [ ] Add coverage summaries/artifacts for the next high-value package.
- [ ] Document why any metric is advisory rather than enforced.
- [ ] Keep runtime's existing 90% statement/line ratchet green.

## Acceptance criteria

- [ ] At least one additional package has meaningful nonzero coverage reporting.
- [ ] Any enforced threshold is backed by a measured baseline and fails below that threshold.
- [ ] Runtime CLJS coverage remains >=90% statements/lines.
- [ ] CI exposes coverage summaries for the covered packages.
- [ ] No unrelated workspace dirt is staged.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:coverage
pnpm coverage
# plus the new package coverage command added by this task
git diff --check
```
