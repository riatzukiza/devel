# Hormuz Risk Clock v4 Methodology

## Why v4 exists
The early clocks were good at showing **temporal relationships**, but they saturated once many projected events either happened or became active conditions. v4 keeps the original clock intuition while adding a proper **signal ingestion layer**.

## Core model
The system is explicitly layered:

```text
raw signals -> normalized state variables -> branch ranges/confidence -> rendered clock
```

### 1. Raw signals
Signals are timestamped observations from public or analyst-accessible sources.
Examples:
- UKMTO / JMIC threat level and incident summaries
- MARAD MSCI advisories
- AIS / tanker transit counts
- war-risk insurance / exclusion-zone updates
- GNSS / AIS / comms disruption notes
- oil output and export interruptions
- strategic reserve preparation / release notices

As of the 19 Mar 2026 refresh, the bundle also treats the following as explicit signal classes:
- `insurance_availability` — cover capacity plus cost, not just a binary yes/no
- `reopening_pressure` — public coalition / escort planning that could reopen protected transit lanes
- `regional_escalation` — conflict spreading into Gulf energy infrastructure or adjacent civilian targets

Each signal should include:
- `id`
- `timestamp_utc`
- `source`
- `category`
- `value`
- `confidence`
- `direction` (`stabilizing`, `destabilizing`, `neutral`)
- optional `notes`

### 2. State variables
Signals update six state variables:
- `transit_flow`
- `attack_tempo`
- `insurance_availability`
- `navigation_integrity`
- `bypass_capacity`
- `asia_buffer_stress`

Each state is scored on a 0–4 scale:
- 0 = normal
- 1 = stressed
- 2 = degraded
- 3 = impaired
- 4 = broken

v4 treats these as *current conditions*, not future events.

### 3. Branch scenarios
The model tracks three branch scenarios:
- `reopening`
- `effective_closure`
- `wider_escalation`

These are not certainties. They are working estimates derived from state severity, trend, and explicit modifier signals.

Each branch now emits:
- `center` — the midpoint of the current heuristic scenario share
- `range.low` / `range.high` — a plausible interval around that midpoint
- `confidence` — confidence in the branch estimate itself, not certainty that the scenario will happen

#### Branch model (19 Mar 2026 evolution)
v4 now supports an additive branch model:

```text
state pressure + explicit modifiers -> scenario midpoint + uncertainty band
```

The default bundle uses `weighted-state-ranges-v1`:
- severe `transit_flow`, `attack_tempo`, `insurance_availability`, and `navigation_integrity` push toward `effective_closure`
- `regional_escalation` modifiers push toward `wider_escalation`
- `reopening_pressure` modifiers can raise `reopening`, but only as a model choice layered on top of observed state pressure

The midpoint remains a heuristic scenario share. The range is intentionally wider than a pure evidence-confidence calculation because the model itself is also uncertain.

Ranges overlap by design. They are uncertainty bands around each branch's current share, not a claim that the branches partition neatly into calibrated probabilities.

This keeps branch outputs explicit, editable, and reversible while reducing false precision.

### 4. Temporal structure
v4 uses **three horizons**:
- **30d** — immediate shock / intervention boundary
- **90d** — soft deadline / cascade window
- **450d** — hard ceiling / structural exhaustion thought experiment

The 90d horizon is useful because many importers and refineries live on weeks-to-months buffers. The 450d horizon is a *global-average depletion thought experiment*, not a forecast.

## Render semantics
### Clock hands
- **Second hand**: confirmed present; anchored only to observed elapsed time since T0
- **Minute hand**: soft deadline / coordination horizon
- **Hour hand**: practical intervention boundary

### Outer wedges
Outer wedges visualize state pressure. They are designed to update frequently and solve the “empty middle” problem.

### Mid-ring arcs
Mid-ring arcs show **buffer-burn windows**:
- shipping pipeline lag
- refinery adjustment lag
- SPR / reserve decision window
- shortage cascade window

### Separate structural bar
The 450d bar is split out because it represents a different question: *How long could a reduced-flow world continue if average loss were ~20%?*

## Rewind logic
The clock must be able to move backward.
Examples of rewind triggers:
- no successful attacks for 72h+
- broad war-risk cover returns
- GNSS/AIS disruption materially drops
- tanker transits recover for several days
- SPR releases and import stabilization reduce downstream stress

## Current extraction posture
Official pages remain preferred, but the practical bundle must survive source blocking and content drift.

Current bundle strategy:
- combine IEA's topic page with the 11 Mar 2026 emergency-release press note
- use accessible JMIC PDFs when MARAD / UKMTO HTML endpoints block scraping
- treat media reporting on insurance, escort planning, and Gulf energy-site attacks as explicit modifier inputs rather than hidden analyst intuition

## Insurance nuance
`insurance_availability` should not jump straight from "available" to "broken."

Examples:
- cover withdrawn / unobtainable -> score 4
- cover technically available but repriced to ~1%+ of hull value, or surging >10x -> score 3
- cover available with high but not extreme repricing -> score 2

This preserves reversibility if cover returns before physical transit fully normalises.

## Confidence and evolution
This model should evolve.
Recommended additions over time:
- trend arrows for each state variable
- backtesting / calibration of branch ranges against later outcomes
- source adapters for additional analysts / institutions
- separate LNG overlay
- importer-specific mini-clocks (Japan, India, Pakistan, etc.)

## Current assumptions in this bundle
- T0 = 28 Feb 2026 00:00 UTC
- main dial = 180 days
- second hand = elapsed days since T0
- minute hand = 90d
- hour hand = 30d

These are configuration defaults, not sacred constants.
