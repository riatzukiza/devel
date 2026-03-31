---
title: "Aaron Beavers — Resume (OpenAI Parameter Golf / Compute Grant, ATS)"
---

# Aaron Beavers
Independent Open-Source ML Systems Engineer (Evaluation · Experimentation · LLM Infrastructure)

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza

## Summary
Independent engineer building reproducible ML evaluation pipelines, model-facing infrastructure, and compact experiment systems. Strongest patterns: deterministic runs, benchmark discipline, fast iteration on unusual technical problems, and shipping tooling that turns ideas into measurable results.

## Skills
- **ML/LLM**: benchmark harness design, dataset generation, embeddings (sentence-transformers), clustering (HDBSCAN), retrieval/semantic search (Chroma), prompt-boundary evaluation, reasoning-trace handling
- **Languages**: Clojure, Python, TypeScript/Node.js, SQL, Ruby
- **Systems**: Fastify/Express, Clojure CLI, Postgres, Docker, WebSockets, structured logging, local GPU/container workflows
- **Experimentation**: deterministic seeds, manifests, SHA-256 artifacts, run ledgers, search-space design, reproducible ablations

## Open Source / Independent Work

### Parameter Golf Experiment Lab (current independent work)
Local experiment system for OpenAI Parameter Golf participation
- Built an ACO-guided experiment lab that ranks candidate Parameter Golf recipes by hypothesis family, local proxy results, and leaderboard-derived motif signals.
- Implemented a local GPU runner and containerized runtime path to validate candidate configurations before spending cloud credits.
- Integrated public PR/leaderboard signal into the search loop to bias exploration toward observed frontier patterns like quantization, sliding-window eval, and optimizer/architecture variants.

### Octave Commons — Shibboleth (generative adversarial prompt-eval dataset DSL)
https://github.com/octave-commons/shibboleth
- Built a generative Clojure DSL + **7-stage** pipeline to produce benchmark-grade adversarial prompt evaluation datasets with full provenance.
- Implemented leakage-proof train/dev/test splits via sentence-transformers embeddings + HDBSCAN clustering and cluster-disjoint stratified sampling.
- Emitted reproducibility bundles (Parquet, datasheet, manifests, SHA-256) so runs are auditable and repeatable.

### Open Hax — OpenAI Proxy (multi-provider OpenAI-compatible LLM gateway)
https://github.com/open-hax/proxx
- Implemented an OpenAI-compatible proxy that routes by model prefix to OpenAI Responses, Anthropic Messages, and Ollama chat APIs.
- Preserved reasoning traces across API translations and added key/OAuth rotation plus semantic session search for easier experiment inspection.

## Work Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained **5-stage** Celery pipelines for uploaded-file processing (parse → validate → summarize → report → notify) with safe failure modes and operational visibility.
- Implemented robust file type + encoding detection and integrated anti-malware scanning automation via ClamAV REST using retry/backoff + timeouts with persisted outcomes.

### CloudApp — Full Stack Engineer (Ruby on Rails)
*Sep 2018 – Feb 2019*
- Integrated a proprietary OCR service into a screenshot platform.
- Shipped interactive OCR UX (bounding boxes; click-to-extract text) and hardened key flows with automated tests.

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education / Work Authorization
Valley Springs High School — Diploma (2012) · Authorized to work in the U.S. for any employer · Willing to relocate
