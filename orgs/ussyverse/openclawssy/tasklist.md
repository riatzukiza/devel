# Openclawssy Tasklist (Parallel-First, Collision-Safe)

Version: v0.1 (2026-02-15)
Source: `devplan.md`

## Mission for this tasklist
- Maximize parallel throughput across A0-A7.
- Minimize merge conflicts via strict ownership and contracts-first flow.
- Keep work shippable in small PR slices with clear dependency gates.

## Ground Rules (Do This Always)
- Single owner per folder boundary; no cross-folder edits without interface PR first.
- Contracts before implementation: shared interfaces must land in `docs/specs/CONTRACTS.md` first.
- Small PRs: target <= 500 net LOC and <= 1 primary concern per PR.
- Rebase daily on integration branch; resolve conflicts immediately.
- Every PR includes tests, security impact note, and acceptance checklist updates.

## Ownership Map (Collision Prevention)
- A0 Architect: `docs/specs/`, integration checklists, acceptance criteria.
- A1 Core Runner: `internal/agent/`, `internal/artifacts/`.
- A2 Tools/Policy: `internal/tools/`, `internal/policy/`, `internal/audit/`.
- A3 Sandbox: `internal/sandbox/`.
- A4 Scheduler: `internal/scheduler/`.
- A5 Channels: `internal/channels/`, CLI UX in `cmd/openclawssy/`.
- A6 Release/CI: `.github/`, `Makefile`, `docs/` release docs/scripts.
- A7 Security: `docs/security/`, abuse tests, hardening checks.

## Dependency Gates (What Must Exist Before Others Start)
1. Gate G0: Repo bootstrap + CI baseline + Make targets exist.
2. Gate G1: Contracts published (`CONTRACTS.md`, `ACCEPTANCE.md`, `CONFIG.md`).
3. Gate G2: Config loader + atomic persistence merged.
4. Gate G3: Core runner + tool registry + policy basics merged.
5. Gate G4: Sandbox gating + audit/redaction + scheduler integrated.
6. Gate G5: Channels + hardening + packaging complete.

## Parallel Execution Plan (Waves)

### Wave 0 (Day 0-1): Foundation
- [ ] A6: Initialize module, Makefile (`fmt/lint/test/build`), CI scaffold. (G0)
- [ ] A0: Draft `docs/specs/CONTRACTS.md` (tools, lifecycle, audit schema, scheduler schema, HTTP shapes). (G1)
- [ ] A0: Draft `docs/specs/ACCEPTANCE.md` and `docs/specs/CONFIG.md`. (G1)
- [ ] A7: Draft `docs/security/THREAT_MODEL.md` aligned to invariants. (parallel with A0/A6)

Parallel safety: A0/A7 stay in docs paths; A6 stays infra paths.

### Wave 1 (Day 1-4): Core Implementation in Parallel
- [ ] A2: Config loader validation + secure defaults + atomic writes + corruption recovery tests. (G2)
- [ ] A1: Run state machine + deterministic prompt assembly + run artifact bundle writer (mock model allowed). (needs G1)
- [ ] A2: Tool registry + policy checks (capabilities, workspace-only writes, path and symlink guards). (needs G1)
- [ ] A3: Sandbox interface + `none`/`local` modes + roadmap specs for additional providers. (needs G1)
- [ ] A4: Scheduler schema + persistence engine + clock/executor skeleton. (needs G1)
- [ ] A5: CLI command scaffolds (`init/ask/run/serve/cron/doctor`) with stubs bound to contracts. (needs G1)
- [ ] A7: Abuse test harness for prompt injection/path traversal/config mutation attempts. (needs G1)

Parallel safety: strict folder ownership; shared interfaces only via contracts PRs.

### Wave 2 (Day 4-7): Integration + Security Invariants
- [ ] A2+A7: Audit event pipeline + redaction rules + append-only JSONL tests.
- [ ] A3+A2: Enforce invariant: `shell.exec` disabled when sandbox inactive.
- [ ] A4+A2: Scheduler emits audit events and writes run artifacts.
- [ ] A5+A1: CLI `ask/run` wired to runner and artifact outputs.
- [ ] A5: HTTP API minimal endpoints with token auth and loopback default.
- [ ] A5: One chat connector (Discord or Telegram) with allowlist + rate limit.

Parallel safety: integration branches by pair only (`agent/pair/<scope>`), merged behind feature flags if needed.

### Wave 3 (Day 7-9): Hardening + Packaging + Docs
- [ ] A6: CI gates (lint/test/build + optional SAST), release workflow, version/changelog flow.
- [ ] A6+A0: Quickstart docs (install/init/first run/first schedule in <10 min target).
- [ ] A7: Security deployment guide for small-box default posture.
- [ ] A0: Final acceptance sweep and DoD verification matrix.

Parallel safety: docs and pipeline tasks mostly isolated; no core runtime churn unless blocker.

## Agent Backlog by Role (Ready Queue)

### A0 Architect
- [ ] Publish contracts package v0.1.
- [ ] Publish acceptance test matrix by phase.
- [ ] Enforce interface-change workflow (contract-first).

### A1 Core Runner
- [ ] Implement run lifecycle states and transitions.
- [ ] Deterministic prompt file order and truncation policy.
- [ ] Persist run bundles under `runs/<runId>/`.

### A2 Tools/Policy
- [ ] Capability model enforcement and denial reasons.
- [ ] Path canonicalization + symlink escape blocking.
- [ ] Core tools (`fs.read`, `fs.list`, `fs.write`, `fs.edit`, `code.search`).
- [ ] Audit emission hooks for all tool calls.

### A3 Sandbox
- [ ] Define sandbox provider interface and lifecycle.
- [ ] Implement `none` and `local` modes.
- [ ] Add provider roadmap design notes for `podman`, `gvisor`, `nsjail`, and `firecracker`.
- [ ] Workspace confinement checks.

### A4 Scheduler
- [ ] Job CRUD + persistence + restart recovery.
- [ ] Trigger engine and missed-job behavior definition.
- [ ] Scheduler-run artifact/audit integration.

### A5 Channels
- [ ] CLI UX complete and stable commands.
- [ ] Local HTTP API with token auth + loopback binding default.
- [ ] Chat connector with allowlist and rate limiting.

### A6 Release/CI
- [ ] Keep build/test/lint green on main.
- [ ] Release packaging + smoke checks.
- [ ] Docs and contributor workflow polish.

### A7 Security
- [ ] Abuse test suite for all invariants.
- [ ] Redaction validation tests.
- [ ] Security review checklist per PR.

## Merge and Sync Cadence (Efficiency Loop)
- Twice daily integration windows: 11:00 and 17:00 local.
- Pre-window rule: each agent rebases and runs local test subset.
- Integrator (A0 or A6) merges only green PRs with ownership compliance.
- Post-window: update `HANDOFF.md` with blockers, changed contracts, next-ready tasks.

## Branching and PR Template
- Branch format: `agent/<role>/<feature>`.
- PR must include:
  - Scope and owned paths touched.
  - Contract impact (`none` or link to contract PR).
  - Security impact (`yes/no` + details).
  - Tests added/updated.
  - Acceptance items checked.

## Blocker Protocol (No Idle Agents)
- If blocked by contract: switch to tests/docs for owned module.
- If blocked by integration conflict: open minimal interface PR and continue behind feature flag.
- If blocked by missing dependency: claim next task in same wave from ready queue.

## Done Signals (v0.1)
- [ ] CLI commands functional: `init`, `run`, `ask`, `serve`, `cron`, `doctor`.
- [ ] Tool system enforces policy and logs audit events.
- [ ] `shell.exec` is sandbox-gated by invariant.
- [ ] Scheduler persists across restart and triggers runs.
- [ ] At least one additional channel works end-to-end.
- [ ] Security abuse tests pass for defined threat model.
- [ ] Quickstart validated under 10-minute first run target.
