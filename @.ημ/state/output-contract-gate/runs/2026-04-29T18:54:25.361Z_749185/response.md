## Signal
(己, p=0.95) Done. `llamacpp-embed` is running, `proxx` is rebuilt/restarted with `llamacpp` + `llamacpp-embed` in `UPSTREAM_PROVIDER_BASE_URLS`, and `openplanner` is restarted with:

- `EMBED_PROVIDER_MODEL=llamacpp-embed:qwen3-embedding:0.6b`
- `EMBED_PROVIDER_COMPACT_MODEL=llamacpp-embed:qwen3-embedding:0.6b`

(世, p=0.95) OpenPlanner health now reports embeddings OK and shows the new embedding models:

```json
"embeddingModels":{"hot":"llamacpp-embed:qwen3-embedding:0.6b","compact":"llamacpp-embed:qwen3-embedding:0.6b"},
"dependencies":{"embeddings":{"ok":true}}
```

## Evidence
(己, p=0.9) `services/llamacpp-stack`: `llamacpp-stack-llamacpp-embed-1` is `healthy` and listening on `127.0.0.1:8081`.
(己, p=0.9) `services/proxx`: `proxx-local-proxx-1` is `healthy` after rebuild.
(己, p=0.9) `services/openplanner`: `openplanner-openplanner-1` is `healthy` and `curl -fsS http://127.0.0.1:7777/v1/health` returns `dependencies.embeddings.ok=true`.
(世, p=0.8) OpenPlanner logs no longer show the prior `Embed provider failed: 404 Not Found ... model not found` error during the quick tail I checked.

## Frames
(世, p=0.7) Previously: Proxx was implicitly using Ollama for embeddings and Ollama didn’t have `qwen3-embedding:0.6b`.
(世, p=0.8) Now: OpenPlanner forces the `llamacpp-embed` provider via model prefix; Proxx routes embeddings to llama.cpp’s OpenAI-compatible `/v1/embeddings`.

## Countermoves
(世, p=0.75) The `/v1/health` output shows `vexx.ok=false` (“fetch failed”), but `vexx.enforce=false` so it won’t break ingestion/embedding; treat it as separate optional dependency noise unless you’re trying to use Vexx.
(世, p=0.7) If you ever remove the `llamacpp-embed:` prefix, Proxx will likely fall back to Ollama embedding again and you can re-trigger the 404 depending on that Ollama instance.

## Next
(己, p=0.8) Re-run the exact action that produced the `503` earlier (the same request / ingestion event) and confirm the event now indexes with embeddings instead of logging `embedding_upstream_error`.