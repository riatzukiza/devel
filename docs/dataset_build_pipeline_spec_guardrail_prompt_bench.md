# Dataset Build Pipeline Spec — Guardrail PromptBench

> This document defines the executable pipeline that produces the dataset artifacts described in the Dataset Spec.
>
> Design constraints:
> - Deterministic and replayable
> - Leakage-proof (cluster-level split before transform)
> - Manifest-driven (all inputs/outputs hashed)
> - Suitable for paper reproduction

---

# 1) Pipeline Overview

The dataset build is a staged, idempotent pipeline.

```
Stage 0: Fetch Sources
Stage 1: Canonicalize + Build prompts.parquet
Stage 2: Embed + Cluster
Stage 3: Split (cluster-level)
Stage 4: Generate Tier 1 MT variants
Stage 5: Generate Tier 2 MT variants
Stage 6: Generate Eval Suites (CodeMix / Obfuscation / Exhaustion)
Stage 7: Integrity Checks + Manifests
```

Each stage writes versioned artifacts to:

```
build/<dataset_version>/<stage_name>/
```

Each stage writes:
- artifact file(s)
- stage_manifest.json
- checksums.json

---

# 2) CLI Interface (Single Entry Point)

Command:

```
promptbench build \
  --config configs/build.yaml \
  --version 0.1.0 \
  --seed 1337
```

Subcommands:

```
promptbench fetch
promptbench canonicalize
promptbench cluster
promptbench split
promptbench variants
promptbench suites
promptbench verify
```

All commands must accept `--seed` and `--version`.

---

# 3) Stage Specifications

## Stage 0 — Fetch Sources

Inputs:
- `sources.manifest.json`

Outputs:
- raw dataset snapshots in `data/raw/`
- SHA256 checksums recorded

Requirements:
- Pin exact dataset commit or version
- Record license
- Fail if checksum mismatch

---

## Stage 1 — Canonicalization

Input:
- raw datasets

Output:
- `prompts.parquet`

Process:
1. Extract prompt text + labels
2. Map to unified taxonomy
3. Normalize text (NFKC, whitespace collapse)
4. Compute:
   - `canonical_hash = sha256(normalized_text)`
   - `source_id = sha256(dataset_id + ':' + row_id + ':' + canonical_hash_prefix)`
5. Store original text separately if needed

Invariants:
- No translation here
- No paraphrasing here
- No augmentation here

---

## Stage 2 — Embedding + Clustering

Input:
- `prompts.parquet`

Process:
1. Embed `canonical_text` with multilingual embedding model
2. Compute similarity graph
3. Cluster (HDBSCAN or thresholded agglomerative)
4. Assign `cluster_id`

Output:
- updated `prompts.parquet` with `cluster_id`
- `cluster_stats.json`

Constraint:
- Clustering seed must be fixed
- Embedding model ID recorded in manifest

---

## Stage 3 — Split

Input:
- clustered `prompts.parquet`

Process:
1. Group by `cluster_id`
2. Stratify by:
   - intent_label
   - attack_family
   - canonical_lang
3. Split 70/15/15 train/dev/test at cluster level

Output:
- updated `prompts.parquet` with `split`
- `splits.manifest.json`

Integrity Rule:
- No cluster_id may appear in multiple splits

Verification:
- assert intersection(train_clusters, test_clusters) == ∅

---

## Stage 4 — Tier 1 MT Variants

Input:
- `prompts.parquet`

Process:
For each split independently:
  For each `source_id` in that split:
    For each Tier 1 language L:
      translate canonical_text → L
      record translation metadata
      assign `variant_id`

Output:
- `variants.parquet` (canonical + mt variants)

Constraints:
- No cross-split translation caching
- Deterministic ordering

---

## Stage 5 — Tier 2 MT Variants

Same as Stage 4, but for Tier 2 languages.

Tier 2 may be gated by:
- `--tier2` flag
- compute budget config

---

## Stage 6 — Eval Suites

Run only on `split == test` unless configured otherwise.

### CodeMix
Parameters (from config):
- mix_rate: [0.1, 0.25, 0.5]
- strategies: [inter_sentential, intra_sentential]
- pairings: auto-generate from Tier 1

### Obfuscation
Parameters:
- homoglyph_rate
- zwj_rate
- bidi_rate

### Exhaustion
Parameters:
- repetition_length
- suffix_pattern
- tokenizer_profile

All transforms:
- Must record `transform_seed`
- Must record `transform_params`
- Must preserve `source_id`

---

# 4) Verification Stage (Stage 7)

Checks:

1. No cluster leakage across splits
2. No variant references a source_id outside its split
3. No missing Tier 1 coverage
4. Label distribution sanity checks
5. Language coverage report
6. Duplicate text detection (within split)

Write:
- `verification_report.json`

Pipeline fails if any invariant violated.

---

# 5) Determinism Requirements

All randomness must use:

```
seed_global
seed_split
seed_transform
```

Every artifact must be reproducible from:
- dataset_version
- build.yaml
- seed
- source checksums

---

# 6) Build Configuration (build.yaml)

Example:

```
dataset_name: guardrail_promptbench
version: 0.1.0
seed: 1337

split:
  train: 0.7
  dev: 0.15
  test: 0.15

embedding_model: multilingual-e5-large

translation:
  engine: gpt-4o-mini
  record_backtranslation: true

suites:
  codemix:
    enabled: true
    rates: [0.1, 0.25]
  obfuscation:
    enabled: true
    homoglyph_rate: 0.15
  exhaustion:
    enabled: true
    repetition_lengths: [1024, 4096]
```

---

# 7) Acceptance Tests (Executable Assertions)

### Leakage
- Assert cluster disjointness
- Assert variant split == source split

### Determinism
- Rebuild with same seed → identical checksums

### Coverage
- Each Tier 1 language has ≥1 variant per source_id in test split

### Audit
- Print language × attack_family matrix
- Print benign/adversarial ratios per split

---

# 8) Outputs Required for Research

After full build:

```
prompts.parquet
variants.parquet
splits.manifest.json
sources.manifest.json
transforms.manifest.json
verification_report.json
```

These artifacts are sufficient to:
- Train one classifier model
- Evaluate P1/P5/P7 policies
- Run multilingual and obfuscation stress tests
- Produce reproducible paper figures

---

# 9) Next Implementation Step

To move to code:

1. Implement Stage 1–3 first (spine).
2. Add Tier 1 MT.
3. Add verification checks.
4. Freeze v0.1.0.
5. Only then add suites.

This prevents scope creep and preserves publication integrity.

---

END OF PIPELINE SPEC

