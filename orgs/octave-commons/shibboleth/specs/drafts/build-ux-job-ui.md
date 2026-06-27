# Build UX + Job UI (Shibboleth)

Created: 2026-03-15
Status: draft

## Mission
Make dataset generation (especially MT-all-prompts) **observable, resumable, and operable** without staring at a silent terminal for hours.

User intent: manage long-running jobs (MT translation) like a build system:
- stepped
- resumable
- batched / checkpointed
- inspectable (progress, ETA, retries, 429s)
- optionally controllable from a UI/webserver

## Facts (current state)
- The pipeline is staged (fetch → canonicalize → embed+cluster → split → tier1-mt → tier2-mt → eval-suites).
- Stage-level caching exists via stage manifests + config-hash checks.
- MT-all-prompts implies ~13k prompts × 20 languages = ~266k variants (big, slow).
- Build currently has poor UX:
  - minimal/no progress logging
  - Stage 4/5 writes a single output file at end; interruption mid-stage loses work
  - 429/rate limits possible; retries/throttle are required
- Data artifacts live under `data/` which is gitignored (repo shouldn’t balloon).

## Non-goals
- Committing full datasets into git by default (too large). Instead: reproducible generation + external publishing.
- Fancy UI at phase 1.

## Risks
- Proxy rate limiting (429) and transient failures.
- Long runtime means operators will interrupt; resume must be robust.
- Partial/corrupt chunk files if process is killed mid-write (must use atomic writes).

## Plan

### Phase 1 — CLI Observability (fast)
- Add stage start/finish logs with timestamps.
- Add periodic progress logs during MT stages:
  - language, chunk i/N, throughput, ETA
  - retry/429 counters

### Phase 2 — True Resumability for MT stages (required)
- MT tier stages must be resumable *within* the stage:
  - write per-language chunk files under a config-hash-specific directory
  - skip already-existing chunks on restart
  - atomic write temp→rename to prevent corrupted chunks
  - at end, aggregate into `tier*-mt-variants.edn` for compatibility

### Phase 3 — Job Runs directory
- Each build gets a `run_id` and writes:
  - `data/runs/<run_id>/events.jsonl` (progress events)
  - `data/runs/<run_id>/build.log`
  - pointer to bundle dir + manifest hashes

### Phase 4 — Minimal Web UI (optional but desired)
- Start `promptbench.web` server (Ring/Jetty or http-kit).
- Endpoints:
  - POST /api/build (start job)
  - POST /api/cancel
  - GET /api/status
  - GET /api/logs (tail)
  - GET /events (SSE)
- Simple HTML dashboard to:
  - show stages, progress bars
  - show errors/retries
  - show latest bundle artifacts + checksums

## Definition of done
- `clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337`:
  - produces regular progress output (no silent hang)
  - can be interrupted and resumed without losing completed MT work
  - completes without fatal errors given a functioning proxy
