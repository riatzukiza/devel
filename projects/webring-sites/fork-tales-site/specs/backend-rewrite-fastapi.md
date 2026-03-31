# Fork Tales backend rewrite

## Goal

Replace the old single-file Python backend with a framework-based service that is easier to reason about, easier to deploy, and easier to extend without touching the frontend aesthetic.

## Non-negotiables

- keep the existing frontend shell and browser behavior
- keep the current API surface (`/healthz`, `/api/status`, `/api/chat`)
- use a real framework and real libraries
- remove runtime Caddy babysitting from the app process
- provide a staged Promethean deploy path

## Chosen frame

Use a **FastAPI + BM25 + httpx** backend and move deployment concerns into:

- container runtime config
- remote deploy script
- GitHub staging / production workflows

## Why this frame won

- FastAPI gives typed routes, lifecycle, validation, and decent operational ergonomics fast
- `rank-bm25` replaces custom ad hoc scoring with a small proven retrieval primitive
- `httpx` gives a clean async client for z.ai's OpenAI-compatible API
- deploy-time Caddy updates are cleaner than an app thread repeatedly poking the admin API
- remote host rebuild keeps the 500MB+ generated site snapshot out of git and out of CI artifacts

## Phases

1. Create a typed backend package.
2. Replace the legacy `server.py` with a thin uvicorn launcher.
3. Add tests against fixture content.
4. Add a container runtime.
5. Add remote deploy and live verify scripts.
6. Add PR -> staging -> main -> production workflows.
7. Update docs and examples.

## Verification

- `pytest` passes against fixture content
- `python server.py --root <fixture-dist>` serves status + chat
- `docker compose up -d --build` works after `python build_site.py`
- deploy script syntax checks cleanly
- workflow promotion rules are explicit
