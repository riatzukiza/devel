---
title: "Aaron Beavers — Resume (Ichi / Costanoa, 1 Page)"
---

# Aaron Beavers
Staff / Senior Full‑Stack Software Engineer (React · Ruby on Rails · AI Systems)

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza

## Summary
Staff-level full-stack engineer with 10+ years of production software experience (pre-agentic-AI) building reliable systems end-to-end: APIs, data pipelines, web UIs, and automation. Recent work centers on AI-native infrastructure—model-agnostic LLM gateways, OAuth/credential workflows, and reproducible evaluation pipelines—shipping pragmatic architecture with tests, observability, and clear operational knobs.

## Skills
- **Full stack**: Ruby on Rails, React, TypeScript/Node.js (Fastify/Express), Python (Django/DRF/Celery)
- **Data**: Postgres, file pipelines/ETL, background jobs/queues
- **AI systems**: OpenAI-compatible APIs, model-aware routing (Responses/Messages/chat), multi-provider fallback/rotation, reasoning-trace preservation, semantic search (Chroma)
- **Reliability & security**: OAuth PKCE, token-authenticated services, retries/timeouts/backoff, idempotent job design, structured logs/audit trails
- **DevOps**: Docker/Compose, CI-driven regression prevention, Terraform-based cloud provisioning (OCI)

## Open Source Experience

### Founder / Maintainer — Open Hax · Octave Commons · RiatZukiza (Independent OSS)
*2023 – Present*
- **Open Hax Proxy**: 3-provider OpenAI-compatible gateway that integrates OpenAI Responses, Anthropic Messages, and Ollama via model-aware routing, avoiding dependence on a single model. Includes OAuth-based account ingestion, rate-limit-aware rotation/fallback, and a React/Vite console with Chroma-backed session recall.  
  https://github.com/open-hax/proxx
- **Shibboleth**: 7-stage generative prompt-eval dataset DSL + pipeline (Clojure + Python bridge) with deterministic builds, provenance, and reproducibility bundles (Parquet + SHA-256 manifests). Uses sentence-transformers + HDBSCAN for leakage-proof splits.  
  https://github.com/octave-commons/shibboleth

### Contributor — Ussyverse / Battlebussy
*2026*
- Production deployment + hardening for an AI cyber CTF platform (Go + NATS JetStream control plane): multi-arch Docker builds, GHCR publish/pull workflows, docker-compose production stack (optional nginx + health checks), and OCI (ARM64) Terraform provisioning docs.
  https://github.com/shuv1337/battlebussy

### Octave Commons — Mythloom
*2026*
- Built a worker-side resume analysis workbench for comparing resume variants against job descriptions with explainable scoring and reproducible reports, explicitly framed against employer-side candidate ranking.

## Work Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained 5-stage Celery pipelines for uploaded-file processing (parse → validate → summarize → report → notify) with safe failure modes and operational visibility.
- Implemented robust file type + encoding detection and case-level validation guardrails (caching, OOM prevention) producing structured errors for end users/analysts.
- Integrated anti-malware scanning automation (ClamAV REST) using retry/backoff + timeouts with persisted outcomes for auditability.
- Supported CI-driven end-to-end automation (Cypress E2E) to prevent regressions.

### CloudApp — Full Stack Engineer (Ruby on Rails)
*Sep 2018 – Feb 2019*
- Integrated a proprietary OCR service into a screenshot product and implemented interactive OCR UX (bounding boxes + click-to-extract text).

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education
Valley Springs High School — Diploma (2012)

## Work Authorization
Authorized to work in the U.S. for any employer · Fully remote (U.S.)
