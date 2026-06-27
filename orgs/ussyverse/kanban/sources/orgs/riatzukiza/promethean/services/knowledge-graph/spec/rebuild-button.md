# Spec: Rebuild Button in SPA

## Context

- The SPA currently streams a static `graph.ndjson` (see `packages/knowledge-graph-ui/src/App.tsx` around load logic ~95-160).
- There is no rebuild control in the UI; rebuilding today is manual via CLI/automation.
- Backend endpoint for rebuilding is assumed to be `POST /api/rebuild` (same origin) that triggers graph regeneration and refreshes the served graph files/DB.

## Target Files

- `packages/knowledge-graph-ui/src/App.tsx` — add UI control, call rebuild endpoint, refresh streamed graph.
- `spec/frontend-spa-ui.md` (core interactions/styling) — note rebuild control and endpoint expectation.

## Requirements

- Add a visible button to trigger a rebuild request from the SPA.
- Call `POST /api/rebuild`; show loading/error/success feedback.
- After a successful rebuild, reload the streamed graph so the canvas reflects updates.
- Keep existing graph loading behavior intact for initial load and filters.

## Definition of Done

- Button present in the UI, disabled while rebuild is in-flight.
- Rebuild request errors are surfaced to the user (message near the button).
- On success, graph data reloads from `/graph.ndjson` automatically.
- Docs updated to mention the rebuild control and assumed endpoint.

## Notes

- Backend must expose `POST /api/rebuild`; UI will treat non-200 as failure and keep the prior graph loaded.
- Reload uses the existing streaming loader; it resets loading state and fetches fresh data.
