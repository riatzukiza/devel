# portal.promethean.rest on ussy2

## Open questions
- The exact intended portal service is inferred to be `services/host-fleet-dashboard`, since it is the standalone browser-facing host portal already used behind `/fleet/` on `ussy` and `ussy3`.
- `ussy2` currently has SSH access and sudo, but no Docker runtime or deployed app tree; bootstrap is required.
- Public HTTPS on `portal.promethean.rest` depends on non-proxied DNS pointing at `ussy2` before Caddy can complete ACME issuance.

## Risks
- Docker bootstrap on a fresh host can fail on package/service setup details.
- Reusing the fleet dashboard auth token across hosts is operationally convenient but should be treated as sensitive.
- The portal may be browser-reachable before remote host aggregation is fully useful if target auth or remote reachability is wrong.

## Priority
- High: stand up a browser-inspectable portal on `ussy2` that can serve as a stable public entrypoint while the rest of the host remains mostly empty.

## Phases
1. Add reproducible local deploy assets for the portal service (`Caddyfile`, compose TLS overlay).
2. Bootstrap Docker + compose on `ussy2` and copy the service tree there.
3. Create `portal.promethean.rest` as a direct Cloudflare A record to `ussy2`.
4. Start the fleet dashboard + Caddy on `ussy2`, verify HTTPS, and validate the browser UI.
5. Record the remote bootstrap and verification evidence.

## Affected files
- `services/host-fleet-dashboard/Caddyfile`
- `services/host-fleet-dashboard/docker-compose.ssl.yml`
- `services/host-fleet-dashboard/README.md`
- `specs/drafts/portal-ussy2-bootstrap.md`
- `receipts.log`

## Definition of done
- `ussy2` has Docker running and hosts the fleet dashboard service.
- `portal.promethean.rest` resolves to `ussy2` with `proxied=false`.
- `https://portal.promethean.rest/` serves the fleet dashboard over TLS.
- The portal is browser-inspectable and can at least render its own host card plus remote targets.

## Execution log
- 2026-03-21T04:20:00Z Confirmed `ussy2` was reachable over SSH with sudo access but had no Docker runtime or deployed services.
- 2026-03-21T04:20:00Z Added reproducible local deploy assets for the standalone portal: `services/host-fleet-dashboard/Caddyfile` and `services/host-fleet-dashboard/docker-compose.ssl.yml`.
- 2026-03-21T04:20:00Z Installed Docker Engine + Compose v2 on `ussy2`, created the `ai-infra` network, synced the `host-fleet-dashboard` service tree, and wrote a host-specific `.env` targeting `portal.promethean.rest`.
- 2026-03-21T04:20:00Z Created `portal.promethean.rest` in Cloudflare as a direct A record to `ussy2` with `proxied=false`.
- 2026-03-21T04:20:00Z Started the fleet dashboard and Caddy TLS frontend on `ussy2`, then verified public HTML on `/` and authenticated host aggregation on `/api/hosts`.

## Verification
- `ssh error@ussy2.promethean.rest 'docker --version'` ✅
- `ssh error@ussy2.promethean.rest 'sudo docker compose -f compose.yaml -f docker-compose.ssl.yml up -d --build'` ✅
- `curl https://portal.promethean.rest/` ✅
- `curl -H 'Authorization: Bearer <fleet-token>' https://portal.promethean.rest/api/hosts` ✅
- `agent-browser open https://portal.promethean.rest` + token entry + snapshot ✅
