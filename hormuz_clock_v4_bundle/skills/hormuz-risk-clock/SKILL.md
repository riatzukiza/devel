# Hormuz Risk Clock

Use this skill to maintain and evolve a public-signal early-warning clock for the Strait of Hormuz and related maritime-energy disruption.

## Purpose
This skill ingests public signals, updates state variables, revises branch priors, and renders a clock image plus a short markdown snapshot.

## When to use
Use this skill when asked to:
- regenerate the clock
- update the clock from new signals
- compare clock versions over time
- extract maritime / energy / insurance / AIS signals
- prepare a daily or scheduled crisis snapshot

## Inputs
Expected inputs can include any of:
- as-of timestamp
- updated raw signal files or URLs
- revised scoring thresholds
- revised branch prior logic
- requests for a new render or report

## Workflow
1. Load `config/model_config.yaml`
2. Pull raw signals with `scripts/extract_signals.py`
3. Merge / normalize into `data/signals.latest.json`
4. Run `scripts/update_state.py`
5. Render `assets/hormuz_risk_clock_v4.png` with `scripts/generate_v4_clock.py`
6. Optionally create a markdown brief via `scripts/render_snapshot_report.py`
7. If requested, compare versions with `scripts/animate_transition.py`

## State model
Primary state variables:
- transit_flow
- attack_tempo
- insurance_availability
- navigation_integrity
- bypass_capacity
- asia_buffer_stress

Each state is scored 0–4 and may carry:
- score
- trend
- confidence
- notes

## Output expectations
When updating the clock:
- report which files changed
- explain why the update is safe
- say how to verify it quickly

## Evolution rule
Do not treat the model as fixed.
If new signal classes become important, extend:
- `config/signal_schema.json`
- `config/model_config.yaml`
- the extraction adapters in `scripts/extract_signals.py`
- the rendering logic in `scripts/generate_v4_clock.py`

## Guardrails
- Distinguish **observed facts** from **working model choices**
- Keep branch priors editable and explicit
- Allow rewind when signals improve
- Prefer additive extensions over breaking changes
