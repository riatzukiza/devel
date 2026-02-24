---
uuid: f6ab0488-a1ae-4d20-acc4-5307bd08e58b
title: "Move Legacy Codex Submodule to `open-hax/codex`"
slug: move-opencode-openai-codex-auth-to-open-hax-codex
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
# Move Legacy Codex Submodule to `open-hax/codex`

## Background & References
- `.gitmodules:13-15` still pointed at the old submodule living under `orgs/numman-ali`, so it must be updated to `orgs/open-hax/codex` with the `open-hax/codex` remote.
- Workspace docs (README, AGENTS, cross-repository flows) referenced the previous path and need to highlight the new location.
- Nx metadata (`projects/*`, `graph.json`, `out.json`, `tools/nx-plugins/giga/deps.json`) registered the legacy project key and must be retargeted to the `orgs-open-hax-codex` definition.
- `docs/reports/submodules-recursive-status-2025-11-13.md:12-84` and `docs/MASTER_CROSS_REFERENCE_INDEX.md:15-123` document the submodule under the old organization/path and require updates.

## Existing Issues / PRs
- No existing issues or pull requests mention the migration after searching for `open-hax/codex` across the workspace.

## Definition of Done
1. `.gitmodules` points to the `orgs/open-hax/codex` path and `open-hax/codex` remote.
2. Submodule checkout exists at `orgs/open-hax/codex` without touching the legacy path under `orgs/numman-ali`.
3. Nx metadata (`projects/*`, `graph.json`, `out.json`, `tools/nx-plugins/giga/deps.json`) refers to the new project key/path.
4. Workspace docs (README, AGENTS, cross-reference docs, manifests, and reports) referencing the old path are updated to the new organization/repo name.
5. Any automation scripts or commands that shell into the old path now target `orgs/open-hax/codex`.
6. `git status` shows only the intended set of updated files plus the new submodule state.

## Requirements & Constraints
- We cannot rename the existing folder in-place; instead we must add the new submodule directory and adjust references.
- Preserve other unrelated submodule entries and Nx configuration.
- Keep documentation accurate by updating textual references that describe the path/org/repo.
- Ensure commands keep quoting for paths with spaces and avoid destructive git actions.
- Validate that no tooling still points to the legacy submodule path once the move is complete.

## Plan (Phases)
### Phase 1: Git/Submodule Metadata
- Update `.gitmodules` entry to use the new path/URL; add the submodule under `orgs/open-hax/codex`.
- Initialize/sync the new submodule checkout to ensure contents are available.

### Phase 2: Tooling Config Updates
- Add/replace Nx project metadata: rename the old `projects/orgs-numman-ali-*/project.json` to a new project file for `orgs-open-hax-codex` and update any dependent configs (`graph.json`, `out.json`, `tools/nx-plugins/giga/deps.json`).
- Adjust automation scripts, manifests, and dependency graphs referencing the old key/path.

### Phase 3: Documentation & Verification
- Update README, AGENTS, cross-reference docs, manifests, and reports to mention the new folder/org/repo.
- Run `git status` to confirm only desired files changed and verify tooling references with `rg` for lingering legacy path strings (outside historical archive docs if any).


## Change Log
- **2025-11-14:** Submodule moved to `orgs/open-hax/codex`, Nx metadata updated, and workspace documentation/manifests rewired to the new `open-hax/codex` branding.
