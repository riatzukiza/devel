# Threat Radar Web MVP (2026-03-18)

## Goal
Make the local Threat Radar stack render a usable MVP wall instead of a blank page.

## Problem statement
The current `threat-radar-web` app loads a blank page in the browser even though the Vite dev server is up and the MCP API is responding.

## Repo-local observations
- Browser check via `agent-browser` loads `http://127.0.0.1:5176/` with title `Threat Radar Wall`, but the page body is visually blank.
- `curl http://127.0.0.1:10002/health` returns `{ ok: true, service: "threat-radar-mcp", storage: "postgres" }`.
- `curl http://127.0.0.1:10002/api/radars` returns radar rows, but `liveSnapshot.signals`, `branches`, and `render_state` are string values rather than structured JSON objects.
- `orgs/riatzukiza/threat-radar-web/src/ui/App.tsx` assumes `liveSnapshot.signals` is already an object and iterates over it during render.
- `orgs/riatzukiza/threat-radar-mcp/.env` sets `PORT=9001`, while the web proxy and MCP defaults expect `10002`.
- `pnpm --filter @riatzukiza/threat-radar-mcp typecheck` fails because `src/collectors/reddit.ts` imports a missing `SignalEvent` type from `@workspace/radar-core`.

## MVP scope
- Render the page shell and radar tiles from current API data without crashing.
- Normalize or decode snapshot JSON fields so existing Postgres-backed data works.
- Show minimal loading / empty / error states instead of a blank page.
- Align local dev port defaults so `pnpm ... dev` works without manual env overrides.
- Restore a green local typecheck/build path for the reviewed packages.

## Non-goals
- Full radar detail pages.
- Authentication / admin UX.
- Polished animations or design work beyond what is needed for legibility.
- Broad schema redesign.

## Open questions
- Prefer decoding JSON in the API, the web client, or both? Recommendation: decode in the API and keep the web client defensive.
- Should historical stringified JSON rows be rewritten in the database? Recommendation: no for MVP; decode at read time.

## Risks
- Some rows may contain malformed JSON; the UI must fail soft.
- Fixing only the UI would leave the API contract surprising for later consumers.
- Fixing only the API could still leave the UI fragile against partial / stale payloads.

## Phases
### Phase 1: Control-plane contract hardening
- Add safe JSON decode helpers in `orgs/riatzukiza/threat-radar-mcp/src/store.ts`.
- Ensure snapshot rows and related JSON-backed fields come back as structured values.
- Align `orgs/riatzukiza/threat-radar-mcp/.env` with the documented/default port.
- Remove or localize the stale `SignalEvent` type dependency in `src/collectors/reddit.ts` so typecheck passes.

### Phase 2: Web MVP rendering hardening
- Normalize API payloads in `orgs/riatzukiza/threat-radar-web/src/ui/App.tsx`.
- Add loading, error, and empty states.
- Keep clock rendering guarded when snapshot data is absent or partial.

### Phase 2b: MVP signal-to-noise cleanup
- De-prioritize or hide obvious integration / lab radars by default.
- Add a small toggle so the full wall is still reachable.
- Surface a tiny summary row with shown/live/hidden counts.

### Phase 3: Verification
- Run typecheck/build for `@workspace/radar-core`, `@workspace/mcp-foundation`, `@riatzukiza/threat-radar-mcp`, and `@riatzukiza/threat-radar-web`.
- Restart local PM2 processes.
- Verify with browser automation that the wall renders visible content.

## Implementation status
- ✅ Phase 1 completed: MCP store now decodes JSON-backed fields on read, uses JSON-safe writes for future rows, `.env` now defaults to port `10002`, and the stale `SignalEvent` import was localized in the Reddit collector.
- ✅ Phase 2 completed: the web app now normalizes payloads defensively, renders loading/error/empty states, and no longer crashes on the current Postgres-backed rows.
- ✅ Phase 2b completed: the wall now hides lab/test radars by default and exposes a `Show lab radars` toggle for the full dataset.
- ✅ Phase 3 completed: local builds/typechecks passed and browser automation confirmed both the focused MVP wall and the full wall toggle.

## Definition of done
- `http://127.0.0.1:5176` renders visible Threat Radar content in the browser.
- The page no longer crashes on current Postgres-backed radar rows.
- `pnpm --filter @riatzukiza/threat-radar-mcp typecheck` passes.
- `pnpm --filter @riatzukiza/threat-radar-web build` passes.
- MCP and web dev defaults agree on the local API port.
