# Backend-Persistent Simulation Sessions

## Context

- Need simulation to run server-side with persistence and lifecycle control.
- UI must create/start/stop/delete simulation sessions, each mapped to its own child process.

## Current State

- Express server only exposes health/graph/delta/rebuild endpoints; no simulation lifecycle (`src/http-server.ts:1-76`).
- GraphQL schema/resolvers lack simulation types or mutations (`src/graphql-server.ts:24-153`, `src/graphql-server.ts:344-420`).
- UI toggles simulation purely client-side (`packages/knowledge-graph-ui/src/App.tsx:482-520`, `packages/knowledge-graph-ui/src/GraphCanvas.tsx:20-120`), no backend coordination.
- No persistent store for simulation runs; `.space/` holds only context LMDB today.

## Requirements

- Store simulation sessions persistently (id, name, status, pid/log paths, timestamps, last frame) on disk.
- Provide backend APIs to create/list/start/stop/delete sessions; starting runs a simulation in a separate child process.
- Child process should read graph data and emit periodic frame updates to a per-session data file or log.
- UI should surface session list with controls to create, start/stop, delete, and reflect status updates from backend.
- Keep existing graph/rebuild functionality intact.

## Plan (Phases)

1. **Session model & runner**: Add `SimulationSessionManager` with JSON persistence under `.space/`; implement child-process runner writing frames to per-session output; ensure restart recovers session metadata. Expose reusable helpers for pid tracking and graceful shutdown.
2. **API surface**: Extend Express + GraphQL to expose simulation queries/mutations and REST endpoints: list/create/start/stop/delete. Validate inputs and propagate last-known status/frame/log paths.
3. **UI wiring**: Add GraphQL operations + UI panel for sessions: creation form, start/stop buttons, delete, and status display. Wire to backend mutations and refresh list after actions.
4. **Validation**: Add targeted tests (manager + API) or manual checks; document commands/endpoints and update definitions of done.

## Definition of Done

- Session metadata persisted to disk; restart preserves session records and treats orphaned pids as stopped.
- Backend APIs allow creating, listing, starting, stopping, deleting sessions; starting spawns a child runner; stopping terminates it.
- UI can manage sessions end-to-end via backend and displays status/errors.
- Existing graph/GraphQL endpoints continue to work; basic test/manual run for new flows recorded.
