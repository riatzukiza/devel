# ATProto Mission Control — 2026-03-20

## Goal

Evolve threat-radar into a real mission-control dashboard with AT Protocol primitives integrated piece by piece until it feels like an actual social platform.

## Immediate User Intent

Build the feel first:

- consume Bluesky firehose via Jetstream
- keep a Redis-backed rolling window of matched events
- filter by hashtags, users/DIDs, and keywords
- generate feeds based on embeddings / semantic proximity
- draft, edit, and post Bluesky posts from the dashboard
- put the dashboard behind login (start with Bluesky identity)
- let the dashboard use Proxx through `ussy.promethean.rest`
- expose/select MCP servers/tools from the interface

## Principle

Do not jump straight to a giant “full social network” rewrite.
Instead, layer the AT protocol in slices:

1. ingest
2. window + filter
3. semantic feed generation
4. drafting / posting
5. auth / identity
6. richer protocol surfaces (repos, follows, lists, custom feeds, moderation, etc.)

## Current State

Already live:
- threat-radar web + MCP/API
- Hormuz recurring bundle pipeline
- crawler/weaver ingestion into radar threads
- social publish path exists elsewhere in workspace (`services/mcp-social-publisher`)
- public radar host: `https://radar.promethean.rest`

New Phase 1 target:
- Jetstream firehose backend integration
- Redis rolling window storage
- rule configuration for users/hashtags/keywords
- REST/MCP collection path from Jetstream window into radar signals

## Phase Plan

### Phase 1 — Firehose ingest foundation
- add Jetstream consumer in `threat-radar-mcp`
- store cursor + rolling event windows in Redis
- configure rules by radar
- collect normalized Jetstream window signals into existing `signals` table

### Phase 2 — Semantic feeds
- add embedding pipeline for Jetstream + crawler + manual items
- generate feed slices by semantic similarity to watch prompts / exemplars
- surface feed definitions in dashboard

### Phase 3 — Dashboard operator workflow
- drafts panel
- edit/revise post composer
- post to Bluesky from dashboard
- mission-control style firehose + queue + posting loop

### Phase 4 — Identity / auth
- dashboard login using Bluesky identity first
- session-gated admin/operator actions
- later evolve toward richer ATProto-native identity/session model

### Phase 5 — Tooling plane
- connect dashboard to selected MCP servers/tools
- server/tool enable/disable registry
- Proxx access from dashboard for research/model work

## Risks

- network-wide Jetstream consumption is expensive/noisy without strict filtering
- UI scope can explode without a strong phase boundary
- auth/login work can derail ingest/feed work if mixed too early
- semantic feeds require careful dedupe across crawler/social/manual sources

## Definition of Done for Phase 1

- Jetstream backend runs with Redis windowing
- rules can be configured per radar
- matching firehose events become radar signals on demand
- foundation is in place for semantic feed generation and dashboard authoring next

## Progress

- Implemented Jetstream backend foundation in `threat-radar-mcp`
- Added Redis-backed Jetstream rule + rolling-window support
- Added REST endpoints for Jetstream status, rule config, and window collection
- Added MCP tools for Jetstream rule configuration and window collection
- Deployed updated `radar-mcp` remotely and verified Jetstream subscriber status with a live configured rule
- Added first-cut operator shell in `threat-radar-web` + `threat-radar-mcp`:
  - Bluesky login session
  - draft CRUD
  - publish-to-Bluesky endpoint
  - Jetstream rule editor
  - semantic feed preview from embeddings
  - MCP server selection prefs
  - docked Proxx panel
- Fixed the first operator-shell browser regression:
  - stabilized `App` hook ordering across auth-state transitions so login no longer crashes React
  - defaulted browser embedding worker to trigram mode unless `VITE_ENABLE_ONNX_EMBEDDING=true`, avoiding missing-model ONNX init noise until model assets are shipped
- Started making the UI less mock-like by exposing assessment provenance in the η lane:
  - `/api/radars` now includes the latest submitted assessment packet summary per radar
  - the global lane now shows a single-packet honesty banner when appropriate
  - each radar shows the latest model id, cited source refs, signal reasons, and explicit uncertainty notes under the clock
- Added raw signal inspection so operators can inspect actual feeds instead of inferred threads only:
  - added `GET /api/signals?radarId=&limit=`
  - replaced the old thread-only firehose with a raw signal feed inspector
  - each raw signal now exposes source/post links, text, author/provenance, tags, and expandable metadata in the UI
- Replaced structured-string rule entry with actual controls in the operator shell:
  - Jetstream rule lists now use add/remove chips for handles, DIDs, hashtags, and keywords
  - added a one-click “Use my DID” action
  - replaced raw Jetstream status JSON with structured status cards
- Added the first real Bluesky-native operator surface:
  - `GET /api/operator/bluesky/timeline?limit=` returns the logged-in operator's actual subscribed Bluesky timeline
  - the operator dock now shows real home-feed posts with counts and direct open-post links
  - generic defaults now avoid the old hard-coded Hormuz wording in the operator controls
- Started shifting the product toward an objective-driven world interface instead of a radar control board:
  - workspace prefs now store an operator objective, long-term direction, strategic notes, and challenge mode
  - the operator panel exposes explicit goal fields instead of only ingest controls
  - the main dashboard now shows a mission briefing layer with strategy lines, heuristic world-map hotspots, and narrative candidates tied back to the objective
- Tightened the Bluesky and operator UX loop:
  - Bluesky operator requests now attempt refresh-token recovery when access JWTs go stale, reducing home-feed 400s from expired sessions
  - the actual Bluesky home feed was moved into the main mission briefing area instead of cramming it into the side dock
  - the side dock now defaults to a simpler shape with objective + compose visible and ingest/tooling controls collapsed behind advanced sections
