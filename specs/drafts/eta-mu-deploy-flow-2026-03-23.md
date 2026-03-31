# Spec Draft: eta-mu staged deploy flow — 2026-03-23

## Goal
Normalize eta-mu onto the Promethean staging-first promotion contract:

- feature branch -> PR into `staging`
- push to `staging` deploys staging and runs live verification
- PR from `staging` into `main`
- push to `main` deploys production and verifies production

## Scope
This covers the eta-mu system components currently split across the devel workspace:

- runtime/devops home: `services/eta-mu`
- service implementation: `services/eta-mu-truth-workbench`
- shared runtime packages: `packages/eta-mu-docs`, `packages/eta-mu-truth`
- GitHub automation logic: `orgs/open-hax/eta-mu-github`
- repo-local eta-mu wrapper workflows that must select the correct staged logic ref

## Constraints
- eta-mu still lives inside the root `devel` repo rather than an extracted dedicated repo.
- The root repo cannot safely hard-redirect every main PR, so eta-mu branch-policy enforcement in `devel` must be check-based and path-scoped.
- Host-level Caddy ownership on `big.ussy.promethean.rest` is not fully automated from the current SSH account, so public-route follow-through must be explicit.

## Deployment topology
- production host: `big.ussy.promethean.rest`
- production runtime root: `~/devel/services/eta-mu`
- production compose project: `eta-mu`
- production public host: `eta.mu.promethean.rest`
- production verify URL: `https://eta.mu.promethean.rest`

- staging host: `big.ussy.promethean.rest`
- staging runtime root: `~/devel/services/eta-mu-staging`
- staging compose project: `eta-mu-staging`
- staging public host: `staging.eta-mu.promethean.rest`
- staging direct verify URL fallback: `http://big.ussy.promethean.rest:8791`

## Phases
1. Parameterize the runtime/devops home so staging and production can coexist on one host.
2. Add a service-specific remote deploy script plus operator documentation.
3. Add devel-root workflows for eta-mu staging PRs, staging deploys, main PR gates, and production deploys.
4. Add staged promotion workflows to `open-hax/eta-mu-github` and make wrapper workflows branch-aware when selecting eta-mu logic refs.
5. Verify locally with compose config, package tests, eta-mu-github tests/build, and shell syntax checks.
6. Call out the remaining GitHub/environment/Caddy follow-through honestly.

## Verification target
- `docker compose -f services/eta-mu/compose.yaml config`
- `node --test packages/eta-mu-docs/tests/*.test.cjs`
- `node --test packages/eta-mu-truth/tests/*.test.cjs`
- `bash -n services/eta-mu/scripts/deploy-remote.sh`
- `pnpm test && pnpm build` in `orgs/open-hax/eta-mu-github`

## Definition of done
- eta-mu runtime can be deployed as separate staging and production compose projects.
- devel has path-scoped eta-mu workflows for PR->staging, push->staging deploy, PR->main gate, and push->main deploy.
- eta-mu-github has its own staged promotion workflow set.
- repo-local eta-mu wrapper workflows can pull staged eta-mu logic on staging-bound events.
- Remaining manual follow-through is explicit: branch protection, environments/secrets/vars, and host-level Caddy import/reload.