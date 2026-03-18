---
title: "Aaron Beavers — Resume (OpenAI Parameter Golf, ATS)"
---

# Aaron Beavers
Machine Learning / Systems Engineer (Evaluation · Benchmarking · LLM Infrastructure)

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza

## Summary
Applied ML + systems engineer with 10+ years of software experience. Build reproducible evaluation pipelines, benchmark-grade datasets, and model-facing infrastructure with a reliability-first mindset. Strongest patterns: deterministic runs, manifests, seed-controlled experiments, leakage-proof validation, and fast iteration loops on weird technical problems.

## Skills
- **ML/LLM**: evaluation pipeline design, dataset generation, benchmark harness design, embeddings (sentence-transformers), clustering (HDBSCAN), retrieval/semantic search (Chroma), machine-translation pipelines, reasoning-trace handling
- **Languages**: Clojure, Python, TypeScript/Node.js, SQL, Ruby
- **Systems**: Fastify/Express, Clojure CLI, libpython-clj interop, Postgres, Docker, WebSockets, structured logging
- **Experiment/Reliability**: deterministic seeds, reproducibility bundles, SHA-256 manifests, retries/timeouts, idempotent automation, parser-aware reporting

## Open Source Experience

### Octave Commons — Shibboleth (generative adversarial prompt-eval dataset DSL)
https://github.com/octave-commons/shibboleth
- Built a generative Clojure DSL + **7-stage** pipeline to produce benchmark-grade adversarial prompt evaluation datasets with full provenance.
- Implemented leakage-proof train/dev/test splits via sentence-transformers embeddings + HDBSCAN clustering and cluster-disjoint stratified sampling.
- Emitted reproducibility bundles (Parquet, datasheet, coverage checks, stage manifests, SHA-256) so runs are auditable and repeatable.

### Open Hax — OpenAI Proxy (multi-provider OpenAI-compatible LLM gateway)
https://github.com/open-hax/proxx
- Implemented an OpenAI-compatible proxy that routes by model prefix to OpenAI Responses, Anthropic Messages, and Ollama chat APIs.
- Preserved reasoning traces across API translations (including streaming) and added provider-scoped key/OAuth rotation plus semantic session search, making model experiments easier to run and inspect.

### Octave Commons — Gates of Aker / Fantasia (Clojure simulation + React observability UI)
https://github.com/octave-commons/gates-of-aker
- Maintained a tick-based backend simulation engine with WebSocket control plane plus a React UI for observing and steering runs.
- Wrote WebSocket E2E tests validating protocol, snapshot/reset operations, performance, and error handling; added agent perception/memory primitives (embedding cache, cosine similarity).

## Work Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained **5-stage** Celery pipelines for uploaded-file processing (parse → validate → summarize → report → notify) with safe failure modes and operational visibility.
- Implemented robust file type + encoding detection and integrated anti-malware scanning automation via ClamAV REST using retry/backoff + timeouts with persisted outcomes.

### CloudApp — Full Stack Engineer (Ruby on Rails)
*Sep 2018 – Feb 2019*
- Integrated a proprietary OCR service into a screenshot platform.
- Implemented interactive OCR UX (render bounding boxes; click-to-extract recognized text) and hardened key user flows with automated tests.

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education
Valley Springs High School — Diploma (2012)

## Work Authorization
Authorized to work in the U.S. for any employer · Willing to relocate
