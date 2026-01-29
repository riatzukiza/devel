# Skill: OpenCode Skill Creation

## Goal
Create new OpenCode skill docs that are reusable, scoped, and consistent with repo conventions.

## Use This Skill When
- The user asks to create a new skill or add reusable workflow guidance.
- You need to standardize repeated workflows into a dedicated skill.
- You are expanding the OpenCode skill catalog under `.opencode/skills/`.

## Do Not Use This Skill When
- The change is a one-off edit or quick fix.
- You are only updating a single file without new workflow guidance.

## Inputs
- User request and target workflow context.
- Existing skills in `.opencode/skills/`.
- `AGENTS.md` skill list and any local agent guidance.

## Steps
1. Review `.opencode/skills/skill-authoring.md` for the standard template.
2. Choose a precise skill name and file path under `.opencode/skills/`.
3. Write Goal, Use This Skill When, and Do Not Use This Skill When gates.
4. Define Inputs, Steps, Output, and References.
5. Cross-link related skills instead of duplicating content.
6. Update `AGENTS.md` to reference the new skill.

## Output
- A new skill doc in `.opencode/skills/` following the standard template.
- Updated `AGENTS.md` entries referencing the new skill.

## References
- Skill authoring template: `.opencode/skills/skill-authoring.md`
- Skill index guidance: `AGENTS.md`
