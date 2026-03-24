# Root module usage manifest — 2026-03-21

## Summary
Investigate where and why the current top-level root modules outside the active placement structure are still used.

This slice focuses on the project-like **root-level** modules already surfaced by the outside-structure manifest, especially:
- top-level aliases
- top-level standalone roots
- root-level vendor/fork/special checkouts

## Open questions
- Which root modules are still actively referenced by workspace scripts, docs, specs, and deployment notes?
- Which root modules are merely legacy aliases or historical artifacts with no meaningful active usage?
- Which root modules are active because they are deployed/live, versus active only because of documentation or local operator convenience?
- Which root modules should gain explicit exception status versus be normalized into the placement structure?

## Risks
- Name-only search can overcount generic words like `promethean` or `desktop`; usage must be tied to actual path or project context where possible.
- Some root modules may be used indirectly via humans or shell habits rather than explicit tracked references.
- Reports and inventories written earlier today can inflate reference counts if not interpreted carefully.

## Priority
- High: understand active dependency on outside-structure roots before deciding whether to normalize, retire, or bless them as exceptions.

## Phases
1. Load the outside-structure manifest and select the root-level module set.
2. Search tracked workspace files for references to those root modules and collect sample hits.
3. Inspect representative usage sites to infer why each module persists.
4. Write JSON and markdown usage artifacts.
5. Verify the artifacts parse and include the expected major root modules.

## Affected artifacts
- `specs/drafts/root-module-usage-manifest-2026-03-21.md`
- `docs/reports/inventory/root-module-usage-manifest-2026-03-21.json`
- `docs/reports/inventory/root-module-usage-manifest-2026-03-21.md`
- `receipts.log`

## Definition of done
- The major root-level modules outside the structure have usage samples and a provisional why-it-exists explanation.
- The report distinguishes active references from likely legacy/alias residue.
- The artifacts are machine-readable and reviewable.
- Verification confirms the artifacts include the major root modules.

## Execution log
- 2026-03-21T19:47:00Z Began tracing where/why root-level outside-structure modules are still used.
- 2026-03-21T19:54:00Z Collected tracked-file reference counts and sample file hits for the root aliases, standalone roots, and vendor/fork roots outside the active placement structure.
- 2026-03-21T19:58:00Z Wrote JSON and markdown usage manifests with provisional active-status categories such as alias, tooling root, deploy root, planning bundle, bookkeeping-only fork, and special worktree.
- 2026-03-21T19:59:00Z Verified the manifests parse and include the major root modules: `desktop`, `promethean`, `reconstitute`, `mcp-social-publisher-live`, `threat-radar-deploy`, and `gates-pr35-hardening-main`.
- 2026-03-21T21:47:00Z Updated the radar-related root usage entries so `threat-radar-deploy` and `threat-radar-next-step` now point at normalization into `orgs/open-hax/eta-mu-radar` rather than remaining generic ambiguous outside-structure roots.
