# Fix run-submodule Typecheck Exit Codes
# Fix run-submodule Typecheck Exit Codes

## Context and Observations
- Nx target failures (e.g. `orgs-open-hax-codex:typecheck`, `orgs-riatzukiza-promethean-packages-test-utils:typecheck`) reproduces locally even though `tsc --noEmit` reports no diagnostics.
- Running `bun run src/giga/run-submodule.ts "orgs/open-hax/codex" typecheck` logs a successful `pnpm typecheck` run but still exits with code `1` (`src/giga/run-submodule.ts:205-221`).
- The helper's `run` function returns `false` whenever `proc.exitCode !== 0`, but it never awaits `proc.exited`, so `proc.exitCode` stays `null`, causing every invocation to be treated as a failure.

## Existing Issues / PRs
- No open issues or PRs referencing `run-submodule.ts` exit codes found in repo search as of 2025-11-14.

## Requirements
1. Update `run` in `src/giga/run-submodule.ts` to await process completion (`await proc.exited`) and capture the resulting exit code before deciding success/failure.
2. Preserve existing logging (stdout trimmed, stderr warnings) so downstream Nx logs remain concise.
3. Ensure helper propagates non-zero exit codes from underlying tools to allow genuine failures to bubble up.
4. Add regression coverage (unit or integration) or at minimum a low-cost sanity check verifying that `run` succeeds for a command that exits `0` and fails for non-zero.

## Definition of Done
- `bun run src/giga/run-submodule.ts "orgs/open-hax/codex" typecheck` exits with status `0` when the underlying typecheck succeeds.
- Representative Nx targets (`orgs-open-hax-codex:typecheck`, `orgs-riatzukiza-promethean:typecheck`, `orgs-riatzukiza-promethean-packages-test-utils:typecheck`) complete without the blanket failure message.
- Any new automated coverage (unit test or equivalent) passes.
- No additional regressions in `pnpm typecheck` / `pnpm lint` if relevant to touched code.

## Plan by Phase
1. **Phase 1 – Diagnostics**: capture git status and reproduce failures (complete).
2. **Phase 2 – Root Cause**: confirm exit-code propagation bug in `run-submodule` helper (complete).
3. **Phase 3 – Spec Draft**: record context, requirements, and DoD in this file.
4. **Phase 4 – Implementation**: update `src/giga/run-submodule.ts` and add targeted regression coverage.
5. **Phase 5 – Verification**: rerun `bun run src/giga/run-submodule.ts "orgs/open-hax/codex" typecheck` plus a couple of Nx targets.
6. **Phase 6 – Wrap-up**: summarize outcome, call out any follow-up needs.
