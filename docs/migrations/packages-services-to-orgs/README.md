# packages/ + services/ -> orgs/ placement contract

## Current rule
Canonical mature projects live under `orgs/<org>/<repo>`.

The workspace keeps two distinct top-level layers:
- `packages/<name>` -> default rapid-prototyping home
- `services/<name>` -> runtime/devops/integration home

This means `services/*` is **not** the default prototype home and should not be treated as the canonical source location for mature application code.

## Default flow
1. Start new work in `packages/*` unless the user explicitly says otherwise.
2. When the project matures, choose its canonical org home based on identity and intent:
   - `orgs/riatzukiza/*`
   - `orgs/octave-commons/*`
   - `orgs/open-hax/*`
   - `orgs/ussyverse/*`
3. Keep any workspace-specific deploy/runtime material in `services/*`.

## Source of truth
- `docs/reference/devel-placement-contract.md` — active workspace placement contract
- `promotion-checklists.md` — org-specific promotion gates for `riatzukiza`, `octave-commons`, `open-hax`, and `ussyverse`
- `migration-map.yaml` — promotion targets and current migration notes
- `links.yaml` — compatibility alias notes where still relevant

## Important note
The active contract for this migration stack is now:
- prototypes default to `packages/*`
- devops/runtime homes live in `services/*`
- canonical mature repos live in `orgs/*/*`

The phase specs in this folder have been reconciled to that rule. Historical notes elsewhere in the repo may still mention older assumptions.
