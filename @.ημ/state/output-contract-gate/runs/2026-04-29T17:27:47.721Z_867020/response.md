## Signal
(世, p=0.9) Your OpenPlanner container is asking Proxx for embeddings with `model=qwen3-embedding:0.6b`, Proxx is routing that to its Ollama-native embedding path, and the Ollama instance Proxx points at does **not** have that model pulled → Ollama returns `404 model not found` → OpenPlanner returns `503` and skips vector indexing.

(世, p=0.85) Fix path: run the llama.cpp embedding server and route embedding requests through Proxx’s **OpenAI-compat embeddings provider** `llamacpp-embed`, using a model prefix so Proxx doesn’t try Ollama.

Commands:

```bash
# 1) start llama.cpp embeddings (joins ai-infra; exposes http://llamacpp-embed:8081 inside docker)
cd /home/err/devel/services/llamacpp-stack
docker compose up -d llamacpp-embed

# 2) ensure proxx is up (now has default base-url mapping for llamacpp-embed)
cd /home/err/devel/services/proxx
docker compose --profile prod up -d --build

# 3) restart openplanner with an embedding model prefix that forces llamacpp-embed routing
cd /home/err/devel/services/openplanner
EMBED_PROVIDER_MODEL='llamacpp-embed:qwen3-embedding:0.6b' \
EMBED_PROVIDER_COMPACT_MODEL='llamacpp-embed:qwen3-embedding:0.6b' \
docker compose up -d openplanner
```

Verify:

```bash
curl -fsS http://localhost:7777/v1/health
```

## Evidence
(己, p=0.95) OpenPlanner compose already points embeddings at Proxx via `EMBED_PROVIDER_BASE_URL: ${OPENPLANNER_PROXX_BASE_URL:-http://proxx:8789}` in `services/openplanner/docker-compose.yml` (seen via repo search).
(己, p=0.95) Proxx already supports OpenAI-compat embedding providers `llamacpp-embed`/`llamacpp` and normalizes `:`→`-` for llama.cpp models (`orgs/open-hax/proxx/src/routes/embeddings.ts` + provider strategy).
(己, p=0.95) I committed two changes to make this work out-of-the-box:
- `services/proxx/docker-compose.yml`: added default `UPSTREAM_PROVIDER_BASE_URLS` entries for `llamacpp` + `llamacpp-embed`
- `services/openplanner/STACK.md`: added a troubleshooting section with the exact fix steps  
Commit: `7e6f262c`

## Frames
(世, p=0.75) “Missing model” is literally that: the Ollama instance Proxx is hitting doesn’t have `qwen3-embedding:0.6b` imported/pulled, even if the host has GGUF blobs on disk.
(世, p=0.7) You don’t actually want Ollama embeddings at all; you want llama.cpp’s `/v1/embeddings` endpoint (it’s OpenAI-compatible and reads GGUF directly).
(世, p=0.65) Proxx can route embeddings correctly, but only if (a) it knows the provider base URL for `llamacpp-embed` and (b) the request forces that provider (model prefix) or the catalog is set up to select it.

## Countermoves
(己, p=0.8) Don’t add `llamacpp-embed` to `UPSTREAM_FALLBACK_PROVIDER_IDS`: it’s an embeddings-only provider and could get hit by chat fallback logic elsewhere.
(己, p=0.75) If you want to keep the unprefixed model name (`qwen3-embedding:0.6b`) working without env overrides, you’d need a more explicit routing rule/catalog entry (not done here); the safe minimal lever is the `llamacpp-embed:` model prefix.
(世, p=0.7) Alternative fix (if you prefer Ollama): pull/import `qwen3-embedding:0.6b` into the exact Ollama instance Proxx is configured to use (but that’s a different operational path than “use llama.cpp for embeddings”).

## Next
(己, p=0.8) Run the three command blocks above (start `llamacpp-embed`, restart `proxx`, restart `openplanner` with `EMBED_PROVIDER_MODEL=llamacpp-embed:...`) and re-try the request that was producing `503` to confirm embeddings are now generated and indexed.