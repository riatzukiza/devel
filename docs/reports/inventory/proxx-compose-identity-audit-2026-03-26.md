# Proxx Compose Identity Audit — 2026-03-26

Date: 2026-03-26
Root workspace: `/home/err/devel`

## Scope
Audit of the canonical Proxx-related Docker Compose files previously captured in the Proxx compose manifest.

## Important operational note
- `services/proxx/docker-compose.yml` was **not restarted or shut down**.
- This audit only changed compose source files and validated them with `docker compose config -q`.
- Any running containers keep their current live identity until they are explicitly recreated later.

## Drift detected
- `services/proxx/docker-compose.glm5.yml` is currently **missing** from the workspace.
- The repo-local GLM5 compose at `orgs/open-hax/proxx/docker-compose.glm5.yml` is present and was audited.

## Findings before remediation

### Identity collisions / instability found
1. Root `docker-compose.yml` and `services/proxx/docker-compose.yml` shared the same default telemetry and federation identity (`proxx` / `primary` / `local-test-*`).
2. Root `docker-compose.yml` had an OAuth callback default mismatch:
   - published host port default: `1456`
   - advertised app env default: `1455`
3. `services/proxx/docker-compose.federation.yml` had the same kind of callback mismatch:
   - published host port default: `18756`
   - advertised app env default: `1456`
4. Several files used public base URL defaults that did not match the actual service identity on the target network:
   - `services/proxx/docker-compose.yml`
   - `services/proxx/docker-compose.federation.yml`
   - `services/proxx/docker-compose.blongs.yml`
5. `orgs/open-hax/proxx/docker-compose.yml` reused the same default web UI port as `services/proxx/docker-compose.yml` (`15174`).
6. `orgs/open-hax/proxx/docker-compose.glm5.yml` had no stable compose project name and used a generic service/db identity that could collide with another GLM5 stack.
7. `orgs/open-hax/proxx/docker-compose.federation-runtime.yml` and `orgs/open-hax/proxx/docker-compose.federation-e2e.yml` had no baked-in compose project names, so concurrent runs depended on manual `-p` discipline.
8. `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml` used bundled proxy host port `8789`, colliding with the canonical `services/proxx/docker-compose.yml` default.

## Remediation applied

### Updated files
- `docker-compose.yml`
- `services/proxx/docker-compose.yml`
- `services/proxx/docker-compose.federation.yml`
- `services/proxx/docker-compose.blongs.yml`
- `orgs/open-hax/proxx/docker-compose.yml`
- `orgs/open-hax/proxx/docker-compose.glm5.yml`
- `orgs/open-hax/proxx/docker-compose.federation-runtime.yml`
- `orgs/open-hax/proxx/docker-compose.federation-e2e.yml`
- `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml`

### Changes made
- Assigned unique telemetry defaults where they were colliding:
  - `proxx-root`
  - `proxx-local`
  - `proxx-repo`
  - `proxx-repo-glm5`
- Assigned unique default federation identities for the root and canonical local stacks.
- Corrected callback port env defaults to match published defaults.
- Corrected local public base URL defaults so they name the actual service they belong to.
- Moved repo-local web UI default port from `15174` to `25174`.
- Gave repo-local GLM5 its own stable compose project name (`proxx-repo-glm5`), service name, DB service name, and unique default ports.
- Gave federation runtime and federation e2e files explicit stable compose project names.
- Moved BattleBussy bundled proxy host port default from `8789` to `28889`.
- Moved root DB host port default from `5432` to `15431` for safer coexistence with the other Proxx stacks.

## Current audited identity map

| Path | Compose project | App service identity | Key unique defaults |
| --- | --- | --- | --- |
| `docker-compose.yml` | `open-hax-openai-proxy` | `open-hax-openai-proxy` | proxy `18790`, callback `1456`, DB `15431`, OTEL `proxx-root`, federation node `root-primary` |
| `services/proxx/docker-compose.yml` | `proxx-local` | `proxx` | proxy `8789`, callback `1455`, DB `15432`, OTEL `proxx-local`, federation node `local-primary` |
| `services/proxx/docker-compose.federation.yml` | `proxx-federation-peer` | `proxx-federation-peer` | proxy `18792`, callback `18756`, DB `15434`, OTEL `federation-peer`, federation node `federation-peer-1` |
| `services/proxx/docker-compose.blongs.yml` | `proxx-blongs` | `proxx-blongs` | proxy `5277`, callback `2456`, DB `15433`, OTEL `proxx-blongs`, federation node `blongs` |
| `services/cephalon-hive/docker-compose.yml` | `cephalon-hive` | `proxx` | proxy `18779`, callback `12455`, DB `15435`, federation node `big-ussy-cephalon` |
| `orgs/open-hax/proxx/docker-compose.yml` | `proxx-repo` | `proxx-repo` | proxy `18789`, callback `18755`, web `25174`, DB `15436`, OTEL `proxx-repo` |
| `orgs/open-hax/proxx/docker-compose.glm5.yml` | `proxx-repo-glm5` | `proxx-repo-glm5` | proxy `28791`, web `25175`, OTEL `proxx-repo-glm5` |
| `orgs/open-hax/proxx/docker-compose.federation-runtime.yml` | `proxx-federation-runtime` | `federation-proxx-a1/a2/b1/b2` | stable project name; node IDs `a1/a2/b1/b2` |
| `orgs/open-hax/proxx/docker-compose.federation-e2e.yml` | `proxx-federation-e2e` | `federation-proxx-a1/a2/b1/b2` | stable project name; host ports `18891-18894`; cluster `federation-e2e` |
| `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml` | `battlebussy-prod` | `openai-proxy` | bundled proxy host port `28889` |

## Validation performed
All edited compose files were validated structurally with `docker compose config -q`.

Validated files:
- `docker-compose.yml`
- `services/proxx/docker-compose.yml`
- `services/proxx/docker-compose.federation.yml`
- `services/proxx/docker-compose.blongs.yml`
- `services/cephalon-hive/docker-compose.yml`
- `orgs/open-hax/proxx/docker-compose.yml`
- `orgs/open-hax/proxx/docker-compose.glm5.yml`
- `orgs/open-hax/proxx/docker-compose.federation-runtime.yml`
- `orgs/open-hax/proxx/docker-compose.federation-e2e.yml`
- `orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml`

## Remaining caveat
`services/proxx/docker-compose.yml` is currently running and was intentionally left live. Its source file now encodes a cleaner unique identity, but the already-running container will keep its current live configuration until a future, deliberate recreate.
