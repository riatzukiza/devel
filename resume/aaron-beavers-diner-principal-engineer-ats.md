---
title: "Aaron Beavers — Principal Engineer Resume (diner)"
---

# Aaron Beavers
Principal Engineer / Full-Stack AI Systems Engineer

## Contact
West Des Moines, IA 50265 · 515-388-0539 · foamy125@gmail.com  
GitHub: https://github.com/riatzukiza · Open to relocate for the right founding-team role

## Professional Summary
Founding-minded full-stack engineer with 10+ years building production software and recent deep ownership of OpenPlanner and Knoxx: a graph-backed, multi-tenant AI agent workbench spanning React, TypeScript/Node, Fastify, ClojureScript, PostgreSQL, Redis, WebSockets, OAuth, MCP tools, semantic memory, and LLM-integrated agent workflows. Strong fit for an early third-engineer role: set architecture, ship daily across the stack, keep systems observable, and turn ambiguous product needs into working software.

## Skills
- **Frontend**: React, TypeScript, Vite, React Router, WebSockets, real-time streaming UI, admin/workbench UX, component tests with Vitest and Testing Library
- **Backend**: TypeScript/Node.js, Fastify, ClojureScript/shadow-cljs, REST APIs, WebSockets, PostgreSQL, Redis, MongoDB, Docker Compose
- **AI / agents**: RAG and semantic-memory systems, tool-calling agents, MCP, OpenAI-compatible APIs, passive context hydration, run receipts, embeddings/vector search, graph traversal
- **Architecture / leadership**: early-stage product architecture, contract-oriented design, auth/RBAC, multi-tenancy, reliability, observability, CI, test strategy, incremental refactors

## Professional Experience

### Open Hax — OpenPlanner / Knoxx — Founder / Principal Engineer
*2026 – Present*
- Built and directed **OpenPlanner**, a graph-stack monorepo for semantic graph construction, traversal, layout, vector search, document/event projection, and agent memory APIs.
- Led **Knoxx**, a full-stack AI agent runtime/workbench with a React/Vite frontend and CLJS/Node/Fastify backend; current source spans more than **60k lines** across frontend and backend application code.
- Designed the agent workbench product surface: live chat orchestration, websocket token streaming, passive hydration, witness/source panels, tool receipts, run history, scratchpad/artifact surfaces, and steer/follow-up controls.
- Implemented product-grade auth and onboarding architecture with GitHub OAuth, Redis-backed cookie sessions, invite-based provisioning, bootstrap admin seeding, org membership context, and secure API route protection.
- Built the PostgreSQL control-plane foundation for multi-tenant RBAC: orgs, users, built-in roles, permission atoms, role assignments, per-role tool policies, per-user overrides, data lakes, and admin APIs.
- Drove a contract-oriented backend architecture so agents, actors, roles, capabilities, models, tool policies, triggers, and storage/materialization rules are explicit EDN contracts instead of scattered runtime assumptions.
- Integrated MCP as both a Knoxx tool-ingestion path and an OAuth-protected HTTP MCP facade, enabling agents and external clients to discover/call governed tools under role-based policy.
- Built ingestion contract surfaces for tenant/source-scoped knowledge pipelines, including discovery rules, scheduling, source drivers, sink routing, semantic graph enrichment, translation, projection metadata, and backpressure policies.
- Hardened runtime reliability: shadow-cljs build/test/lint flows, CLJS backend bootstrap pattern for Node built-ins, dockerized non-root runtime, nREPL/PM2 dev loops, streaming duplication fixes, and session persistence repairs.

### Open Hax — Proxx / LLM Infrastructure — Founder / Maintainer
*2024 – Present*
- Built an OpenAI-compatible multi-provider LLM gateway that routes model-prefixed requests across OpenAI, Anthropic, and Ollama-style APIs with token auth, provider-aware request translation, streaming support, and semantic session recall.
- Implemented operational controls for OAuth/account ingestion, provider-scoped rotation on rate limits, request/response normalization, reasoning trace preservation, and local/remote model routing.

### Raft Technologies — Full Stack Engineer (Python/Django + React)
*Jul 2020 – Sep 2023*
- Built and maintained **5-stage** Celery pipelines for uploaded-file processing: parse, validate, summarize, generate error reports, and notify stakeholders with safe failure modes and operational visibility.
- Implemented robust file type and encoding detection using extension fallback, charset detection, and magic-based sniffing to route inputs correctly and reduce manual support burden.
- Integrated ClamAV REST anti-malware scanning with retry/backoff, timeouts, persisted scan outcomes, and auditability for production file workflows.
- Supported React application work and Cypress/Gherkin E2E automation in CI against deployed federal/DoD environments.

### CloudApp — Full Stack Engineer (Ruby on Rails)
*Sep 2018 – Feb 2019*
- Integrated a proprietary OCR service into a screenshot/screengrab platform and shipped interactive OCR UX: render bounding boxes over screenshots and click to extract recognized text.
- Hardened user flows with automated browser testing patterns and production Rails/JS feature delivery.

### Additional Experience
1brand (Full Stack Engineer, 2019–2020) · Birdseed (Full Stack Engineer, 2019) · Freelance Software Engineer (2014–Present)

## Education
Valley Springs High School — Diploma (2012)

## Work Authorization
Authorized to work in the U.S. for any employer · Willing to relocate
