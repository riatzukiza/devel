# Pre-push Hook: Nx Affected-Only Typecheck (2025-11-12)

## Code References
- `.hooks/pre-push-typecheck.sh:76-105` computes an Nx merge-base and runs `pnpm nx affected -t typecheck --base <sha> --head <ref>`.
- `.hooks/pre-push-typecheck.sh:108-118` now logs the Nx affected result and exits with its status, eliminating the prior `pnpm nx run-many -t typecheck --all` fallback.
- The remaining fallbacks at `.hooks/pre-push-typecheck.sh:121-145` invoke generic `typecheck` scripts for non-Nx repos and must stay intact.

## Existing Issues / PRs
- None currently track this change (searched for "pre-push" and "typecheck" references in `/spec` and issue trackers).

## Requirements
1. When Nx is available, the hook must only run the affected typecheck; remove the `nx run-many --all` fallback so we never fan out to every project.
2. Continue using the merge-base resolution logic (`NX_BASE_REF`, `NX_HEAD_REF`, and computed `base_sha`). Any failure from `nx affected` should surface directly instead of silently running all projects.
3. Preserve the non-Nx fallback chain (pnpm/npm/bun/deno/tsc) so repositories without Nx still typecheck.
4. Ensure logging clearly distinguishes whether Nx affected ran, skipped (no affected projects), or fell back to the generic toolchain.

## Definition of Done
- `pnpm nx affected -t typecheck --base <sha> --head <ref>` is the only Nx pathway; the script never calls `nx run-many --all`.
- If Nx affected succeeds (even with "No projects affected"), the hook exits without invoking other commands.
- Non-Nx fallbacks continue to function, and `SKIP_PREPUSH_TYPECHECK=1` still short-circuits the hook.
- Manual invocation of the hook demonstrates the affected-only behavior and logs the chosen base reference.

## Implementation Plan (Phases)

### Phase 1 – Hook Adjustment
1. Remove the `pnpm nx run-many -t typecheck --all` fallback block at `.hooks/pre-push-typecheck.sh:108-115`.
2. Ensure `run_nx_affected_typecheck` returns the Nx exit code directly; no extra recovery path within the pnpm/Nx branch.

### Phase 2 – Documentation & Validation
1. Update this spec (or related docs) if logging/behavior changes warrant clarification.
2. Manually invoke `.hooks/pre-push-typecheck.sh` (with `SKIP_PREPUSH_TYPECHECK=1` toggled if needed) to confirm it stops after the Nx affected run.

## Change Log
- 2025-11-12: Removed the run-many fallback and added explicit success/failure logging for the Nx affected branch; manual run of `.hooks/pre-push-typecheck.sh` now shows only the Nx affected execution path prior to exiting.
