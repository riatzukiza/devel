# Event Schema Spec

## Purpose

Define the minimal event vocabulary a future daimoi implementation should emit so the system stays inspectable.

## Why event schemas matter here

The original corpus repeatedly points toward:
- explicit ownership
- explicit collision semantics
- observer bands and metrics
- explainable runtime state

A silent daimoi engine would betray the design.

## Core event families

### Emission
```json
{
  "kind": "daimoi.emit",
  "daimon_id": "...",
  "owner_presence_id": "...",
  "profile_id": "daimo:core",
  "intent_units": 10,
  "timestamp": "..."
}
```

### Motion
```json
{
  "kind": "daimoi.move",
  "daimon_id": "...",
  "from": {"x": 0.1, "y": 0.2},
  "to": {"x": 0.14, "y": 0.27},
  "speed": 0.09,
  "field_sample": {"fx": 0.3, "fy": -0.1},
  "timestamp": "..."
}
```

### Collision
```json
{
  "kind": "daimoi.collide",
  "left_id": "...",
  "right_id": "...",
  "collision_type": "deflect|absorb|exchange",
  "semantic_affinity": 0.62,
  "impulse": 0.18,
  "timestamp": "..."
}
```

### Ownership transfer
```json
{
  "kind": "daimoi.owner_handoff",
  "daimon_id": "...",
  "from_owner": "...",
  "to_owner": "...",
  "reason": "explicit-contract",
  "timestamp": "..."
}
```

### Observer metrics
```json
{
  "kind": "observer.sample",
  "population": 128,
  "lambda": 3.4,
  "ell": 0.54,
  "N_space": 0.22,
  "N_motion": 0.11,
  "S_alignment": 0.74,
  "SNR": 0.56,
  "band": "normal",
  "timestamp": "..."
}
```

### Band transitions
```json
{
  "kind": "observer.band_change",
  "from": "normal",
  "to": "noisy",
  "cause": "alignment-drop",
  "timestamp": "..."
}
```

## Design rules

1. every important state change gets a typed event
2. events should be append-only
3. ownership must never be implicit
4. observer transitions must be reconstructible from samples
5. event schemas should version explicitly when changed

## Relationship to adjacent repos

- `graph-runtime` can consume these as part of substrate explanation
- `simulacron` can treat them as cast-visible signals
- UI layers can render motion and observer changes without scraping hidden state
