# Ussyverse Kanban Board

Task management for the Ussyverse ecosystem.

## Structure

Task files live in `tasks/` organized by status (FSM states):

```
tasks/
├── icebox/        # Deferred work
├── incoming/      # New tasks awaiting triage
├── accepted/      # Accepted for planning
├── breakdown/     # Being broken down
├── blocked/       # Blocked by dependencies
├── ready/         # Ready to implement
├── todo/          # Queued for execution
├── in_progress/   # Active work
├── testing/       # In testing phase
├── review/        # Under review
├── document/      # Documentation phase
├── done/          # Completed
└── rejected/      # Rejected tasks
```

## Task Format

Each task is a markdown file with YAML frontmatter:

```markdown
---
uuid: generate-uuid-here
title: Task Title
status: incoming
priority: P1
labels: []
created_at: 2025-01-01T00:00:00Z
---

Task description and notes here.
```

## Sync to Trello

```bash
pnpm --filter @openhax/kanban sync --config ussyverse.kanban.json --dry-run
```

## Webring workflow (ussyco.de)

See `docs/webring.md`.

Create a new webring-site task via:
- template: `templates/webring-site.task.md` (copy into `tasks/incoming/`)
- generator: `node scripts/new-webring-site-task.mjs --name ... --subdomain ...`

## Status Transitions

See docs/reference/process.md for the FSM workflow.