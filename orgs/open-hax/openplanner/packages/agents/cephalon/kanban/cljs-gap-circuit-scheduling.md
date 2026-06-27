---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-cljs-gap-circuit-scheduling-md"
title: "CLJS Critical Gap — Circuit Scheduling"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.899Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-circuit-scheduling.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/cljs-gap-circuit-scheduling.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/cljs-gap-circuit-scheduling.md`

# CLJS Critical Gap — Circuit Scheduling

**Parent:** `cljs-ts-feature-parity-audit.md`
**Story Points:** 3
**Status:** done
**Priority:** critical

## Implementation

Created:
- `packages/cephalon-cljs/src/promethean/circuits/octave.cljs` — 8-circuit definitions with Promethean model
- `packages/cephalon-cljs/src/promethean/runtime/scheduler.cljs` — temporal scheduling with jitter and backoff

Circuits implemented:
- C1 — Aionian (Survival) — 45s
- C2 — Dionysian (Emotion) — 90s
- C3 — Apollonian (Cognition) — 180s
- C4 — Demetrian (Social) — 300s
- C5 — Sophian (Meaning) — 900s
- C6 — Promethean (Metaprogramming) — 1800s
- C7 — Christonic (Transpersonal) — 3600s
- C8 — Buddhaic (Non-dual) — 7200s

Scheduler features:
- Deterministic jitter based on hash
- Backoff on error (exponential, capped at 4x)
- Schedule/cancel/reschedule operations

## Problem

CLJS lacks the 8-circuit temporal scheduler. TS has:
- `circuits.ts` — 8 circuit definitions with personas, tools, intervals
- `runtime/temporal.ts` — scheduling with jitter and backoff
- Per-circuit tick scheduling with configurable intervals

CLJS has a single tick loop in `main.cljs` but no circuit abstraction.

## Goal

Implement circuit scheduling for CLJS matching the Promethean octave model.

## Scope

### In Scope
- Create `circuits/` namespace with circuit definitions
- Create `runtime/scheduler.cljs` with temporal scheduling
- Port 8-circuit config from TS
- Wire into main tick loop
- Jitter and backoff support

### Out of Scope
- Personality system extraction (Phase 1 of decomposition)
- Bot config registry (separate concern)

## Design

### Circuit Definition

```clojure
{:circuit/id "c1-survival"
 :circuit/label "Circuit I — Aionian (Uptime / Survival)"
 :circuit/index 1
 :circuit/loop-kind :control      ;; :llm or :control
 :circuit/priority-class :operational
 :circuit/interval-ms 45000
 :circuit/model "auto:cheapest"
 :circuit/reasoning-effort :low
 :circuit/attention-focus "homeostasis, rate limits, backlog pressure"
 :circuit/persona "Aionian homeostasis controller..."
 :circuit/system-prompt "..."
 :circuit/developer-prompt "..."
 :circuit/tool-permissions #{:field.observe :memory.lookup :memory.pin}
 :circuit/reflection-prompt "AIONIAN TICK: compute control signals..."}
```

### Octave Structure (Powers of 2)

```
2³ = 8 circuits (octave)
├── C1 — Survival (45s)   — Aionian
├── C2 — Emotion (90s)    — Dionysian
├── C3 — Cognition (180s) — Apollonian
├── C4 — Social (300s)    — Demetrian
├── C5 — Meaning (900s)   — Sophian
├── C6 — Metaprogramming (1800s) — Promethean
├── C7 — Transpersonal (3600s) — Christonic
└── C8 — Non-dual (7200s) — Buddhaic
```

### Scheduler Protocol

```clojure
(defprotocol CircuitScheduler
  (schedule-circuit [this circuit-id delay-ms]
    "Schedule a circuit tick after delay.")
  (cancel-circuit [this circuit-id]
    "Cancel pending tick for circuit.")
  (tick-circuit [this circuit-id]
    "Execute a circuit tick.")
  (get-next-due [this]
    "Get next circuit due for tick."))
```

### Integration with ECS

Each circuit becomes a session entity:

```clojure
(world/add-entity w circuit-id
  {:session/name circuit-id
   :session/circuit circuit-config
   :session/status :idle
   :session/queue []})
```

The scheduler publishes `:circuit.tick` events that get routed to circuit sessions.

## Tasks

- [ ] Create `circuits/core.cljs` with circuit definitions
- [ ] Create `circuits/octave.cljs` with 8-circuit config
- [ ] Create `runtime/scheduler.cljs` with temporal scheduling
- [ ] Implement jitter calculation (deterministic hash-based)
- [ ] Implement backoff on error
- [ ] Wire scheduler into `main.cljs` tick loop
- [ ] Emit `:circuit.tick` events on schedule
- [ ] Add tests

## Acceptance Criteria

- [ ] 8 circuits defined with Promethean octave structure
- [ ] Scheduler runs circuits at configured intervals
- [ ] Jitter prevents thundering herd on startup
- [ ] Backoff prevents tight error loops
- [ ] Tests pass

## Dependencies

- None (pure scheduling logic)

## Blocking

- Blocks full CLJS operational parity with TS
