# Promethean host runtime inventory — 2026-03-21

## Scope
Inventory the current runtime state of:
- `ussy.promethean.rest`
- `ussy2.promethean.rest`
- `ussy3.promethean.rest`
- `big.ussy.promethean.rest`

This report separates:
- **container-backed public routes**
- **host-process-backed routes**
- **references-only hostnames**
- **non-container hosts**

Machine-readable companion artifact:
- `docs/reports/inventory/promethean-host-runtime-inventory-2026-03-21.json`

## Fleet summary

| Host | SSH target | Runtime type | Running containers | Public subdomains backed by containers |
|---|---|---|---:|---|
| `ussy.promethean.rest` | `error@ussy.promethean.rest` | Docker | 30 | `ussy.promethean.rest`, `radar.promethean.rest`, `battlebussy.ussy.promethean.rest`, `voxx.ussy.promethean.rest` |
| `ussy2.promethean.rest` | `error@ussy2.promethean.rest` | Docker | 2 | `portal.promethean.rest` |
| `ussy3.promethean.rest` | `error@ussy3.promethean.rest` | Docker | 6 | `ussy3.promethean.rest` |
| `big.ussy.promethean.rest` | `error@big.ussy.promethean.rest` | systemd + Proxmox | 0 | none detected |

## Host details

### `ussy.promethean.rest`
- Remote hostname: `prod-instance-17739565607148573`
- Runtime: Docker-backed
- Running containers: 30

#### Public container-backed routes
| Hostname | Backing containers | Notes |
|---|---|---|
| `ussy.promethean.rest` | `open-hax-openai-proxy-open-hax-openai-proxy-1`, `open-hax-openai-proxy-open-hax-openai-proxy-ssl-1`, `host-fleet-dashboard` | Main Proxx web/API surface; `/fleet/*` is routed to `host-fleet-dashboard` under the same hostname |
| `radar.promethean.rest` | `radar-stack-radar-web-1`, `radar-stack-radar-mcp-1`, `open-hax-openai-proxy-open-hax-openai-proxy-ssl-1` | Shared Caddy router fronts the Radar web/API stack |
| `battlebussy.ussy.promethean.rest` | `battlebussy-site`, `battlebussy-backend`, `open-hax-openai-proxy-open-hax-openai-proxy-ssl-1` | Public Battlebussy site + backend |
| `voxx.ussy.promethean.rest` | `openhax-voxx`, `open-hax-openai-proxy-open-hax-openai-proxy-ssl-1` | Voxx is container-backed on ussy |

#### Host-process-backed routes declared in Caddy
| Hostname | Upstreams | Notes |
|---|---|---|
| `shibboleth.promethean.rest` | `host.docker.internal:8787`, `host.docker.internal:5197` | Declared in live Caddy config but not backed by containers visible in `docker ps` |
| `gates.ussy.promethean.rest` | `host.docker.internal:3300`, `host.docker.internal:5175` | Declared in live Caddy config but not backed by containers visible in `docker ps` |

#### Notable internal-only containers
- Battlebussy internals: commentary, sidecar, NATS, relays, first-move barrier, studio runner, and current match-specific agent/executor/target containers
- Radar internals: chroma, redis, openplanner, hormuz agent, fork-tales weaver, radar DB
- Proxx DB: `open-hax-openai-proxy-open-hax-openai-proxy-db-1`

### `ussy2.promethean.rest`
- Remote hostname: `prod-instance-17739565536758572`
- Runtime: Docker-backed
- Running containers: 2

#### Public container-backed routes
| Hostname | Backing containers | Notes |
|---|---|---|
| `portal.promethean.rest` | `host-fleet-dashboard`, `host-fleet-dashboard-ssl` | Dedicated host-fleet dashboard deployment |

### `ussy3.promethean.rest`
- Remote hostname: `prod-instance-17739565677538574`
- Runtime: Docker-backed
- Running containers: 6

#### Public container-backed routes
| Hostname | Backing containers | Notes |
|---|---|---|
| `ussy3.promethean.rest` | `proxx-staging-open-hax-openai-proxy-1`, `proxx-staging-open-hax-openai-proxy-ssl-1` | Staging Proxx web/API surface |
| `ussy3.promethean.rest` (`/fleet/*`) | `host-fleet-dashboard` | Configured in the live staging Caddyfile and the dashboard env, but the public probe returned `HTTP/2 404` at inventory time |

#### References-only hostnames
| Container | Referenced hostname | Notes |
|---|---|---|
| `battlebussy-restreamer` | `battlebussy.ussy.promethean.rest` | `PAGE_URL=https://battlebussy.ussy.promethean.rest/arena`; this is a client/upstream reference, not a hostname served by ussy3 |

#### Containers without discovered public `promethean.rest` routes
- `parameter-golf-weaver`
- `proxx-staging-open-hax-openai-proxy-db-1`

### `big.ussy.promethean.rest`
- Remote hostname: `pve.ussy.cloud`
- Runtime: systemd + Proxmox
- Running Docker containers: 0

#### Host-level findings
- `docker`: unavailable
- `podman`: unavailable
- Proxmox services are active: `pve-cluster`, `pvedaemon`, `pveproxy`
- Proxmox VM configs present: `100.conf`, `101.conf`, `102.conf`
- `voxx.service` is active and bound to `100.125.215.12:8788`

#### Public route status
- `http://big.ussy.promethean.rest` -> `308` redirect to HTTPS
- `https://big.ussy.promethean.rest` -> TLS handshake failure during probe
- No explicit `promethean.rest` route was found in visible Caddy config on-host

## Raw container counts
- `ussy.promethean.rest`: 30
- `ussy2.promethean.rest`: 2
- `ussy3.promethean.rest`: 6
- `big.ussy.promethean.rest`: 0

## Evidence sources
- SSH inventory commands against each host as `error@<host>`
- Live `docker ps` output on `ussy`, `ussy2`, and `ussy3`
- Live Caddy config on:
  - `/home/error/devel/services/proxx/Caddyfile`
  - `/home/error/devel/services/host-fleet-dashboard/Caddyfile`
  - `/home/error/devel/services/proxx-staging/Caddyfile`
- `systemctl cat voxx.service` and `/etc/pve` inspection on `big.ussy`
- Public `curl -I` probes for:
  - `https://ussy.promethean.rest`
  - `https://portal.promethean.rest`
  - `https://ussy3.promethean.rest`
  - `https://ussy3.promethean.rest/fleet/`
  - `http://big.ussy.promethean.rest`
  - `https://big.ussy.promethean.rest`

## Caveats
- This is a point-in-time snapshot; Battlebussy match containers on `ussy` are especially volatile.
- A route declared in proxy config is not automatically container-backed; `shibboleth` and `gates` on `ussy` currently point to host processes.
- `ussy3` declares a `/fleet/*` route, but that path was returning `404` during validation.
- `big.ussy` is not currently behaving as a Docker application host, even though it is reachable over SSH and runs active system services.
