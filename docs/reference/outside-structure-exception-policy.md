# Outside-structure exception policy

## Purpose
The placement contract defines the preferred homes for active work:
- `packages/*`
- `services/*`
- `orgs/riatzukiza/*`
- `orgs/octave-commons/*`
- `orgs/open-hax/*`
- `orgs/ussyverse/*`

This policy explains what to do with project-like work that still exists outside those paths.

It exists to stop every outside-structure path from being treated as the same kind of problem.

## Decision actions
Every outside-structure item should eventually receive one of four actions:

- **keep**
  - the current path is acceptable as-is for now
  - may still need documentation, but no structural move is currently required
- **normalize**
  - move or re-home the work into the active placement structure
  - leave behind aliases only when they have real operator value
- **retire**
  - remove the path after its value has been absorbed elsewhere or its purpose has ended
- **explicit-exception**
  - keep it outside the main placement structure intentionally
  - document why it is outside and what reevaluation condition would change that

## Exception classes
Use these classes to avoid flattening meaning.

### 1. Compatibility alias
A short or historical path that resolves to a canonical allowed home.

Examples:
- `desktop` -> `orgs/riatzukiza/desktop`
- `promethean` -> `orgs/riatzukiza/promethean`

Default action:
- **keep** if active references still justify the alias
- otherwise **normalize** by rewriting callers and then **retire** the alias

### 2. Root tooling exception
A root-level tool or fixture that is still actively used by the workspace, but not yet clearly placed under `packages/*` or an org repo.

Examples:
- `pm2-clj-project`
- `reconstitute`

Default action:
- **explicit-exception** while active and structurally ambiguous
- later **normalize** when the correct long-term home is decided

### 3. Standalone source/deploy root pending placement
A real project repo at the workspace root that is actively used, but has not yet been assigned to `packages/*`, `services/*`, or one of the four org homes.

Examples:
- `mcp-social-publisher-live`
- `threat-radar-deploy`

Default action:
- **normalize** unless there is a strong reason to keep it at root temporarily
- may be **explicit-exception** during active transition

### 4. Planning bundle
A root-level area that primarily holds future design, staging, or next-step material rather than canonical runnable source.

Examples:
- `threat-radar-next-step`

Default action:
- **explicit-exception** while it is actively useful as a planning bundle
- later **retire** or fold the useful parts into canonical specs/repos

### 5. Foreign fork / vendor mirror
A fork, vendor checkout, or mirrored upstream repo that does not belong to the four-home model.

Examples:
- `bevy_replicon`
- `egregoria`
- `game_network`
- `ggrs`
- `lightyear`

Default action:
- **explicit-exception** if you still need the fork/mirror
- otherwise **retire**
- only **normalize** if you create a dedicated vendor/forks policy or area later

### 6. Active special worktree
A branch-specific or sprint-specific checkout that exists for focused work and is still referenced by active workflow surfaces.

Examples:
- `gates-pr35-hardening-main`

Default action:
- **explicit-exception** while the branch/sprint is live
- **retire** after merge/abandonment

### 7. Foreign-org exception
A repo kept under `orgs/<foreign>/*` because it reflects upstream identity or a fork/mirror relationship, not because it belongs to one of the four canonical homes.

Examples:
- `orgs/anomalyco/opencode`
- `orgs/openai/codex`
- `orgs/moofone/codex-ts-sdk`

Default action:
- **explicit-exception**
- reevaluate only if the repo becomes a canonical home for your own work rather than a foreign mirror/fork

### 8. Private-org exception
Private or access-limited work that does not cleanly fit the public four-home model.

Examples:
- `orgs/private/snorkel-ai`

Default action:
- **explicit-exception** until a clearer ownership/home policy exists

### 9. Aggregation / projection tree
A tree that contains generated, projected, staged, mirrored, or grouped project material rather than canonical project homes.

Examples:
- `projects/*`
- `workspaces/*`
- `vaults/*`

Default action:
- **explicit-exception** if the tree is intentionally part of the workflow
- otherwise **retire** or fold it into canonical homes

## Selection rules
When deciding an action, apply these rules in order:

1. If the path is just a compatibility alias into an allowed home, prefer `keep` or eventual alias retirement rather than panic-migration.
2. If the path is still the live source/deploy root for a real service, do not retire it before a canonical home is ready.
3. If the path is only referenced through receipts, fork-tax manifests, or `.gitmodules`, treat it as low-activity bookkeeping until stronger evidence appears.
4. If the path exists for a branch/sprint/worktree reason, time-box it and define its exit condition.
5. If the path is a foreign fork or vendor mirror, do not force it into the four-home model; give it explicit exception status instead.

## Reevaluation triggers
An outside-structure item should be reevaluated when:
- active references drop to zero or near-zero
- a canonical home is chosen
- a deployment path is formalized elsewhere
- a sprint/worktree merges or is abandoned
- a generated/projection tree becomes obsolete

## Relationship to the placement contract
This policy does not weaken the placement contract.
It operationalizes it.

The preferred homes remain:
- prototype -> `packages/*`
- operations -> `services/*`
- identity -> `orgs/{riatzukiza|octave-commons|open-hax|ussyverse}/*`

Everything outside that structure should be either:
- normalized,
- retired,
- or kept as an explicit, named exception.
