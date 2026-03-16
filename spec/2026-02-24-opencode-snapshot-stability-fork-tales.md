---
uuid: 3f8f7dbe-5c4e-4f6a-a3e6-0a0673d1c4a4
title: "Spec: OpenCode Snapshot Stability for fork_tales"
slug: opencode-snapshot-stability-fork-tales
status: in_progress
priority: P1
tags: [opencode, snapshot, git, disk]
created_at: "2026-02-24T23:59:00Z"
estimates:
  complexity: medium
  scale: medium
  time_to_completion: 1-2 days
storyPoints: 5
---
# Spec: OpenCode Snapshot Stability for fork_tales

## Summary
- Stop runaway snapshot git state growth and lock contention in `vaults/fork_tales` usage.
- Make snapshot operations serialized per snapshot repo.
- Reduce disk churn by preventing overlapping git operations as the first containment step.

## Problem Statement
- Snapshot writes can occur at high frequency per session step, and current snapshot operations are not serialized.
- Concurrent `track`/`patch`/`diff`/`cleanup` calls can collide on the same git dir, leaving lock files and temporary pack artifacts.
- In active sessions, this manifests as gradual disk growth with occasional cleanup drops.

## Scope
- In scope: snapshot operation locking and cleanup lock-aware behavior.
- Out of scope for phase 1: GC policy redesign, retries/backoff policy, and cleanup heuristics.

## Phases
1. **Phase 1 - Locking and contention guardrails**
   - Add a per-repo snapshot lock in `packages/opencode/src/snapshot/index.ts`.
   - Route snapshot operations through the lock.
   - Make cleanup non-blocking when another snapshot operation already holds the lock.
2. **Phase 2 - Error handling hardening**
   - Centralize git invocation checks.
   - Treat empty or invalid snapshot hashes as failures.
   - Add bounded retries for lock-related git failures only.
3. **Phase 3 - Safer GC strategy**
   - Shift cleanup from unconditional heavy gc to threshold-driven maintenance.
   - Remove stale temp pack files under lock.
4. **Phase 4 - Stress and regression tests**
   - Add high-contention tests for concurrent snapshot calls and cleanup behavior.
5. **Phase 5 - Runtime verification in fork_tales**
   - Validate disk behavior and lock artifact absence in long-running sessions.

## Phase Status
- Phase 1: completed (per-repo lock, non-blocking cleanup gate, and contention tests passing)
- Phase 2: completed (checked/retried staging + write-tree, invalid hash rejection, safe fallback for patch/diff)
- Phase 3: completed (stale tmp_pack cleanup, threshold-driven gc/prune, snapshot gc auto-disable on init)
- Phase 4: completed (high-contention churn and cleanup storm regression tests)
- Phase 5: in_progress (runtime verify harness added; fork_tales long-run capture pending)

## Phase 1 Implementation Plan
- Introduce a minimal per-gitdir lock helper inside `snapshot/index.ts`.
- Wrap `track`, `patch`, `diff`, `diffFull`, `restore`, `revert`, and `cleanup` internals with that lock.
- Add non-blocking lock acquisition path for `cleanup`; if lock unavailable, skip and log a debug/info marker.
- Preserve existing functional behavior and return types.

## Files and Line References
- `orgs/anomalyco/opencode/packages/opencode/src/snapshot/index.ts`
- `orgs/anomalyco/opencode/packages/opencode/src/cli/cmd/debug/snapshot.ts`
- `orgs/anomalyco/opencode/packages/opencode/test/snapshot/snapshot.test.ts`

## Definition of Done (Phase 1)
- Snapshot operations are serialized per snapshot git directory.
- Cleanup does not wait behind active snapshot operations.
- Existing snapshot tests pass.
- Added tests confirm lock serialization and cleanup skip behavior.

## Risks
- Lock misuse could deadlock if not released on all code paths.
- Over-serialization could increase latency during very high throughput.

## Change Log
- 2026-02-24: Initial spec and phased plan drafted.
- 2026-02-24: Began Phase 1 by adding per-repo snapshot locking and a concurrent snapshot regression test.
- 2026-02-24: Completed Phase 1 by adding deterministic cleanup skip-under-contention test and validating snapshot test suite.
- 2026-02-24: Began Phase 2 by adding checked/retried snapshot staging and write-tree flow with invalid hash rejection.
- 2026-02-25: Completed Phase 2 with lock-contention retries for snapshot staging/tree writes and safe fallback behavior.
- 2026-02-25: Completed Phase 3 with stale tmp pack cleanup and threshold-driven snapshot gc/prune.
- 2026-02-25: Completed Phase 4 with high-contention snapshot churn and cleanup storm regression tests.
- 2026-02-25: Opened fork PR stack for Phases 2-4 (`riatzukiza/opencode#76`, `riatzukiza/opencode#77`, `riatzukiza/opencode#78`) and upstream Phase 1 PR (`anomalyco/opencode#15020`).
- 2026-02-25: Began Phase 5 by adding `opencode debug snapshot verify` to exercise contention churn and report lock/tmp-pack/count-objects health.
- 2026-02-25: Runtime verify exposed loose-object growth under heavy churn; updated snapshot cleanup to run `git repack -d -l` at high loose-object thresholds and retain prune fallback.
- 2026-02-25: Added regression coverage (`cleanup compacts loose objects when snapshot churn is high`) and re-ran snapshot suite successfully.
