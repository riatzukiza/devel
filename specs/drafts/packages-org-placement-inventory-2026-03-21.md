# Packages org-placement inventory — 2026-03-21

## Open questions
- Should promoted `packages/*` entries generally become standalone repos, or should some be folded into existing org monorepos such as `promethean` or `openhax` packages trees?
- Should `@workspace/*` packages be treated as a strong signal to remain prototypes/internal until renamed and documented, or only a weak temporary naming signal?
- For packages that already have name matches under existing org monorepos (for example `event`, `fsm`, `logger`, `embedding`, `persistence`, `test-utils`, `utils`), which current org monorepo should be considered canonical?
- Are there any current `packages/*` entries that should remain permanently devel-local and never promote?

## Risks
- A package-level org recommendation can be directionally right while still choosing the wrong final repo boundary (standalone repo vs existing monorepo).
- Some packages have minimal docs, so recommendations must remain provisional and evidence-based rather than falsely definitive.
- Existing duplicate package names under current org monorepos imply unresolved source-of-truth drift that this inventory should surface rather than paper over.

## Priority
- High: convert the new promotion checklists into a concrete inventory of the current `packages/*` surface.

## Phases
1. Inventory all top-level `packages/*` directories and collect basic metadata.
2. Cross-check package names against existing org package trees to detect likely existing homes or drift.
3. Apply the new promotion checklists to propose provisional org destinations or recommend staying in `packages/*`.
4. Reclassify Promethean-derived overlap using the Promethean corpus/crucible model rather than treating all overlap as generic bad drift.
5. Write JSON and markdown inventory artifacts for review.
6. Verify the artifacts parse and reflect the expected package count and org buckets.

## Affected artifacts
- `specs/drafts/packages-org-placement-inventory-2026-03-21.md`
- `docs/reports/inventory/packages-org-placement-inventory-2026-03-21.json`
- `docs/reports/inventory/packages-org-placement-inventory-2026-03-21.md`
- `receipts.log`

## Definition of done
- All current top-level `packages/*` directories are inventoried.
- Each package has a provisional stage recommendation and likely org candidate(s) with rationale.
- Promethean-derived overlap is distinguished from generic bad drift when the overlap represents verified extraction from the corpus.
- The report distinguishes strong candidates from packages that should remain prototypes.
- Verification confirms the artifacts exist and parse.

## Execution log
- 2026-03-21T19:00:00Z Began inventorying top-level `packages/*` against the new placement contract and promotion checklists.
- 2026-03-21T19:03:00Z Collected package metadata (package name, scripts, README presence, workspace deps) for all 25 top-level packages and cross-checked exact package-name matches under current org monorepos.
- 2026-03-21T19:06:00Z Wrote provisional JSON and markdown placement reports with stage recommendations, likely org candidates, confidence levels, and rationale per package.
- 2026-03-21T19:07:00Z Verified the artifacts parse, reflect the full package count, and highlight the existing Promethean package-name collisions plus the strongest open-hax, riatzukiza, and octave-commons candidates.
- 2026-03-21T19:18:00Z Reclassified the Promethean-derived overlaps in the package inventory as verified extraction from a living documentation corpus, pending canonical descendant decisions.
