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
lastCommitSha: "514b2b7d70dedf642cfd38347926843c9ea30cad"
commitHistory:
  -
    sha: "514b2b7d70dedf642cfd38347926843c9ea30cad"
    timestamp: "2026-02-04 21:43:20 -0600\n\ndiff --git a/spec/2026-02-04-agents-skill-breakdown.md b/spec/2026-02-04-agents-skill-breakdown.md\nnew file mode 100644\nindex 0000000..0d40ae0\n--- /dev/null\n+++ b/spec/2026-02-04-agents-skill-breakdown.md\n@@ -0,0 +1,68 @@\n+---\n+uuid: \"7b899e77-2fdc-4852-b893-f5d26a404de8\"\n+title: \"AGENTS Skill Breakdown\"\n+slug: \"2026-02-04-agents-skill-breakdown\"\n+status: \"breakdown\"\n+priority: \"P2\"\n+labels: [\"agents\", \"skill\", \"breakdown\", \"specific\"]\n+created_at: \"2026-02-04T21:48:05.734887Z\"\n+estimates:\n+  complexity: \"\"\n+  scale: \"\"\n+  time_to_completion: \"\"\n+---\n+\n+# AGENTS Skill Breakdown\n+\n+## Context\n+- The root `AGENTS.md` contains a mix of repository structure and task-specific workflows.\n+- The request is to move task-specific instructions into `.opencode/skills/**/SKILL.md` files following the existing skill conventions.\n+- `AGENTS.md` should be reduced to structural information, tech stack notes, and a skills list with trigger words.\n+\n+## Requirements\n+- Move all task-specific guidance currently in `AGENTS.md` into skill docs under `.opencode/skills/`.\n+- Add any missing skills needed to cover the moved guidance, using the standard SKILL.md format.\n+- Update `AGENTS.md` to include only:\n+  - Repository structure\n+  - Tech stack overview\n+  - Skills list and trigger words\n+\n+## Plan\n+### Phase 1: Inventory and Mapping\n+- Identify task-specific sections in `AGENTS.md` and map each to existing or new skills.\n+- Review existing skills to avoid duplication and determine needed updates.\n+\n+### Phase 2: Skill Updates\n+- Create new skills for any missing guidance (e.g., workspace commands/standards).\n+- Update existing skills to absorb relevant guidance from `AGENTS.md`.\n+\n+### Phase 3: AGENTS.md Rewrite\n+- Replace task-specific content with structural and tech stack summaries.\n+- Add a skills index plus trigger word quick reference.\n+\n+### Phase 4: Verification\n+- Run `lsp_diagnostics` on all modified files.\n+\n+## Files\n+- `AGENTS.md`\n+- `.opencode/skills/opencode-agents-skills/SKILL.md`\n+- `.opencode/skills/submodule-ops/SKILL.md`\n+- `.opencode/skills/testing-general/SKILL.md`\n+- `.opencode/skills/workspace-navigation/SKILL.md`\n+- `.opencode/skills/opencode-command-authoring/SKILL.md`\n+- `.opencode/skills/workspace-typecheck/SKILL.md`\n+- `.opencode/skills/workspace-commands/SKILL.md` (new)\n+- `.opencode/skills/workspace-code-standards/SKILL.md` (new)\n+\n+## Existing Issues / PRs\n+- Issue #2: Track Giga orchestration roll-out and submodule pointer cleanup.\n+- PR #8: Add Windows Defender workflow.\n+- PR #6: Add OWASP dependency-check workflow.\n+\n+## Definition of Done\n+- All task-specific instructions from `AGENTS.md` live in appropriate skill docs.\n+- `AGENTS.md` only contains structural info, tech stack, and skills + trigger words.\n+- `lsp_diagnostics` reports no errors on modified files.\n+\n+## Change Log\n+- 2026-02-04: Initialize AGENTS skill breakdown plan."
    message: "Change task status: 7b899e77-2fdc-4852-b893-f5d26a404de8 - AGENTS Skill Breakdown - accepted → breakdown"
    author: "Error"
    type: "status_change"
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
