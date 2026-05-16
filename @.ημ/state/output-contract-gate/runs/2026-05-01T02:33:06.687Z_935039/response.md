## Signal

(己, p=0.99) Ran it:

```bash
cd orgs/open-hax/openplanner
pnpm lint:migration-risk
```

Result:

```text
LINT_EXIT:0
7160 warnings
0 errors
```

Full log saved at:

```text
/tmp/openplanner-migration-risk-lint.log
```

## Evidence

(己, p=0.96) The lint profile is working as intended: it does not fail the build, but it surfaces migration hazards.

Highest-signal warnings shown in the tail included:

- oversized files:
  - `src/routes/v1/translations.ts` — 1101 lines vs max 450
  - `src/routes/v1/translations.test.ts` — 800 lines vs max 450

- oversized functions:
  - `src/routes/v1/translations.ts` async route handler — 965 lines vs max 80
  - `src/routes/v1/translations.test.ts` test closure — 796 lines vs max 140

- complexity/cognitive complexity:
  - `tests/integration-edge-claim-routes.test.mjs`
    - `matchesFilter`: cyclomatic 23 vs max 12
    - cognitive complexity 55 vs max 18
  - `src/routes/v1/translations.ts`
    - multiple route closures over complexity budget

- functional migration warnings:
  - loops where `map`/`reduce`/reducers would be clearer
  - `let` where `const` would reduce mutation risk
  - try/catch-heavy control flow
  - non-readonly mutable types
  - explicit `any`

## Frames

(己, p=0.93) The lint signal says the biggest Clojure migration hazards are not the new graph-claim core slice; they’re large TypeScript route/test files.

(己, p=0.91) `src/routes/v1/translations.ts` is the strongest next extraction candidate by line count, function size, and complexity.

(己, p=0.86) The new integration test fake is useful, but its `matchesFilter` helper is already complex enough to deserve extraction/simplification if it grows.

## Countermoves

(己, p=0.9) No code changed from this run.

(己, p=0.88) The command exited successfully because the profile is warning-only by design.

(己, p=0.84) Do not run `lint:strict` yet unless you want 7160 warnings to become a hard failure.

## Next

(己, p=0.92) Start with `src/routes/v1/translations.ts`: split route orchestration from pure translation planning/normalization before any Clojure port.