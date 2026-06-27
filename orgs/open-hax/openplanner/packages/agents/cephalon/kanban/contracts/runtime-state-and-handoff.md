---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-contracts-runtime-state-and-handoff-md"
title: "Runtime State and Handoff Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.912Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/runtime-state-and-handoff.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/runtime-state-and-handoff.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/contracts/runtime-state-and-handoff.md`

# Runtime State and Handoff Contract

## Goal

Define what a Cephalon runtime must expose so that:
- operators can inspect it
- sibling strata can reason about it
- candidate runtimes can be promoted without blind trust

## Canonical runtime snapshot

A runtime snapshot should be JSON-serializable and include at least:

```json
{
  "schemaVersion": 1,
  "runtimeId": "uuid",
  "cephalonId": "duck",
  "package": "cephalon-ts",
  "status": "ready",
  "graphSummary": "...",
  "rssSummary": "...",
  "eidolonSummary": "...",
  "promptFieldSummary": "...",
  "controlPlane": {
    "healthScore": 1,
    "welcomeScore": 0.62,
    "pacingMultiplier": 1
  },
  "sessions": [],
  "checks": {
    "http": true,
    "discord": true,
    "toolCall": true
  }
}
```

## Current grounding

The strongest living source is the TS runtime inspector assembled in:
- `packages/cephalon-ts/src/app.ts`

That inspector already exposes rich state such as:
- graph summary
- RSS summary
- eidolon summary
- prompt-field summary
- mind queue summary
- compaction summary
- browser state
- channel trails
- session manifests

The control-plane shape is additionally grounded in:
- `packages/cephalon-ts/src/runtime/control-plane.ts`

## Required runtime snapshot fields

- `schemaVersion`
- `runtimeId`
- `cephalonId`
- `package`
- `status`
- `sessions`
- `checks`

## Recommended runtime snapshot fields

- `graphSummary`
- `rssSummary`
- `eidolonSummary`
- `promptFieldSummary`
- `controlPlane`
- `channelTrails`
- `browserState`

## Candidate handoff contract

The existing handoff doctrine in `packages/cephalon-ts/docs/runtime-handoff.md` should be treated as the seed of the family contract.

A candidate runtime must prove:
- HTTP/API liveness
- social login liveness for its active output surface
- at least one successful self-test tool call
- current session/circuit manifest availability
- current graph/field/runtime summary availability

## Canonical handshake shape

```json
{
  "schemaVersion": 1,
  "runtimeId": "candidate-uuid",
  "buildHash": "sha256:...",
  "cephalon": "duck",
  "package": "cephalon-ts",
  "status": "ready",
  "checks": {
    "http": true,
    "discord": true,
    "toolCall": true,
    "sessions": true,
    "graphWeaver": true
  },
  "snapshot": {
    "graphSummary": "...",
    "eidolonSummary": "...",
    "promptFieldSummary": "..."
  }
}
```

## Promotion rule

Promotion should only occur if:
- handshake passes
- candidate and incumbent agree on cephalon identity
- candidate exposes a session manifest compatible with its declared runtime role
- candidate can still emit or route output through the intended surface

If handshake fails:
- incumbent stays primary
- candidate is demoted or killed
- failure should be surfaced as an inspectable runtime artifact, not only a log line

## Mixed-runtime implication

This contract is intentionally not TS-only.
A future CLJS-led or mixed TS/CLJS runtime may satisfy the same handoff contract as long as it can expose the snapshot and handshake fields in canonical form.

## Sharp warning

A process restart is **not** a proof of successful inheritance.
A new runtime becomes legitimate only after it proves:
- identity
- liveness
- tool competence
- state visibility
- output-surface health
