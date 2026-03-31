# Fork Tales submodule relocation — 2026-03-21

## Summary
Move the canonical Octave Commons Fork Tales repo from `vaults/fork_tales` to `orgs/octave-commons/fork_tales`, remove the duplicate standalone `fork_tales` checkout that points at Shuv's fork, and represent Shuv's fork as a secondary remote on the canonical repo.

## Open questions
- Should a compatibility alias remain at `vaults/fork_tales`, or should all tracked references move immediately to the new org path?
  - Working default: update tracked references to the new org path and remove the old root/vault path usage.
- Should the standalone `fork_tales` checkout be preserved in any form beyond a remote entry?
  - Working default: no; preserve access by adding a `shuv` remote and removing the duplicate checkout.

## Risks
- Moving a submodule path can leave stale local submodule config if `.gitmodules` and `.git/config` are not kept in sync.
- Workspace docs/configs and dependent repos currently reference `vaults/fork_tales`; leaving them unchanged would break path-based tooling.
- `orgs/octave-commons/gates-of-aker` already has unrelated local modifications, so edits there must stay surgical.

## Priority
- High: this normalizes the canonical repo into the correct org namespace and removes a misleading duplicate checkout.

## Phases
1. Record the relocation plan and inspect current repo/remotes for both checkouts.
2. Move the canonical submodule to `orgs/octave-commons/fork_tales` and update root submodule metadata.
3. Update tracked workspace configs/docs that still point at `vaults/fork_tales`.
4. Update dependent repo references that would break under the new canonical path.
5. Add `shuv` as a remote on the canonical repo, remove the standalone `fork_tales` checkout, and verify the resulting layout.

## Affected artifacts
- `specs/drafts/fork-tales-submodule-relocation-2026-03-21.md`
- `.gitmodules`
- `config/docker-stacks.json`
- `docs/docker-stacks.md`
- `docs/sing.v3.md`
- `projects/vaults-fork-tales/project.json`
- `services/radar-stack/docker-compose.yml`
- `spec/2026-02-24-opencode-snapshot-stability-fork-tales.md`
- `spec/2026-03-08-docker-stack-registry.md`
- `specs/drafts/radar-crawler-integration-2026-03-20.md`
- `specs/drafts/radar-live-deploy-2026-03-20.md`
- `orgs/octave-commons/gates-of-aker/backend/src/fantasia/config.clj`
- `orgs/octave-commons/gates-of-aker/docs/notes/fantasia/fork-tales-story-engine.md`
- `orgs/octave-commons/gates-of-aker/docs/planning/spec/2026-03-20-fork-tales-story-engine.md`
- `orgs/open-hax/voxx/README.md`
- `orgs/open-hax/voxx/specs/drafts/sports-commentator-postprocess.md`
- `receipts.log`

## Definition of done
- Root git tracks the canonical repo at `orgs/octave-commons/fork_tales` instead of `vaults/fork_tales`.
- The canonical repo keeps Octave Commons as `origin` and has Shuv's fork configured as remote `shuv`.
- The standalone top-level `fork_tales` checkout is removed.
- Tracked workspace configs/docs no longer rely on `vaults/fork_tales` for current operational paths.
- Dependent repo references that should follow the canonical path are updated.
- Verification confirms the moved repo path, remotes, and key workspace references.

## Execution log
- 2026-03-21T19:00:00Z Began planning and inventory for relocating Fork Tales from `vaults/` into `orgs/octave-commons/` and demoting the standalone Shuv checkout into a secondary remote.
- 2026-03-21T19:09:00Z Moved the canonical submodule working tree from `vaults/fork_tales` to `orgs/octave-commons/fork_tales`, renamed the `.gitmodules` entry, and synced the root submodule config to the new path.
- 2026-03-21T19:12:00Z Updated root workspace configs/docs and dependent repo references in Gates of Aker and Voxx so current operational paths point at `orgs/octave-commons/fork_tales`.
- 2026-03-21T19:14:00Z Added `shuv` remote to `orgs/octave-commons/fork_tales`, fetched `shuv/main`, and removed the duplicate top-level `fork_tales` checkout.
- 2026-03-21T19:16:00Z Verified JSON files still parse, the canonical Part64 path exists, the old `vaults/fork_tales` path is gone, and no tracked non-receipt files still reference the old location.
