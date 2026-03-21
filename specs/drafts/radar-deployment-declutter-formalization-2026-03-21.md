# Radar deployment declutter + formalization — 2026-03-21

## Goal

Make the live `radar.promethean.rest` deployment legible, low-drift, and auditable by reducing duplicate deployment surfaces and explicitly naming the canonical runtime contract.

## Current observed state

### Live runtime truth
- Public host: `https://radar.promethean.rest`
- Edge routing: `services/proxx/Caddyfile`
- Runtime stack: `services/radar-stack/docker-compose.yml`
- Host: `error@ussy.promethean.rest`
- Verified backing containers from current inventory:
  - `radar-stack-radar-web-1`
  - `radar-stack-radar-mcp-1`
  - shared Proxx Caddy frontend

### Product/source surfaces currently in play
- `threat-radar-deploy/`
  - active application source for `packages/*` and `services/threat-radar-*`
  - contains local receipts and current dirty feature work
- `threat-radar-next-step/`
  - future/platform design bundle with Postgres/tool-surface/validation specs
  - not the current live runtime source

### Observed deployment drift / duplication
- The live Promethean deployment is container-first via `services/radar-stack`, not Render.
- `threat-radar-deploy/render.yaml` and per-service `render.yaml` files still describe Render deployment surfaces.
- `threat-radar-deploy/services/threat-radar-mcp/Dockerfile` still references `orgs/riatzukiza/threat-radar-mcp`, which does not match the current repo layout.
- `services/radar-stack/nginx.radar-web.conf` appears duplicated by the inline nginx config in `services/radar-stack/Dockerfile.threat-radar-web`.
- The remote host is a synced runtime tree, not a normal git checkout, so deployment reproducibility currently depends on explicit file sync discipline.

## Evidence already established

- `specs/drafts/radar-live-deploy-2026-03-20.md`
  - original live-host deployment intent and scope
- `specs/drafts/radar-crawler-integration-2026-03-20.md`
  - crawler/weaver integration into the live radar cycle
- `specs/drafts/atproto-mission-control-2026-03-20.md`
  - product evolution after deployment: operator shell, Jetstream, raw feed, Bluesky timeline, world interface
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.md`
  - confirms `radar.promethean.rest` is backed on `ussy` by `radar-stack-radar-web-1` + `radar-stack-radar-mcp-1`
- `receipts.log`
  - `2026-03-20T18:20:00Z`: initial live `radar-stack` deployment to `error@ussy.promethean.rest`
  - `2026-03-21T01:53:33Z` and `2026-03-21T02:04:27Z`: Caddy/TLS remediation for `radar.promethean.rest`
  - `2026-03-21T05:03:31Z`: post-Π sync verifying live runtime file hashes for `services/proxx` and `services/radar-stack/scripts/hormuz_cycle.py`
- `threat-radar-deploy/receipts.log`
  - confirms recent work has been product/UX evolution, not deployment simplification

## Open questions

- Is Render formally retired for this project, or do we still want a maintained secondary deployment path?
- Should `threat-radar-deploy/` remain the canonical app-source repo, or should the mature source graduate into an org repo with `services/radar-stack` left as pure runtime glue?
- Do we want the remote host to stay sync-based, or should formalization include a git/PR-driven runtime checkout path?
- Which radar-adjacent services are considered part of the canonical deploy contract vs optional co-resident dependencies?
  - likely core: `radar-web`, `radar-mcp`, `hormuz-agent`, `fork-tales-weaver`
  - likely shared/supporting: `openplanner`, `mcp-stack`, `redis`, `chroma`, `hormuz-clock-mcp`

## Risks

- Removing stale deployment files without naming a canonical owner first could destroy still-useful fallback knowledge.
- Remote runtime drift is easy because the host is not a normal git checkout.
- Current dirty `threat-radar-deploy` working tree mixes deployment-adjacent improvements with unrelated world-interface UX work.
- `services/proxx/Caddyfile` is shared with other public hosts, so route cleanup must not break `ussy`, `battlebussy`, `voxx`, or `shibboleth`.

## Proposed phases

### Phase 1 — Declare the canonical deployment contract
- explicitly state that the live Promethean deployment is:
  - edge: `services/proxx/Caddyfile`
  - runtime: `services/radar-stack/**`
  - product source: `threat-radar-deploy/**`
- record whether Render is deprecated, fallback-only, or still supported
- define the minimum service set required for a healthy `radar.promethean.rest`

### Phase 2 — Separate product work from deployment work
- snapshot or land the current dirty `threat-radar-deploy` UX changes independently
- avoid mixing operator/world-interface polish with deployment formalization edits
- produce a clean deployment-focused diff surface

### Phase 3 — Remove or quarantine stale deployment surfaces
- either delete or clearly deprecate:
  - `threat-radar-deploy/render.yaml`
  - `threat-radar-deploy/services/threat-radar-mcp/render.yaml`
  - `threat-radar-deploy/services/threat-radar-web/render.yaml`
  - any broken/stale Dockerfiles or unused config artifacts
- if retained, mark them as non-canonical and explain when they should be used

### Phase 4 — Write the runtime runbook
- document:
  - required env vars
  - required synced paths
  - build/restart commands
  - health checks
  - post-deploy verification steps
  - receipts expectations
- ensure the runbook matches the actual live host/runtime inventory

### Phase 5 — Add drift checks
- add a lightweight verification path for:
  - compose config validity
  - Caddy route presence
  - runtime file hash checks for synced host material
  - public health probes for `radar.promethean.rest`

## Affected files

- `services/proxx/Caddyfile`
- `services/radar-stack/**`
- `threat-radar-deploy/render.yaml`
- `threat-radar-deploy/services/threat-radar-mcp/render.yaml`
- `threat-radar-deploy/services/threat-radar-web/render.yaml`
- `threat-radar-deploy/services/threat-radar-mcp/Dockerfile`
- `services/radar-stack/nginx.radar-web.conf`
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.md`
- `receipts.log`

## Definition of done

- One deployment path is named canonical for `radar.promethean.rest`.
- Non-canonical deployment files are either removed or explicitly marked deprecated.
- The runtime contract explains how source, runtime glue, and host sync fit together.
- A clean verification checklist exists for local -> host sync -> public validation.
- Future radar feature work no longer obscures which files actually govern deployment.

## Immediate next action

- Decide whether Render is retired for threat-radar; that single decision determines whether we delete stale Render artifacts or preserve them as a documented secondary path.