---
uuid: ecd9b981-2a1a-4a8f-9ac1-784238099ac8
title: "Spec: Codex Release Monitor Workflow"
slug: codex-release-monitor
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.407448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Spec: Codex Release Monitor Workflow

## References
- `.github/workflows/mdlint-agent.yml:1-85` – baseline for repo-level Actions job structure and commit automation.
- `orgs/open-hax/codex/.github/workflows/review-response.yml:1-110` – shows how to install the OpenCode CLI and execute `opencode run` with context files inside CI.
- GitHub Actions docs ("Events that trigger workflows") – release events only observe the current repository; monitoring upstream repos requires polling or `repository_dispatch`. See <https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows>.
- `rg -n "release watch" spec` (run 2025-11-16) returned no existing specs, confirming this is net-new work.

## Existing Issues / PRs
- No tracked issues or PRs mention an upstream release monitor for `openai/codex` or `sst/opencode`.

## Requirements
1. Detect when either `sst/opencode` or `openai/codex` publishes a new npm/GitHub release (tags `v*` and `rust-v*` respectively).
2. Clone the corresponding upstream repo, compute `git diff <last-reviewed-tag>..<latest-tag>`, and retain both the raw diff and a `--stat` summary.
3. Feed the diff plus release metadata into an OpenCode agent that performs a targeted search over the latest worktree for changes that can impact the `open-hax/codex` plugin (focus on API/CLI surface, auth flows, plugin hooks).
4. Store and update the "last successfully reviewed" version per upstream so the next run diffs against the right tag.
5. When the agent reports potential breaking changes, automatically open GitHub issues in this repo summarizing each finding with reproducible evidence and recommended mitigations.
6. Provide manual + scheduled triggers. If GitHub cannot react to upstream releases directly, run on a daily cron and skip if nothing new is published.

## Definition of Done
- Scheduled/workflow-dispatch Action lives in `.github/workflows/` and runs without manual setup, installing pnpm dependencies, the OpenCode CLI, and the monitoring script.
- New monitoring script plus configuration persist in the repo, including per-upstream state (JSON) and directory scaffolding for release artifacts.
- `.opencode/agent/release-impact.md` (or equivalent) defines deterministic output schema so CI can parse agent conclusions.
- Workflow successfully commits updated state (last reviewed version) and creates GitHub issues whenever the agent declares breaking change risk.
- Documentation/spec updated (this file) plus README snippet (if needed) describing how to operate/configure the workflow.

## Plan
### Phase 1 – Tooling & Agent Definition
- Create `.opencode/agent/release-impact.md` describing objectives, investigation rules, and machine-readable JSON output (impact level, issues array, evidence list).
- Add `.github/release-watch/state.json` seeded with null placeholders for both upstreams.

### Phase 2 – Monitoring Script
- Implement `scripts/codex-release-monitor.mjs` using `@octokit/rest` + `git` commands to:
  - Pull latest release metadata for `sst/opencode` and `openai/codex`.
  - Clone/fetch tags into a temp dir, capture `git diff` + `--stat` + `git log` between prior reviewed tag and new tag.
  - Generate context/diff files, invoke `opencode run --agent release-impact ...`, parse strict JSON output, and open issues via Octokit when needed.
  - Update state JSON once analysis succeeds.

### Phase 3 – GitHub Workflow & Documentation
- Author `.github/workflows/codex-release-watch.yml` with `schedule` + `workflow_dispatch`, Node/pnpm/opencode setup, script execution, and auto-commit of updated state.
- Document environment variables/secrets, cron behavior, and manual operation (README or docs entry referencing this spec).
- Verify workflow via dry-run (`workflow_dispatch` with noop) or local script invocation.

## Implementation Notes (2025-11-16)
- `.opencode/agent/release-impact.md:1-42` formalizes the JSON-only schema and investigative priorities (OAuth/CLI hooks) for the OpenCode agent invoked by CI.
- `.github/release-watch/state.json:1-8` tracks the most recent reviewed tag per upstream so diffs always start from the last successful analysis.
- `scripts/codex-release-monitor.mjs:1-392` orchestrates release polling (via Octokit), shallow clones, diff/context generation, OpenCode execution, JSON parsing, issue creation, and state persistence.
- `.github/workflows/codex-release-watch.yml:1-64` schedules the automation daily + on-demand, installs pnpm/opencode, runs the monitor script, and commits state deltas.
- `README.md:191-214` now documents the release monitor expectations, configuration, and supporting files so maintainers know how to operate/adjust it.
