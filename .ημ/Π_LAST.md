# Π handoff

- time: 2026-03-21T19:43:03Z
- branch: feature/threat-radar-platform
- pre-Π HEAD: 758a99e
- Π HEAD: pending at capture time; resolved by the final commit after artifact assembly

## Summary
- Persist the current workspace placement-contract and deployment-governance bundle: AGENTS/doc updates, promotion checklists, inventory reports, and Promethean host/runtime skill mirrors.
- Move the canonical Fork Tales submodule from vaults/fork_tales to orgs/octave-commons/fork_tales, retarget dependent workspace/repo paths, and preserve the Shuv fork as a documented local secondary remote on the canonical checkout.
- Advance recursive submodule pointers to freshly pushed Π snapshots for orgs/octave-commons/gates-of-aker, orgs/octave-commons/shibboleth, orgs/open-hax/voxx, and threat-radar-deploy.

## Notes
- submodule orgs/octave-commons/gates-of-aker -> 6061513 (Π/2026-03-21/193814-6061513, push pi/fork-tax/2026-03-21-193439)
- submodule orgs/octave-commons/shibboleth -> 5858a97 (Π/2026-03-21/193903-5858a97, push pi/fork-tax/2026-03-21-193439)
- submodule orgs/open-hax/voxx -> 7df28c5 (Π/2026-03-21/193930-7df28c5, push pi/fork-tax/2026-03-21-193439)
- submodule threat-radar-deploy -> b77c0bb (Π/2026-03-21/193954-b77c0bb, push pi/fork-tax/2026-03-21-193439)
- orgs/octave-commons/fork_tales remains at 70a5e68; the added shuv remote is a local checkout configuration and is documented in specs/drafts/fork-tales-submodule-relocation-2026-03-21.md.

## Verification
- pass: python json.load config/docker-stacks.json + projects/vaults-fork-tales/project.json + inventory JSON reports
- pass: docker compose -f services/radar-stack/docker-compose.yml config (env warnings only)
- fail: docker compose -f services/host-fleet-dashboard/docker-compose.ssl.yml config (depends on undefined service host-fleet-dashboard)
- pass: git grep tracked non-receipt files found no remaining vaults/fork_tales references
- pass: recursive Π pushes succeeded for gates-of-aker, shibboleth, voxx, and threat-radar-deploy
