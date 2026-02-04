# OpenCode Command: opencode-sessions-search

```yaml
name: opencode-sessions-search
description: Search indexed OpenCode sessions using semantic similarity
usage: |
  ## Usage
  pnpm -C packages/reconstituter opencode-sessions search "<query>" [options]

  ## Options
  --k <number> (default: 10): Number of results to return
  --session, -s <id> (optional): Filter results to a specific session ID

  ## Notes
  CHROMA_COLLECTION uses a base name and appends the embedding model suffix.

  ## Examples
  pnpm -C packages/reconstituter opencode-sessions search "authentication flow"
  pnpm -C packages/reconstituter opencode-sessions search "error handling" --k 20
  pnpm -C packages/reconstituter opencode-sessions search "api design" --session ses_abc123
```
