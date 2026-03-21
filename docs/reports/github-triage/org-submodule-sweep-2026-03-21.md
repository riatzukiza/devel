# GitHub org submodule sweep + first-pass triage (2026-03-21)

## Scope
Swept tracked submodule remotes under:
- `orgs/octave-commons/**`
- `orgs/open-hax/**`
- `orgs/riatzukiza/**`

Source of truth for repo discovery: `.gitmodules`

Machine-readable snapshot:
- `docs/reports/github-triage/data/org-submodule-sweep-2026-03-21.json`

## Coverage summary
| Surface | Count | Notes |
|---|---:|---|
| Targeted submodule paths | 33 | Paths under the three requested org prefixes in `.gitmodules` |
| Excluded local-file remotes | 2 | `orgs/octave-commons/mythloom`, `orgs/riatzukiza/hormuz-clock-mcp` |
| Unique GitHub repos swept | 30 | De-duplicated by `owner/repo` |
| Raw open issues | 235 | Includes mirrored repo pairs |
| Raw open PRs | 49 | Includes mirrored repo pairs |
| Effective unique issue surfaces | 153 | Collapsing identical `promethean` + `openhax` mirrors |
| Effective unique PR surfaces | 45 | Collapsing identical `promethean` + `openhax` mirrors |

## Exclusions and oddities
- `orgs/open-hax/codex` and `orgs/open-hax/plugins/codex` both target `open-hax/codex`; triaged once.
- `octave-commons/promethean` and `riatzukiza/promethean` currently expose the same open-issue and open-PR sets.
- `open-hax/openhax` and `riatzukiza/openhax` currently expose the same open-issue and open-PR sets.
- `octave-commons/lineara_conversation_export` remote is configured in `.gitmodules`, but GitHub did not resolve the repository during the sweep.
- `riatzukiza/TANF-app` and `riatzukiza/agent-shell` have issues disabled, so issue count `0` there means “disabled”, not “clean”.

## Repo hotspots
| Repo | Issues | PRs | Triage read |
|---|---:|---:|---|
| `octave-commons/promethean` | 81 | 2 | Large mixed backlog; inflated by Kanban/projector artifacts and mirrored into `riatzukiza/promethean` |
| `riatzukiza/promethean` | 81 | 2 | Same surface as `octave-commons/promethean`; treat as one backlog for planning |
| `open-hax/proxx` | 67 | 2 | Nearly all issues are unlabeled CodeRabbit follow-ups; good candidate for batch clustering |
| `riatzukiza/TANF-app` | 0* | 21 | PR backlog dominated by ancient Dependabot updates; issues are disabled |
| `riatzukiza/riatzukiza.github.io` | 0 | 6 | Mostly stale personal PR backlog; mixture of clean and draft |
| `open-hax/codex` | 4 | 0 | Small human-scale issue queue with one real user bug report |
| `open-hax/openhax` | 1 | 2 | Small mirrored backlog, but both PRs currently failing coverage |
| `riatzukiza/openhax` | 1 | 2 | Same surface as `open-hax/openhax`; treat as one backlog |

## PR triage buckets

### 1. Immediate attention: conflicts or failing checks
These are the highest-signal PRs because they are actively blocked.

- `octave-commons/promethean#1709` / `riatzukiza/promethean#1709` — `Device/stealth`
  - `mergeStateStatus=DIRTY`
  - failing checks: `validate`, `sync`, `build`
  - broad PR touching 100+ files including `.gitmodules`, receipts, and repo automation artifacts
  - triage action: decide whether this branch is still canonical; if yes, rebase + repair CI, otherwise close as superseded
- `octave-commons/promethean#1710` / `riatzukiza/promethean#1710` — `Conflicted/stealth - preserve nested submodule changes`
  - `mergeStateStatus=DIRTY`
  - older and idle for 46 days
  - triage action: likely superseded by newer branch work unless there is hidden submodule state worth rescuing
- `open-hax/openhax#3` / `riatzukiza/openhax#3` — `@openhax/kanban: local web UI (serve)`
  - `mergeStateStatus=UNSTABLE`
  - failing check: `coverage`
  - PR body is coherent and scoped, but the diff includes a lot of `.clj-kondo/.cache/**` noise
  - triage action: strip cache artifacts from the PR, rerun coverage, then re-evaluate mergeability
- `open-hax/openhax#2` / `riatzukiza/openhax#2` — `Sync device/stealth branch`
  - `mergeStateStatus=UNSTABLE`
  - failing check: `coverage`
  - triage action: likely fold into or close in favor of newer targeted work if the branch is no longer active
- `octave-commons/fork_tales#1` — `Feature/eta mu tts fix`
  - `mergeStateStatus=UNSTABLE`
  - failing check: `frontend-test`
  - triage action: reproduce the failing frontend test locally before deciding merge vs close
- `octave-commons/gates-of-aker#140` — `Π: snapshot 2026-03-21 — Fork Tales canonical path relocation`
  - `mergeStateStatus=DIRTY`
  - checks are green; only conflict resolution remains
  - triage action: rebase/merge if today’s relocation is still wanted

### 2. Probably ready once a human decides “merge or close”
These are clean and non-draft, but many are stale enough that intent may have changed.

Fresh/likely-relevant:
- `octave-commons/shibboleth#1` — fresh Π snapshot, clean
- `open-hax/voxx#1` — fresh Π snapshot, clean
- `riatzukiza/TANF-app#24` — recent Dependabot `pyasn1` bump, clean
- `riatzukiza/TANF-app#25` — recent Dependabot `flatted` bump, clean

Stale-clean backlog that likely needs a binary decision rather than more waiting:
- `open-hax/clients#1`
- `open-hax/workbench#1`
- `octave-commons/pantheon#1`
- `riatzukiza/agent-shell#1`
- `riatzukiza/book-of-shadows#1`
- `riatzukiza/dotfiles#2`
- `riatzukiza/goblin-lessons#1`
- `riatzukiza/stt#1`
- `riatzukiza/riatzukiza.github.io#27`
- `riatzukiza/riatzukiza.github.io#32`

### 3. Draft / personal backlog
- `riatzukiza/riatzukiza.github.io#29`
- `riatzukiza/riatzukiza.github.io#30`
- `riatzukiza/riatzukiza.github.io#31`

These are not urgent engineering blockers; they mostly need an owner decision on whether to keep incubating or close.

### 4. Close-or-batch candidates: ancient Dependabot swarm
`riatzukiza/TANF-app` has **19** Dependabot PRs opened in 2022–2023, all idle for 1169–1527 days and all still `mergeStateStatus=UNKNOWN`.

Representative examples:
- `#4` `Bump pa11y-ci...`
- `#7` `Bump react-router-dom...`
- `#10` `Bump node-sass...`
- `#22` `Bump express...`
- `#23` `Bump json5...`

Triage read: these are almost certainly stale enough to close in bulk unless the repo is about to be revived. Keep `#24` and `#25` separate because they are fresh and security-adjacent.

## Issue triage buckets

### 1. Batch-cluster first: `open-hax/proxx` CodeRabbit issue swarm
`open-hax/proxx` has **67 open issues**, all unlabeled, all opened by `app/coderabbitai`, concentrated on three dates: `2026-03-12`, `2026-03-14`, and `2026-03-20`.

This is not a normal backlog; it is a review-comment projection backlog.

High-signal items worth preserving even if the rest get batched:
- `#65` `[Critical] Keep revealSecrets ephemeral — do not persist in localStorage`
  - risk: plaintext credential tokens may auto-reveal on reload if the UI remembers the toggle
  - source: CodeRabbit review on PR `#59`
- `#45` `[Critical] src/lib/factory-auth.ts: Add a timeout to the WorkOS refresh call`
  - risk: hung WorkOS refresh can pin request-driven auth paths indefinitely
  - source: CodeRabbit review on PR `#41`
- `#26` `CRITICAL: refreshExpiredToken can throw and abort entire fallback loop`
- `#18` `maskSecret leaks full value for short secrets`
- `#13` `Fix potential data loss during concurrent flush() calls`

Triage action:
1. Cluster the 67 issues by source PR/date.
2. Preserve the critical/security/data-loss subset as standalone issues.
3. Close or consolidate low-severity review nits into a smaller set of tracking epics.

### 2. Mirror-inflated backlog: `promethean`
`octave-commons/promethean` and `riatzukiza/promethean` each show **81 open issues**, but the sets are identical.

Backlog composition in each mirror:
- `34` labeled `kanban-sync`
- `25` labeled `automated-sync`
- `21` labeled `project-generated`
- `27` created by `app/coderabbitai`
- `32` unlabeled

Triage read: the raw count overstates active engineering debt. A large chunk is automation-generated board/project traffic plus review-comment fallout.

Highest-signal technical issues from the mirrored set:
- `#1144` `Security: writeFileContent allows sandbox escape via symlinks` (`bug`, `security`, `prio:high`)
- `#1143` `Security: treeDirectory vulnerable to symlink escapes outside sandbox`
- `#850` `Critical bug in semaphore implementation breaks mutual exclusion for runJSFunction`
- `#905` `SSE endpoint vulnerable to write-after-end crashes in agent streaming`

Triage action:
1. Choose one canonical repo for active issue handling.
2. Separate board/project projection artifacts from engineering defects.
3. Put the security/concurrency issues at the front of the real engineering queue.

### 3. Small real queue: `open-hax/codex`
Only 4 open issues, so this repo is already in human-scale territory.

Most actionable item:
- `#82` `[BUG] Failure to get openhax/codex error ... Failed to fetch OpenCode codex.txt from GitHub`
  - real external bug report from `TheAllSeeingPie`
  - user says the plugin works but emits a noisy GitHub fetch error
  - triage action: reproduce against plugin `0.4.4` + opencode `1.1.51`, then either fix the fetch path or downgrade the message to a warning if non-fatal

Other open items are feature-ish rather than urgent:
- `#6` richer metrics + request inspection commands (`blocked`)
- `#40` model stats dashboard server
- `#67` auto-update + npm latest workflow

### 4. Tiny mirrored queue: `openhax`
`open-hax/openhax` and `riatzukiza/openhax` each have 1 identical open issue: `#1 testing`.

Triage action: close unless it is intentionally being used as a placeholder.

## First-pass triage decisions seeded by this sweep
1. **Treat mirrored repos as one queue during planning.**
   - `promethean` mirror pair
   - `openhax` mirror pair
2. **Handle stale PR debt separately from active engineering work.**
   - especially `riatzukiza/TANF-app` and `riatzukiza/riatzukiza.github.io`
3. **Handle CodeRabbit issue swarms as clustering problems, not as 67 independent tasks.**
   - especially `open-hax/proxx`
4. **Escalate security / concurrency / secret-handling findings ahead of board/project sync noise.**
   - `promethean#1144/#1143/#850/#905`
   - `proxx#65/#45/#26/#18/#13`

## Recommended next pass
If continuing triage immediately, the highest-yield order is:
1. `riatzukiza/TANF-app`: bulk-close or supersede the 19 ancient Dependabot PRs.
2. `open-hax/proxx`: cluster the 67 CodeRabbit issues into a short actionable set.
3. `open-hax/openhax`: repair or close PR `#3`, then decide whether PR `#2` is superseded.
4. `promethean` mirror pair: choose the canonical repo and resolve whether `#1709/#1710` live or die.
5. `open-hax/codex`: reproduce bug `#82`.

## Verification
Sweep was performed with authenticated GitHub CLI queries against each unique `owner/repo` discovered in `.gitmodules`, capturing open issue and PR metadata into the JSON snapshot referenced above.
