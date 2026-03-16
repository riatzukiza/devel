# Hormuz Risk Clock v4 Methodology

## Why v4 exists
The early clocks were good at showing **temporal relationships**, but they saturated once many projected events either happened or became active conditions. v4 keeps the original clock intuition while adding a proper **signal ingestion layer**.

## Core model
The system is explicitly layered:

```text
raw signals -> normalized state variables -> branch priors -> rendered clock
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

### 3. Branch priors
The model tracks three branch priors:
- `reopening`
- `effective_closure`
- `wider_escalation`

These are not certainties. They are working estimates derived from state severity and trend.

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

## Confidence and evolution
This model should evolve.
Recommended additions over time:
- trend arrows for each state variable
- confidence intervals on branch priors
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
