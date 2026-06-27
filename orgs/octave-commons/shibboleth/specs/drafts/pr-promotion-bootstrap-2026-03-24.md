# Shibboleth PR-promotion bootstrap — 2026-03-24

## Goal
Move Shibboleth onto the same review -> staging -> main promotion contract now proven on Proxx and Battlebussy.

## Current live reality
### Public host
- `https://shibboleth.promethean.rest/` returns `200`
- `https://shibboleth.promethean.rest/api/health` returns `{"ok":true,"service":"promptbench-control-plane"}`

### Live runtime location on `ussy`
- runtime path: `/home/error/devel/orgs/octave-commons/shibboleth`
- unlike Battlebussy's old hacked path, this appears to be a real git checkout, not a broken detached submodule worktree
- tracked source compared against local repo matched exactly except for `receipts.log`

### Live serving model
Observed on `error@ussy.promethean.rest`:
- UI is served by a host process: `python3 -m http.server 5197 --bind 0.0.0.0 --directory dist`
- control plane is served by a host process launched via `bash scripts/ussy_host_control_plane.sh`
- public routing goes through the shared Proxx/Caddy edge to host-local ports
- the host process model implies Shibboleth is currently closer to a host-native app deploy than a pure compose-managed service

### Process provenance confirmed
- UI process parent command: `bash scripts/ussy_host_ui.sh`
- control-plane process parent command: `bash scripts/ussy_host_control_plane.sh`
- current prod secret file in use: `~/.config/shibboleth/proxy-auth.env`

## Repo reality
- repo: `orgs/octave-commons/shibboleth`
- branch state: local `main` is ahead of `origin/main` by 5 commits
- there is currently **no `.github/workflows/` directory** in the repo
- therefore there is currently **no PR gate, no staging deploy, no production deploy, and no branch-promotion contract** encoded in GitHub Actions

## Implication
Shibboleth is a simpler next target than Battlebussy for one reason:
- it already has a live runtime that appears to be a valid git checkout

It is harder in a different way:
- its deploy model is host-native / host-process oriented rather than already centered on a single compose-based runtime home

So the work is not "copy Battlebussy YAML blindly." The work is:
1. decide the canonical runtime-home shape
2. encode the deploy mechanics honestly for that shape
3. then add the staged promotion flow around it

## Proposed runtime contract
### Production
- host: `ussy.promethean.rest`
- runtime home: `~/devel/services/shibboleth`
- public host: `shibboleth.promethean.rest`

### Staging
- host: `ussy3.promethean.rest`
- runtime home: `~/devel/services/shibboleth-staging`
- public host: ideally `staging.shibboleth.promethean.rest` or, if staging stays host-internal first, at least an SSH-verified host-local URL

## Required decision
Choose one of these deployment styles before writing workflows:

### Option A — host-native rsync deploy
- GitHub Actions checks out the repo
- rsyncs source to runtime home
- runs a host-native restart script (build backend, build UI, restart process manager)
- best match if Shibboleth remains a host-process service

### Option B — compose-managed service home
- create a canonical compose runtime under `~/devel/services/shibboleth`
- deploy via `docker compose up -d --build`
- better if the service should converge toward the same runtime semantics as Proxx/Battlebussy

## Recommended default
Start with **Option A** unless a compose conversion is already desired for Shibboleth itself.

Reason:
- it preserves the current live shape more honestly
- it avoids introducing runtime topology changes while also trying to add promotion flow
- we already know the public route is host-local behind the shared edge

## Phase plan
### Phase 1 — inventory the live service precisely
- identify the API process bound on `8787`
- identify the restart mechanism currently used on-host
- identify where UI build artifacts are written (`dist/` is strongly implied)
- identify whether PM2/systemd/tmux/manual shell is the current supervisor
- inspect the live Caddy/edge route source for `shibboleth.promethean.rest`

### Phase 2 — canonical runtime-home bootstrap
- create `~/devel/services/shibboleth`
- rsync or clone the current canonical source into it
- create a single restart/deploy script that reproduces current prod behavior from that home
- validate host-local and public health

Progress now achieved:
- `~/devel/services/shibboleth` was bootstrapped on `ussy`
- alternate-port smoke from that canonical runtime home succeeded for:
  - control plane on `http://127.0.0.1:18788/api/health`
  - UI on `http://127.0.0.1:15198/`
- this proves the new runtime home can launch the service with the existing host-native scripts

### Phase 3 — staging bootstrap
- create `~/devel/services/shibboleth-staging` on `ussy3`
- stand up the same runtime shape there
- validate host-local health first; public staging route optional but preferred

Progress now achieved:
- `~/devel/services/shibboleth-staging` was created on `ussy3`
- the bootstrap branch source was rsynced into that home
- `~/.config/shibboleth/proxy-auth.env` was seeded on `ussy3`
- hard blocker remains: `ussy3` is missing `java`, `clojure`, `node`, and `npm`, so host-native staging cannot run yet

### Phase 4 — GitHub promotion flow
- add `PR -> staging` lightweight gate
- add `push staging` deploy + live verify
- add `PR staging -> main` heavy gate
- add `push main` deploy + prod verify

## GitHub follow-through needed later
- create/confirm long-lived `staging` branch
- add staging + production environments
- set SSH secrets and host/path vars
- require the new checks in branch protection

## Bootstrap PR status
A draft bootstrap PR is now open:
- `octave-commons/shibboleth#3` — `ci: bootstrap staged deploy flow`

That PR intentionally remains draft because:
- the repo's full local test surface is not yet fully clean (`1` real failing test due missing manifest fixture)
- `ussy3` still lacks the host-native runtime toolchain needed for honest staging deploy success

## Success criteria
- Shibboleth staging deploys automatically from `staging`
- Shibboleth production deploys automatically from `main`
- `staging -> main` PR is the only allowed path to production
- live verification is real, not YAML theater
