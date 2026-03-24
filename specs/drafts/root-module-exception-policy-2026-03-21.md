# Root/outside-structure exception policy — 2026-03-21

## Summary
Turn the outside-structure manifest and root-module usage manifest into an explicit policy and action table.

The policy should distinguish:
- benign aliases
- intentional tooling roots
- active standalone source/deploy roots pending placement
- planning bundles
- foreign forks/vendor mirrors
- active special worktrees
- aggregation/projection trees
- foreign-org and private-org exceptions

The action table should assign one of:
- `keep`
- `normalize`
- `retire`
- `explicit-exception`

## Open questions
- Which standalone roots should be normalized first, and which should remain temporarily as explicit exceptions?
- Should foreign forks remain distributed in their current locations, or should a future vendor/forks area be introduced?
- Should aggregation/projection trees like `projects/*`, `workspaces/*`, and `vaults/*` be codified directly in the placement contract?

## Risks
- A flat keep/normalize/retire table can over-simplify active-but-transitional roots unless paired with exception classes.
- Aggressively normalizing aliases or worktrees without acknowledging live usage would create breakage.
- The policy must remain honest about ambiguity rather than pretending all categories are fully settled.

## Priority
- High: the placement contract now needs an operational exception policy so cleanup decisions can proceed consistently.

## Phases
1. Define explicit exception classes for outside-structure work.
2. Write a reference policy describing what each class means and when it is acceptable.
3. Generate a machine-readable action table for the current outside-structure set.
4. Verify the policy and action table cover the major categories and representative paths.

## Affected artifacts
- `specs/drafts/root-module-exception-policy-2026-03-21.md`
- `docs/reference/outside-structure-exception-policy.md`
- `docs/reports/inventory/outside-structure-action-table-2026-03-21.json`
- `docs/reports/inventory/outside-structure-action-table-2026-03-21.md`
- `receipts.log`

## Definition of done
- An explicit exception policy exists.
- The current outside-structure work is assigned a keep/normalize/retire/explicit-exception action plus exception class where relevant.
- The action table is machine-readable and reviewable.
- Verification confirms the policy and action table cover the expected categories and representative paths.

## Execution log
- 2026-03-21T20:01:00Z Began converting the outside-structure manifests into an explicit exception policy and action table.
- 2026-03-21T20:06:00Z Authored `docs/reference/outside-structure-exception-policy.md` with explicit exception classes for aliases, tooling roots, standalone source/deploy roots, planning bundles, foreign forks, worktrees, foreign-org repos, private-org repos, and aggregation trees.
- 2026-03-21T20:09:00Z Wrote a machine-readable outside-structure action table assigning `keep`, `normalize`, or `explicit-exception` across the current outside-structure set.
- 2026-03-21T20:10:00Z Linked the exception policy from the placement contract and `AGENTS.md`, then verified the policy and action table contain the expected categories and representative paths.
- 2026-03-21T21:48:00Z Updated the action table to reflect the new directive that all threat-radar-related roots should normalize into `orgs/open-hax/eta-mu-radar`, including the planning bundle `threat-radar-next-step`.
