---
uuid: "7a1163af-71d4-474c-8cbe-1a4de7b6032a"
title: "OpenCode Skill Migration to SKILL.md Format"
slug: "2026-02-03-opencode-skill-migration"
status: "accepted"
priority: "P2"
labels: ["skill", "opencode", "migration", "format"]
created_at: "2026-02-04T20:48:44.135921Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# OpenCode Skill Migration to SKILL.md Format

## Context
- User reported earlier flat skill files that are missing in the current `.opencode/skills/` tree.
- Git history scan did not show missing flat files, so the skills are re-created from the requested list.
- All custom skills must follow the `SKILL.md` directory pattern per the skill guide.

## Requirements
- Create SKILL.md directories for these skills:
  - `emergency-confusion-reset`
  - `break-edit-loop`
  - `task-atomicity-guard`
  - `verify-resource-existence`
  - `git-safety-check`
  - `test-preservation`
  - `lint-gate`
  - `apology-action-protocol`
  - `workspace-dependency-check`
- Each skill directory must include a `SKILL.md` with YAML frontmatter (`name`, `description`).

## Files
- `spec/2026-02-03-opencode-skill-migration.md:1`
- `.opencode/skills/emergency-confusion-reset/SKILL.md:1`
- `.opencode/skills/break-edit-loop/SKILL.md:1`
- `.opencode/skills/task-atomicity-guard/SKILL.md:1`
- `.opencode/skills/verify-resource-existence/SKILL.md:1`
- `.opencode/skills/git-safety-check/SKILL.md:1`
- `.opencode/skills/test-preservation/SKILL.md:1`
- `.opencode/skills/lint-gate/SKILL.md:1`
- `.opencode/skills/apology-action-protocol/SKILL.md:1`
- `.opencode/skills/workspace-dependency-check/SKILL.md:1`

## Definition of Done
- All listed skills exist as `.opencode/skills/<name>/SKILL.md`.
- No flat `.opencode/skills/<name>.md` files remain.
- `lsp_diagnostics` reports no errors in modified files.

## Change Log
- 2026-02-03: Recreate missing skills as SKILL.md directories.
