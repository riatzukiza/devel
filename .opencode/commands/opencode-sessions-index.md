# OpenCode Command: opencode-sessions-index

```yaml
name: opencode-sessions-index
description: Index OpenCode sessions into OpenPlanner
usage: |
  ## Usage
  pnpm -C packages/reconstituter opencode-sessions index

  ## Environment
  OPENCODE_BASE_URL (default: http://localhost:4096)
  OPENPLANNER_URL (default from @promethean-os/openplanner-cljs-client)
  OPENPLANNER_API_KEY (optional bearer token)
  OPENCODE_THROTTLE_MS (default: 200)
  LEVEL_DIR (default: .reconstitute/level)
  BATCH_SIZE (default: 32)
  OPENCODE_CHUNK_INDEXING (default: 1)
  OPENCODE_CHUNK_TARGET_TOKENS (default: 32000)
  OPENCODE_CHUNK_OVERLAP_MESSAGES (default: 4)

  ## Examples
  pnpm -C packages/reconstituter opencode-sessions index
  OPENCODE_CHUNK_INDEXING=0 pnpm -C packages/reconstituter opencode-sessions index
```
