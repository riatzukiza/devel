# Agile Process Skill

This skill guides agents and developers through the Kanban workflow defined in `orgs/riatzukiza/promethean/docs/agile/process.md`.

## Workflow States

The board functions as a Finite State Machine (FSM). Tasks/Specs must exist in exactly one state.

### 1. Intake (`icebox`)
- **Action**: Create task.
- **Front Matter**: `status: icebox`

### 2. Prioritize (`backlog`)
- **Action**: Accept task for future work.
- **Front Matter**: `status: backlog`

### 3. Queue (`todo`)
- **Action**: Commit to current sprint/phase.
- **Front Matter**: `status: todo`

### 4. Implement (`in-progress`)
- **Action**: Start work.
- **Front Matter**: `status: in-progress`

### 5. Review (`review`)
- **Action**: Open PR.
- **Front Matter**: `status: review`

### 6. Document (`document`)
- **Action**: Update docs.
- **Front Matter**: `status: document`

### 7. Complete (`done`)
- **Action**: Merge and close.
- **Front Matter**: `status: done`

## Updates

When moving a task:
1.  **Read** the task file.
2.  **Update** the `status` field in the front matter.
3.  **Update** `updated_at`.
4.  **Add** notes/evidence to the body if moving to Review/Testing/Done.
