## Signal

(己, p=0.98) Made it happen.

Implemented Proxx routing so `qwen3-embedding:0.6b` can route to `llamacpp-embed` instead of falling through to Ollama.

Changed:

- `orgs/open-hax/proxx/src/lib/embeddings-strategy.ts`
  - Added `llamacpp-embed` embedding provider support.
  - Added `EMBED_MODEL_PROVIDER_ALIASES` / `EMBED_PROVIDER_BY_MODEL` parsing.
  - Added model normalization for `qwen3-embedding:0.6b` → `qwen3-embedding-0.6b`.

- `orgs/open-hax/proxx/src/routes/embeddings.ts`
  - Bare model aliases can now select a configured embedding provider.
  - Explicit `llamacpp-embed:` prefixes are stripped before forwarding.
  - llama.cpp model normalization happens after prefix stripping.

- `services/proxx/docker-compose.yml`
  - Prod/dev now set:
    - `EMBED_MODEL_PROVIDER_ALIASES=qwen3-embedding:0.6b=llamacpp-embed,qwen3-embedding-0.6b=llamacpp-embed`
  - Dev fallback provider list now includes `llamacpp-embed`.

- `services/openplanner/docker-compose.yml`
  - Default OpenPlanner embedding models now prefer:
    - `llamacpp-embed:qwen3-embedding:0.6b`
  - Bundled Proxx profile now includes the same alias wiring.

Commits:

- Proxx: `5388566 Route qwen embeddings to llama.cpp provider`
- Root: `6057a6ce Route qwen embeddings through Proxx llama.cpp`

## Evidence

(己, p=0.96) Typecheck/build/tests passed:

```bash
cd orgs/open-hax/proxx
pnpm exec tsc -p tsconfig.json --noEmit --pretty false
pnpm run build
node --test --test-concurrency=1 --test-name-pattern='embeddings|embedding aliases|llama.cpp embed prefixes' dist/tests/proxy.test.js
```

Result:

```text
pass 5
fail 0
```

(己, p=0.97) Compose validates:

```bash
cd services/proxx && docker compose --profile prod config --quiet
cd services/openplanner && docker compose config --quiet
```

(己, p=0.98) Rebuilt and restarted running Proxx prod:

```bash
cd services/proxx
docker compose --profile prod build proxx
docker compose --profile prod up -d proxx
```

(世, p=0.99) Live Proxx test now passes for bare model:

```json
{
  "object": "list",
  "model": "qwen3-embedding-0.6b",
  "data_len": 1,
  "embedding_len": 1024,
  "error": null
}
```

(世, p=0.99) Live Proxx test also passes for explicit prefix:

```json
{
  "model": "qwen3-embedding-0.6b",
  "embedding_len": 1024,
  "error": null
}
```

(世, p=0.96) OpenPlanner health is now green on both ports:

```json
{
  "ok": true,
  "embeddings": { "ok": true },
  "vectorStore": { "ok": true }
}
```

(世, p=0.96) OpenPlanner vector search works again:

```json
{
  "ok": true,
  "result": {
    "documents": [["test"]]
  }
}
```

## Frames

(己, p=0.9) Proxx still preserves Ollama as the default bare-model behavior unless `EMBED_MODEL_PROVIDER_ALIASES` is set.

(己, p=0.94) The running prod compose now sets that alias, so `qwen3-embedding:0.6b` goes to `llamacpp-embed`.

(己, p=0.91) OpenPlanner is robust either way: if `.env` overrides the model back to bare `qwen3-embedding:0.6b`, Proxx still routes it correctly.

## Countermoves

(己, p=0.88) I did not touch existing unrelated/untracked Proxx notes or `pseudo/`.

(己, p=0.88) I preserved the existing dirty OpenPlanner submodule/worktree state.

(己, p=0.9) No secrets were printed in the final output.

## Next

(己, p=0.94) Let the stack run; the embedding provider failure that was blocking OpenPlanner health/search is cleared.