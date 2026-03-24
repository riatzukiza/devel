---
title: "Aaron Beavers — Resume (DevSecOps + AI Systems)"
---

# Aaron Beavers
DevSecOps Engineer (AI Systems · LLM Infrastructure · Secure Automation)

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza

## Summary
DevSecOps / platform engineer focused on AI systems: secure LLM gateways, credential/OAuth workflows, and reproducible evaluation pipelines. ML-fluent (embeddings/clustering, eval design) with 10+ years building production software pre-agentic-AI; now use agentic tooling to accelerate delivery while keeping changes verifiable (tests, manifests, audit trails).

## Skills
- **DevSecOps**: Docker, Docker Compose, Postgres, PM2-style process management, CI-driven regression prevention (CircleCI), cloud.gov / Cloud Foundry workflows
- **Security & reliability**: OAuth PKCE (browser + device flows), token-gated APIs, provider-scoped key/OAuth rotation on rate limits, retries/timeouts/backoff, secure file handling, audit-friendly logging
- **AI systems**: OpenAI-compatible APIs, model-aware routing (Responses/Messages/chat), reasoning-trace preservation, embeddings + clustering pipelines, semantic session recall (Chroma)
- **Languages**: TypeScript/Node.js, Python, Clojure, SQL, Ruby

## Open Source Experience

### Open Hax — OpenAI Proxy (secure multi-provider LLM gateway)
https://github.com/open-hax/proxx
- Built a **3-provider OpenAI-compatible proxy** with **token auth**, provider-scoped **API-key/OAuth account rotation** on rate limits, and cross-provider fallback for operational continuity.
- Implemented **model-aware routing + payload translation** between OpenAI Responses, Anthropic Messages, and Ollama chat; preserved reasoning traces (including streaming), shipped a web console, and added **Chroma-backed semantic session search** plus optional OTEL export; reused the stack in Mythloom, a worker-side anti-extractive resume analysis workbench.

### Ussyverse — Battlebussy (AI-vs-AI cyber CTF platform; Go + NATS JetStream control plane)
https://github.com/shuv1337/battlebussy
- Contributor: shipped production deployment/hardening (multi-arch Docker builds, GHCR publish, docker-compose prod stack with optional nginx reverse proxy + healthchecks).
- Added OCI (ARM64) Terraform provisioning + first-deploy docs/runbooks for repeatable deployments.

### Octave Commons — Shibboleth (reproducible adversarial prompt-eval dataset pipeline)
https://github.com/octave-commons/shibboleth
- Authored a generative Clojure DSL + **7-stage** build pipeline that regenerates prompt-eval datasets with **deterministic seeds**, **full provenance**, leakage-proof splits (sentence-transformers + HDBSCAN), and **SHA-256 manifests/datasheets** for reproducibility.

### Octave Commons — Gates of Aker / Fantasia (simulation + observability UI)
https://github.com/octave-commons/gates-of-aker
- Maintained a tick-based Clojure simulation backend with a WebSocket control plane + React UI; added WebSocket E2E tests and supported safe rollout of policy constraints via gate runtime modes (shadow/enforce/off).

### Octave Commons — Mythloom (worker-side resume analysis workbench)
Local Octave Commons research project
- Built a worker-side, anti-extractive resume-processing workbench that compares resume variants against job descriptions using parser-aware scoring, ATS checks, and reproducible reports rather than employer-side candidate ranking.

## Work Experience

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained **5-stage** Celery pipelines for uploaded-file processing (parse → validate → summarize → report → notify) designed for safe failure modes and operational visibility.
- Integrated anti-malware scanning automation (ClamAV REST) using retry/backoff + timeouts with persisted outcomes for auditability; implemented robust file type + encoding detection.
- Supported end-to-end browser automation practices (Cypress E2E + CI execution) to prevent regressions.

### CloudApp — Full Stack Engineer (Ruby on Rails)
*Sep 2018 – Feb 2019*
- Integrated a proprietary OCR service into a screenshot platform; implemented interactive OCR UX (bounding boxes + click-to-extract text) and hardened key flows with automated tests.

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education
Valley Springs High School — Diploma (2012)

## Work Authorization
Authorized to work in the U.S. for any employer · Willing to relocate
