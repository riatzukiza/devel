---
uuid: "eta-mu-quality-ratchet-test-suite-hardening"
title: "Eta-mu Quality Ratchet — Test Suite Hardening"
status: todo
priority: P1
labels: ["tasks", "quality", "testing", "flaky", "ci", "5sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 5
category: tasks
---

# Eta-mu Quality Ratchet — Test Suite Hardening

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Points: 5

## Purpose

Make eta-mu's test suite trustworthy enough that failures point to product regressions rather than local environment drift, stale generated files, or hidden test ordering assumptions.

## Scope

- root `pnpm test`
- `@open-hax/eta-mu-cli` Vitest suite
- `packages/eta-mu-runtime` CLJS/Vitest tests
- `packages/eta-mu-extensions` CLJS tests
- generated-file setup required before tests
- known skipped/flaky tests and local-environment blockers

## Work items

- [ ] Run the full local test matrix from a clean checkout.
- [ ] Identify tests that depend on SSH, clipboard, generated bins, network, or local shell state.
- [ ] Fix deterministic local-environment leaks with explicit stubs or setup scripts.
- [ ] Split slow or optional tests only when their gate is named and documented.
- [ ] Improve failure summaries for CI logs where current output hides the failing package.
- [ ] Update blocker ledger for any failures not fixed in this slice.

## Acceptance criteria

- [ ] `pnpm test` passes from a clean checkout after documented setup.
- [ ] `pnpm --filter @open-hax/eta-mu-cli test` passes without relying on host-specific SSH/clipboard state.
- [ ] Generated bin/dist prerequisites are either built by pretest hooks or tested with clear errors.
- [ ] Any skipped/flaky tests have explicit rationale.
- [ ] No unrelated workspace dirt is staged.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --filter @open-hax/eta-mu-cli test
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-extensions test
pnpm test
git diff --check
```
