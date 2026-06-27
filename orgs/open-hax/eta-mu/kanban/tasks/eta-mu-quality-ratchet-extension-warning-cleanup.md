---
uuid: "eta-mu-quality-ratchet-extension-warning-cleanup"
title: "Eta-mu Quality Ratchet — Extension Warning Cleanup"
status: review
priority: P0
labels: ["tasks", "quality", "cljs", "warnings", "eta-mu-extensions", "5sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 5
category: tasks
---

# Eta-mu Quality Ratchet — Extension Warning Cleanup

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Points: 5

## Purpose

Make `packages/eta-mu-extensions` builds stop normalizing CLJS infer warnings as background noise.

## Scope

- `packages/eta-mu-extensions/src/eta_mu/extensions/task_timing.cljs`
- `packages/eta-mu-extensions/lib/eta_mu/opencode.cljs`
- shadow-cljs warning output for extension release builds
- warning-ratchet documentation or scanner if zero warnings cannot land in one slice

## Work items

- [x] Reproduce current extension warning output from a clean checkout.
- [x] Fix target inference warnings by adding type hints, extracting JS interop helpers, or moving raw host access behind named adapter helpers.
- [x] Avoid broad rewrites of extension behavior.
- [x] Add a narrow warning assertion or documented baseline so warnings cannot grow silently.
- [x] Keep generated `dist/` artifacts out of source commits unless the task explicitly requires them.

## Acceptance criteria

- [x] `pnpm --dir packages/eta-mu-extensions build` emits zero warnings, or any remaining warning is captured in a blocker ledger with owner and rationale.
- [x] `pnpm --dir packages/eta-mu-extensions test` passes.
- [ ] OpenCode review confirms no behavior drift in extension registration.
- [x] No unrelated workspace dirt is staged.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-extensions test
pnpm --dir packages/eta-mu-extensions build
git diff --check
```

## Verification results

- `pnpm install --frozen-lockfile`: passed.
- Baseline from `docs/eta-mu-quality-ratchet-baseline-inventory.md`: extension release build emitted 210 CLJS infer warnings across `task_timing.cljs` and `lib/eta_mu/opencode.cljs`.
- `pnpm --dir packages/eta-mu-extensions test`: passed; 72 tests, 195 assertions, 0 failures/errors, 0 warnings.
- `pnpm --dir packages/eta-mu-extensions build`: passed with the warning ratchet wrapper; all pi and OpenCode extension targets emitted `0 warnings`.
- `git diff --check`: passed.

## Implementation notes

- Replaced direct UI dot interop in `task_timing.cljs` with named `ui-set-status!` and `ui-notify!` helpers using typed JS function calls.
- Added typed Zod/OpenCode adapter helpers in `lib/eta_mu/opencode.cljs` to remove schema-builder target inference warnings without changing plugin surface behavior.
- Added `scripts/build-no-warnings.mjs` and routed the package `build` script through it so future release builds fail if shadow-cljs warnings return.
- Left generated `dist/`, `.shadow-cljs/`, `target/`, and `node_modules/` artifacts untracked.
