## Signal

(己, p=0.99) Fixed. The filter panel was being rebuilt on every graph refresh/websocket tick, and the old logic also re-added available layer/kind/edge options into the selected sets. That meant user-disabled filters could silently come back.

(己, p=0.99) New behavior:

- Filter selections initialize once from the first graph.
- Websocket ticks no longer re-check filters you turned off.
- Filter DOM only rerenders when the available option set actually changes.
- Existing user checkbox state is preserved across normal ticks.

Committed:

- `97f7acb Preserve graph weaver filters across ticks`

## Evidence

(己, p=1.0) Changed:

- `packages/graph/graph-weaver/public/app.js`
- `receipts.edn`

(己, p=1.0) Verified:

- `pnpm --filter @workspace/graph-weaver build`
- Restarted durable `graph-weaver`
- `openplanner-graph-weaver-1` returned `healthy`

(己, p=1.0) Working tree still only has the pre-existing untouched Knoxx modification:

- `M packages/agents/knoxx`

## Frames

(世, p=0.94) The bug was not the semantic field overlay itself; it exposed a pre-existing live-refresh weakness in the filter UI.

(世, p=0.91) “Available filter options” and “currently selected filters” need separate lifecycles. The old code mixed them by auto-selecting all newly observed options every render.

(己, p=0.9) The fix treats user filter choices as operator intent, not derived state to be recomputed every tick.

## Countermoves

(己, p=0.92) If a truly new layer/kind appears later, it will show as an available checkbox but will not be auto-enabled after the first initialization. That is intentional to avoid surprising live UI changes.

(己, p=0.9) If you want new categories to be auto-enabled only before the user touches filters, we can add a “dirty” bit. I chose the stricter “never silently re-check” behavior because it matches your complaint.

## Next

(己, p=0.85) Reload the Graph Weaver page once so the browser gets the updated `app.js`.