---
uuid: b9232025-8a92-4943-8c9b-ce582814092b
title: "Promethean Submodule Pointer Repair"
slug: promethean-submodule-pointer-fix
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
# Promethean Submodule Pointer Repair

## Problem Statement
- Running `git status` from the workspace root fails with `fatal: cannot chdir to '../../../../../../orgs/riatzukiza/promethean/packages/kanban'` because Git is still trying to evaluate the legacy `packages/kanban` path even though the working tree now lives at `orgs/riatzukiza/promethean/cli/kanban`.
- `orgs/riatzukiza/promethean/.gitmodules:13-16` tracks the new layout via `[submodule "cli/kanban"]` with `path = cli/kanban`, but the nested gitdir that backs the submodule (`.git/modules/promethean/modules/packages/kanban/config:6`) still advertises `core.worktree = ../../../../../../orgs/riatzukiza/promethean/packages/kanban`.
- Every Promethean child submodule was manually moved during the restructure, so their `.git` pointer files and the corresponding `core.worktree` values no longer align with the locations declared in `.gitmodules`. As soon as Git recurses into one of these inconsistent modules it aborts.

## External References
- Git submodule plumbing uses a `.git` file pointing into `$GIT_DIR/modules/<name>/` plus a `core.worktree` entry to locate the working tree (see [gitsubmodules documentation, "Forms"](https://git-scm.com/docs/gitsubmodules#_forms)).
- When directories move, Git expects the gitdir/worktree relationship to be refreshed via config edits or helper commands such as [`git submodule absorbgitdirs`](https://git-scm.com/docs/git-submodule#Documentation/git-submodule.txt-absorbgitdirs), which rewrites `.git` pointers and `core.worktree` paths.

## Existing Issues / PRs
- No tracked issues or PRs mention this breakage; failure was observed locally via `git status`.

## Requirements
1. Enumerate every Promethean child submodule defined in `orgs/riatzukiza/promethean/.gitmodules` and confirm its working tree now lives in the expected destination (e.g., `cli/*`, `services/*`, `packages/*`).
2. For each child, ensure the `.git` pointer under the working tree and the `core.worktree` entry inside the backing gitdir both resolve to the new directory.
3. Avoid recloning data unless absolutely necessary; reuse the existing `.git/modules/promethean/modules/**` directories to save time.
4. Keep URLs/branches from `.gitmodules` intact—only the filesystem linkage is changing.

## Definition of Done
- `git -C orgs/riatzukiza/promethean status -sb` completes without fatal errors.
- Top-level `git status -sb` (from `/home/err/devel`) succeeds and reports Promethean plus its children clean (or with intentional modifications only).
- Spot-checking `cat orgs/riatzukiza/promethean/<child>/.git` shows gitdir paths that resolve correctly, and `git config --file <gitdir>/config --get core.worktree` echoes the corresponding `<repo>/orgs/riatzukiza/promethean/<child>` directory.
- Document the remediation steps and commands run (for reproducibility) in the final response.

## Plan (Phases)
### Phase 1 – Inventory & Detection
1. Parse `orgs/riatzukiza/promethean/.gitmodules` to produce the authoritative list of submodule paths.
2. For each path, capture:
   - The gitdir target from `<path>/.git`.
   - The `core.worktree` recorded in `<gitdir>/config`.
   - Whether those entries already match the new location.
3. Generate a report so we can validate coverage and spot any missing directories before editing.

### Phase 2 – Pointer & Config Repair
1. For every mismatched module, run `git config --file <gitdir>/config core.worktree <abs-path>` (or edit the config file) so it points to the relocated tree.
2. If the `.git` file still references an obsolete gitdir path (because a gitdir was renamed), rewrite it with the correct relative pointer.
3. Where necessary, move the gitdir inside `.git/modules/promethean/modules/**` so its folder hierarchy mirrors the new structure (e.g., `modules/cli/<name>`), using `mv` plus pointer updates to keep relationships consistent.
4. Run `git -C orgs/riatzukiza/promethean submodule sync --recursive` to propagate any updated URLs/paths into `.git/config`.

### Phase 3 – Validation & Documentation
1. Execute `git -C orgs/riatzukiza/promethean submodule foreach --recursive 'git status -sb'` to ensure every child responds normally.
2. Run `git status -sb` from the workspace root to confirm no fatal errors remain.
3. Update this spec’s changelog section (if needed) and summarize the fix plus verification commands in the final response.
