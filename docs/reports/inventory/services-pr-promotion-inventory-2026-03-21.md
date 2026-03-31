# Services PR-promotion inventory — 2026-03-21

## Scope
- Top-level `services/*` directories under `/home/err/devel`
- Existing GitHub workflows in devel that already implement or approximate a `staging -> main` PR promotion flow for service-related repos
- Current box-only runtime paths cross-checked against local source trees

Machine-readable companion artifact:
- `docs/reports/inventory/services-pr-promotion-inventory-2026-03-21.json`

## Summary
- Total top-level service directories: **30**
- Root-owned directories inside the `devel` monorepo: **28**
- Root submodules under `services/*`: **1**
- Nested git-pointer directories under `services/*`: **1**
- Symlink aliases under `services/*`: **1** (`services/open-hax-openai-proxy` -> `services/proxx`) 
- Direct per-service staging/main GitHub promotion flows inside `services/*`: **none found**
- Full service-related staging/main promotion flows found elsewhere in devel: **`orgs/open-hax/proxx`** and **`orgs/ussyverse/battlebussy`**
- Main-only service deploy flow found elsewhere in devel: **`orgs/open-hax/voxx`**

## `services/*` classification

| Service path | Classification | Direct workflow files | Notes |
|---|---|---|---|
| `services/api-gateway` | root-owned | — | — |
| `services/auto-fork-tax` | root-owned | — | — |
| `services/cephalon-cljs` | root-owned | — | — |
| `services/cephalon-stack` | root-owned | — | — |
| `services/eta-mu-truth-workbench` | root-owned | — | — |
| `services/host-fleet-dashboard` | root-owned | — | — |
| `services/janus` | root-owned | — | — |
| `services/kronos` | nested-git-pointer | — | Contains a .git pointer to ../../../../../.git/modules/promethean/modules/packages/mcp, but git commands do not resolve from this path in the current workspace. |
| `services/mcp-devtools` | root-owned | — | — |
| `services/mcp-exec` | root-owned | — | — |
| `services/mcp-files` | root-owned | — | — |
| `services/mcp-fs-oauth` | root-owned | — | — |
| `services/mcp-github` | root-owned | — | — |
| `services/mcp-ollama` | root-owned | — | — |
| `services/mcp-process` | root-owned | — | — |
| `services/mcp-sandboxes` | root-owned | — | — |
| `services/mcp-social-publisher` | root-owned | — | — |
| `services/mcp-stack` | root-owned | — | — |
| `services/mcp-tdd` | root-owned | — | — |
| `services/mnemosyne` | root-owned | — | — |
| `services/ollama-stack` | root-owned | — | — |
| `services/open-hax-openai-proxy` | root-owned | — | symlink -> `services/proxx`; Symlink alias to services/proxx, not a distinct service boundary. |
| `services/opencode-compat` | root-owned | — | — |
| `services/opencode-indexer` | root-owned | — | — |
| `services/opencode-stack` | root-owned | — | — |
| `services/openplanner` | root-owned | — | — |
| `services/proxx` | root-owned | — | Runtime/deploy directory in the root repo; matching source submodule with a full PR promotion flow exists at orgs/open-hax/proxx. |
| `services/radar-stack` | root-owned | — | — |
| `services/vivgrid-openai-proxy` | root-submodule | — | This is the only services/* path that is a root git submodule. |
| `services/voxx` | root-owned | — | Runtime/deploy directory in the root repo; matching source submodule exists at orgs/open-hax/voxx but currently has main-only automation. |

## Existing service-related promotion flows in devel

| Repo | Backs service path | Flow status | Workflow evidence |
|---|---|---|---|
| `orgs/open-hax/proxx` | `services/proxx` | full | staging-pr.yml, main-pr-gate.yml, deploy-staging.yml, deploy-production.yml |
| `orgs/open-hax/voxx` | `services/voxx` | main-only | voxx-main.yml |
| `services/vivgrid-openai-proxy` | `services/vivgrid-openai-proxy` | none | — |
| `orgs/ussyverse/battlebussy` | `—` | full | pr-staging.yml, pr-main.yml, deploy-staging.yml, deploy-main.yml |
| `mcp-social-publisher-live` | `—` | none | — |
| `orgs/octave-commons/gates-of-aker` | `—` | ci-only | backend.yml, ci.yml, frontend.yml, fullstack.yml |

### `orgs/open-hax/proxx`
- Flow status: **full**
- Backs runtime path: `services/proxx`
- Workflow files: staging-pr.yml, main-pr-gate.yml, deploy-staging.yml, deploy-production.yml
- Implements PR gate to staging, PR gate to main, push-to-staging deploy, and push-to-main production deploy.
- Main PR gate requires successful staging deploy/live checks before promotion.

### `orgs/open-hax/voxx`
- Flow status: **main-only**
- Backs runtime path: `services/voxx`
- Workflow files: voxx-main.yml
- Has pull_request plus main push automation and production deploy.
- No separate staging PR gate or push-to-staging deploy workflow is present.

### `services/vivgrid-openai-proxy`
- Flow status: **none**
- Backs runtime path: `services/vivgrid-openai-proxy`
- Standalone root submodule with no .github/workflows directory in the checked-out repo.

### `orgs/ussyverse/battlebussy`
- Flow status: **full**
- Workflow files: pr-staging.yml, pr-main.yml, deploy-staging.yml, deploy-main.yml
- Not under services/*, but it is live on the boxes and already has the desired staging/main PR promotion pattern.

### `mcp-social-publisher-live`
- Flow status: **none**
- Deployed on ussy under ~/apps/mcp-social-publisher-live but no GitHub workflow files are present locally.

### `orgs/octave-commons/gates-of-aker`
- Flow status: **ci-only**
- Workflow files: backend.yml, ci.yml, frontend.yml, fullstack.yml
- Live on ussy under ~/apps/gates-of-aker, but current workflows are CI-oriented rather than staging/main deploy promotion.

## Box-exclusive findings

- No service is currently known to be **source-exclusive** to the boxes; every live service identified so far has a corresponding source tree somewhere in `devel`.

### Runtime paths that exist only on boxes
- `/home/error/devel/services/proxx-staging` on `ussy3.promethean.rest` — Remote staging runtime path exists only on the host; it is derived from local services/proxx plus orgs/open-hax/proxx workflows rather than a local services/proxx-staging directory.

### Box-only deploy roots with local source elsewhere
- `/home/error/apps/gates-of-aker` on `ussy.promethean.rest` -> local source `orgs/octave-commons/gates-of-aker`
- `/home/error/apps/mcp-social-publisher-live` on `ussy.promethean.rest` -> local source `mcp-social-publisher-live`

### Notes
- From current evidence, no live service appears to exist only on the boxes with no corresponding source tree somewhere in devel.
- Several live services are not under top-level services/*, but they do exist elsewhere in the workspace (for example battlebussy, shibboleth, gates-of-aker, parameter-golf, and mcp-social-publisher-live).

## Interpretation
- Most `services/*` paths are **runtime/config directories inside the root `devel` monorepo**, not standalone GitHub repos.
- If you want **every service** to have a staging -> main PR deploy flow, you first need a boundary decision for each service:
  1. keep it in the `devel` monorepo and build path-filtered workflows there, or
  2. split/promote it into its own repo/submodule with its own GitHub settings and deploy secrets.
- Today, `proxx` already demonstrates the target model well; `voxx` is close but missing the staging half; most root-owned service directories have no dedicated GitHub workflow boundary yet.
