# @promethean-os/opencode-cljs-client

ClojureScript high-level OpenCode client for Node/Bun/ESM consumers.

## API

- `createOpencodeClient(opts?)`
- `opencodeMessageToOllamaParts(entry)`
- `flattenForEmbedding(messages)`
- `extractPathsLoose(text)`

The client defaults to `OPENCODE_BASE_URL` or `http://127.0.0.1:4096`.

## Build

`pnpm --filter @promethean-os/opencode-cljs-client build`

## Test

`pnpm --filter @promethean-os/opencode-cljs-client test`
