# Semantic search performance + optional Ollama backend

## Context / files

- `src/ann/related-embeddings.ts`: Embedding builder uses @xenova/transformers CPU-only pipeline; LMDB cache.
- `src/graphql-server.ts`: Semantic search resolver invokes RelatedEmbeddingBuilder.
- `src/builder.ts`: RelatedEmbeddingBuilder used during graph build for related edges.
- Config: no embedding backend settings yet.

## Problem

Semantic search is slow; current pipeline is CPU/WASM-only and downloads hosted model. Need optional GPU/fast path and local-only fallback. Want optional Ollama embedding driver while keeping zero external service requirement (local-only by default).

## Definition of done

- Embedder supports selectable backend: default Xenova (local CPU/WASM), optional Ollama (local HTTP) with configurable model/host.
- Clear env/config toggles; sensible defaults preserve existing behavior.
- Semantic search works with either backend and keeps caching; failures should fall back to default rather than break.
- Build passes.

## Plan

1. Extend RelatedEmbeddingBuilder to support provider options (xenova/ollama), device hints, fallback behavior, and env-derived defaults; keep LMDB cache.
2. Implement Ollama embedder (local HTTP) and optional Xenova device hint (webgpu/wasm) with graceful fallback.
3. Wire options in graphql-server and builder to honor env vars; document new env names in code comments/spec.
4. Build/validate.
