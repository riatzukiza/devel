# Skill: work-on-ready-task

Execute the best next work for a task currently in `ready`.

## Context
- FSM rules: `docs/reference/process.md`

## Behavior
- Read the task spec, update it with progress notes, and prepare evidence required for the next transition.
- Before transitioning, call `validate-ready-to-<target>`.

## Outputs
- Updated spec notes
- Suggested next state
- Evidence links (PRs/tests/docs) as applicable
