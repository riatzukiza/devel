# Radar Live Deploy — 2026-03-20

## Goal

Deploy a live threat-radar platform to `ssh error@ussy.promethean.rest` with public hostname `radar.promethean.rest`, including:

- recurring Hormuz risk update cycle
- threat-radar web + MCP backend
- openplanner
- MCP family services
- deployed Hormuz clock MCP
- Fork Tales crawler/weaver support
- a Bluesky publication of the current threat clock

## Constraints

- Remote host currently runs Docker + Caddy through `services/proxx`.
- Remote workspace at `/home/error/devel` is not a git checkout; deployment must sync runtime files explicitly.
- Public TLS/front door is managed by the existing Caddy container mounted from `/home/error/devel/services/proxx/Caddyfile`.
- Remote host currently lacks a general host-side Node/PM2 runtime, so deployment should be container-first.

## Known Inputs

- `hormuz_clock_v4_bundle/`
- `orgs/riatzukiza/hormuz-clock-mcp/`
- `threat-radar-deploy/`
- `services/openplanner/`
- `services/mcp-stack/`
- `orgs/octave-commons/fork_tales/part64/code/web_graph_weaver.js`
- `specs/drafts/threat-radar-platform.md`

## Open Questions

- Whether “all MCP servers” should include only the current `mcp-stack` family plus threat-radar/hormuz MCPs, or every MCP-like project in the workspace.
  - Working default: deploy the current MCP family stack plus the requested radar/hormuz MCPs.
- Whether recurring Bluesky posting should run from the server.
  - Working default: publish the current clock now from the local credentialed environment; keep the server-side recurring system focused on clock/state refresh.

## Risks

- `threat-radar-deploy` appears Render-oriented and may need SSH/Docker deployment glue.
- Current threat-radar clock rendering depends on live snapshots; without packet submission the public wall may stay visually empty.
- Fork Tales crawler has local package dependencies and must be deployed with the matching workspace package paths.
- Existing Caddy config must be updated carefully to avoid breaking `ussy.promethean.rest`, `battlebussy.*`, or `voxx.*`.

## Phases

### Phase 1 — Prepare deployable runtime
- add container-first radar stack config
- make threat-radar backend automation-friendly for recurring jobs
- add Hormuz packet export bridge from bundle -> radar backend
- wire public proxy route for `radar.promethean.rest`

### Phase 2 — Sync and deploy to remote
- sync required workspace slices to `/home/error/devel`
- provision remote env/state directories
- build and start radar stack
- reload proxy/Caddy

### Phase 3 — Seed + verify
- create/ensure `hormuz` radar
- run one recurring update cycle
- verify openplanner, MCP family, hormuz MCP, crawler, threat-radar API, and public site

### Phase 4 — Publish
- regenerate social payloads from current Hormuz snapshot
- publish Bluesky post with current threat clock

## Affected Files

- `services/proxx/Caddyfile`
- `services/radar-stack/**` (new)
- `threat-radar-deploy/services/threat-radar-mcp/**`
- `hormuz_clock_v4_bundle/scripts/**`
- `orgs/riatzukiza/hormuz-clock-mcp/**`
- `receipts.log`

## Definition of Done

- `https://radar.promethean.rest` responds successfully
- threat-radar web shows at least one live `hormuz` tile
- remote recurring job can refresh Hormuz state and submit a packet
- openplanner is healthy on the remote host
- MCP family stack is running on the remote host
- Hormuz clock MCP is running on the remote host
- Fork Tales crawler is running on the remote host
- current threat clock is posted to Bluesky
