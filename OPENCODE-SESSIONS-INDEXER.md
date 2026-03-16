# OpenCode Sessions Indexer

This service provides passive indexing of historical OpenCode sessions into ChromaDB for semantic search.

Real-time message ingestion is handled by the `RealtimeCapturePlugin`, which forwards live `message.updated` events through the API gateway into OpenPlanner (`/api/openplanner/v1/events`).

## Components

1. **CLI Tool**: `packages/reconstituter/src/opencode-sessions.ts` - Unified search and index CLI
2. **PM2 Service**: `services/opencode-indexer` + `ecosystems/opencode-indexer.cljs`
3. **Shell Script**: `opencode-sessions-index.sh` - Standalone script wrapper
4. **Skill Documentation**: `.opencode/skills/opencode-session-search.md` - Agent skill reference

## Quick Start

### Option 1: Run Manually
```bash
# Index all sessions
pnpm -C packages/reconstituter opencode-sessions index

# Search sessions
pnpm -C packages/reconstituter opencode-sessions search "your query"

# Use shell script
./opencode-sessions-index.sh
```

### Option 2: PM2 Service (Recommended)
```bash
# Add to PM2 (compile ecosystems first)
pnpm generate-ecosystem
pm2 start ecosystem.config.cjs

# Check status
pm2 describe opencode-indexer

# View logs
pm2 logs opencode-indexer

# Stop service
pm2 stop opencode-indexer
pm2 delete opencode-indexer
```

### Option 3: Cron Job
```bash
# Edit crontab
crontab -e

# Add line (runs every hour):
0 * * * * /home/err/devel/opencode-sessions-index.sh >> /home/err/devel/logs/cron.log 2>&1
```

## Configuration

Environment variables can be set in several ways:

1. **`.env` file** in project root
2. **PM2 config** (`ecosystems/opencode-indexer.cljs`)
3. **Shell export** before running
4. **Direct environment variables**

### Default Values
```bash
OPENCODE_BASE_URL=http://localhost:4096
OPENCODE_INDEXER_MODE=historical-backfill
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=opencode_messages_v1  # base name; model suffix is appended automatically
OPENCODE_THROTTLE_MS=200
LEVEL_DIR=.reconstitute/level
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b
OLLAMA_NUM_CTX=32768
BATCH_SIZE=32
EMBED_TTL_MS=2592000000  # 30 days
```

`OPENCODE_INDEXER_MODE` supports:

- `historical-backfill` (default): index archived session/message history.
- `disabled`: no-op mode for environments where another process handles backfill.

## Embedding Dimensions

⚠️ **Important**: Collections are salted with the embedding model name (e.g. `opencode_messages_v1__qwen3_embedding_8b`). If you encounter an embedding dimension mismatch, delete the salted collection:

```bash
# Using ChromaDB HTTP API
curl -X DELETE http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections/opencode_messages_v1__qwen3_embedding_8b

# Or using ChromaDB CLI
chroma-cli delete opencode_messages_v1__qwen3_embedding_8b
```

The indexer will automatically recreate the collection with the correct dimensions.

## Logging

Logs are stored in `/home/err/devel/logs/`:

- `opencode-indexer.log` - Standard output
- `opencode-indexer-out.log` - PM2 stdout
- `opencode-indexer-error.log` - Error output

View logs:
```bash
# PM2 logs
pm2 logs opencode-indexer --lines 100

# Direct log files
tail -f /home/err/devel/logs/opencode-indexer.log
```

## Usage with Agents

When working with OpenCode session search, load the `opencode-session-search` skill:

```typescript
delegate_task(
  category="quick",
  load_skills=["opencode-session-search"],
  description="Search sessions for authentication patterns",
  prompt="Search previous OpenCode sessions to find how authentication was implemented"
)
```

## Troubleshooting

### PM2 Out of Date Warning
```bash
pm2 update
```

### Collection Dimension Mismatch
If you see: "Collection expecting embedding with dimension of X, got Y":

```bash
# Delete collection and re-index
curl -X DELETE http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections/opencode_messages_v1
pm2 restart opencode-indexer
```

### ChromaDB Connection Issues
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Check ChromaDB logs
docker logs chromadb
```

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Pull model if needed
ollama pull qwen3-embedding:8b
```

## Files

- `packages/reconstituter/src/opencode-sessions.ts` - Main CLI implementation
- `opencode-sessions-index.sh` - Shell script wrapper
- `ecosystems/opencode-indexer.cljs` - ClojureScript ecosystem definition
- `.opencode/skills/opencode-session-search.md` - Skill documentation

## Integration with Existing Tools

The CLI is designed to work with:
- **ChromaDB**: Vector database for embeddings
- **Ollama**: Embedding generation with caching
- **LevelDB**: Embedding cache with TTL
- **OpenCode API**: Session and message retrieval
- **PM2**: Process management
