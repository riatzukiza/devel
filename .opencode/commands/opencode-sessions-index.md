# OpenCode Command: opencode-sessions-index

```yaml
name: opencode-sessions-index
description: Index OpenCode sessions into ChromaDB
usage: |
  ## Usage
  pnpm -C packages/reconstituter opencode-sessions index

  ## Environment
  OPENCODE_BASE_URL (default: http://localhost:4096)
  CHROMA_URL (default: http://localhost:8000)
  CHROMA_COLLECTION (base name, model suffix appended; default: opencode_messages_v1)
  OPENCODE_THROTTLE_MS (default: 200)
  LEVEL_DIR (default: .reconstitute/level)
  OLLAMA_URL (default: http://localhost:11434)
  OLLAMA_EMBED_MODEL (default: qwen3-embedding:8b)
  OLLAMA_NUM_CTX (default: 32768)
  BATCH_SIZE (default: 32)
  EMBED_TTL_MS (default: 2592000000)

  ## Examples
  pnpm -C packages/reconstituter opencode-sessions index
  CHROMA_COLLECTION=opencode_messages_v2 pnpm -C packages/reconstituter opencode-sessions index
```
