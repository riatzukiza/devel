# Remote UI observability + deploy for shibboleth.promethean.rest

## Goal
Expose Shibboleth on `shibboleth.promethean.rest` with a browser UI that can:
- observe long-running benchmark jobs
- start/stop managed host-native benchmark sessions
- inspect run configs, logs, and metrics
- show truth-oriented summaries and charts for ASR/FPR/error behavior

## Why now
- Benchmarks are already running on `ussy.promethean.rest`
- host-native runtime is now stable enough for remote execution
- user wants direct browser access for monitoring and management, not terminal-only workflows
- DNS for `shibboleth.promethean.rest` now points at the benchmark host

## Scope
### In scope
1. Add benchmark-run discovery + status endpoints for `data/runs/**`.
2. Add start/stop controls for host-native tmux-managed benchmark sessions.
3. Extend the React UI with:
   - benchmark run list
   - run detail/log view
   - summary charts/tables for metrics
4. Deploy the UI + control-plane to the remote host behind the existing reverse-proxy stack.

### Out of scope
- multi-user auth/permissions
- perfect historical reconstruction for every old run artifact
- full job queueing/distributed orchestration

## Facts
- Existing control plane only manages `data/control-plane/runs/**` and subprocess jobs it starts itself.
- Current long-running host-native sweep is launched via tmux + `scripts/ussy_host_long_bench.sh`.
- Existing UI is DSL-oriented but not benchmark-observability-oriented.
- Remote host already has Caddy/nginx-related infra in containers and exposes 80/443.
- Port 8788 is already occupied by another service on the host.
- Open Hax proxy already maps OpenAI-style `reasoning_effort` into Claude thinking budgets.

## Risks
- Existing reverse proxy config may already be crowded; pick non-conflicting local ports.
- Benchmark runs created outside the control plane may have incomplete metadata.
- Starting/stopping tmux sessions via HTTP needs careful naming/validation.

## Phases
### Phase 1 — API support for benchmark observability
- add benchmark run listing/detail endpoints over `data/runs/**`
- add tmux-aware start/stop endpoints for host-native jobs
- expose grouped metrics summaries for charts

### Phase 2 — UI dashboard
- add benchmark jobs panel
- add run detail + log tail + config/metrics inspector
- add lightweight charts for ASR/FPR/errors by model

### Phase 3 — remote deploy
- run control plane on a non-conflicting local port
- build/serve UI on a non-conflicting local port
- wire `shibboleth.promethean.rest` through the existing reverse proxy

### Phase 4 — verification
- confirm browser access via domain
- confirm the UI can see the live long-running run
- confirm start/stop of a small managed job from the browser-backed API

## Definition of done
- `shibboleth.promethean.rest` serves the UI.
- The UI lists recent benchmark runs from `data/runs/**`.
- The UI can inspect metrics/logs/config for a run.
- The API can start/stop at least one host-native tmux-backed benchmark job.
