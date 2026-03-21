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
  - contains local receipts and recent feature work
- `threat-radar-next-step/`
  - future/platform design bundle with Postgres/tool-surface/validation specs
  - not the current live runtime source

### Observed deployment drift / duplication
- The live Promethean deployment is container-first via `services/radar-stack`, not Render.
- Retired Render manifests and the stale MCP Dockerfile have now been removed from the operational path.
- The redundant `services/radar-stack/nginx.radar-web.conf` has also been removed.
- Remaining Render references are historical only: prior receipts/spec text and old `.ημ` handoff manifests.
- The remote host is a synced runtime tree, not a normal git checkout, so deployment reproducibility currently depends on explicit file sync discipline.

## Deployment decision

- Render is **retired** for threat-radar.
- `radar.promethean.rest` should be treated as a Promethean-hosted runtime only:
  - edge: `services/proxx/Caddyfile`
  - compose/runtime: `services/radar-stack/**`
  - app/product source: `threat-radar-deploy/**`
- Active Render artifacts have been removed from the operational path; only historical residue remains in prior receipts/spec text and old `.ημ` handoff manifests.

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

- Should `threat-radar-deploy/` remain the canonical app-source repo, or should the mature source graduate into an org repo with `services/radar-stack` left as pure runtime glue?
- Do we want the remote host to stay sync-based, or should formalization include a git/PR-driven runtime checkout path?
- Which radar-adjacent services are considered part of the canonical deploy contract vs optional co-resident dependencies?
  - likely core: `radar-web`, `radar-mcp`, `hormuz-agent`, `fork-tales-weaver`
  - likely shared/supporting: `openplanner`, `mcp-stack`, `redis`, `chroma`, `hormuz-clock-mcp`

## Risks

- Removing stale deployment files without naming a canonical owner first could destroy still-useful fallback knowledge.
- Remote runtime drift is easy because the host is not a normal git checkout.
- Historical threat-radar iterations mixed deployment-adjacent improvements with unrelated world-interface UX work, so future commit boundaries should stay explicit.
- `services/proxx/Caddyfile` is shared with other public hosts, so route cleanup must not break `ussy`, `battlebussy`, `voxx`, or `shibboleth`.

## Proposed phases

### Phase 1 — Declare the canonical deployment contract
- explicitly state that the live Promethean deployment is:
  - edge: `services/proxx/Caddyfile`
  - runtime: `services/radar-stack/**`
  - product source: `threat-radar-deploy/**`
- record Render as retired and non-canonical
- define the minimum service set required for a healthy `radar.promethean.rest`

### Phase 2 — Separate product work from deployment work
- snapshot or land the current dirty `threat-radar-deploy` UX changes independently
- avoid mixing operator/world-interface polish with deployment formalization edits
- produce a clean deployment-focused diff surface

### Phase 3 — Remove retired deployment surfaces
- delete retired Render surfaces:
  - `threat-radar-deploy/render.yaml`
  - `threat-radar-deploy/services/threat-radar-mcp/render.yaml`
  - `threat-radar-deploy/services/threat-radar-web/render.yaml`
- delete or repair broken/stale deployment artifacts that imply dead paths:
  - `threat-radar-deploy/services/threat-radar-mcp/Dockerfile`
  - `services/radar-stack/nginx.radar-web.conf` if it remains redundant with the live image build
- if any Render material must survive for historical reference, move it into docs/archive rather than leaving it in the operational path

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

- `threat-radar-deploy/README.md`
- `services/proxx/Caddyfile`
- `services/radar-stack/**`
- `threat-radar-deploy/services/threat-radar-mcp/README.md`
- `threat-radar-deploy/services/threat-radar-web/README.md`
- `threat-radar-deploy/render.yaml`
- `threat-radar-deploy/services/threat-radar-mcp/render.yaml`
- `threat-radar-deploy/services/threat-radar-web/render.yaml`
- `threat-radar-deploy/services/threat-radar-mcp/Dockerfile`
- `services/radar-stack/nginx.radar-web.conf`
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.md`
- `receipts.log`

## Definition of done

- One deployment path is named canonical for `radar.promethean.rest`.
- Retired Render deployment files are removed from the operational path.
- The runtime contract explains how source, runtime glue, and host sync fit together.
- A clean verification checklist exists for local -> host sync -> public validation.
- Future radar feature work no longer obscures which files actually govern deployment.

## Immediate next action

- Keep future deployment work anchored on `services/radar-stack` + `services/proxx`, and let the next threat-radar snapshot refresh historical `.ημ` manifests so the only remaining Render references live in git history rather than active handoff artifacts.

## Progress

- 2026-03-21: Render was formally retired for Threat Radar.
- 2026-03-21: Added canonical deployment notes to `threat-radar-deploy/README.md`, `services/threat-radar-mcp/README.md`, `services/threat-radar-web/README.md`, and `services/radar-stack/README.md`.
- 2026-03-21: Retired deployment artifacts were removed from the operational path:
  - `threat-radar-deploy/render.yaml`
  - `threat-radar-deploy/services/threat-radar-mcp/render.yaml`
  - `threat-radar-deploy/services/threat-radar-web/render.yaml`
  - `threat-radar-deploy/services/threat-radar-mcp/Dockerfile`
  - `services/radar-stack/nginx.radar-web.conf`
