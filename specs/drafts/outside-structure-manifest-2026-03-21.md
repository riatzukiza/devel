# Outside-structure work manifest — 2026-03-21

## Summary
Create a manifest of project-like work that currently lives **outside** the active placement structure:
- `packages/*`
- `services/*`
- `orgs/riatzukiza/*`
- `orgs/octave-commons/*`
- `orgs/open-hax/*`
- `orgs/ussyverse/*`

The manifest should distinguish true misplacements from intentional exceptions such as foreign forks, compatibility aliases, generated project trees, and vendor repos.

## Open questions
- Which outside-structure categories should become explicit long-term exceptions rather than migration targets?
- Should foreign forks under `orgs/<foreign>/*` remain under foreign namespaces, or eventually move under a dedicated exception area?
- Should large generated/derived trees like `projects/*` and `workspaces/*` remain where they are, or get their own formal classification in the contract?

## Risks
- Treating all outside-structure work as equally problematic would blur the difference between misplacements, aliases, foreign mirrors, and generated artifacts.
- The root workspace contains infrastructure directories that are intentionally root-level; the manifest must focus on project-like work, not every technical directory.
- Some outside-structure paths may be symlink aliases into allowed homes rather than independent work.

## Priority
- High: inventory the remaining exceptions so the placement contract can become operational rather than aspirational.

## Phases
1. Define the inclusion rule: project-like work outside the currently blessed placement paths.
2. Inventory top-level project-like roots outside the allowed structure.
3. Inventory foreign org namespaces and the repos under them.
4. Inventory aggregation trees (`projects/*`, `workspaces/*`, `vaults/*`) that currently contain work outside the structure.
5. Write JSON and markdown manifest artifacts with suggested handling categories.
6. Verify the artifacts parse and include the major outside-structure buckets.

## Affected artifacts
- `specs/drafts/outside-structure-manifest-2026-03-21.md`
- `docs/reports/inventory/outside-structure-manifest-2026-03-21.json`
- `docs/reports/inventory/outside-structure-manifest-2026-03-21.md`
- `receipts.log`

## Definition of done
- The manifest records project-like work outside the active placement structure.
- The manifest distinguishes aliases, foreign forks, standalone roots, vendor roots, and aggregation trees.
- The artifacts are reviewable and machine-readable.
- Verification confirms the manifest includes the major outside-structure categories.

## Execution log
- 2026-03-21T19:33:00Z Began inventory of work outside the active placement structure.
- 2026-03-21T19:41:00Z Enumerated top-level project-like roots, foreign org repos, and aggregation trees that fall outside `packages/*`, `services/*`, and the four active org namespaces.
- 2026-03-21T19:44:00Z Wrote JSON and markdown manifest artifacts separating top-level aliases, standalone roots, vendor/fork roots, foreign org repos, and aggregation trees.
- 2026-03-21T19:45:00Z Verified the manifest parses and includes the expected major outside-structure categories and representative paths.
