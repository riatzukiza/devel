# Skill: Skill Authoring

## Goal
Create or revise repo skills so they are reusable, scoped, and easy to trigger.

## Use This Skill When
- A task repeats across issues or repos and needs a dedicated skill.
- You are asked to "create a skill" or "add guidance" for agent behavior.
- The workflow needs stronger guardrails or a consistent checklist.

## Do Not Use This Skill When
- The change is a one-off edit or quick fix.
- You only need to update a single file without new workflow guidance.

## Inputs
- The user request and target workflow context.
- Existing agent instructions (`AGENTS.md`) and any `.opencode/agent/*.md` docs.

## Required Output
1. New or updated skill doc(s) in `.opencode/skills/`.
2. A short update in `AGENTS.md` that tells when to use the new skill.

## Strong Hints
- Prefer 1-2 pages of concise instructions; avoid essays.
- Include explicit "Use When" and "Do Not Use" gates.
- Keep steps actionable and testable; avoid vague advice.
- Avoid duplicating global rules; reference them instead.

## Suggested Template
```
# Skill: <Name>

## Goal
<single sentence>

## Use This Skill When
- <trigger>

## Do Not Use This Skill When
- <anti-trigger>

## Inputs
- <inputs>

## Steps
1. <step>

## Output
- <deliverable>
```
