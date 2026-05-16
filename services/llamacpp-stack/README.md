# llama.cpp Stack

Drop-in replacement for the `ollama-stack` service, providing local GPU-accelerated LLM inference via [llama.cpp](https://github.com/ggerganov/llama.cpp).

## Services

| Service | Port | Purpose |
|---|---|---|
| `llamacpp-chat` | 8080 | Chat/completions (`/v1/chat/completions`) |
| `llamacpp-embed` | 8081 | Embeddings (`/v1/embeddings`) |

Both join the `ai-infra` Docker network and expose OpenAI-compatible endpoints.

## Setup

### 1. Models are already on disk

The compose defaults to reading GGUF blobs directly from the existing Ollama storage
at `/usr/share/ollama/.ollama/models/blobs`. Ollama stores models as raw GGUF files
with `sha256-` prefixed filenames — no download or conversion needed.

If you want to use a different models directory, set `LLAMACPP_MODELS_DIR`:

```bash
LLAMACPP_MODELS_DIR=/usr/share/ollama/.ollama/models/blobs docker compose up -d
```

### Available model blobs (from current Ollama install)

| Ollama tag | Blob filename | Size |
|---|---|---|
| `gemma4:e4b` / `gemma4:latest` | `sha256-4c27e0f5b5adf02ac...` | 8.95GB |
| `qwen3.5:latest` | `sha256-dec52a44569a2a25...` | 6.14GB |
| `qwen3:8b` | `sha256-a3de86cd1c132c82...` | 4.87GB |
| `qwen3:4b` | `sha256-3e4cb1417446040...` | 2.33GB |
| `qwen3-embedding:0.6b` | `sha256-06507c7b4268846...` | 639MB |

To switch the chat model, set `LLAMACPP_CHAT_MODEL` to the blob filename:

```bash
# Use qwen3.5:latest for chat instead
LLAMACPP_CHAT_MODEL=sha256-dec52a44569a2a25341c4e4d3fee25846eed4f6f0b936278e3a3c900bb99d37c docker compose up -d
```

### Adding new GGUF models

If you need models not in the Ollama store, download them into a local directory
and point `LLAMACPP_MODELS_DIR` at it:

```bash
mkdir -p models
wget -O models/gemma-4-e2b-Q4_K_M.gguf \
  "https://huggingface.co/bartowski/gemma-4-e2b-GGUF/resolve/main/gemma-4-e2b-Q4_K_M.gguf"
LLAMACPP_MODELS_DIR=./models LLAMACPP_CHAT_MODEL=gemma-4-e2b-Q4_K_M.gguf docker compose up -d
```

### 2. Start the stack

```bash
cd services/llamacpp-stack
docker compose up -d
```

### 3. Verify

```bash
# Chat endpoint
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma-4-e4b","messages":[{"role":"user","content":"hello"}]}'

# Embedding endpoint
curl http://127.0.0.1:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-embedding-0.6b","input":"hello world"}'
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLAMACPP_CHAT_PORT` | 8080 | Host port for chat server |
| `LLAMACPP_EMBED_PORT` | 8081 | Host port for embedding server |
| `LLAMACPP_CHAT_MODEL` | sha256-4c27e0f5... (gemma4:e4b) | Chat model blob filename in `/models` |
| `LLAMACPP_EMBED_MODEL` | sha256-06507c7b... (qwen3-embed:0.6b) | Embedding model blob filename in `/models` |
| `LLAMACPP_MODELS_DIR` | /usr/share/ollama/.ollama/models/blobs | Host directory containing GGUF files |
| `LLAMACPP_N_GPU_LAYERS` | 999 | GPU layers (999 = all layers on GPU) |
| `LLAMACPP_CTX_SIZE` | 8192 | Context window size (chat only) |
| `LLAMACPP_PARALLEL` | 4 | Parallel sequences (chat only) |
| `CUDA_VISIBLE_DEVICES` | 0 | GPU device index |

## Why llama.cpp over Ollama

- **Explicit GPU control**: `--n-gpu-layers 999` forces all layers to VRAM, bypassing Ollama's broken automatic offload heuristics
- **OpenAI-compatible API natively**: Standard `/v1/chat/completions` and `/v1/embeddings` without custom Ollama paths
- **Validated on Gemma 4 GGUFs**: No mangling issues that Ollama has ([ollama#15237](https://github.com/ollama/ollama/issues/15237))
- **Zero redownload**: Reads existing Ollama blob storage directly — Ollama stores raw GGUF under `/usr/share/ollama/.ollama/models/blobs/` with `sha256-` prefixed filenames
