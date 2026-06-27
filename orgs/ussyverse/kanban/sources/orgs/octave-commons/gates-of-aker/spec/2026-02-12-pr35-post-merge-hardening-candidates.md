---
title: "PR #35 Post-Merge Hardening Candidates"
status: draft
owner: riatzukiza
created_at: 2026-02-12
updated_at: 2026-02-12
tags: [pr-35, follow-up, hardening, reliability]
related_pr:
  repo: octave-commons/gates-of-aker
  number: 35
  branch: "device/stealth"
process_ref: "docs/reference/process.md"
---

## Objective
Capture non-blocking reliability and CI/workflow consistency improvements discovered during PR #35 review closure.

This is explicitly follow-up work: do not expand scope or delay PR #35 merge readiness; implement as small post-merge slices.

## Candidate Items
1. `backend/src/fantasia/server.clj`
   - Improve `assign_job` agent existence validation against projected agent collection semantics.
   - Reason: avoid potential index-membership mismatch on vector-backed projections.
2. `backend/src/fantasia/server.clj`
   - Standardize websocket error responses for operation-level exceptions.
   - Reason: current top-level logging can hide actionable failures from UI clients.
3. `backend/src/fantasia/sim/spatial_facets.clj`
   - Harden embedding-line parsing with row-level guard + skip/report invalid rows.
   - Reason: malformed row should not abort full embedding load.
4. `.github/workflows/*.yml`
   - Align lint failure policy across workflows (avoid masked failures / inconsistent exit codes).
   - Reason: PR #35 closure loop observed workflow policy drift and failing checks.
5. `.github/workflows/*.yml`
   - Normalize check naming and required-check mapping (avoid duplicate/near-duplicate check names like `Backend` vs `backend`).
   - Reason: inconsistent check names makes branch protection and "green" status harder to reason about.

## Priority
- P1: workflow lint policy + check naming normalization (CI consistency).
- P2: websocket error response standardization and assign_job validation semantics.
- P3: embedding row-level parse resilience.

## Acceptance Checks
- Each follow-up slice is <=5 LoE and independently mergeable.
- Modified backend files pass `cd backend && clojure -X:test`.
- Modified workflow files are lint-consistent and do not mask failures.
- Check names remain stable across workflows so branch protection can require the intended checks.
- Any user-visible behavior change is reflected in PR notes and linked to this spec.

## FSM Transition Notes (`docs/reference/process.md`)
- While PR #35 closure remains active: keep this spec as planning-only (no scope expansion into the current PR closure loop).
- After PR #35 merges (or is otherwise closed): model each candidate as its own task starting in `Incoming`.
- Preferred follow-up flow per FSM: `Incoming -> Accepted -> Breakdown -> Ready -> Todo -> In Progress -> In Review -> Testing -> Document -> Done`.
- If any item sizes above LoE 5 during Breakdown: split before `Breakdown -> Ready`.
