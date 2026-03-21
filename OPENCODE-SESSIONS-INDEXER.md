# OpenCode sessions indexer

This workspace includes a **historical backfill indexer** that reads OpenCode sessions/messages and indexes them into **OpenPlanner** as events. Searches are then performed via **OpenPlanner FTS**.

There is also a separate, embedding-based workflow (ChromaDB) used by the `reconstitute` CLI.

## Components

- **CLI (index + search)**: `packages/reconstituter/src/opencode-sessions.ts`
  - `index`: fetch sessions/messages from OpenCode and ingest OpenPlanner events
  - `search`: query OpenPlanner FTS and print grouped results
- **PM2 service**: `services/opencode-indexer` (wired in `ecosystems/opencode.cljs` as `opencode-indexer`)
- **Shell wrapper**: `opencode-sessions-index.sh` (optional cron-friendly wrapper)
- **Skill reference**: `.opencode/skills/opencode-session-search/SKILL.md`

## Quick start

### Run manually
```bash
# Index all sessions into OpenPlanner
pnpm -C packages/reconstituter opencode-sessions index

# Search via OpenPlanner FTS
pnpm -C packages/reconstituter opencode-sessions search "your query" --k 10
```

### Run via PM2
```bash
# Compile ecosystem config
pnpm generate-ecosystem

# Start configured processes
pm2 start ecosystem.config.cjs

# Logs
pm2 logs opencode-indexer
```

## Configuration

The indexer relies on both OpenCode and OpenPlanner endpoints.

Common env vars:
```bash
# OpenCode
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_THROTTLE_MS=200
BATCH_SIZE=32
LEVEL_DIR=.reconstitute/level

# OpenPlanner (picked up via @promethean-os/openplanner-cljs-client defaults)
OPENPLANNER_URL=http://127.0.0.1:7777
OPENPLANNER_API_KEY=change-me

# Mode
OPENCODE_INDEXER_MODE=historical-backfill   # or: disabled
```

See `ecosystems/opencode.cljs` for the canonical PM2 environment.

## Semantic search (ChromaDB)

For semantic similarity search and reconstruction workflows, use:

```bash
pnpm -C packages/reconstituter reconstitute index
pnpm -C packages/reconstituter reconstitute search "your query"
```

Legacy standalone scripts (kept for reference) are:
- `index_opencode_sessions.ts`
- `search_opencode_sessions.ts`

These require `CHROMA_URL`, `CHROMA_COLLECTION`, `OLLAMA_URL`, `OLLAMA_EMBED_MODEL`, etc.
