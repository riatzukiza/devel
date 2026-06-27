# Test Stability Improvements

## Context & Findings

- `src/tests/safe-rule-evaluation.test.ts:11-90` builds mock task/board data with the status value `"open"`. The runtime validators invoked by `safeEvaluateTransition` (see `src/lib/safe-rule-evaluation.ts:97-170`) only recognize canonical statuses such as `incoming`/`icebox`. As a result, all success-path tests fail validation before the rule evaluation executes, leading to the observed assertions failing.
- `src/tests/underscore-bug-demo.test.ts:1-59` is an executable script with console logging, not an AVA test (no `import test from 'ava'`). When AVA globbing pulls in every file under `dist/tests/**`, it runs this module and errors with "No tests found".
- `src/tests/helpers/cli-test-utils.ts:1-259` exports helper utilities but similarly lacks any AVA `test` registrations. Because AVA still runs every file beneath `dist/tests/**`, it halts upon loading this helper with the same "No tests found" error before the remaining suites complete.

## Requirements / Definition of Done

1. Update the safe-rule evaluation tests to use valid board/task fixtures so the validation layer passes and the tests assert the intended behavior.
2. Convert `underscore-bug-demo.test.ts` into a proper AVA test (or suite) that programmatically asserts the normalization parity instead of only printing a table.
3. Ensure `cli-test-utils.ts` registers at least one lightweight AVA test (or is relocated) so AVA no longer treats it as a malformed suite.
4. Run `pnpm test:coverage` and verify all tests complete without pending/timeout failures.
5. Keep console noise minimal (remove unnecessary debug logging if touched) and ensure lint/build continue to succeed.

## Phase Plan

### Phase 1 – Validation Fixes
- Adjust `mockTask`/`mockTaskForBoard`/`mockBoard` fixtures in `safe-rule-evaluation.test.ts` to use `incoming`/`ready` statuses that satisfy the validators.
- Re-run the safe-rule tests (or targeted subset) to confirm the assertions now exercise the rule evaluator rather than failing validation.

### Phase 2 – Normalize Non-test Files
- Rewrite `underscore-bug-demo.test.ts` as an actual AVA test: iterate over representative column names and assert `columnKey()` equals the transition rules normalization result. Remove the manual console table.
- Add a minimal smoke test near the bottom of `cli-test-utils.ts` (e.g., export verification) so AVA registers at least one test when it loads the helper module.

### Phase 3 – Verification
- Execute `pnpm test:coverage` to ensure the full suite passes (and coverage thresholds met).
- Capture any additional regressions surfaced during the test run.

### Phase 4 – Documentation & Wrap-up
- Summarize the changes, update TODO tracking, and prepare for commit once tests succeed.
