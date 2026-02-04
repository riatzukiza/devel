# Top-level submodule branch sync hooks (2025-11-16)

## Context
- Upstream @promethean CI now expects hook integration that delegates to `scripts/git-hooks/submodule-branch-sync.sh` for commit/push/post-checkout stages on special branches (device/*, dev/*, main, release).
- Current mega-repo hooks only run Nx/typecheck in `.git/hooks/pre-push`; no helper wiring exists yet.

## Scope / Files
- `.git/hooks/pre-push` (lines ~1-154): append helper call without disrupting existing typecheck flow.
- `.git/hooks/pre-commit` (new): invoke helper `commit` stage before other checks (none today).
- `.git/hooks/post-checkout` (new): invoke helper `post-checkout` stage to update submodules for special branches.
- `scripts/git-hooks/submodule-branch-sync.sh` (new, copied from `orgs/riatzukiza/promethean/scripts/git-hooks/submodule-branch-sync.sh`): provide helper locally so hooks are stable when submodule paths change.

## Requirements
- Preserve existing hook behavior (Nx/typecheck) while short-circuiting helper on non-special branches.
- Helper path resolves from repo root; avoid hard-coding submodule locations.
- Hooks must exit non-zero on helper failure to block unsafe pushes/commits.
- New script should be executable and match upstream logic (branch alignment, dirty/detached checks, CI stages).

## Definition of Done
- Hooks call the helper as described and still run existing checks.
- Helper script available under `scripts/git-hooks/` with executable bit.
- Special-branch logic only; feature/chore/etc. unaffected.
- Documented in this spec; no unrelated files changed.
