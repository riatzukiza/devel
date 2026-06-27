---
uuid: "eta-mu-quality-ratchet-cli-startup-smoke"
title: "Eta-mu Quality Ratchet — CLI Startup Smoke"
status: todo
priority: P0
labels: ["tasks", "quality", "startup", "extensions", "smoke", "3sp"]
created_at: "2026-05-31T00:45:00Z"
source: "kanban/epics/eta-mu-quality-ratchet.md"
points: 3
category: tasks
---

# Eta-mu Quality Ratchet — CLI Startup Smoke

> Parent epic: `kanban/epics/eta-mu-quality-ratchet.md`
> Points: 3

## Purpose

Catch missing built-in extension package targets before `eta-mu-beta` or release users see startup errors.

## Starting regression

A current-main checkout produced:

```text
Failed to load extension ".../packages/eta-mu-extensions/dist/pi/cljs-lisp-decomp-nudge/index.ts": Extension path does not exist
```

Rebuilding `packages/eta-mu-extensions` regenerated the missing path, so this task should convert that incident into an automated smoke gate.

## Scope

- package metadata extension path validation
- `packages/eta-mu-extensions` build output materialization
- `eta-mu`/`pi` startup smoke with built-in extensions enabled
- generated dist freshness checks without committing generated build output unless required by package policy

## Work items

- [ ] Add a script that validates every path in `@open-hax/eta-mu-extensions` `pi.extensions` exists after build.
- [ ] Add a CLI smoke test that starts the built CLI with built-in extensions and fails on `Failed to load extension`.
- [ ] Ensure the smoke runs after the extension build in CI or package tests.
- [ ] Document the local recovery command for missing extension dist targets.
- [ ] Verify the smoke catches `cljs-lisp-decomp-nudge` if its target is absent.

## Acceptance criteria

- [ ] Missing `dist/pi/*/index.ts` paths fail a package test or CI step.
- [ ] Normal `eta-mu-beta`/built CLI startup no longer depends on stale local generated artifacts.
- [ ] `packages/eta-mu-extensions build` still materializes `cljs-lisp-decomp-nudge`.
- [ ] No unrelated workspace dirt is staged.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --dir packages/eta-mu-extensions build
pnpm --dir packages/coding-agent build
ETA_MU_NO_DEFAULT_EXTENSIONS=0 timeout 20s node packages/coding-agent/dist/cli.js --help
# plus the new extension-path smoke script/test
git diff --check
```
