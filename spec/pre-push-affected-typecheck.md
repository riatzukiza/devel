# Pre-push Nx Affected Typecheck

## Context
- `.hooks/pre-push-typecheck.sh:16-19` currently runs `pnpm nx run-many -t typecheck --all`, which fans out to every project and makes every push block for several minutes.
- The workspace already uses Nx to orchestrate tasks; we only need to type check projects touched by the current branch.

## Existing Issues / PRs
- None discovered that target the pre-push hook or typecheck automation.

## Requirements
1. When pnpm and Nx are available, the hook must run `nx affected --target typecheck` instead of `run-many --all` so only changed projects are checked.
2. Default comparison base should match the remote branch head being pushed to (derived from the pre-push hook stdin / remote name). Operators can still override via `NX_BASE_REF`, and we should still call `git merge-base` to obtain an exact commit SHA for stability.
3. If the merge-base cannot be determined, fall back to `HEAD~1` so we always have a base.
4. If Nx reports "No projects affected" (exit code 0), the hook should log that information and continue without running anything else.
5. Preserve the existing fallback chain (pnpm run / npm run / bun / deno / tsc) for repos without Nx, and honor `SKIP_PREPUSH_TYPECHECK=1`.
6. The hook must surface failures (non-zero exit code) so pushes abort when the affected typecheck fails.

## Definition of Done
- Pre-push hook logs and executes an Nx affected typecheck scoped to changed projects relative to the configured base reference.
- Env overrides (`SKIP_PREPUSH_TYPECHECK`, `NX_BASE_REF`) are documented/logged within the script.
- Fallback behavior for non-Nx repositories remains unchanged.
- A dry-run (manual invocation) demonstrates the hook only runs affected projects and exits quickly when no projects are affected.
