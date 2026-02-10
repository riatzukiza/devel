# @promethean-os/opencode-openplanner-plugin-cljs

ClojureScript OpenCode plugin (template-style structure) that:

- exposes tools for every OpenPlanner API gateway endpoint under `/api/openplanner/v1/*`
- performs active message indexing using the canonical CLJS OpenCode + OpenPlanner clients

## Export

- `OpenPlannerToolsPlugin` (named export)

## Tools

- `openplanner/health`
- `openplanner/sessions/list`
- `openplanner/sessions/get`
- `openplanner/events/index`
- `openplanner/search/fts`
- `openplanner/search/vector`
- `openplanner/jobs/list`
- `openplanner/jobs/get`
- `openplanner/jobs/import/chatgpt`
- `openplanner/jobs/import/opencode`
- `openplanner/jobs/compile/pack`
- `openplanner/blobs/get`
- `openplanner/blobs/upload`

## Build

`pnpm --filter @promethean-os/opencode-openplanner-plugin-cljs build`

## Test

`pnpm --filter @promethean-os/opencode-openplanner-plugin-cljs test`
