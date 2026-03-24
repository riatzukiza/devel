# GitHub org submodule sweep + triage (2026-03-21)

## Goal
Sweep all tracked GitHub-backed submodules under `orgs/octave-commons`, `orgs/open-hax`, and `orgs/riatzukiza` for open issues and pull requests, then begin triage with a reproducible local snapshot and a prioritized action list.

## Scope
- Discover tracked submodules from `.gitmodules`.
- Restrict to the three requested orgs.
- Ignore non-GitHub or local `file://` remotes.
- De-duplicate repeated remote targets referenced by multiple submodule paths.
- Collect open issue and PR metadata from GitHub.
- Produce a local report with counts, notable hotspots, and first-pass triage buckets.

## Repo-local observations
- `gh auth status` is healthy for account `riatzukiza` with `repo` scope available.
- `.gitmodules` currently exposes 33 targeted submodule paths across the requested orgs.
- At least two targeted paths currently point at local `file://` remotes rather than GitHub and should be excluded from a GitHub sweep.
- `orgs/open-hax/plugins/codex` and `orgs/open-hax/codex` point at the same GitHub repository and should be treated as one remote for triage.
- The workspace already has unrelated dirty changes in `specs/drafts/outside-structure-manifest-2026-03-21.md` and `specs/drafts/radar-deployment-declutter-formalization-2026-03-21.md`; this task should avoid disturbing them.

## Open questions
- Should this first pass only classify and prioritize, or also mutate GitHub state (labels/comments/closures)? Assumption for now: classify locally first and avoid remote mutation until a focused follow-up pass.

## Risks
- Some repositories may be archived, inaccessible, or otherwise return incomplete metadata.
- A broad projection of every thread body/comment could generate noisy artifacts; start with metadata, then deepen only for top-priority candidates.
- Without agreed triage policy, “begin triage” can sprawl into issue gardening; keep this pass focused on grouping and ranking.

## Phases
### Phase 1: Discovery
- Enumerate targeted submodule remotes from `.gitmodules`.
- Filter to GitHub-backed remotes and de-duplicate owner/repo targets.

### Phase 2: Sweep
- Query open issues and open PRs for each unique remote.
- Capture a machine-readable snapshot for repeatable reporting.

### Phase 3: First-pass triage
- Rank repos by open work volume.
- Bucket PRs and issues by likely next action (review, merge, stale, needs repro, docs/admin, etc.).
- Pull deeper detail for the highest-signal items only.

### Phase 4: Report
- Write a markdown report with counts, exclusions, and recommended next actions.
- Record verification commands and outcomes.

## Implementation status
- ✅ Phase 1 complete: `.gitmodules` was parsed, targeted org paths were enumerated, local-file remotes were excluded, and duplicate GitHub targets were collapsed.
- ✅ Phase 2 complete: open issue/PR metadata was captured into `docs/reports/github-triage/data/org-submodule-sweep-2026-03-21.json`.
- ✅ Phase 3 complete: first-pass triage buckets were derived for stale PR debt, blocked PRs, mirror-inflated issue queues, and CodeRabbit issue swarms.
- ✅ Phase 4 complete: markdown report written to `docs/reports/github-triage/org-submodule-sweep-2026-03-21.md` with recommended next actions.

## Definition of done
- A local snapshot exists for the requested org submodule remotes.
- A markdown report summarizes open issues/PRs and first-pass triage buckets.
- The report clearly identifies excluded non-GitHub or duplicate remotes.
- At least a handful of highest-signal issues/PRs have deeper notes to seed the next triage pass.
