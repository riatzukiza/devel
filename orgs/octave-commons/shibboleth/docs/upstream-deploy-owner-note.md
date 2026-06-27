# Shibboleth staged deploy owner note

This repo is being moved onto the same review -> staging -> main promotion contract already proven on Proxx and Battlebussy.

## Branch model
- long-lived branches: `staging`, `main`
- feature branch -> PR into `staging`
- `staging` -> PR into `main`

## Runtime homes
### Production
- host: `ussy.promethean.rest`
- path: `~/devel/services/shibboleth`

### Staging
- host: `ussy3.promethean.rest`
- path: `~/devel/services/shibboleth-staging`

## Deploy mechanics
Shibboleth uses a **runner-side rsync** deploy, not remote `git fetch`.

GitHub Actions:
- checks out repo source
- rsyncs it into the runtime home
- optionally writes `.env`
- optionally writes `~/.config/shibboleth/proxy-auth.env`
- runs `./scripts/deploy-source.sh` remotely

## Current staging blocker
`ussy3` currently lacks the required host-native runtime toolchain:
- `java`
- `clojure`
- `node`
- `npm`

So the staging deploy path is structurally defined, but it will fail honestly until those runtimes are installed or staging is intentionally converted to a containerized shape.

## Secrets and vars expected
### Staging
- secret: `SHIBBOLETH_STAGING_DEPLOY_SSH_KEY`
- optional secret: `SHIBBOLETH_STAGING_ENV_FILE`
- optional secret: `SHIBBOLETH_STAGING_PROXY_AUTH_ENV`
- vars:
  - `SHIBBOLETH_STAGING_HOST` (default `ussy3.promethean.rest`)
  - `SHIBBOLETH_STAGING_USER` (default `error`)
  - `SHIBBOLETH_STAGING_DEPLOY_PATH` (default `~/devel/services/shibboleth-staging`)
  - `SHIBBOLETH_STAGING_API_HEALTH_URL` (default `http://127.0.0.1:8787/api/health`)
  - `SHIBBOLETH_STAGING_UI_HEALTH_URL` (default `http://127.0.0.1:5197/`)

### Production
- secret: `SHIBBOLETH_PRODUCTION_DEPLOY_SSH_KEY`
- optional secret: `SHIBBOLETH_PRODUCTION_ENV_FILE`
- optional secret: `SHIBBOLETH_PRODUCTION_PROXY_AUTH_ENV`
- vars:
  - `SHIBBOLETH_PRODUCTION_HOST` (default `ussy.promethean.rest`)
  - `SHIBBOLETH_PRODUCTION_USER` (default `error`)
  - `SHIBBOLETH_PRODUCTION_DEPLOY_PATH` (default `~/devel/services/shibboleth`)
  - `SHIBBOLETH_PRODUCTION_API_HEALTH_URL` (default `http://127.0.0.1:8787/api/health`)
  - `SHIBBOLETH_PRODUCTION_UI_HEALTH_URL` (default `http://127.0.0.1:5197/`)