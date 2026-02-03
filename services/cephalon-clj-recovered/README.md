# Promethean (conversation zip export)

This zip was generated from a ChatGPT conversation and contains a minimal Shadow-CLJS Node runtime
for:

- ECS world + tick loop
- async effect runner with `:effects/pending` and inflight limits
- Discord adapter (discord.js) emitting `:discord.message/new`
- FS adapter (chokidar) emitting `:fs.file/created` + `:fs.file/modified`
- Memory ingestion + deterministic dedupe + tags + nexus keys
- Eidolon v0: nexus index + embedding scheduling + vector store
- Cephalon (Duck) janitor session that posts reports to Discord

## Run

```bash
npm install
npm run dev
# or build:
npm run build && npm run start
```

### Env vars

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional, defaults to https://api.openai.com/v1)
- `DISCORD_BOT_TOKEN`

## Notes

- The code is intentionally MVP-grade; several parts (query embeddings, GC summarization)
  are planned but not fully implemented yet.
