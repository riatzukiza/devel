# OpenCode Extensions

OpenCode plugins, skills, commands, and tools for agent workflow automation.

## OVERVIEW

`.opencode/` contains OpenCode ecosystem extensions including:
- **skills/**: Agent skill definitions (116 skills)
- **agents/**: Agent configurations
- **commands/**: CLI commands
- **tools/**: TypeScript tools for OpenCode integration
- **workflows/**: Automation workflows

## WHERE TO LOOK

| Directory | Purpose |
|-----------|---------|
| `skills/` | Skill definitions with trigger words |
| `agents/` | Agent configurations and prompts |
| `commands/` | OpenCode CLI commands |
| `tools/` | TypeScript tools (fix_clojure_delimiters, validate_clojure_syntax) |
| `workflows/` | Automation workflows |

## SKILL STRUCTURE

```markdown
# .opencode/skills/<skill-name>/SKILL.md
---
name: <skill-name>
description: <what it does>
trigger: <trigger words>
---

## Use This Skill When
...

## Protocol/Steps
...
```

## TOOLS

| Tool | Purpose |
|------|---------|
| `fix_clojure_delimiters` | Auto-fix malformed Clojure with Parinfer |
| `validate_clojure_syntax` | Validate Clojure via clj-kondo |

## CONVENTIONS

- Skills follow OpenCode template in `SKILL.md`
- Trigger words enable skill discovery
- Tools exposed via MCP or direct invocation

## RELATED

- Root `AGENTS.md` for workspace-wide conventions
- `src/submodule/` for submodule smart-commit (Pantheon integration)
