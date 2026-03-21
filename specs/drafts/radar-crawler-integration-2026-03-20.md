# Radar Crawler Integration — 2026-03-20

## Goal

Advance the live threat-radar system so the Fork Tales web graph weaver feeds radar signals/threads instead of running as an isolated sidecar.

## Why

The crawler is already live on `error@ussy.promethean.rest` and tracking the Hormuz watchlist, but the radar backend currently ingests only:

- structured Hormuz bundle packets
- Bluesky posts
- Reddit posts

This leaves crawler activity invisible to the radar wall.

## Desired Outcome

- threat-radar MCP can collect crawler/weaver data as first-class signals
- crawler-derived signals can be attached to a radar like `hormuz`
- clustering/reduction can use those signals without duplicating threads on every cycle
- the deployed recurring agent cycle uses crawler collection before clustering/reduction
- the public radar wall can surface crawler-connected threads

## Constraints

- Prefer additive changes; do not redesign the whole radar model.
- Use the existing weaver HTTP API rather than coupling directly to remote filesystem state.
- Avoid noisy ingestion of `entity_tick` spam.
- Keep remote deployment container-first.

## Inputs / Existing Surfaces

- `threat-radar-deploy/services/threat-radar-mcp/src/main.ts`
- `threat-radar-deploy/services/threat-radar-mcp/src/collectors/*.ts`
- `threat-radar-deploy/services/threat-radar-mcp/src/store.ts`
- `threat-radar-deploy/packages/radar-core/src/{schema,normalize,cluster}.ts`
- `services/radar-stack/scripts/hormuz_cycle.py`
- `orgs/octave-commons/fork_tales/part64/code/web_graph_weaver.js`
- remote weaver endpoints:
  - `/api/weaver/status`
  - `/api/weaver/events`
  - `/api/weaver/graph`

## Observed Reality

- The weaver `/events` feed is currently dominated by `entity_tick` events.
- The `/status` feed exposes usable aggregate data already:
  - crawler state
  - metrics
  - active domains
  - domain distribution
  - watchlist counts
- The current radar thread clustering path can duplicate threads if it reclusters repeatedly without replacing prior radar threads.

## Plan

### Phase 1 — Radar-side crawler collector
- add a `WeaverCollector` for weaver status/graph aggregation
- add REST + MCP tool surface for crawler collection
- emit normalized `SignalEvent`s with `source_type="api"`

### Phase 2 — Safe reclustering
- add radar-thread replacement / reset path before reclustering
- ensure recurring cycles can re-cluster without infinite duplicate thread growth

### Phase 3 — Runtime wiring
- call crawler collection from `services/radar-stack/scripts/hormuz_cycle.py`
- use watchlist domains/seeds appropriate to `hormuz`
- deploy updated radar stack to the remote host

### Phase 4 — Verification
- targeted collector tests
- threat-radar MCP build/tests for changed areas
- remote one-shot cycle
- confirm radar API shows crawler-connected threads/signals

## Risks

- Overly noisy crawler signals could swamp the radar UI.
- Graph payloads can be large; collector should prefer bounded status-derived summaries.
- Recluster replacement must not break existing thread-based UI expectations.

## Definition of Done

- `radar_collect_weaver` exists and works
- recurring Hormuz cycle invokes crawler collection
- reclustering for a radar is replacement-safe
- deployed remote radar API contains crawler-derived signals/threads for `hormuz`

## Progress

- Implemented `radar_collect_weaver` in `threat-radar-deploy/services/threat-radar-mcp`
- Added replacement-safe thread reclustering via `deleteThreadsByRadar`
- Wired `services/radar-stack/scripts/hormuz_cycle.py` to collect weaver signals before cluster/reduce
- Rebuilt the remote `radar-mcp` container and verified `https://radar.promethean.rest/api/radars` now reports crawler-derived `signalCount` and a live crawler watchlist thread for `hormuz`
