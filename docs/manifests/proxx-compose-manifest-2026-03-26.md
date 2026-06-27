# Proxx Docker Compose Manifest — 2026-03-26

Date: 2026-03-26
Root workspace: `/home/err/devel`

## Scope
This manifest includes Docker Compose files in the canonical workspace that directly start one or more Proxx/Open Hax OpenAI Proxy application containers.

Excluded from the manifest:
- compose files that only add TLS/edge/proxy layers (`*-ssl*.yml`, shared-edge files)
- compose override files that only modify an existing Proxx service (`*.override.yml`)
- compose files that only relay traffic to an already-running Proxx instance
- archived paths and `.worktrees/*`

## Summary
- Total compose files that start Proxx instances: **11**
- Total directly started Proxx app services across those files: **17**

## Manifest

| Path | Compose project | Proxx service(s) | Instance count | Role | Host ports |
| --- | --- | --- | ---: | --- | --- |
| `docker-compose.yml` | `open-hax-openai-proxy` | `open-hax-openai-proxy` | 1 | Root-level local proxy stack | `8789`, `1455`, `5174` |
| `services/proxx/docker-compose.yml` | `proxx-local` | `proxx` | 1 | Primary local Proxx dev stack | `18789`, `18755`, `15174` |
| `services/proxx/docker-compose.glm5.yml` | _unnamed_ | `open-hax-openai-proxy-glm5` | 1 | GLM5-focused Proxx variant | `8791`, `5175` |
| `services/proxx/docker-compose.federation.yml` | `proxx-federation-peer` | `proxx-federation-peer` | 1 | Secondary federation peer layered beside the main stack | `18792`, `18756`, `15175` |
| `services/proxx/docker-compose.blongs.yml` | `proxx-blongs` | `proxx-blongs` | 1 | Standalone Blongs Proxx stack | `5277`, `2456`, `8793` |
| `services/cephalon-hive/docker-compose.yml` | `cephalon-hive` | `proxx` | 1 | Proxx embedded inside the Cephalon Hive stack | `18779`, `12455`, `15274` |
| `orgs/open-hax/proxx/docker-compose.yml` | `proxx-repo` | `proxx-repo` | 1 | Repo-local Proxx stack for developing Proxx itself | `18789`, `18755`, `15174` |
| `orgs/open-hax/proxx/docker-compose.glm5.yml` | _unnamed_ | `open-hax-openai-proxy-glm5` | 1 | Repo-local GLM5-focused Proxx variant | `8791`, `5175` |
| `orgs/open-hax/proxx/docker-compose.federation-runtime.yml` | _unnamed_ | `federation-proxx-a1`, `federation-proxx-a2`, `federation-proxx-b1`, `federation-proxx-b2` | 4 | Multi-node federation runtime topology | none published |
| `orgs/open-hax/proxx/docker-compose.federation-e2e.yml` | _unnamed_ | `federation-proxx-a1`, `federation-proxx-a2`, `federation-proxx-b1`, `federation-proxx-b2` | 4 | Federation end-to-end test topology | `18891`, `18892`, `18893`, `18894` |
| `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml` | `battlebussy-prod` | `openai-proxy` | 1 | Bundled Proxx image for BattleBussy production profile | `${PROXY_PORT:-8789}` |

## Notes by file

### `docker-compose.yml`
- Builds from `../../orgs/open-hax/proxx`
- Starts service `open-hax-openai-proxy`
- Includes Postgres sidecar `open-hax-openai-proxy-db`

### `services/proxx/docker-compose.yml`
- Commented as the primary local Proxx instance
- Builds from `../../orgs/open-hax/proxx`
- Starts service `proxx`

### `services/proxx/docker-compose.glm5.yml`
- Starts `open-hax-openai-proxy-glm5`
- Uses `ollama-cloud` as the upstream provider
- Includes `open-hax-openai-proxy-db`

### `services/proxx/docker-compose.federation.yml`
- Starts a second peer named `proxx-federation-peer`
- Intended to run alongside `services/proxx/docker-compose.yml`

### `services/proxx/docker-compose.blongs.yml`
- Starts standalone service `proxx-blongs`
- Includes dedicated database `proxx-blongs-db`

### `services/cephalon-hive/docker-compose.yml`
- Starts service `proxx` inside a larger bot stack
- Cephalon services consume it over `http://proxx:8789`

### `orgs/open-hax/proxx/docker-compose.yml`
- Repo-local compose for working directly in the Proxx repository
- Starts service `proxx-repo`

### `orgs/open-hax/proxx/docker-compose.glm5.yml`
- Repo-local GLM5 compose variant
- Starts `open-hax-openai-proxy-glm5`

### `orgs/open-hax/proxx/docker-compose.federation-runtime.yml`
- Defines four runtime federation nodes
- No host port publishing; intended for internal network/runtime federation

### `orgs/open-hax/proxx/docker-compose.federation-e2e.yml`
- Defines four federation nodes for end-to-end testing
- Publishes ports `18891`–`18894` to localhost

### `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml`
- Starts Proxx only when the `bundled` profile is enabled
- Uses image `ghcr.io/${GHCR_ORG:-ussyverse}/open-hax-openai-proxy:latest`
- Service name is `openai-proxy`

## Adjacent compose files reviewed but excluded
- `orgs/open-hax/proxx/deploy/docker-compose.ssl.yml`
- `orgs/open-hax/proxx/deploy/docker-compose.federation.ssl.yml`
- `orgs/open-hax/proxx/deploy/docker-compose.production.shared-edge.yml`
- `orgs/open-hax/proxx/docker-compose.factory-auth.override.yml`
- `orgs/open-hax/proxx/docker-compose.host-dashboard.override.yml`
- `services/proxx/docker-compose.ssl.yml`
- `services/proxx/docker-compose.factory-auth.override.yml`
- `orgs/ussyverse/battlebussy/deploy/docker-compose.control-plane.yml`
- `orgs/ussyverse/battlebussy/deploy/docker-compose.dev.yml`
- `services/cephalon-stack/docker-compose.yml`
- `services/eta-mu/compose.yaml`
