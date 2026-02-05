---
uuid: "7b899e77-2fdc-4852-b893-f5d26a404de8"
title: "AGENTS Skill Breakdown"
slug: "2026-02-04-agents-skill-breakdown"
status: "breakdown"
priority: "P2"
labels: ["agents", "skill", "breakdown", "specific"]
created_at: "2026-02-04T21:48:05.734887Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# AGENTS Skill Breakdown

## Context
- The root `AGENTS.md` contains a mix of repository structure and task-specific workflows.
- The request is to move task-specific instructions into `.opencode/skills/**/SKILL.md` files following the existing skill conventions.
- `AGENTS.md` should be reduced to structural information, tech stack notes, and a skills list with trigger words.

## Requirements
- Move all task-specific guidance currently in `AGENTS.md` into skill docs under `.opencode/skills/`.
- Add any missing skills needed to cover the moved guidance, using the standard SKILL.md format.
- Update `AGENTS.md` to include only:
  - Repository structure
  - Tech stack overview
  - Skills list and trigger words

## Plan
### Phase 1: Inventory and Mapping
- Identify task-specific sections in `AGENTS.md` and map each to existing or new skills.
- Review existing skills to avoid duplication and determine needed updates.

### Phase 2: Skill Updates
- Create new skills for any missing guidance (e.g., workspace commands/standards).
- Update existing skills to absorb relevant guidance from `AGENTS.md`.

### Phase 3: AGENTS.md Rewrite
- Replace task-specific content with structural and tech stack summaries.
- Add a skills index plus trigger word quick reference.

### Phase 4: Verification
- Run `lsp_diagnostics` on all modified files.

## Files
- `AGENTS.md`
- `.opencode/skills/opencode-agents-skills/SKILL.md`
- `.opencode/skills/submodule-ops/SKILL.md`
- `.opencode/skills/testing-general/SKILL.md`
- `.opencode/skills/workspace-navigation/SKILL.md`
- `.opencode/skills/opencode-command-authoring/SKILL.md`
- `.opencode/skills/workspace-typecheck/SKILL.md`
- `.opencode/skills/workspace-commands/SKILL.md` (new)
- `.opencode/skills/workspace-code-standards/SKILL.md` (new)

## Existing Issues / PRs
- Issue #2: Track Giga orchestration roll-out and submodule pointer cleanup.
- PR #8: Add Windows Defender workflow.
- PR #6: Add OWASP dependency-check workflow.

## Definition of Done
- All task-specific instructions from `AGENTS.md` live in appropriate skill docs.
- `AGENTS.md` only contains structural info, tech stack, and skills + trigger words.
- `lsp_diagnostics` reports no errors on modified files.

## Change Log
- 2026-02-04: Initialize AGENTS skill breakdown plan.
