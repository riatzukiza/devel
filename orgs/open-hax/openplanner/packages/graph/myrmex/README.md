# myrmex

**Myrmex** is an ACO-guided web graph orchestrator that uses `@workspace/graph-weaver-aco` as the traversal brain and a ShuvCrawl-backed fetch backend for richer extraction.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Reading order

1. `docs/INDEX.md`
2. `docs/FORK_TALES_SOURCE_MAP.md`
3. `specs/orchestrator-contract.md`
4. `specs/adaptive-frontier-salience-and-template-aware-pruning.md`
5. `specs/event-and-storage-flow.md`
6. `specs/checkpoint-and-recovery.md`
7. `specs/deployment-lattice.md`

## What it does

- seeds and runs a long-lived graph crawl
- routes page/error/checkpoint events
- stores graph nodes and edges
- supports checkpointing and restore hooks
- exposes a small CLI/runtime entrypoint

## Status

Prototype package extracted from the devel workspace.

## Runtime configuration

Primary lake path now targets OpenPlanner directly so Myrmex can write into the
same lake Knoxx already uses:

- `OPENPLANNER_BASE_URL` — default `http://localhost:7777`
- `OPENPLANNER_API_KEY` — default `change-me`

Legacy/future compatibility:

- `PROXX_BASE_URL`
- `PROXX_AUTH_TOKEN`

Frontier hygiene controls:

- `MYRMEX_INCLUDE_PATTERNS` — optional comma-separated allowlist substrings for discovered URLs
- `MYRMEX_EXCLUDE_PATTERNS` — comma-separated denylist substrings for low-value hosts and action URLs
- `MYRMEX_MAX_DISPATCH_BURST` — maximum number of crawl launches per dispatch wave; defaults to current concurrency
- `MYRMEX_HOST_BALANCE_EXPONENT` — penalize hosts that dominate the current candidate set so sitemap-heavy domains do not monopolize traversal

If `OPENPLANNER_BASE_URL` is set, Myrmex writes graph events to
`POST /v1/events`. Otherwise it falls back to the planned Proxx lake surface at
`POST /api/v1/lake/events`.

OpenPlanner backpressure controls:

- `MYRMEX_OPENPLANNER_MAX_PENDING_WRITES` — pause crawling when queued graph writes reach this count
- `MYRMEX_OPENPLANNER_RESUME_PENDING_WRITES` — resume when the queue drains to this count or lower
- `MYRMEX_OPENPLANNER_MAX_EVENTS_PER_WRITE` — split large page graph writes into bounded event batches
- `MYRMEX_OPENPLANNER_HEALTH_TIMEOUT_MS` — timeout for OpenPlanner health probes
- `MYRMEX_OPENPLANNER_WRITE_TIMEOUT_MS` — timeout for a single OpenPlanner graph write request
- `MYRMEX_OPENPLANNER_HEALTH_POLL_MS` — polling interval while waiting for OpenPlanner recovery
- `MYRMEX_OPENPLANNER_BACKOFF_BASE_MS` — initial exponential backoff after transient OpenPlanner write failure
- `MYRMEX_OPENPLANNER_BACKOFF_MAX_MS` — cap for exponential backoff delay

Myrmex now serializes OpenPlanner graph writes, engages explicit backpressure on
transient `5xx`/timeout failures, pauses the crawl when the downstream queue
grows too large, and resumes only after OpenPlanner recovers and the pending
write queue drains. The underlying ACO loop now survives pause/resume cycles,
so a temporary backpressure pause no longer kills the crawl until container
restart.

## Adjacent repos

- `octave-commons/graph-weaver-aco` — traversal brain
- `octave-commons/graph-weaver` — graph service/UI surface
