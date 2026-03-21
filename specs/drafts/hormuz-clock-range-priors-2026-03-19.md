# Spec Draft: Hormuz clock branch ranges + confidence scores

## Summary
Refine the Hormuz Risk Clock so branch outputs stop presenting misleadingly precise point probabilities. Replace single-value branch priors with probability ranges plus explicit branch confidence scores, then regenerate the snapshot/render/social artifacts.

## Open Questions
- None blocking.

## Risk Analysis
- **False precision**: keeping exact branch percentages implies more certainty than the underlying evidence supports.
- **Schema churn**: several render/report/social paths assume scalar branch values today.
- **Interpretation drift**: ranges for mutually exclusive scenarios will overlap; the report must explain why.

## Priority
High.

## Implementation Phases
1. **Schema + methodology**
   - define branch center/range/confidence output shape
   - document how uncertainty is produced
2. **Scoring update**
   - compute branch center plus interval envelope from state/modifier confidence
   - keep contribution ledger explainable
3. **Output update**
   - update report/render/social text to display ranges and confidence instead of exact single numbers
4. **Verification**
   - rerun update pipeline and confirm all regenerated artifacts are coherent

## Affected Files
- `hormuz_clock_v4_bundle/config/model_config.yaml`
- `hormuz_clock_v4_bundle/methodology/clock_methodology_v4.md`
- `hormuz_clock_v4_bundle/prompts/research/clock_model_evolver.md`
- `hormuz_clock_v4_bundle/scripts/update_state.py`
- `hormuz_clock_v4_bundle/scripts/render_snapshot_report.py`
- `hormuz_clock_v4_bundle/scripts/generate_v4_clock.py`
- `hormuz_clock_v4_bundle/scripts/social/build_social_payloads.mjs`
- `hormuz_clock_v4_bundle/data/state.v4.json`
- `hormuz_clock_v4_bundle/reports/v4_snapshot.md`
- `hormuz_clock_v4_bundle/reports/bluesky_thread_2026-03-19.md`
- `hormuz_clock_v4_bundle/data/social_payloads.latest.json`

## Definition of Done
- Branch outputs are ranges plus confidence, not bare point claims.
- Methodology explicitly explains the uncertainty model.
- Snapshot/render/social artifacts no longer imply false precision.
- Verification commands pass.

## Todo
- [ ] Phase 1: Schema + methodology
- [ ] Phase 2: Scoring update
- [ ] Phase 3: Output update
- [ ] Phase 4: Verification
