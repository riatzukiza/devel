# @promethean-os/openplanner-cljs-client

ClojureScript OpenPlanner client for Node/Bun/ESM consumers.

## API

- `createOpenPlannerClient(opts?)`
- `defaultOpenPlannerConfig(opts?)`
- `createOpenPlannerEvent(input)`

The client targets OpenPlanner through the API gateway by default:

- `http://127.0.0.1:8788/api/openplanner`

and supports direct configuration via `endpoint`, `apiKey`, and custom `fetch`.

## Build

`pnpm --filter @promethean-os/openplanner-cljs-client build`

## Test

`pnpm --filter @promethean-os/openplanner-cljs-client test`
