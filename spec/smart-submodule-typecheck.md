---
uuid: a89348c5-530f-4734-bfd2-6a3645b51234
title: "Smart Submodule Typecheck Enforcement"
slug: smart-submodule-typecheck
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.409448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Smart Submodule Typecheck Enforcement

## Code References
- `src/giga/run-submodule.ts:22-42` – current logic only checks for a `package.json` `typecheck` script via pnpm and then falls back to Nx or skips entirely.
- `src/giga/run-submodule.ts:34-41` – skips whenever there is no `package.json` or `nx.json`, which allows many submodules to bypass typechecks.
- `projects/orgs-sst-opencode/project.json:7-25` – Nx proxy target shows that every submodule already exposes a `typecheck` goal that calls `run-submodule.ts`, so the missing behavior is inside the runner, not the Nx configuration.
- `.hooks/pre-push-typecheck.sh:67-118` – the pre-push hook invokes `pnpm nx ... typecheck`, so any failure in `run-submodule.ts` blocks pushes from the parent workspace.

## Existing Issues / PRs
- None filed; searched for "typecheck" within `/spec` and repo issues with no matches describing package-manager-aware typechecks.

## Requirements
1. `run-submodule.ts` must detect the correct package manager (bun, pnpm, yarn, npm) based on `package.json#packageManager` or lockfiles and use the corresponding CLI to run scripts.
2. When a `typecheck` script is missing but the repo is clearly TypeScript, automatically run `tsc --noEmit` (via the detected package manager or `npx --prefix`) so every package still performs a real typecheck.
3. Support non-Node toolchains that appear in this workspace, starting with Rust (detect `Cargo.toml` and run `cargo check`). The detection logic should be extensible for future managers ("etc").
4. Continue handling Nx-based submodules, but run Nx with the appropriate package manager instead of assuming pnpm, and prefer this Nx fallback before attempting raw TypeScript compilation.
5. Ensure TypeScript fallbacks execute through the detected package manager (`pnpm exec`, `yarn tsc`, `bunx tsc`, etc.) so local dependencies and type definitions are honored.
6. Emit a warning when no suitable typecheck strategy can be determined so maintainers know which repositories still need explicit coverage, but do not block pushes in that scenario.
7. Keep `test` and `build` targets working exactly as before, aside from using the correct package manager binary instead of hard-coded pnpm.
8. Regenerate or verify Nx project stubs so every submodule keeps a `typecheck` target pointing at the smarter runner.

## Definition of Done
- `bun run src/giga/run-submodule.ts "orgs/sst/opencode" typecheck` invokes bun instead of pnpm and succeeds by calling the submodule's `typecheck` script.
- A representative Node package without a `typecheck` script (e.g., `orgs/riatzukiza/promethean/packages/obsidian-export`) now runs `tsc --noEmit` automatically and fails if the TypeScript program has errors.
- A Rust repository (e.g., `orgs/openai/codex/codex-rs`) is detected and `cargo check` executes from the pre-push hook.
- Attempting to typecheck a repo with no recognized strategy logs a clear warning identifying the missing toolchain so the coverage gap can be addressed later.
- Generated Nx project files (existing ones and any newly generated ones) keep `typecheck` targets referencing the updated runner.
- Pre-push from the workspace no longer fails due to bun-based packages, and the hook output shows the correct manager-specific commands.

## Implementation Plan

### Phase 1 – Package Manager & Toolchain Detection
1. Introduce helper utilities inside `run-submodule.ts` to read `package.json`, discover lockfiles, and pick a `{ manager, runScriptCmd, execCmd }` tuple that works for bun/pnpm/yarn/npm.
2. Extend the runner so every target (test/build/typecheck) uses the detected manager when firing scripts; keep Nx fallback but route through the manager as well.
3. Add detection branches for Rust (`Cargo.toml`) and future toolchains via a pluggable strategy list.

### Phase 2 – Typecheck Strategy Enhancements
1. For Node repos missing a `typecheck` script, locate a TypeScript config (`tsconfig.json`, `tsconfig.build.json`, etc.) and run `tsc --noEmit` via the detected manager (`pnpm exec`, `yarn`, `bunx`, or `npx --prefix` fallback).
2. For Rust repos, run `cargo check --manifest-path <path>/Cargo.toml`.
3. When no strategy applies, emit a clear warning so the gap is visible without blocking the current push.

### Phase 3 – Verification & Documentation
1. Regenerate Nx project stubs if needed (via `bun run src/giga/generate-nx-projects.ts`) and ensure `projects/**/project.json` still includes the `typecheck` target.
2. Manually run the updated runner against representative submodules (bun-based, pnpm-based without scripts, Rust) and capture outputs for the final summary.
3. Document the supported toolchains and fallback order inline in `run-submodule.ts` for future maintainers.

## Change Log
- 2025-11-13: Initial spec drafted after diagnosing bun-based failures in the pre-push hook.
