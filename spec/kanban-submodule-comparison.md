---
uuid: e38f20d9-f32a-4fa5-aa7c-9cbddce9a9fb
title: "Kanban Submodule Comparison"
slug: kanban-submodule-comparison
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Kanban Submodule Comparison

## Context
- Path: `orgs/riatzukiza/promethean/packages/kanban`
- Submodule update failed because local HEAD `c8e48f1` and `origin/main` (`b51f2f2`) have unrelated histories.
- Local copy appears to be a lightweight extractor from the Promethean monorepo, while the new remote repo is a standalone dump with every source file checked in.

## Code References
- `orgs/riatzukiza/promethean/packages/kanban/package.json:18-25` — local repo metadata still references the Promethean monorepo (`riatzukiza/promethean`).
- `orgs/riatzukiza/promethean/packages/kanban/package.json:51-58` — only basic build/test scripts exist locally; no clean/lint/typecheck coverage.
- `orgs/riatzukiza/promethean/packages/kanban/package.json (origin/main)#L40-L70` — remote repo adds `clean`, `build:test`, `lint`, and `typecheck` scripts plus extra workspace copies inside `dist/`.
- `orgs/riatzukiza/promethean/packages/kanban (origin/main)` — 364 tracked files (src/, docs/, pseudo/, scripts/, tests/, etc.) totaling ~61K insertions versus the two local commits (initial seed + repo URL tweak).

## Existing Issues
- No GitHub issue or PR referenced; user manually observed the failure when invoking `submodules-update --recursive`.

## Definition of Done
- Explain why the histories diverged.
- Enumerate the substantive differences between the local and remote states.
- Recommend viable remediation paths (reset to remote vs. keep local history) so submodule sync can succeed again.

## Requirements
1. Identify commit graphs for both histories.
2. Highlight key file-level differences (size, scripts, metadata).
3. Provide guidance for choosing which history to trust and how to align the submodule.

## Actions Taken
- Created and pushed branch `promethean/dev` inside the nested submodule so the detached SHA `c8e48f1` is reachable through a named ref.
- Updated `orgs/riatzukiza/promethean/.gitmodules` so `packages/kanban` tracks `promethean/dev` (line 13) and synced the git config, keeping the monorepo pointed at the legacy history.
- Re-ran `submodules-sync --recursive` / `submodules-update --recursive` to verify the fix before moving on to the next failure.

## Next Steps
1. Decide whether to eventually replace the nested submodule with the standalone repo once the evaluation is complete.
2. Keep the branch updated (if local changes are made) until a final decision is reached.
