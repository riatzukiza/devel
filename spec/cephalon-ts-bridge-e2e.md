---
uuid: faf4263f-399b-4dae-9950-579ff480d134
title: "cephalon ts bridge e2e"
slug: cephalon-ts-bridge-e2e
status: incoming
priority: P2
tags: []
created_at: "2026-02-04T20:48:57.566520Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
## Summary
Enable the CLJS cephalon service to start the TS bridge via ecosystem env, then add CLJS e2e coverage around the bridge behavior so we can verify it before deprecating TS.

## Requirements
- Add `CEPHALON_TS_BRIDGE=true` to the cephalon ecosystem app env and rebuild/restart the service.
- Add CLJS e2e coverage that verifies `start-ts-bridge!` honors config and wires the TS bridge call path.
- Run CLJS tests and build, and report diagnostics.

## Plan
Phase 1: Ecosystem wiring
- Update `ecosystems/services_cephalon.cljs` to include `CEPHALON_TS_BRIDGE` in `:env` for the `cephalon` app.
- Run `pnpm generate-ecosystem` and restart `cephalon` via pm2.

Phase 2: CLJS e2e tests
- Add an e2e test namespace under `services/cephalon-cljs/test/promethean/e2e/`.
- Verify `promethean.main/start-ts-bridge!` calls `promethean.bridge.cephalon-ts/create-cephalon-app!` and `start-cephalon!` when `:runtime :start-ts-bridge` is true.
- Verify no TS bridge calls when the config flag is false.
- Register the new test namespace in `services/cephalon-cljs/test/promethean/test_runner.cljs`.

Phase 3: Verification
- Run CLJS tests: `pnpm --dir services/cephalon-cljs test`.
- Run CLJS build: `pnpm --dir services/cephalon-cljs build`.
- Run LSP diagnostics on modified files.

## Files and line references
- `ecosystems/services_cephalon.cljs`: app env block for `cephalon` (lines 8-19).
- `services/cephalon-cljs/src/promethean/main.cljs`: `make-config` reads `CEPHALON_TS_BRIDGE` and `start-ts-bridge!` wiring (lines 40-119).
- `services/cephalon-cljs/src/promethean/bridge/cephalon_ts.cljs`: `create-cephalon-app!` / `start-cephalon!` implementations (lines 30-63).
- `services/cephalon-cljs/test/promethean/test_runner.cljs`: test registry (lines 1-53).
- `services/cephalon-cljs/test/promethean/e2e/workflows_test.cljs`: existing e2e pattern (lines 1-60).

## Existing issues / PRs
- Issues: not checked.
- PRs: not checked.

## Definition of Done
- Ecosystem includes `CEPHALON_TS_BRIDGE=true` and cephalon is restarted from the new config.
- New e2e tests verify TS bridge on/off behavior in CLJS.
- `pnpm --dir services/cephalon-cljs test` passes.
- `pnpm --dir services/cephalon-cljs build` passes.
- LSP diagnostics report no errors for modified files.

## Notes
- Fixed frontmatter parsing so `promethean.contracts.markdown-frontmatter-test` and `promethean.sys.sentinel-test` now pass.
