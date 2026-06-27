# Standalone Kanban Rewrite

## Context
- The existing kanban CLI in `orgs/riatzukiza/promethean/cli/kanban` is feature-rich but tightly coupled to the Promethean workspace.
- The legacy Trello bridge in `orgs/riatzukiza/promethean/packages/trello` shells out to `pnpm kanban`, hardcodes a board id, and deduplicates by title instead of stable task identity.
- The immediate target board is `https://trello.com/b/Mu2BmeDE/ussyverse`.

## References
- `orgs/riatzukiza/promethean/cli/kanban/package.json`
- `orgs/riatzukiza/promethean/packages/trello/src/lib/kanban-to-trello-sync.ts`
- `orgs/riatzukiza/promethean/packages/trello/src/lib/trello-client.ts`
- `orgs/riatzukiza/promethean/docs/agile/tasks/*.md`

## Problems To Fix
- Standalone use is poor because the Trello bridge depends on the Promethean CLI being callable from the working directory.
- Trello setup is brittle because board access is hardcoded to `V54OVEMZ` instead of being driven by config or URL.
- Sync correctness is weak because cards are matched by title, so renames create duplicates.
- The current integration lacks a small portable core that can be reused outside Promethean.

## Rewrite Direction
1. Create a new standalone package at `packages/kanban` in this `open-hax/openhax` workspace.
2. Read markdown task files directly instead of shelling out to another CLI.
3. Support a simple JSON config file (`openhax.kanban.json`) with relative path resolution.
4. Accept Trello board ids or board URLs, including `https://trello.com/b/Mu2BmeDE/ussyverse`.
5. Build sync plans from stable task UUIDs so card renames update instead of duplicating.
6. Keep the first iteration CLI-focused and production-oriented: task loading, board snapshot generation, and Trello sync.

## Definition Of Done
- `@openhax/kanban` builds inside this workspace.
- A dry-run Trello sync can be executed against Promethean task files without depending on `@promethean-os/kanban`.
- The package includes tests for markdown task loading and Trello sync planning.
- Setup docs include a ready example for the Ussyverse board.
