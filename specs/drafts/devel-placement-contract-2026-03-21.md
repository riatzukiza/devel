# Devel placement contract — 2026-03-21

## Summary
Formalize the workspace placement contract as clarified by the user:
- default new-project mode is rapid prototyping in `packages/*`
- `services/*` is reserved for devops/runtime/integration material, not canonical product source
- mature projects graduate into one of four org namespaces based on identity and intent:
  - `orgs/riatzukiza/*`
  - `orgs/octave-commons/*`
  - `orgs/open-hax/*`
  - `orgs/ussyverse/*`
- deploy/release contracts should live with the canonical org repo, while `devel` remains the giga-repo composition and operations layer

## Open questions
- Should `packages/*` remain only for active prototypes, or also continue to host compatibility symlinks after promotion?
- How should legacy migration manifests (`links.yaml`, `migration-map.yaml`) represent the new distinction between canonical source homes and `services/*` runtime homes?
- Which current `services/*` directories should remain long-term runtime homes versus be retired or consolidated?

## Risks
- Existing migration drafts assume `services/*` can act as a prototype + symlink layer, which now conflicts with the clarified policy.
- Without a written contract, future moves may continue to blur source truth and runtime truth.
- Over-updating old migration docs in one pass could create accidental scope creep; this slice should establish the contract first, then let later cleanup specs reconcile historical drafts.

## Priority
- High: this contract should guide future project placement and deploy-flow ownership decisions.

## Phases
1. Capture the clarified placement policy in a reference doc.
2. Update `AGENTS.md` so future agents see the policy in the workspace contract.
3. Update the migration README so active migration guidance points at the new contract and no longer treats `services/*` as a prototype home.
4. Reconcile the migration phase drafts so they no longer imply `services/*` is a generic prototype or symlink destination.
5. Add org-specific promotion checklists for `riatzukiza`, `octave-commons`, `open-hax`, and `ussyverse`.
6. Add the Promethean-specific corpus/crucible model so agents do not misread Promethean overlap as ordinary repo drift.
7. Verify the new contract appears in the expected docs and reflects the four namespace meanings accurately.

## Affected artifacts
- `specs/drafts/devel-placement-contract-2026-03-21.md`
- `docs/reference/devel-placement-contract.md`
- `docs/migrations/packages-services-to-orgs/README.md`
- `docs/migrations/packages-services-to-orgs/promotion-checklists.md`
- `specs/drafts/migrate-packages-services-to-orgs-phase-0-inventory.md`
- `specs/drafts/migrate-packages-services-to-orgs-phase-1-symlink-layer.md`
- `specs/drafts/migrate-packages-services-to-orgs-phase-2-packages-to-orgs-submodules.md`
- `specs/drafts/migrate-packages-services-to-orgs-phase-3-services-to-orgs-submodules.md`
- `specs/drafts/migrate-packages-services-to-orgs-phase-4-governance-polish.md`
- `AGENTS.md`
- `docs/reports/inventory/packages-org-placement-inventory-2026-03-21.json`
- `docs/reports/inventory/packages-org-placement-inventory-2026-03-21.md`
- `receipts.log`

## Definition of done
- A durable reference document exists for the placement contract.
- `AGENTS.md` reflects the default prototype home, the devops-only role of `services/*`, the meanings of the four org namespaces, and the Promethean corpus/crucible distinction.
- The migration README no longer describes `services/*` as a prototype home.
- The migration phase drafts align with the active placement contract.
- Org-specific promotion checklists exist for all four destination namespaces.
- Promethean-derived overlap in the package inventory is classified as slop vs corpus artifact vs verified extraction vs canonical descendant rather than generic bad drift.
- Verification confirms the updated docs contain the core rules.

## Execution log
- 2026-03-21T18:05:00Z Began formalizing the workspace placement contract after clarifying that `packages/*` is the prototype home and `services/*` is devops-only.
- 2026-03-21T18:12:00Z Authored `docs/reference/devel-placement-contract.md` capturing the two-axis placement model, the four org namespace meanings, and the split between org-owned deploy truth and devel-owned composition/operations.
- 2026-03-21T18:14:00Z Updated `AGENTS.md` to include the project placement contract, the missing primary org namespaces, and explicit `packages/*` versus `services/*` semantics.
- 2026-03-21T18:16:00Z Rewrote `docs/migrations/packages-services-to-orgs/README.md` to point at the active contract and stop treating `services/*` as a prototype home.
- 2026-03-21T18:18:00Z Refreshed the migration helper docs `links.yaml` and `migration-map.yaml` so the `open-hax-openai-proxy` alias reflects the current runtime home (`services/proxx`) rather than a stale direct org symlink assumption.
- 2026-03-21T18:19:00Z Verified the contract docs exist and contain the expected placement rules and current runtime/source distinctions.
- 2026-03-21T18:27:00Z Reconciled the Phase 0-4 migration drafts so they now treat `packages/*` as the prototype layer, `services/*` as the runtime/devops layer, and the four org namespaces as the canonical mature homes.
- 2026-03-21T18:29:00Z Updated the migration README note to reflect that the phase specs in the folder are now aligned with the active placement contract, while older assumptions may still survive in historical notes elsewhere.
- 2026-03-21T18:34:00Z Authored `docs/migrations/packages-services-to-orgs/promotion-checklists.md` with explicit destination gates for `riatzukiza`, `octave-commons`, `open-hax`, and `ussyverse`, plus shared pre-promotion checks.
- 2026-03-21T18:35:00Z Updated the migration README to include the new promotion checklist doc in the active source-of-truth set.
- 2026-03-21T19:16:00Z Added a Promethean-specific corpus/crucible section to the placement contract and AGENTS guidance so future agents treat Promethean overlap as provenance work, not automatically as product-repo drift.
- 2026-03-21T19:18:00Z Reclassified the Promethean-derived package overlaps in the package placement inventory as verified extraction from the Promethean corpus pending canonical descendant decisions.
