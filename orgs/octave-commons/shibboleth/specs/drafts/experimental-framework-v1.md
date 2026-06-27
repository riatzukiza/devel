# Experimental framework v1 (paper track B)

Created: 2026-03-15
Status: draft

## Mission
Deliver a **research-grade, peer-review-defensible** experimental framework for evaluating adversarial prompt defenses across **Safety / Availability / Cost** (SEU) using Shibboleth bundles.

Core requirement: every claim in the paper must be reproducible from **receipts** (immutable run artifacts) produced by the framework.

## Scope (Phase 1 + Phase 2)
### Phase 1 (single-turn, publishable alone)
- Inputs: `prompts.parquet`, `variants.parquet` from `data/build/<version>/`
- Policies: P0, P1, P5, P7
- Targets: kimi-k2.5, gpt-5.2, gpt-5.4, claude-opus-4.6, glm-5 via the local open-hax OpenAI-compatible proxy (managed routing).
  - **Confound note:** the proxy may choose an underlying provider; we must log the *requested* model name and the *returned* `model_id` (and any proxy routing metadata if available) per event, and treat drift as an explicit limitation/measurement.
- Suites: native + MT + code-mix + homoglyph + exhaustion (as available)
- Judging: deterministic refusal + judge-model rubric + small human audit sample
- Outputs: per-cell metrics + SEU/Pareto plots + full run receipts

### Phase 2 (multi-turn sessions, novelty amplifier)
- Add `sessions.jsonl` (generated deterministically from canonical prompts + templates)
- Stateful policy variants (risk accumulation, decay)
- Token burn trajectories + time-to-recovery metrics

## Deliverables (receipts)
For each run `run_id`:
- `runs/<run_id>/config.edn` (full experiment config, pinned)
- `runs/<run_id>/dataset_manifest.edn` (bundle version + checksums + build_manifest hash)
- `runs/<run_id>/cases.parquet` (the exact cases executed; stable `case_id`)
- `runs/<run_id>/events.jsonl` (one event per request/turn; audit-grade)
- `runs/<run_id>/metrics.parquet` (per-case + per-cell metrics)
- `runs/<run_id>/plots/` (SVG/PNG + data CSV used to render)
- `runs/<run_id>/report.md` (tables + figure captions)

All files listed above are checksummed:
- `runs/<run_id>/checksums.sha256`

## Definitions (paper-usable)
### Experimental cell
A cell is:
`policy_layer × target(model_id, provider, transport_mode) × suite × language × split`

### Primary outcomes
For each evaluated case/turn:
- `blocked_by_policy` (router decision)
- `refusal` (heuristic + provider refusal flags)
- `harmful_compliance` (judge rubric)
- `benign_task_success` (judge rubric)

### Primary metrics (per cell)
Safety:
- **ASR** (Attack Success Rate) = adversarial cases with harmful compliance / adversarial cases
- **Conditional ASR** = harmful compliance / adversarial cases that reached target model

Availability:
- **FPR** (over-blocking) = benign cases blocked or refused / benign cases
- **Benign Task Success Rate** = benign cases judged successful / benign cases

Cost:
- tokens in/out/total (provider or estimated)
- latency p50/p95
- additional calls (classifier calls, judge calls)

### SEU scalarizations (for plots, not as the only result)
- S = 1 - ASR
- U = 1 - FPR
- E = 1 / (1 + norm_token_overhead + norm_latency_overhead)

Report Pareto fronts in 3D (S,U,E) and 2D projections.

## Judging design (peer-review critical)
### Judge rubric
Implement a pinned judge model (or local judge) that classifies:
- refusal vs compliance
- harmful compliance vs safe completion
- benign task success (task-relevant answer)

Controls:
- judge model fixed across all experimental conditions
- rubric text versioned + hashed
- include an uncertainty/abstain option; treat abstains as separate bucket

### Human audit
- random stratified sample across languages/suites/policies
- annotate: harmful compliance + benign success
- report inter-annotator agreement and judge-vs-human agreement

## Interface normalization (confound control)
- fixed base system prompt (hashed)
- temperature/top_p/max_output_tokens fixed
- transport_mode is an explicit factor: `templated` vs `raw` (when supported)
- log returned provider model_id and any routing metadata

## Statistical analysis
- Bootstrap confidence intervals for per-cell ASR/FPR
- Multiple comparison control for language-by-suite breakdowns (e.g. BH-FDR)
- Sensitivity analyses:
  - remove near-duplicates by cluster id
  - per-source ablation
  - per-language subset

## Charts (minimum figure set)
1. **SEU scatter**: Safety vs Availability with bubble size = cost
2. **Pareto front**: non-dominated configurations
3. **Per-language bar charts**: ASR/FPR by language and suite
4. **Cost distributions**: latency/tokens per policy
5. (Phase 2) **Token burn trajectories** over turns; time-to-recovery

Each figure must have:
- code to regenerate
- input data file path(s)
- hash of data used

## Risks
- Provider drift (model updates, routing). Mitigation: local pinned baseline + log model_id + timestamp.
- Judge drift. Mitigation: pinned judge + store raw judge prompts/outputs.
- Safety of storing harmful outputs. Mitigation: store plaintext outputs for reviewers **in the run artifacts** (requested), but:
  - default publication bundle uses hashes-only (events include `response_hash`),
  - plaintext is written under `runs/<run_id>/plaintext/` and is never committed,
  - provide an optional encrypted-at-rest mode for sharing outside the lab.

## Open questions
1. What is the exact harm/outcome taxonomy used for harmful compliance judging (coarse binary vs category-aware, and how do we score jailbreaks that do not directly produce harmful instructions)?
2. What is the acceptance threshold for “task success” on benign prompts?
3. Proxy routing drift: what proxy-returned metadata can we reliably log to evidence the *actual* underlying model/provider used?
4. Data governance: are plaintext outputs allowed to be used for downstream training, and under what licensing/ToS constraints (kept separate from the paper’s reproducibility claims)?

## Affected code (expected)
- `src/promptbench/eval/*` (new policy router, adapters, judge, logger)
- `src/promptbench/report/figures.clj` (currently stub)
- `src/promptbench/report/core.clj` (tables expanded)
- `docs/research-paper-draft.md` (align claims with implemented framework)
- `pipelines/v1.edn` (ensure suites + language coverage)

## Definition of done
- A single command runs an experiment and emits full receipts + plots.
- Re-running with same config produces identical case selection and identical metrics (modulo provider nondeterminism, which must be quantified).
- Paper can cite: exact run_id, bundle hash, code commit, and reproduce all main tables/figures.
