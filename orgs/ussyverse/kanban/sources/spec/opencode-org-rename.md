---
uuid: c2a28ae3-ac04-4918-bbcd-6f4474882f35
title: "Opencode org rename (sst -> anomalyco)"
slug: opencode-org-rename
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
# Opencode org rename (sst -> anomalyco)

## Summary
Move the opencode submodule from `orgs/sst/opencode` to `orgs/anomalyco/opencode`, update the submodule URL to SSH `git@github.com:anomalyco/opencode.git`, and update workspace references to the new path.

## Requirements
- Submodule path is `orgs/anomalyco/opencode` and uses SSH remote `git@github.com:anomalyco/opencode.git`.
- Remove the old `orgs/sst/opencode` submodule entry.
- Update workspace references and commands that use the old path.
- Do not modify unrelated workspace changes.

## Files and references
- `.gitmodules` (submodule path + URL)
- `AGENTS.md` (references to `orgs/sst/opencode`)
- `README.md` (references to `orgs/sst/opencode`)
- `docs/pr-mirroring.md` (references to `orgs/sst/opencode`)
- `docs/MASTER_CROSS_REFERENCE_INDEX.md` (path references)
- `docs/reports/package-doc-matrix.md` (path references)
- `docs/reports/submodules-recursive-status-2025-11-13.md` (path references)
- `docs/agile/tasks/orgs-duplication-analysis-report-2025-11-06.md` (path references)
- `graph.json` (task commands referencing `orgs/sst/opencode`)
- `projects/orgs-sst-opencode/project.json` (run-submodule commands)
- `spec/nx-giga-repo.md` (path references)
- `spec/submodule-cleanup.md` (path references)
- `spec/glm-model-variants-analysis.md` (path references)
- `spec/glm-implementation-code-changes.md` (path references)
- `spec/glm-agent-variants.md` (path references)
- `spec/smart-submodule-typecheck.md` (path references)
- `spec/submodule-commits-20251114.md` (path references)
- `spec/zen-api-key.md` (path references)
- `system/README.md` (path references)
- `tools/nx-plugins/giga/deps.json` (path references)

## Definition of done
- `orgs/anomalyco/opencode` is a working submodule with SSH remote.
- All workspace references to `orgs/sst/opencode` are updated to `orgs/anomalyco/opencode`.
- `git status` shows only intentional changes.

## Issues / PRs
- Not checked in this pass.
