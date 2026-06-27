# Full multilingual dataset generation (v1)

Created: 2026-03-14
Status: draft

## Goal
Generate a *full multilingual* Shibboleth bundle from the current implementation by producing Tier‑1 + Tier‑2 MT variants **for all canonical prompts** (not just curated/high-affinity families).

**Definition of “full multilingual” (B):**
- For every row in `prompts.parquet` (all `source_id`s across all splits), generate MT variants for:
  - Tier‑1 languages (10)
  - Tier‑2 languages (10)
- Total expected MT variants (ignoring eval-suites):
  - `total_prompts × 20` (minus any explicitly skipped cases)

**Required change vs current behavior:**
- Remove/override the current `:mt` affinity gate by adding a pipeline config option (e.g. `:scope :all`) and making Stage 4/5 honor it.

**Practical requirement:**
- MT must be batched (N prompts per request) to avoid millions of per‑prompt proxy calls.

## Current state (observed)
- Bundle exists at `data/build/0.1.0/`.
- `prompts.parquet` has 13,307 prompts; almost all have `attack_family = "unmapped"`.
- Tier-1 MT previously produced 130 variants (13 prompts × 10 languages) because MT was gated to `:mt` affinity `:high` families only.
- Tier-2 MT previously produced 0 variants because Tier-2 gating was disabled (no `:tier2 true` in config).
- Curated family `developer-mode` previously had `:mt` affinity `:medium`, so it was excluded from MT generation.

## Plan
### Phase 1 — Add “MT scope” + batched MT
1. Add a config knob under `:transforms :tier-1-mt` and `:transforms :tier-2-mt`:
   - `:scope :high-affinity` (default, current behavior)
   - `:scope :all` (**new**, required for B)
2. Implement batched MT in Stage 4/5:
   - `:batch-size N` in tier config
   - Translate a JSON array of N prompts in a single proxy call; parse JSON array response.

### Phase 2 — Enable Tier‑2 + select scope=all in v1 pipeline
1. Ensure `:tier2 true` at the pipeline root config.
2. Set `:scope :all` and a reasonable `:batch-size` for both tier configs.

### Phase 3 — Regenerate bundle
1. Run `clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337`.
2. Confirm:
   - `build_manifest.edn` has `:total-variants ≈ total-prompts × 20` (Tier‑1 + Tier‑2).
   - `variants.parquet` has `rows == total-prompts × 20`.

## Risks
- MT proxy availability / rate limits.
- Build time depends on proxy throughput.

## Affected files
- `pipelines/v1.edn`
- `src/promptbench/corpus/curated.clj`

## Definition of done
- Build completes with Tier-2 MT variants present.
- Bundle artifacts (`prompts.parquet`, `variants.parquet`, manifests, datasheet, checksums) are regenerated successfully.
