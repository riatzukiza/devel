# Full multilingual dataset generation (v1)

Created: 2026-03-14
Status: draft

## Goal
Generate a *full multilingual* Shibboleth bundle from the current implementation by ensuring Tier-2 MT actually runs and that all curated families intended for MT participate.

**Definition of “full multilingual” for this draft:**
- Tier-1 MT (10 languages) + Tier-2 MT (10 languages) variants are generated.
- Coverage applies to the curated attack families (persona-injection, authority-impersonation, developer-mode) using the existing affinity rule (`:mt` must be `:high`).

This does **not** attempt to translate every `:unmapped` external record (would be extremely large / expensive and would require streaming/caching improvements).

## Current state (observed)
- Bundle exists at `data/build/0.1.0/`.
- `prompts.parquet` has 13,307 prompts; almost all have `attack_family = "unmapped"`.
- Tier-1 MT produced 130 variants (13 prompts × 10 languages).
- Tier-2 MT produced 0 variants because Tier-2 gating is disabled (no `:tier2 true` in config).
- Curated family `developer-mode` has `:mt` affinity `:medium`, so it is excluded from MT generation.

## Plan
### Phase 1 — Minimal changes to unlock full Tier-1 + Tier-2 for curated families
1. Set `:tier2 true` at the pipeline root config (EDN).
2. Change curated `developer-mode` family `:transforms :mt :affinity` to `:high`.

### Phase 2 — Regenerate bundle
1. Run `clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337`.
2. Confirm:
   - `data/build/0.1.0/manifests/tier2-mt-manifest.edn` has `:artifact-count > 0`.
   - `data/build/0.1.0/build_manifest.edn` shows `:total-variants >= 360` (expected: 18 prompts × 20 langs = 360 MT variants, plus any eval-suite variants).

## Risks
- MT proxy availability / rate limits.
- Build time depends on proxy throughput.

## Affected files
- `pipelines/v1.edn`
- `src/promptbench/corpus/curated.clj`

## Definition of done
- Build completes with Tier-2 MT variants present.
- Bundle artifacts (`prompts.parquet`, `variants.parquet`, manifests, datasheet, checksums) are regenerated successfully.
