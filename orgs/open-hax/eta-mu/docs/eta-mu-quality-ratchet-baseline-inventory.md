# Eta-mu Quality Ratchet Baseline Inventory

Date: 2026-05-31
Branch: `pi/eta-mu-quality-ratchet-baseline-inventory-main`
Base: `origin/main` at `f0d570ab7d0c39ad3a6381e6fe442135e456bbb5`
Task: `kanban/tasks/eta-mu-quality-ratchet-baseline-inventory.md`

## Purpose

This report records the first quality-ratchet baseline for eta-mu after the CLJS runtime cutover and the quality-ratchet planning PR. It is intentionally descriptive: it does not fix source behavior, but it names the current gates, warnings, blockers, and next cleanup owners.

## Script inventory

### Root workspace

| Script | Command | Baseline note |
| --- | --- | --- |
| `build` | `pnpm -r --no-bail build` | Broad package build; can update generated model data through `packages/ai` generation. |
| `test` | runtime + github + docs/truth/presence/kanban/signal package tests | Passes; does not include `@open-hax/eta-mu-cli` tests. |
| `typecheck` | runtime, github, presence, kanban typechecks | Requires built workspace dependency artifacts for `eta-mu-github`. |
| `coverage` | `pnpm --dir packages/eta-mu-runtime cljs:coverage` | Enforces runtime CLJS lines/statements >= 90%. |
| `docs` | `pnpm docs:ts && pnpm docs:cljs` | Not run in this baseline. |

### High-value package scripts

| Package | Quality scripts |
| --- | --- |
| `@open-hax/eta-mu-runtime` | `build`, `typecheck`, `test`, `cljs:compile`, `cljs:test`, `cljs:coverage`, `cljs:smoke`, `cljs:boundary`, `cljs:verify` |
| `@open-hax/eta-mu-extensions` | `build`, `test`, `test:coverage` |
| `@open-hax/eta-mu-cli` | `build`, `test` |
| `@open-hax/eta-mu-github` | `build`, `test`, `typecheck` |
| `@open-hax/kanban-legacy` | `build`, `test`, `test:e2e`, `build:web` |
| `@open-hax/presence-core` | `build`, `typecheck`, `test` |
| `@open-hax/output-contract-gate` | `build`, `typecheck`, `test` |
| `@open-hax/agentd` | `build`, `test`, `coverage` |

Other packages expose narrower `build`, `test`, or `check` scripts, but the table above names the surfaces that currently matter most for this quality ratchet.

## Gate outcomes

Commands were run from a fresh task worktree after `pnpm install --frozen-lockfile`.

| Gate | Exit | Outcome | Notes |
| --- | ---: | --- | --- |
| `pnpm install --frozen-lockfile` | 0 | Pass with warnings | 27 warning lines, mainly workspace bin links that point at not-yet-built `dist/*` CLIs plus ignored dependency build scripts. |
| `pnpm --dir packages/eta-mu-runtime cljs:verify` | 0 | Pass | CLJS compile/test/smoke/boundary all green; boundary scanner reported `checked: 35`, `extern: 5`. |
| `pnpm --dir packages/eta-mu-runtime cljs:coverage` | 0 | Pass | Runtime CLJS total coverage: statements 93.77%, branches 61.49%, functions 74.46%, lines 93.77%. Lines/statements gate is >=90%. |
| `pnpm --dir packages/eta-mu-extensions test` | 0 | Pass | 72 tests, 195 assertions, 0 failures/errors; node-test build emitted 0 warnings. |
| `pnpm --dir packages/eta-mu-extensions build` | 0 | Pass with warnings | Build completed and registered all extension outputs, including `lisp-decomp-nudge`; emitted 210 CLJS infer warnings. |
| `pnpm --filter @open-hax/eta-mu-cli test` after install only | 1 | Fails due generated/build prerequisites | 76 suites failed from unresolved workspace package entries (`eta-mu-agent-core`, `eta-mu-ai`, `eta-mu-tui`); 2 stdout cleanliness tests also failed because spawned CLI exited 1. |
| `pnpm test` | 0 | Pass | Root test suite green; this root script does not cover `@open-hax/eta-mu-cli` tests. |
| `pnpm typecheck` after install only | 2 | Fails due generated/build prerequisites | `eta-mu-github` cannot resolve `@open-hax/eta-mu-cli` until CLI build artifacts exist. |
| CLI dependency build set | 0 | Pass | Built `eta-mu-ai`, `eta-mu-agent-core`, `eta-mu-tui`, `kanban-legacy`, `output-contract-gate`, then `eta-mu-cli`. |
| `pnpm --filter @open-hax/eta-mu-cli test` after dependency builds | 0 | Pass | 110 files passed, 7 skipped; 1120 tests passed, 47 skipped. |
| `pnpm typecheck` after dependency builds | 0 | Pass | Runtime, github, presence, and kanban typechecks passed. |

## Warning baseline

### Install warnings

`pnpm install --frozen-lockfile` succeeds but warns because workspace package bins point to built files that do not exist yet in a clean checkout.

Representative missing bin targets:

- `packages/ai/dist/cli.js` for `pi-ai`
- `packages/kanban/dist/cli.js` for `openhax-kanban`
- `packages/output-contract-gate/dist/cli.js` for `output-contract-gate`
- `packages/coding-agent/dist/cli.js` for `pi` / `eta-mu`

Owner recommendation: `eta-mu-quality-ratchet-cli-startup-smoke` should decide whether build prerequisites are documented, prebuilt by tests, or validated with clearer errors.

### Extension build infer warnings

`pnpm --dir packages/eta-mu-extensions build` succeeds but emits 210 CLJS `:infer-warning` warnings:

| File | Count | Representative expressions | Owner recommendation |
| --- | ---: | --- | --- |
| `packages/eta-mu-extensions/src/eta_mu/extensions/task_timing.cljs` | 42 | `(. ctx -ui)`, `(. ctx -hasUI)`, `(. (.-ui ctx) setStatus ...)` | `eta-mu-quality-ratchet-extension-warning-cleanup` |
| `packages/eta-mu-extensions/lib/eta_mu/opencode.cljs` | 168 | `(. z -enum)`, `(. base describe desc*)`, `(. tool-helper -schema)` | `eta-mu-quality-ratchet-extension-warning-cleanup` |

The warning count is inflated by repeated extension release builds that compile shared helper code more than once, but the underlying source locations are concentrated in the two files above.

### Runtime CLJS warnings

`packages/eta-mu-runtime` CLJS compile/test/coverage paths emitted 0 warnings in this baseline.

## Blocker and drift ledger

| Signal | Classification | Evidence | Next owner |
| --- | --- | --- | --- |
| Direct CLI test fails from a clean install-only worktree. | Generated/build prerequisite gap, not a product test regression after build. | Fails resolving `@open-hax/eta-mu-agent-core`, `@open-hax/eta-mu-ai`, and `@open-hax/eta-mu-tui`; passes after dependency builds. | `eta-mu-quality-ratchet-test-suite-hardening` |
| Root `pnpm test` is green but does not include CLI tests. | Coverage/gate composition gap. | `pnpm test` passed while direct CLI test failed before build prerequisites. | `eta-mu-quality-ratchet-test-suite-hardening` |
| Root `pnpm typecheck` fails after install-only checkout. | Generated/build prerequisite gap. | `eta-mu-github` cannot resolve `@open-hax/eta-mu-cli`; passes after dependency builds. | `eta-mu-quality-ratchet-lint-gates` or `test-suite-hardening` |
| `packages/eta-mu-extensions build` emits 210 infer warnings. | Warning debt. | Concentrated in `task_timing.cljs` and `lib/eta_mu/opencode.cljs`. | `eta-mu-quality-ratchet-extension-warning-cleanup` |
| Building `@open-hax/eta-mu-ai` rewrote `packages/ai/src/models.generated.ts` with provider model catalog drift. | Generated source drift / reproducibility risk. | Local diff removed/changed provider model records during build; reverted before commit. | Future generated-model determinism task or `lint-gates` |
| Generated extension dist is required for startup. | Known startup regression class. | Previous `eta-mu-beta` failure missing `dist/pi/cljs-lisp-decomp-nudge/index.ts`; current build materializes it. | `eta-mu-quality-ratchet-cli-startup-smoke` |

## Recommended next implementation order

1. `eta-mu-quality-ratchet-extension-warning-cleanup`
   - The warning source is narrow and measurable: 210 warnings from two files.
2. `eta-mu-quality-ratchet-cli-startup-smoke`
   - The install/build prerequisite gap overlaps with the observed missing extension dist startup failure.
3. `eta-mu-quality-ratchet-test-suite-hardening`
   - Root `pnpm test` and direct CLI tests currently disagree about what is covered.
4. `eta-mu-quality-ratchet-lint-gates`
   - Use the baseline to define explicit static-quality commands without accidental generated-source churn.
5. `eta-mu-quality-ratchet-coverage-expansion`
   - Runtime coverage is healthy; extension coverage can be added once extension warnings are quieter.

## Verification artifacts

Raw command logs were written locally under `/tmp/eta-mu-baseline/` during this run. They are not committed because this PR is a source-control baseline report, not a log artifact dump.

Tracked source changes for this task are limited to:

- this report
- `kanban/tasks/eta-mu-quality-ratchet-baseline-inventory.md`
