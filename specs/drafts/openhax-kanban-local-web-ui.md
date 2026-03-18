# Draft Spec: @openhax/kanban local web UI (Obsidian-kanban-ish, independent)

## Mission
Provide a **lightweight local web UI** (no Obsidian dependency) for viewing and moving kanban tasks stored as markdown files (YAML frontmatter), while keeping the workflow compatible with early Obsidian-kanban prototyping goals.

## Context / Current State
- Package: `orgs/open-hax/openhax/packages/kanban` (`@openhax/kanban`)
- Existing CLI:
  - `openhax-kanban board snapshot`
  - `openhax-kanban sync trello`
- Tasks:
  - markdown files under a `tasksDir` (recursive)
  - YAML frontmatter fields: `uuid`, `title`, `status`, `priority`, `labels/tags`, `created_at`
- There is an Obsidian-kanban *board markdown* format present elsewhere in the workspace (`kanban-plugin: board`, `%% kanban:settings`), but `@openhax/kanban` currently treats **task notes** as source-of-truth.

## Goals
1. Add `openhax-kanban serve` which:
   - serves a local HTML kanban board UI
   - shows columns for statuses (default order + any extra seen)
   - supports drag/drop to move cards between columns
   - writes changes back to the underlying markdown task file(s)
2. Keep dependencies minimal:
   - Node built-ins + existing deps (no framework)
3. Safe defaults:
   - bind to `127.0.0.1` by default
   - explicit port flag

## Non-goals
- Full feature parity with the Obsidian Kanban plugin.
- Multi-user / remote access.
- Rich markdown editing within the browser.

## Proposed UX
- Browser board view:
  - columns: status
  - cards show: title, priority, labels, relative path
  - drag/drop card to new column triggers save
  - optional quick search filter

## Writeback Semantics
- On move:
  - update YAML frontmatter `status:` to the new status
  - optionally move files into `tasks/<status>/` folders **only** when the tasksDir appears to be a status-folder tree
  - preserve the rest of the file content exactly

## API (local)
- `GET /` → HTML
- `GET /api/board` → JSON board snapshot (same schema as `buildBoardSnapshot`)
- `POST /api/task/:uuid/status` with `{ "status": "todo" }` → performs writeback, returns updated task summary

## Open Questions
1. Should file moving be enabled by default when tasksDir is `./tasks` (FSM tree), or should it be opt-in (`--move-files`)?
2. Should the UI show full body content preview or only title/meta?
3. Do we need a “regenerate Obsidian board markdown” export action in the UI (nice-to-have)?

## Risks
- Concurrency: two moves in quick succession could race writes.
- Filename collisions if moving files across folders.
- YAML variants: some tasks may have malformed frontmatter; writeback must be conservative.

## Implementation Phases
### Phase 1 — Serve + read-only UI
- Implement HTTP server
- Implement `GET /api/board`
- Implement static HTML with column rendering

### Phase 2 — Drag/drop + writeback
- `POST /api/task/:uuid/status`
- Update frontmatter
- Optional safe file move

### Phase 3 — Polish
- Search filter
- Error toasts
- Reload button

## Affected Files
- `orgs/open-hax/openhax/packages/kanban/src/cli.ts`
- `orgs/open-hax/openhax/packages/kanban/src/server.ts` (new)
- `orgs/open-hax/openhax/packages/kanban/src/task-writeback.ts` (new)
- `orgs/open-hax/openhax/packages/kanban/README.md`
- tests: `orgs/open-hax/openhax/packages/kanban/tests/*`

## Definition of Done
- Running:
  - `pnpm --filter @openhax/kanban dev -- serve --tasks-dir <dir> --port 8787`
  opens a functional board.
- Dragging a card to another column updates the task file `status:`.
- `pnpm --filter @openhax/kanban test` passes.
