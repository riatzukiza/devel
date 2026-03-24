# eta-mu service home

Devops/runtime home for the eta-mu truth workbench stack.

## What lives here
- `compose.yaml` — shared compose definition for staging and production
- `Caddyfile.snippet` — current production host mapping
- `Caddyfile.template` — renderable host mapping for staged deploys
- `scripts/deploy-remote.sh` — curated remote deploy helper for Promethean hosts

## Runtime payload
The eta-mu runtime is built from a small curated slice of the workspace:

- `packages/eta-mu-docs`
- `packages/eta-mu-truth`
- `services/eta-mu`
- `services/eta-mu-truth-workbench`

The deploy script syncs exactly those paths to a remote runtime root, then runs:

```bash
docker compose --project-name <name> -f services/eta-mu/compose.yaml up -d --build --remove-orphans
```

## Standard Promethean layout
- production: `~/devel/services/eta-mu`
- staging: `~/devel/services/eta-mu-staging`

## Key runtime env
- `ETA_MU_CONTAINER_NAME`
- `ETA_MU_PORT`
- `ETA_MU_BIND_HOST`
- `ETA_MU_GITHUB_TOKEN`
- `ETA_MU_AUTOMATION_ENABLED`
- `ETA_MU_AUTOMATION_INTERVAL_MS`
- `ETA_MU_AUTOMATION_VAULTS`
- `ETA_MU_CONTROL_PLANE_RECEIPTS_PATH`

## Public routing
Production is currently expected at:

- `https://eta.mu.promethean.rest`

Staging is intended to live at:

- `https://staging.eta-mu.promethean.rest`

If host-level Caddy automation is unavailable, use the direct staging verify URL as an interim check:

- `http://big.ussy.promethean.rest:8791`