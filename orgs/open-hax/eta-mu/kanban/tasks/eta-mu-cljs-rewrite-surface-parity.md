---
uuid: "eta-mu-cljs-rewrite-surface-parity"
title: "Eta-mu CLJS Rewrite — CLI/TUI/Web Surface Parity"
status: review
priority: P1
labels: ["tasks", "cljs", "rewrite", "parity", "8sp"]
created_at: "2026-05-29T21:18:48Z"
source: "kanban/epics/eta-mu-cljs-runtime-rewrite.md"
points: 8
category: tasks
---

# Eta-mu CLJS Rewrite — CLI/TUI/Web Surface Parity

> Parent epic: `kanban/epics/eta-mu-cljs-runtime-rewrite.md`
> Points: 8

## Purpose

Prove existing eta-mu user-facing surfaces can be served by CLJS-backed implementations without breaking current commands, packages, or UI entrypoints.

## Scope

- `eta-mu` and `pi` binary behavior
- package export compatibility for runtime consumers
- TUI rendering/state flows
- web UI / opencode-reactant where affected
- extension manifests consumed by OpenCode and pi harnesses

## Work items

- [x] Select one thin end-to-end command path for first CLJS-backed parity.
- [x] Route that path through a compiled CLJS export while preserving its current CLI/API contract.
- [x] Add parity fixtures for command output, exit codes, and structured return values.
- [x] Document known gaps instead of silently changing behavior.
- [x] Keep TS compatibility wrappers small and path-scoped.

## Acceptance criteria

- [x] At least one real command path runs through CLJS and passes existing CLI tests.
- [x] Existing package consumers can still import the same public symbols for the migrated path.
- [x] TUI/web behavior touched by the migrated path has smoke evidence or an explicit blocker.

## Verification

```bash
pnpm install --offline --frozen-lockfile
pnpm --dir packages/eta-mu-runtime cljs:verify
pnpm --dir packages/eta-mu-runtime test
pnpm --dir packages/eta-mu-runtime typecheck
pnpm --dir packages/eta-mu-runtime build
pnpm --dir packages/ai build
pnpm --dir packages/agent build
pnpm --dir packages/tui build
pnpm --dir packages/kanban build
pnpm --dir packages/coding-agent build
ETA_MU_NO_DEFAULT_EXTENSIONS=1 node packages/coding-agent/dist/cli.js --version
pnpm --dir packages/coding-agent exec vitest run test/version-command-cljs-parity.test.ts
pnpm --filter @open-hax/eta-mu-cli test
pnpm -C packages/opencode-reactant exec shadow-cljs compile app
pnpm test
pnpm -C packages/eta-mu-extensions test
pnpm -C packages/eta-mu-extensions build
```

## Notes

Selected the existing `eta-mu`/`pi --version` path as the first thin surface-parity slice. The command now routes through the compiled CLJS ESM export `createSurfaceCommandResult` from the additive `@open-hax/eta-mu-runtime/cljs` subpath while preserving the CLI output (`0.70.15`) and exit code (`0`). The default `@open-hax/eta-mu-runtime` TypeScript entrypoint remains unchanged.

TUI/web smoke evidence: `pnpm -C packages/opencode-reactant exec shadow-cljs compile app` completed with 0 warnings. The command rewrote tracked generated CLJS resources locally; those generated deltas were intentionally restored and are not part of this task PR.

Full CLI suite evidence: `pnpm --filter @open-hax/eta-mu-cli test` passes with 110 files passed / 7 skipped and 1120 tests passed / 47 skipped. A small test-harness fix stubs SSH clipboard environment variables in `clipboard.test.ts` so local runs from SSH sessions do not accidentally exercise remote OSC52 behavior in tests named as local clipboard cases.
