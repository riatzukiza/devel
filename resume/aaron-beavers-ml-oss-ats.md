---
title: "Aaron Beavers — Resume (ML + Open Source)"
---

# Aaron Beavers
Machine Learning / LLM Systems Engineer (Evaluation · LLM Infrastructure · Agentic Tooling)

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza

## Summary
Applied ML + systems engineer with 10+ years of software experience (pre-LLM era). Build reproducible evaluation pipelines, LLM proxy infrastructure, and simulation systems with a reliability-first mindset (determinism, manifests, idempotency, tests). Use agentic AI workflows as a force multiplier to iterate faster while keeping changes verifiable.

## Skills
- **ML/LLM**: prompt safety evaluation, dataset generation, embeddings (sentence-transformers), clustering (HDBSCAN), retrieval/semantic search (Chroma), machine-translation pipelines, reasoning-trace handling
- **Languages**: Clojure, Python, TypeScript/Node.js, SQL, Ruby
- **Backend**: Fastify/Express, Clojure CLI, libpython-clj interop, Postgres, Docker, WebSockets, structured logging
- **Frontend**: React, Vite, typed WebSocket clients, dashboards/observability UI
- **Reliability/Security**: OAuth PKCE (browser + device flows), rate-limit aware account rotation, retries/timeouts, reproducible builds, SHA-256 manifests

## Open Source Experience

### Octave Commons — Shibboleth (generative adversarial prompt-eval dataset DSL)
https://github.com/octave-commons/shibboleth
- Built a generative Clojure DSL + **7-stage** pipeline to produce publication-grade adversarial prompt evaluation datasets with full provenance.
- Implemented leakage-proof train/dev/test splits via sentence-transformers embeddings + HDBSCAN clustering and cluster-disjoint stratified sampling.
- Emitted reproducibility bundles (Parquet + datasheet + stage manifests + SHA-256) and multilingual transforms (MT, code-mixing, homoglyphs, token exhaustion).

### Open Hax — OpenAI Proxy (multi-provider OpenAI-compatible LLM gateway)
https://github.com/open-hax/proxx
- Implemented an OpenAI-compatible proxy that routes by model prefix to OpenAI Responses, Anthropic Messages, and Ollama chat APIs.
- Preserved reasoning traces across API translations (including streaming) and mapped OpenAI reasoning controls into provider-specific “thinking” payloads.
- Added provider-scoped key/OAuth rotation on rate limits, cross-provider fallbacks, and a web console (credentials + usage) with Chroma-backed semantic history search; reused the stack in Mythloom, a worker-side anti-extractive resume analysis workbench.

### Ussyverse — Battlebussy (AI-vs-AI cyber CTF platform; Go + NATS JetStream control plane)
https://github.com/shuv1337/battlebussy
- Contributor: production deployment + container hardening (multi-arch builds, GHCR, docker-compose prod, OCI Terraform walkthrough/docs).

### Octave Commons — Gates of Aker / Fantasia (Clojure simulation + React observability UI)
https://github.com/octave-commons/gates-of-aker
- Maintained a tick-based backend simulation engine with WebSocket control plane plus a React UI for observing and steering runs (ticks, levers, trace logs).
- Wrote WebSocket E2E tests validating protocol, snapshot/reset operations, placement mechanics, performance, and error handling.
- Implemented agent perception/memory primitives (facet queries, embedding cache, cosine similarity) and simulation levers for belief propagation and model selection.

### Octave Commons — Mythloom (worker-side resume analysis workbench)
Local Octave Commons research project
- Built a worker-side, anti-extractive resume-processing workbench that compares resume variants against job descriptions using parser-aware lexical scoring, ATS section checks, and reproducible JSON/Markdown reports.
- Authored the ML design direction: parser ensemble first, dense embeddings + hybrid fusion next, with guardrails against employer-side candidate ranking.

## Work Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained **5-stage** Celery pipelines for uploaded-file processing (parse → validate → summarize → report → notify) with safe failure modes and operational visibility.
- Implemented robust file type + encoding detection (magic-based sniffing + charset detection + fallbacks) to route inputs to correct decoders and reduce support burden.
- Integrated anti-malware scanning automation via ClamAV REST using retry/backoff + timeouts and persisted scan outcomes for auditability.

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
