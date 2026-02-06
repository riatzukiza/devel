---
uuid: eb07c998-5b1f-4760-8afa-a85d10e136af
title: "Submodules Update Recovery Plan"
slug: submodules-update
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
# Submodules Update Recovery Plan

## Context
- Command `submodules-update --recursive` began failing on nested Promethean packages as upstream repos were rewritten as standalone projects with different roots.
- We already handled `packages/kanban` by pinning the legacy SHA on branch `promethean/dev`. Subsequent runs now fail on `packages/mcp`, and further packages might show similar symptoms.

## Known Failures
1. `packages/kanban` — resolved by creating branch `promethean/dev` on commit `c8e48f1` (see `spec/kanban-submodule-comparison.md`).
2. `packages/mcp` — resolved via the same approach; legacy SHA `9287f23` now lives on branch `promethean/dev`, and `.gitmodules` pins that branch (`orgs/riatzukiza/promethean/.gitmodules:21-24`).
3. `packages/naming` — resolved by branching `promethean/dev` from local commit `09986bf` and pushing upstream; `.gitmodules` now pins the branch (`orgs/riatzukiza/promethean/.gitmodules:25-28`).
4. `packages/persistence` — resolved; branch `promethean/dev` now pins legacy commit `2631880` and `.gitmodules` references it (`orgs/riatzukiza/promethean/.gitmodules:29-32`).
5. `packages/utils` — resolved; branch `promethean/dev` pushed and `.gitmodules` updated (`orgs/riatzukiza/promethean/.gitmodules:33-36`).

## Current Status
- Latest `submodules-update --recursive` run completed successfully (see console log at 2025-11-08) after retargeting all divergent nested packages.

## Requirements
1. Iterate through `submodules-update --recursive` runs until the command completes successfully.
2. For each failure:
   - Capture the local commit(s) and remote heads.
   - Decide whether to preserve legacy history (new branch) or fast-forward to upstream rewrite.
   - Update `.gitmodules` and submodule config accordingly.
   - Push any new branch names upstream so collaborators can fetch.
   - Record the remediation details here for traceability.
3. Produce a final report summarizing every failure and the corrective action applied.

## Definition of Done
- `submodules-update --recursive` exits cleanly (no fatal errors).
- Each previously failing submodule has a clearly documented resolution path and, if applicable, a dedicated branch capturing the legacy state.
- This spec is updated with references (file paths, line numbers) for all configuration changes.
