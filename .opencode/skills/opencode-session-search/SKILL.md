---
name: opencode-session-search
description: "Index and search OpenCode sessions via OpenPlanner event ingestion + FTS (fast full-text search)"
---

# Skill: OpenCode Session Search

## Goal
Index OpenCode session history into OpenPlanner as events, then search it via OpenPlanner **FTS**.

This is the fastest way to answer questions like “where did we discuss X?” when you don’t need vector embeddings.

## Use This Skill When
- You need to find prior OpenCode conversations by keyword/phrase
- You want quick, deterministic search results (FTS)
- You are recovering context and can tolerate non-semantic search

## Do Not Use This Skill When
- You need **semantic** (embedding-based) similarity search → use `reconstitute search` instead
- You only need codebase content → use `rg`/`find`/LSP instead

## Inputs
- Search query
- Optional session filter (`--session`)
- Number of results (`--k`)

## Commands

### Index sessions (historical backfill)
```bash
pnpm -C packages/reconstituter opencode-sessions index
```

### Search sessions (FTS)
```bash
pnpm -C packages/reconstituter opencode-sessions search "authentication flow" --k 10
pnpm -C packages/reconstituter opencode-sessions search "visibility state unknown" --session ses_abc123 --k 20
```

## Environment (high signal)
- **OPENCODE_BASE_URL**: OpenCode server URL (default: `http://localhost:4096`)
- **OPENPLANNER_URL**: OpenPlanner endpoint (from `@promethean-os/openplanner-cljs-client` defaults)
- **OPENPLANNER_API_KEY**: bearer token (if required)
- **OPENCODE_THROTTLE_MS**: delay between OpenCode API calls (default: `200`)
- **LEVEL_DIR**: LevelDB state dir (default: `.reconstitute/level`)
- **BATCH_SIZE**: indexing batch size (default: `32`)

Chunking options (if you need them):
- **OPENCODE_CHUNK_INDEXING**: `1` (default) to index chunk events; `0` for legacy per-message
- **OPENCODE_CHUNK_TARGET_TOKENS**: approx token target (default: `32000`)
- **OPENCODE_CHUNK_OVERLAP_MESSAGES**: overlap window (default: `4`)

## Output
Search output is grouped by `session_id` and includes an FTS **Score**, plus any extracted metadata (role, session title, paths).

## PM2 service
This workspace also provides a PM2 process for scheduled backfill:
```bash
pnpm generate-ecosystem
pm2 start ecosystem.config.cjs --only opencode-indexer
pm2 logs opencode-indexer
```

## References
- CLI: `packages/reconstituter/src/opencode-sessions.ts`
- OpenPlanner FTS formatting: `packages/reconstituter/src/openplanner-client.ts`
