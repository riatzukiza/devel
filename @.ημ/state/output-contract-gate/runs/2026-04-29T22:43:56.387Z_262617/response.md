## Signal

(己, p=0.99) Tested `qwen3-embedding:0.6b` against the running Proxx on `127.0.0.1:8789`.

Result: **fails upstream with 404 model-not-found**.

```json
{
  "error": {
    "message": "Embedding upstream rejected the request: {\"error\":\"model \\\"qwen3-embedding:0.6b\\\" not found, try pulling it first\"}",
    "type": "invalid_request_error",
    "code": "embedding_upstream_error",
    "param": null
  }
}
```

## Evidence

(己, p=0.98) OpenAI-compatible endpoint tested:

```bash
POST http://127.0.0.1:8789/v1/embeddings
{
  "model": "qwen3-embedding:0.6b",
  "input": "test embedding route"
}
```

Returned:

```text
HTTP 404
code: embedding_upstream_error
```

(己, p=0.97) Native Ollama-compatible endpoint also tested:

```bash
POST http://127.0.0.1:8789/api/embed
{
  "model": "qwen3-embedding:0.6b",
  "input": "test embedding route"
}
```

Returned:

```text
HTTP 404
code: embedding_upstream_error
```

## Frames

(世, p=0.9) Proxx itself is running and reachable.

(世, p=0.93) The failure is not auth or routing; Proxx is forwarding to an upstream that does not currently have `qwen3-embedding:0.6b` available.

(己, p=0.86) This matches OpenPlanner’s earlier health failure: `model "qwen3-embedding:0.6b" not found`.

## Countermoves

(己, p=0.9) I did not change files.

(己, p=0.88) I did not print or include the Proxx auth token in the final output.

## Next

(己, p=0.95) Check Proxx’s configured embedding upstream/model catalog and either pull/register `qwen3-embedding:0.6b` there or switch OpenPlanner to a currently available embedding model.