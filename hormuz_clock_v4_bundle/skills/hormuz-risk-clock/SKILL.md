# Hormuz Risk Clock

Use this skill to maintain and evolve a public-signal early-warning clock for the Strait of Hormuz and related maritime-energy disruption.

## Purpose
This skill ingests **fresh public signals**, updates state variables, revises branch priors, and renders a clock image plus a short markdown snapshot.

## ⚠️ CRITICAL: Always Fetch Fresh Signals

**Never rely on cached state as ground truth.** The Hormuz situation evolves rapidly. Before producing any clock update or report:

1. **Check cached state age** — If `data/state*.json` is older than 24 hours, it is stale.
2. **Fetch fresh signals via web search** — Use `websearch` to find latest developments.
3. **Extract facts from fresh sources** — Use `webpage_markdown` to pull full articles.
4. **Update state model** before rendering or publishing.

If the user asks for a clock update, they expect **current intelligence**, not a stale snapshot.

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

### Preflight: Staleness Check
Before starting any update:
1. Read the `as_of_utc` timestamp from `data/state.latest.json`.
2. Compare to current date. If older than 24 hours: **STOP and fetch fresh signals.**
3. Only proceed with cached state if explicitly asked to work from a specific historical snapshot.

### Fresh Signal Extraction
When state is stale or missing:
1. Use `websearch` with current-date queries.
2. Use `webpage_markdown` to extract full source text from key articles.
3. Normalize findings into signal objects:
   - `id`, `timestamp_utc`, `source`, `category`, `value`, `confidence`, `direction`, `notes`, `url`
4. Merge into `data/signals.latest.json`.

### State Update & Render
1. Load `config/model_config.yaml`
2. Run `scripts/update_state.py`
3. Render `assets/hormuz_risk_clock_v4.png` with `scripts/generate_v4_clock.py`
4. Optionally create a markdown brief via `scripts/render_snapshot_report.py`
5. If requested, compare versions with `scripts/animate_transition.py`

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
- **Never publish stale state as current.** Always check timestamps.
- Distinguish **observed facts** from **working model choices**
- Keep branch priors editable and explicit
- Allow rewind when signals improve
- Prefer additive extensions over breaking changes
- If you cannot fetch fresh signals, clearly label output as "stale" with the `as_of_utc` timestamp prominently displayed.
