# Reconstituter

Tools for indexing OpenCode sessions into ChromaDB and reconstituting project context from those sessions.

## What It Provides
- `opencode-sessions` CLI for indexing and searching session embeddings.
- `reconstitute` CLI for indexing, search, and run-based reconstruction.
- Reusable helpers exported from `@promethean-os/reconstituter`.

## Commands

### Index OpenCode Sessions
```bash
pnpm -C packages/reconstituter opencode-sessions index
```

### Search Sessions
```bash
pnpm -C packages/reconstituter opencode-sessions search "auth flow" --k 10
pnpm -C packages/reconstituter opencode-sessions search "api design" --session ses_abc123
```

### Reconstitute CLI
```bash
pnpm -C packages/reconstituter reconstitute index
pnpm -C packages/reconstituter reconstitute search "orgs/octave-commons/cephalon-clj websocket rpc"
pnpm -C packages/reconstituter reconstitute run orgs/octave-commons/cephalon-clj
```

## Environment Variables

### OpenCode Sessions CLI
- `OPENCODE_BASE_URL` (default: `http://localhost:4096`)
- `CHROMA_URL` (default: `http://localhost:8000`)
- `CHROMA_COLLECTION` base name (default: `opencode_messages_v1`, salted with `OLLAMA_EMBED_MODEL`)
- `CHROMA_TENANT` (optional)
- `CHROMA_DATABASE` (optional)
- `CHROMA_TOKEN` (optional)
- `OPENCODE_THROTTLE_MS` (default: `200`)
- `LEVEL_DIR` (default: `.reconstitute/level`)
- `OLLAMA_URL` (default: `http://localhost:11434`)
- `OLLAMA_EMBED_MODEL` (default: `qwen3-embedding:0.6b`)
- `OLLAMA_NUM_CTX` (default: `32768`)
- `BATCH_SIZE` (default: `32`)
- `EMBED_TTL_MS` (default: 30 days)

### Reconstitute CLI
- `LEVEL_DIR` (default: `.reconstitute/level`)
- `OUTPUT_DIR` (default: `.reconstitute/output`)
- `OPENCODE_BASE_URL` (default: `http://localhost:4096`)
- `OPENCODE_API_KEY` (optional)
- `CHROMA_URL` (default: `http://localhost:8000`)
- `CHROMA_TENANT` (optional)
- `CHROMA_DATABASE` (optional)
- `CHROMA_TOKEN` (optional)
- `CHROMA_COLLECTION_SESSIONS` base name (default: `opencode_messages_v1`, salted with `OLLAMA_EMBED_MODEL`)
- `CHROMA_COLLECTION_NOTES` base name (default: `reconstitute_notes_v1`, salted with `OLLAMA_EMBED_MODEL`)
- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_EMBED_MODEL` (default: `qwen3-embedding:0.6b`)
- `OLLAMA_EMBED_NUM_CTX` (default: `32768`)
- `OLLAMA_CHAT_MODEL` (default: `qwen3-vl:8b-instruct`)
- `OLLAMA_CHAT_NUM_CTX` (default: `131072`)
- `TTL_EMBED_MS` (default: 30 days)
- `TTL_SEARCH_MS` (default: 30 minutes)
- `TTL_CHAT_MS` (default: 10 minutes)
- `BATCH_SIZE` (default: `32`)
- `WINDOW` (default: `2`)
- `SEARCH_LIMIT` (default: `25`)
- `SEARCH_THRESHOLD` (optional)
- `MAX_TOOL_ITERS` (default: `10`)
- `MAX_PATH_EXTRACTION_PASSES` (default: `6`)
- `MAX_PATHS` (default: `2000`)

## Exports
```ts
import {
  env,
  extractPathsLoose,
  flattenForEmbedding,
  indexSessions,
  opencodeMessageToOllamaParts,
  parseCliArgs,
  searchSessions,
} from "@promethean-os/reconstituter";
```

## Development
```bash
pnpm -C packages/reconstituter build
pnpm -C packages/reconstituter test
```

## Related Docs
- `OPENCODE-SESSIONS-INDEXER.md`
- `.opencode/skills/opencode-session-search/SKILL.md`
