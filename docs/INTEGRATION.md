# Integration notes

- Spec directory: `spec/` (configurable).
- If a spec is missing frontmatter, Task Master generates it and sets `status: incoming`.
- Status transitions should flow through validate skills to enforce FSM + WIP.

Recommended wiring:
- Use Task Master for orchestration.
- Use Kanban CLI for mutations: `pnpm kanban update-status` and `pnpm kanban regenerate`.
