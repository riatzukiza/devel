---
name: opencode-agents-skills
description: "Author or update agents and skills that align with OpenCode guidance and repository conventions"
---

# Skill: OpenCode Agents & Skills

## Goal
Author or update agents and skills that align with OpenCode guidance and repo conventions.

## Use This Skill When
- You add or update `.opencode/agent/*.md` or `.opencode/skills/*.md`.
- You need to document new agent behavior or skill triggers.

## Do Not Use This Skill When
- The change does not affect agent or skill guidance.

## Inputs
- Agent requirements and expected behaviors.
- Existing agent/skill docs in this repo.

## Required Frontmatter Syntax

When authoring skills, always use valid YAML frontmatter:

```yaml
---
name: my-skill-name
description: "A clear, specific description of what this skill does"
---
```

### Critical: Quote Description Values

**ALWAYS quote the description field.** If the description contains a colon (`:`), unquoted YAML will fail to parse and the skill won't load.

```yaml
# GOOD - quoted description
---
name: my-skill
description: "Skill: My Skill Description"
---

# BAD - unquoted description (27 skills failed to load)
---
name: my-skill
description: Skill: My Skill Description
---
```

### Valid Frontmatter Fields

Only these fields are recognized by OpenCode:
- `name` - Required, kebab-case, matches directory
- `description` - Required, 1-1024 chars, MUST be quoted
- `license` - Optional, SPDX identifier
- `compatibility` - Optional, version constraints
- `metadata` - Optional, additional key-value data

## Steps
1. Mirror the local skill/agent templates and keep scope narrow.
2. Update `AGENTS.md` to reference any new skills.
3. Ensure behaviors align with OpenCode agents/skills docs.

## Output
- Updated agent/skill documentation and any references in `AGENTS.md`.

## References
- OpenCode agents docs: https://opencode.ai/docs/agents/
- OpenCode skills docs: https://opencode.ai/docs/skills/
