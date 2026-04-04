# Π Last Snapshot

**Time:** 2026-04-04T18:02:50Z
**Branch:** staging
**Pre-commit HEAD:** 8d51fa7

## Summary

Snapshot of the current full dirty workspace state on `staging`.

Dominant change roots in this bundle:

- `services` — 544 changed paths
- `packages` — 193 changed paths
- `orgs` — 30 changed paths
- `recovered` — 28 changed paths
- `reconstitute-mcp` — 13 changed paths
- `spec` — 9 changed paths
- `.github` — 6 changed paths
- `.opencode` — 3 changed paths

This root snapshot contains **817** regular file changes and **22** submodule deltas.

## Submodule State Captured in the Root Commit

Pointer-only submodule advances that can be preserved directly by the root git object (6):

- `orgs/octave-commons/cephalon` — `SC..`
- `orgs/octave-commons/daimoi` — `SC..`
- `orgs/octave-commons/graph-runtime` — `SC..`
- `orgs/octave-commons/graph-weaver-aco` — `SC..`
- `orgs/octave-commons/simulacron` — `SC..`
- `orgs/open-hax/depenoxx` — `SC..`

Removed submodules (2):

- `orgs/open-hax/eta-mu-github`
- `services/vivgrid-openai-proxy`

## Submodule State Only Documented, Not Fully Encoded at the Root

These submodules still contain tracked and/or untracked local dirt beyond the pointer state (14):

- `orgs/octave-commons/fork_tales` — `S.M.`
- `orgs/octave-commons/graph-weaver` — `SCM.`
- `orgs/octave-commons/myrmex` — `SCM.`
- `orgs/octave-commons/promethean` — `S.MU`
- `orgs/octave-commons/shibboleth` — `SCMU`
- `orgs/open-hax/cljs-plugin-template` — `S..U`
- `orgs/open-hax/knoxx` — `SCMU`
- `orgs/open-hax/openhax` — `S.M.`
- `orgs/open-hax/openplanner` — `S.MU`
- `orgs/open-hax/proxx` — `SCM.`
- `orgs/open-hax/uxx` — `SCMU`
- `orgs/open-hax/voxx` — `SC.U`
- `orgs/open-hax/workbench` — `S.M.`
- `orgs/shuv/our-gpus` — `SCMU`

## Verification

- `git diff --check` ✅
- Mixed-workspace build/lint/test sweep skipped: no single low-cost executable target covers this cross-repo migration + rehome bundle.

## Tag

`Π/2026-04-04/180250-8d51fa7`
