# GitHub label application report (2026-03-21)

## Scope
Applied the new kanban-managed label plan from `packages/kanban` to a first live subset of the refined backlog.

Explicit exclusion:
- `riatzukiza/TANF-app` was not touched.

## Tooling used
- CLI source: `packages/kanban/src/cli.ts`
- Commands added this turn:
  - `github apply`
  - `fsm show`

## Live application passes

### 1. `open-hax/proxx` — breakdown issues only
Source artifact:
- `docs/reports/github-triage/data/proxx-breakdown-label-apply-2026-03-21.json`

Result:
- `33` issues updated
- new managed labels ensured:
  - `artifact:issue`
  - `kanban`
  - `priority:P0`
  - `priority:P1`
  - `priority:P2`
  - `risk:correctness`
  - `risk:security`
  - `source:coderabbit`
  - `state:breakdown`
  - `triage:cluster-candidate`

Representative labeled issues:
- `open-hax/proxx#18` → `state:breakdown`, `priority:P0`, `risk:security`
- `open-hax/proxx#45` → `state:breakdown`, `priority:P1`, `risk:correctness`
- `open-hax/proxx#65` → `state:breakdown`, `priority:P0`, `risk:security`
- `open-hax/proxx#84` → `state:breakdown`, `priority:P2`

### 1b. `open-hax/proxx` — remaining incoming / accepted / in_review items
Source artifacts:
- `docs/reports/github-triage/data/proxx-remaining-label-dry-run-2026-03-21.json`
- `docs/reports/github-triage/data/proxx-remaining-label-apply-2026-03-21.json`

Result:
- `36` additional items updated
  - `33` incoming issues
  - `1` accepted issue
  - `2` in-review PRs
- additional managed labels ensured:
  - `artifact:pr`
  - `priority:P3`
  - `state:accepted`
  - `state:incoming`
  - `state:in_review`

Representative state mapping:
- `open-hax/proxx#10` → `state:incoming`, `priority:P3`
- `open-hax/proxx#25` → `state:accepted`, `priority:P2`, `bug`
- `open-hax/proxx#56` → `state:incoming`, `priority:P2`
- `open-hax/proxx#15` → `state:in_review`, `artifact:pr`
- `open-hax/proxx#60` → `state:in_review`, `artifact:pr`

After this second pass, the refined `open-hax/proxx` queue is fully labeled across its currently recommended FSM states.

### 2. `open-hax/openhax` — all refined items
Source artifact:
- `docs/reports/github-triage/data/openhax-label-apply-2026-03-21.json`

Result:
- `3` items updated
- PRs `#2` and `#3` labeled into blocked review state
- issue `#1` labeled as rejected placeholder

Representative state mapping:
- `open-hax/openhax#2` → `state:blocked`, `triage:blocked`, `checks:failing`
- `open-hax/openhax#3` → `state:blocked`, `triage:blocked`, `checks:failing`
- `open-hax/openhax#1` → `state:rejected`, `triage:placeholder`

### 3. `open-hax/codex` — all refined issues
Source artifact:
- `docs/reports/github-triage/data/codex-label-apply-2026-03-21.json`

Result:
- `4` issues updated
- state distribution applied:
  - `#82` → `state:accepted`
  - `#6` → `state:blocked`
  - `#40`, `#67` → `state:icebox`

## Label policy used
Managed namespaces applied by the new CLI:
- `kanban`
- `artifact:*`
- `state:*`
- `priority:*`
- `source:*`
- `triage:*`
- `risk:*`
- `checks:*`
- `merge:*`
- plus normalized GitHub-native `bug` / `enhancement`

Unrelated existing labels are preserved.

## Verification
- `pnpm --filter @openhax/kanban build`
- `pnpm --filter @openhax/kanban test`
- live label checks via `gh issue view ... --json labels`

## Not yet applied
The following remain local recommendations only for now:
- mirrored `promethean` queues
- non-OpenHax org repos outside the explicit live passes above
