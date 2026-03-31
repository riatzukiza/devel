# Spec Draft: Hormuz clock evolution + 2026-03-19 snapshot + social package

## Summary
Evolve the Hormuz Risk Clock so the model can ingest fresh operational and policy signals more explicitly, recompute branch priors from state pressure plus research modifiers, and emit an updated render/report/social package for 2026-03-19.

This slice covers:
- additive model evolution for branch-prior logic and structured signal categories
- a fresh signal set using current public reporting
- a regenerated clock image and markdown snapshot
- a Bluesky-ready thread draft in a high-energy "GOOD MORNING, VIETNAM" register
- a short lyrics artifact tied to the updated snapshot

## Open Questions
- None blocking. Tone target is intentionally loud/performative for the social draft, while the factual payload stays uncertainty-aware.

## Risk Analysis
- **Source drift**: official pages and advisories have changed since the prior 2026-03-11 snapshot; extraction must stay additive and fall back cleanly.
- **Model overreach**: branch priors are not facts; any new dynamic logic must remain transparent and reversible.
- **Tone spillover**: the Bluesky thread should carry the requested energy without contaminating the factual state/report artifacts.
- **Workspace dirtiness**: the root workspace is already dirty; changes must stay scoped to the Hormuz bundle plus the required spec/receipts artifacts.

## Priority
High.

## Implementation Phases
1. **Research + model evolution**
   - inspect methodology/config/scripts
   - add additive scoring/branch logic for structured signals and explicit priors
   - document the evolved model
2. **Fresh signal ingest + snapshot generation**
   - curate/update fresh signals from public sources
   - recompute `data/state.v4.json`
   - regenerate `assets/hormuz_risk_clock_v4.png`
   - regenerate `reports/v4_snapshot.md`
3. **Creative/social outputs**
   - draft a short lyrics artifact
   - draft a Bluesky thread in the requested style while keeping facts/model choices separated
4. **Verification**
   - run the update/render path end-to-end
   - confirm generated files exist and summarize what changed

## Affected Files
- `hormuz_clock_v4_bundle/config/model_config.yaml`
- `hormuz_clock_v4_bundle/config/signal_schema.json`
- `hormuz_clock_v4_bundle/methodology/clock_methodology_v4.md`
- `hormuz_clock_v4_bundle/prompts/research/clock_model_evolver.md`
- `hormuz_clock_v4_bundle/scripts/extract_signals.py`
- `hormuz_clock_v4_bundle/scripts/update_state.py`
- `hormuz_clock_v4_bundle/scripts/render_snapshot_report.py`
- `hormuz_clock_v4_bundle/scripts/social/build_social_payloads.mjs`
- `hormuz_clock_v4_bundle/data/signals.latest.json`
- `hormuz_clock_v4_bundle/data/state.template.v4.json`
- `hormuz_clock_v4_bundle/data/state.v4.json`
- `hormuz_clock_v4_bundle/assets/hormuz_risk_clock_v4.png`
- `hormuz_clock_v4_bundle/reports/v4_snapshot.md`
- `hormuz_clock_v4_bundle/reports/lyrics_2026-03-19.md`
- `hormuz_clock_v4_bundle/reports/bluesky_thread_2026-03-19.md`

## Definition of Done
- The model uses explicit, additive logic for dynamic branch priors and fresh research modifiers.
- The 2026-03-19 signal/state/render/report artifacts are regenerated successfully.
- The report separates observed facts from model choices.
- A lyrics artifact and Bluesky thread draft exist and reflect the requested tone.
- Verification commands are recorded.

## Verification Notes
- `cd hormuz_clock_v4_bundle && python3 -m py_compile scripts/extract_signals.py scripts/update_state.py scripts/render_snapshot_report.py scripts/generate_v4_clock.py` ✅
- `cd hormuz_clock_v4_bundle && python3 scripts/extract_signals.py > data/signals.latest.json` ✅
- `cd hormuz_clock_v4_bundle && python3 scripts/update_state.py data/signals.latest.json > data/state.v4.json` ✅
- `cd hormuz_clock_v4_bundle && python3 scripts/render_snapshot_report.py data/state.v4.json > reports/v4_snapshot.md` ✅
- `cd hormuz_clock_v4_bundle && python3 scripts/generate_v4_clock.py data/state.v4.json assets/hormuz_risk_clock_v4.png` ✅
- Render preview of `assets/hormuz_risk_clock_v4.png` in TUI ✅
- Bluesky thread post lengths checked for Bluesky-safe sizing (primary + 3 continuations all under 300 chars) ✅

## Todo
- [x] Phase 1: Research + model evolution
- [x] Phase 2: Fresh signal ingest + snapshot generation
- [x] Phase 3: Creative/social outputs
- [x] Phase 4: Verification
