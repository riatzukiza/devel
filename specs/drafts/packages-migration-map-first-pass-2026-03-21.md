# Packages migration map first pass — 2026-03-21

## Summary
Apply a cautious, provenance-aware first pass to `docs/migrations/packages-services-to-orgs/migration-map.yaml`.

This pass should only add:
- the highest-confidence package candidates from the package placement inventory
- the Promethean-derived foundational packages whose overlap has been clarified as verified extraction rather than generic bad drift

This pass should **not** try to settle every low-confidence package yet.

## Open questions
- Which verified-extraction foundational packages should remain canonically nested under an existing org monorepo versus eventually split into standalone repos?
- Should `packages/radar-core` be mapped now despite its repo-boundary ambiguity, or remain inventory-only until a stronger home decision exists?
- For Promethean-derived foundational packages, should the first-pass map record a target org only, or also a canonical descendant candidate path under an existing monorepo?

## Risks
- Writing low-confidence package guesses into `migration-map.yaml` would make the map look more decided than it really is.
- Overwriting provenance nuance with a flat target-org field would lose the distinction between direct prototypes and verified Promethean extraction.
- Existing package-name matches inside current org monorepos still imply unresolved canonical-home drift, so the first pass should preserve that uncertainty explicitly.

## Priority
- High: turn the current inventory into a reviewable first-pass map without prematurely locking the ambiguous cases.

## Phases
1. Select the first-pass package set from the highest-confidence inventory results.
2. Encode provenance and home-type metadata in `migration-map.yaml`.
3. Preserve uncertainty explicitly for existing-monorepo-package cases and canonical-descendant-pending packages.
4. Verify the migration map parses and contains the expected first-pass package entries.

## Affected artifacts
- `specs/drafts/packages-migration-map-first-pass-2026-03-21.md`
- `docs/migrations/packages-services-to-orgs/migration-map.yaml`
- `receipts.log`

## Definition of done
- `migration-map.yaml` contains a first-pass package set based on high-confidence inventory results.
- Promethean-derived foundational packages are marked as verified extraction with provenance.
- Low-confidence package cases remain out of the migration map for now.
- Verification confirms the YAML parses and the expected first-pass entries exist.

## Execution log
- 2026-03-21T19:31:00Z Began first-pass migration-map update for high-confidence package placements and Promethean-derived verified extractions.
- 2026-03-21T19:36:00Z Added first-pass package entries for the clearest high-confidence candidates (`cephalon-*`, `eta-mu-*`, `npu-top`, `omni-top`, `opencode-*`, `openplanner-cljs-client`, `reconstituter`) and preserved the existing `services/open-hax-openai-proxy` runtime alias mapping.
- 2026-03-21T19:38:00Z Added provenance-aware entries for the Promethean-derived foundational packages (`embedding`, `event`, `fsm`, `logger`, `persistence`, `test-utils`, `utils`) using `verified-extraction` plus `canonical_descendant_candidate` fields instead of flattening them into generic drift.
- 2026-03-21T19:39:00Z Verified the YAML parses, the expected first-pass keys exist, and the verified-extraction count matches the intended seven Promethean-derived foundational packages.
