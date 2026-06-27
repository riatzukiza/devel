# Unified Workbench Release Readiness and Migration Handoff (Task 10)

## Scope and Objective

This runbook finalizes Wave 4 handoff for the unified workbench effort. It provides an agent-executable release flow with explicit rollback routes, feature-flag gates, and verification commands tied to Task 1-9 coverage.

In scope:
- Release readiness checks
- Migration map and deprecation sequence
- Rollout/rollback decision tree
- Agent-executable dry-run scenario

Out of scope:
- New product behavior
- New dependencies

## Environment Preconditions

Before rollout or dry-run, ensure:

1. Workbench dependencies are installed in `orgs/open-hax/workbench`.
2. Chromium Playwright runtime is available.
3. Known workspace blocker is acknowledged: full TypeScript workspace build can fail externally because `/home/err/devel/orgs/config/tsconfig.base.json` is missing in this environment. Treat this as an environment precondition risk, not a product regression.

## Capability Evidence Map (Tasks 1-9)

| Task | Capability | Evidence |
| --- | --- | --- |
| 1 | React host + Reagent seam adapter contract | `tests/e2e/react-reagent-adapter-spike.playwright.spec.ts` |
| 2 | Unified shell layout + persistence | `tests/e2e/shell-layout.playwright.spec.ts` |
| 3 | Search surface (`Ctrl/Cmd+K`) + errors-first session results | `tests/e2e/search-surface.playwright.spec.ts` |
| 4 | Action rail (`Ctrl/Cmd+P`) + destructive confirmation | `tests/e2e/command-palette.playwright.spec.ts` (`task4` case) |
| 5 | Sessions + activity default behavior | `tests/e2e/activity-feed.playwright.spec.ts` |
| 6 | Cephalon donor controls (view/pagination/detail/sticky inspector) | `tests/e2e/task6-cephalon-donor.playwright.spec.ts` |
| 7 | Docs/settings route integration + persisted settings | `tests/e2e/task7-docs-settings.playwright.spec.ts` |
| 8 | Inspector multi-pin compare | `tests/e2e/task8-inspector-multi-pin.playwright.spec.ts` |
| 9 | Hardening, non-blocking retry, feature-flag rollback proof | `tests/e2e/task9-hardening.playwright.spec.ts` |

## Migration Map and Deprecation Sequence

### Migration map

1. Unified shell remains primary route (`/#/`).
2. React/Reagent seam route (`/#/react-reagent-spike`) remains behind a feature gate.
3. Donor fallback route is preserved and activated by disabling `reactReagentSeam`.

### Deprecation sequence (gated)

1. Keep donor fallback available until all Task 1-9 verification commands pass in release candidate runs.
2. Only after parity gates pass, mark donor route usage as deprecated in operator comms.
3. Remove fallback route in a later release train only after two consecutive green release cycles with no rollback invocation.

## Preflight Checklist (Agent-Executable)

Run from `orgs/open-hax/workbench`.

```bash
pnpm build:clojurescript
pnpm exec playwright test --project=chromium tests/e2e/react-reagent-adapter-spike.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/shell-layout.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/search-surface.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/command-palette.playwright.spec.ts --grep "task4:"
pnpm exec playwright test --project=chromium tests/e2e/activity-feed.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task6-cephalon-donor.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task7-docs-settings.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task8-inspector-multi-pin.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task9-hardening.playwright.spec.ts
```

Preflight pass criteria:
- All commands above exit 0.
- No manual validation required.

## Rollout Procedure

1. Confirm preflight checklist has passed in current candidate.
2. Keep seam enabled (default):

```bash
node -e "globalThis.window={}; globalThis.window.__OPENCODE_FEATURE_FLAGS__={reactReagentSeam:true}; console.log(globalThis.window.__OPENCODE_FEATURE_FLAGS__.reactReagentSeam)"
```

3. Execute production-candidate smoke command set:

```bash
pnpm exec playwright test --project=chromium tests/e2e/search-surface.playwright.spec.ts tests/e2e/command-palette.playwright.spec.ts tests/e2e/activity-feed.playwright.spec.ts
```

4. Publish candidate only if smoke command exits 0.

## Rollback Decision Tree (Explicit)

Use this tree when rollout verification fails.

1. Did failure involve seam route or adapter behavior (`/#/react-reagent-spike`)?
   - Yes -> disable seam flag and route to donor fallback.
   - No -> continue to step 2.
2. Did failure involve search/action/inspector behavior but app remains responsive?
   - Yes -> keep release blocked, run Task 3/4/8/9 suites, do not cut release.
   - No -> continue to step 3.
3. Is app startup or critical navigation broken?
   - Yes -> hard rollback to last known-good artifact and re-run hardening suite.

### Rollback Route A: Feature-flag fallback (preferred)

Behavior reference: `src/clojurescript/opencode_unified/ui.cljs` checks `window.__OPENCODE_FEATURE_FLAGS__.reactReagentSeam` and renders donor fallback when false.

Validation command:

```bash
pnpm exec playwright test --project=chromium tests/e2e/task9-hardening.playwright.spec.ts -g "feature flag disable rolls seam route back to donor fallback"
```

### Rollback Route B: Candidate rejection

If fallback is insufficient (non-seam critical regressions):

1. Stop candidate promotion.
2. Re-issue last known-good artifact.
3. Re-run:

```bash
pnpm exec playwright test --project=chromium tests/e2e/task9-hardening.playwright.spec.ts
```

4. Resume rollout only after clean rerun.

## Post-Rollout Verification

Run after rollout (or rollback completion):

```bash
pnpm exec playwright test --project=chromium tests/e2e/task9-hardening.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task7-docs-settings.playwright.spec.ts
pnpm exec playwright test --project=chromium tests/e2e/task8-inspector-multi-pin.playwright.spec.ts
```

Pass criteria:
- Hardening suite green.
- Docs/settings persistence green.
- Inspector compare flows green.

## Agent-Executable Dry-Run Scenario (No Human Steps)

Run this exact dry-run sequence from `orgs/open-hax/workbench`:

```bash
pnpm build:clojurescript && \
pnpm exec playwright test --project=chromium tests/e2e/react-reagent-adapter-spike.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/shell-layout.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/search-surface.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/command-palette.playwright.spec.ts --grep "task4:" && \
pnpm exec playwright test --project=chromium tests/e2e/activity-feed.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/task6-cephalon-donor.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/task7-docs-settings.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/task8-inspector-multi-pin.playwright.spec.ts && \
pnpm exec playwright test --project=chromium tests/e2e/task9-hardening.playwright.spec.ts
```

Expected outcome:
- Single command chain exits 0.
- Confirms runbook is executable end-to-end by an agent.

## Operational Notes

- Preserve keyboard semantics (`Ctrl/Cmd+K` search, `Ctrl/Cmd+P` action rail) during release validation.
- Keep existing selector/testid compatibility; runbook commands rely on current Playwright suites.
- Do not remove donor fallback until deprecation sequence gates pass.
