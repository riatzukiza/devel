---
uuid: c50aebc7-9ab0-4e28-9f26-ecbb863699df
title: "LSP + Nx Workflow Refresh"
slug: 2026-02-04-lsp-nx-workflow
status: incoming
priority: P2
tags: []
created_at: "2026-02-04T23:01:04.926888Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# LSP + Nx Workflow Refresh

## Context
- `lsp_diagnostics` fails to initialize because `marksman server` points to a non-LSP `marksman` binary.
- Root workspace scripts currently do not expose Nx affected aliases for lint/build/test/typecheck.
- Nx project graph fails due to duplicate project names from submodule `project.json` files.
- Primary workflow should be per-module (`pnpm -C <path> <target>`), with root scripts delegating to Nx affected for uncommitted diffs.

## Requirements
1. Fix Markdown LSP startup by pointing OpenCode to the correct marksman LSP binary.
2. Add root `pnpm` commands (`lint`, `build`, `test`, `typecheck`) that run Nx affected against uncommitted changes.
3. Provide full-run aliases (e.g., `typecheck:all`) without making them the primary workflow.
4. Update Nx graph so `nx affected` works without duplicate project name errors.
5. Ensure Nx projects expose `lint`, `build`, `test`, and `typecheck` targets.
6. Update skill/docs to reflect the new workflow.

## Plan
### Phase 1: LSP Fix
- Install marksman LSP binary and update OpenCode LSP config.

### Phase 2: Nx Graph & Commands
- Add `.nxignore` entries to avoid duplicate project definitions.
- Update Nx plugin/project-graph generation to include `lint` and `typecheck` targets.
- Add a root script that computes uncommitted diffs (including submodules) and runs `nx affected`.
- Wire root `pnpm` scripts to the new affected runner and add `*:all` aliases.

### Phase 3: Docs & Skills
- Update `AGENTS.md` triggers and workspace skills to match the new command flow.

## Files
- `~/.config/opencode/oh-my-opencode.json`
- `nx.json`
- `.nxignore`
- `package.json`
- `scripts/nx-affected.mjs` (new)
- `tools/nx-plugins/giga/plugin.ts`
- `tools/nx-plugins/giga/graph-writer-plugin.ts`
- `tools/nx-plugins/giga/project-graph.ts`
- `src/giga/generate-nx-projects.ts`
- `tools/nx-plugins/giga/README.md`
- `AGENTS.md`
- `.opencode/skills/workspace-commands/SKILL.md`
- `.opencode/skills/workspace-typecheck/SKILL.md`
- `.opencode/skills/workspace-lint/SKILL.md`
- `.opencode/skills/workspace-build/SKILL.md`

## Existing Issues / PRs
- Issue #2: Track Giga orchestration roll-out and submodule pointer cleanup.
- PR #8: Add Windows Defender workflow.
- PR #6: Add OWASP dependency-check workflow.

## Definition of Done
- `lsp_diagnostics` runs without the marksman server error.
- Root `pnpm` commands call Nx affected based on uncommitted diffs.
- Nx graph builds without duplicate project name errors.
- `lint`, `build`, `test`, and `typecheck` targets exist for Nx project nodes.
- Documentation reflects the new workflow.
