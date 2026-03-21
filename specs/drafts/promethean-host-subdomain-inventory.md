# Promethean host subdomain inventory

## Open questions
- Whether all three target hosts (`ussy`, `ussy2`, `ussy3`) are reachable over SSH with the current key material.
- Which runtime configs on each host are authoritative for public hostname routing: Caddy, nginx, compose env, or service-specific proxy config.
- Whether some subdomains are declared in config but not currently backed by healthy containers.

## Risks
- Grepping all remote repos could overcount historical/docs-only hostnames; runtime-serving configs and active containers should be prioritized.
- Some hosts may be partially configured or inaccessible, so the result may be a partial inventory rather than a complete one.
- Cloudflare should not proxy any discovered records yet; the output must stay inventory-only until services are validated one by one.

## Priority
- High: inventory the currently intended subdomains per host before adding missing DNS records in Cloudflare.

## Phases
1. Probe SSH access to `ussy`, `ussy2`, and `ussy3`.
2. On each reachable host, inventory running containers, published ports, and active reverse-proxy/runtime config files that mention `promethean.rest`.
3. Extract host -> subdomain mappings with evidence references.
4. Summarize missing/unreachable/ambiguous cases without making DNS changes.

## Affected artifacts
- `specs/drafts/promethean-host-subdomain-inventory.md`
- `receipts.log`

## Definition of done
- Each of `ussy`, `ussy2`, and `ussy3` is classified as reachable/unreachable.
- For each reachable host, running containers and intended public subdomains are summarized from runtime evidence.
- No DNS writes or proxy enablement occur.

## Execution log
- 2026-03-21T01:20:00Z Confirmed SSH access works for `error@ussy.promethean.rest`, `error@ussy2.promethean.rest`, and `error@ussy3.promethean.rest`.
- 2026-03-21T01:20:00Z Inspected running containers and runtime config on each host.
- 2026-03-21T01:20:00Z Verified active proxy config and local route behavior on `ussy` and `ussy3`; `ussy2` currently has no Docker runtime or deployed app tree under `~/devel`.
- 2026-03-21T02:10:00Z Re-synced the live `services/proxx` Caddy config to `ussy`, added the missing runtime network attachments for the Caddy frontend, created the missing Cloudflare DNS A record for `voxx.ussy.promethean.rest` without enabling proxying, and verified live HTTPS/browser-facing responses for radar, battlebussy, voxx, and the two core hosts.
- 2026-03-21T02:35:00Z Added `shibboleth.promethean.rest` to the live `ussy` Caddy config, created the missing Cloudflare A record with proxying disabled, and verified both the UI and `/api/health` over HTTPS.

## Findings
### ussy (`104.130.31.129`)
- Reachable: yes
- Docker runtime: yes
- Active proxy/runtime evidence after remediation:
  - synced the current workspace `services/proxx/Caddyfile` to the host and reloaded/recreated the Caddy frontend with the SSL overlay
  - ensured the live Caddy container is attached to `ai-infra`, `battlebussy-prod_default`, and `voxx_default`
- Confirmed browser-inspectable routes now returning live responses:
  - `https://ussy.promethean.rest/` -> `HTTP/2 200`
  - `https://ussy.promethean.rest/fleet/` -> browser page title `Host Fleet Dashboard`
  - `https://radar.promethean.rest/` -> `HTTP/2 200`
  - `https://radar.promethean.rest/health` -> `HTTP/2 200`
  - `https://battlebussy.ussy.promethean.rest/` -> `HTTP/2 200`
  - `https://battlebussy.ussy.promethean.rest/arena` -> `HTTP/2 200`
  - `https://battlebussy.ussy.promethean.rest/api/game/status` -> `HTTP/2 200`
  - `https://voxx.ussy.promethean.rest/healthz` -> JSON `{\"ok\":true,...}` over HTTPS after DNS creation
  - `https://shibboleth.promethean.rest/` -> `HTTP/2 200`
  - `https://shibboleth.promethean.rest/api/health` -> JSON `{\"ok\":true,...}` via GET over HTTPS
- Running stacks supporting those routes:
  - Proxx: `ussy.promethean.rest`
  - Radar: `radar.promethean.rest`
  - Battlebussy: `battlebussy.ussy.promethean.rest`
  - Voxx: `voxx.ussy.promethean.rest`
  - Shibboleth: `shibboleth.promethean.rest`

### ussy3 (`104.130.31.144`)
- Reachable: yes
- Docker runtime: yes
- Active proxy/runtime evidence:
  - `/home/error/devel/services/proxx-staging/Caddyfile` and `/etc/caddy/Caddyfile` expose only `ussy3.promethean.rest`
  - local route check on-host returns `HTTP/2 200` for `https://ussy3.promethean.rest/`
- Running stacks that imply intended hostnames:
  - Staging Proxx: `ussy3.promethean.rest` (confirmed active)
  - `battlebussy-restreamer` container has env `PAGE_URL=https://battlebussy.ussy.promethean.rest/arena`, so it expects that Battlebussy hostname as an upstream/client target
- Important nuance:
  - `battlebussy.ussy.promethean.rest` is referenced by a running container on `ussy3`, but `ussy3` itself does not proxy that hostname; it appears to be a client dependency, not a hostname served by `ussy3`

### ussy2 (`104.130.31.121`)
- Reachable: yes
- Docker runtime: no `docker` or `podman` found in `PATH`
- App tree: no `~/devel` directory present for user `error`
- Intended public subdomains from current runtime evidence: none found
- Current state looks like a bare host with SSH only, not an active application host

## Candidate hostname inventory from runtime evidence
### Confirmed active now
- `ussy.promethean.rest` -> served on `ussy`
- `radar.promethean.rest` -> served on `ussy`
- `battlebussy.ussy.promethean.rest` -> served on `ussy`
- `voxx.ussy.promethean.rest` -> served on `ussy`
- `shibboleth.promethean.rest` -> served on `ussy`
- `ussy3.promethean.rest` -> served on `ussy3`

### Not currently serving an app
- `ussy2.promethean.rest` -> host reachable, but no active application runtime discovered

## Recommended next action
- Keep all discovered records **DNS only / not proxied** until each service is validated by its intended clients.
- `ussy2` should remain a plain A record with no proxying until it actually hosts an application runtime.
- The current browser-inspectable service set is ready for manual client-by-client validation: Proxx (`ussy`/`ussy3`), Radar, Battlebussy, and Voxx.
