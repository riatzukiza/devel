# OpenCode Skill Pack and Optimization Guide

## Context
- User requested a set of new OpenCode skills for: creating skills, agents, commands, plugins, tools, adding MCP servers, adding LSP servers, and adding models/providers/variants.
- User also requested a skill optimization guide and a dedicated skill for optimizing skills.
- Existing conventions live in `.opencode/skills/*.md` (see `.opencode/skills/skill-authoring.md`).
- Workspace skill index is maintained in `AGENTS.md` under the "Repo Skills" list.

## Requirements
1. Create new skill docs under `.opencode/skills/` for:
   - OpenCode skill creation
   - OpenCode agent authoring
   - OpenCode command authoring
   - OpenCode plugin authoring
   - OpenCode tool authoring
   - MCP server integration
   - LSP server integration
   - Model/provider/variant management
2. Create a skill optimization guide doc that embeds prompt-optimization techniques and sources.
3. Create a dedicated skill that applies the optimization guide to an existing skill.
4. Each new skill must follow the established template:
   - Goal
   - Use This Skill When
   - Do Not Use This Skill When
   - Inputs
   - Steps
   - Output
   - References
5. Update `AGENTS.md` to list the new skills under "Repo Skills" with short usage guidance.
6. Keep content ASCII and aligned with existing repo tone; avoid inventing new CLI commands.

## References
- `.opencode/skills/skill-authoring.md`
- `.opencode/skills/opencode-agents-skills.md`
- `.opencode/skills/opencode-tools-mcp.md`
- `.opencode/skills/opencode-models-providers.md`
- `.opencode/skills/opencode-plugins.md`
- `bin/create-command`
- `AGENTS.md`
- Prompt optimization sources:
  - https://promptbuilder.cc/blog/prompt-engineering-best-practices-2026
  - https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices
  - https://kontent.ai/blog/the-only-5-prompt-structures-you-need/
  - https://www.getmaxim.ai/articles/prompt-evaluation-frameworks-measuring-quality-consistency-and-cost-at-scale/

## Definition of Done
- New skill docs exist in `.opencode/skills/` and match the template.
- A skill optimization guide doc exists and includes cited optimization techniques.
- A skill-optimizing skill exists and references the guide.
- `AGENTS.md` lists all new skills under "Repo Skills".
- `lsp_diagnostics` run on modified files without errors.
