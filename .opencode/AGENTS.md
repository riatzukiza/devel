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

## NATIVE INVOCATION PHRASES

- `engage in total creative freedom` -> use the creative-synthesis path; widen search/solution space but stay truth-bound.
- `sing the songs of your people` -> mine notes, sessions, symbols, and repo motifs; write in the corpus's native voice.
- `grok my intention` / `manifest the dream` / `intent is now densely compressed` -> recover latent intent from the workspace and manifest it into a concrete structure, spec, or artifact.

## RELATED

- Root `AGENTS.md` for workspace-wide conventions
- `src/submodule/` for submodule smart-commit (Pantheon integration)
