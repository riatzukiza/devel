# Skill: work-on-in_review-task

Execute the best next work for a task currently in `in_review`.

## Context
- FSM rules: `docs/reference/process.md`

## Behavior
- Read the task spec, update it with progress notes, and prepare evidence required for the next transition.
- Before transitioning, call `validate-in_review-to-<target>`.

## Outputs
- Updated spec notes
- Suggested next state
- Evidence links (PRs/tests/docs) as applicable
