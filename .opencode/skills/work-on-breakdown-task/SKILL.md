# Skill: work-on-breakdown-task

Execute the best next work for a task currently in `breakdown`.

## Context
- FSM rules: `docs/reference/process.md`

## Behavior
- Read the task spec, update it with progress notes, and prepare evidence required for the next transition.
- Before transitioning, call `validate-breakdown-to-<target>`.

## Outputs
- Updated spec notes
- Suggested next state
- Evidence links (PRs/tests/docs) as applicable
