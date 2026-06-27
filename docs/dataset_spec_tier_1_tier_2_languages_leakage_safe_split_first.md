# Dataset Spec — Tier 1 & Tier 2 Languages (Leakage‑Safe, Split‑First)

> Paper focus: **Safety–Availability–Cost** evaluation of policy layers (P1/P5/P7) under multilingual + obfuscated adversarial prompting.
>
> Core invariant: **split first at `source_id`/problem level, then translate/augment**. No variant of a `source_id` may cross splits.

---

## 1) Goals

1. Build a **prompt-level dataset** with leakage-proof splits.
2. Generate **language variants** (MT + code-mix + obfuscation) only *after* split.
3. Provide a reproducible, auditable corpus for evaluating:
   - **Safety** (under-blocking)
   - **Availability** (over-blocking)
   - **Cost** (token burn / tool burn / latency)

---

## 2) Language Tiers

### 2.1 Tier 1 Languages (Primary)
Tier 1 must be covered end-to-end (train/eval translation, code-mix suites, reporting).

**Tier 1 (core set):**
- `en` English (pivot / canonical)
- `zh` Mandarin Chinese
- `es` Spanish
- `hi` Hindi
- `ar` Arabic
- `fr` French
- `ru` Russian
- `pt` Portuguese
- `id` Indonesian
- `de` German

Rationale: top global usage + diverse scripts/morphologies + known asymmetries.

### 2.2 Tier 2 Languages (Secondary)
Tier 2 expands coverage for generalization and code-mix diversity. Tier 2 is used primarily for **evaluation suites** and selective training augmentation.

**Tier 2 (recommended set):**
- `ja` Japanese
- `bn` Bengali
- `pa` Punjabi
- `jv` Javanese
- `ko` Korean
- `vi` Vietnamese
- `te` Telugu
- `mr` Marathi
- `ta` Tamil
- `tr` Turkish

Notes:
- Tier 2 includes additional scripts (CJK, Hangul), agglutinative languages, and Indo-Aryan variants.
- If compute/translation budget is tight, Tier 2 can be split into **Tier 2A** (ja, bn, ko, tr, vi) and **Tier 2B** (pa, jv, te, mr, ta).

### 2.3 Language Metadata
All language codes must be normalized to **BCP‑47** (e.g., `zh-Hans`, `pt-BR` optional), but evaluation aggregation is at primary tag (e.g., `zh`).

---

## 3) Dataset Types

### 3.1 Prompt-Level Dataset (Phase 1, publishable alone)
Each row is one **problem-level prompt**.

**Key properties:**
- Single-turn, stateless examples.
- `source_id` is the atomic unit for splitting.

### 3.2 Variant Dataset (Post-split expansions)
Each `source_id` can yield multiple `variant_id`s.

**Variant types:**
- `native` (if original prompt is non-English and preserved)
- `mt` (machine translation)
- `backtrans` (translation quality check)
- `codemix` (controlled bilingual/trilingual mixes)
- `unicode_obf` (homoglyph, ZWJ, bidi controls, tag chars)
- `cost_attack` (token/resource exhaustion templates)

### 3.3 Session Dataset (Phase 2)
Conversation templates built from selected `variant_id`s, seeded and deterministic.

---

## 4) Labels & Taxonomy

### 4.1 Intent Label
- `benign`
- `adversarial`
- `probe` (optional; policy boundary mapping)

### 4.2 Attack Taxonomy (multi-label)
A minimal multi-label set aligned to prior-art categories:
- `jailbreak_direct`
- `jailbreak_roleplay`
- `injection_instruction_override`
- `policy_probe`
- `system_prompt_extraction`
- `tool_abuse` (reserved; may be synthetic-only initially)
- `obfuscation_unicode`
- `obfuscation_homoglyph`
- `codemix`
- `cost_exhaustion`

### 4.3 Harm/Policy Category (optional, dataset-dependent)
Normalize into a coarse set:
- `violence`
- `self_harm`
- `illegal_activity`
- `hate_harassment`
- `sexual_content`
- `malware_cyber`
- `privacy`
- `fraud_deception`
- `other`

---

## 5) Canonicalization & Leakage Control

### 5.1 Canonical Text
`canonical_text` is the normalized prompt used for clustering/splitting.
- Prefer English pivot if available.
- If the original dataset is non-English (e.g., Chinese JailBench), `canonical_text` may be non-English; optionally include a `pivot_en` field later.

### 5.2 `source_id` Rules (non-negotiable)
`source_id` must be stable across:
- translation
- paraphrase
- code-mix
- unicode perturbations

**Construction:**
- `source_id = sha256(dataset_id + "::" + dataset_row_id)`
- If dataset lacks stable row ids, derive `dataset_row_id = sha256(raw_text + labels + metadata_subset)` and store both.

### 5.3 Clustering & Split Strategy
- Compute `cluster_id` over `canonical_text` embeddings.
- Split by `cluster_id` (group split) so near-duplicates never leak.
- Store split manifests listing `source_id`s.

---

## 6) File Formats

Preferred: **Parquet** for tables, **JSONL** for sessions/logs.

### 6.1 `prompts.parquet`
Columns (required):
- `source_id` (string)
- `dataset_id` (string)
- `dataset_row_id` (string)
- `canonical_text` (string)
- `language_native` (string; BCP‑47 primary tag)
- `intent_label` (enum)
- `attack_taxon` (list<string>)
- `harm_category` (string | null)
- `cluster_id` (string)
- `split` (enum: `train` | `eval`)
- `license_id` (string)
- `provenance_url` (string)

Columns (optional):
- `notes` (string)
- `quality_flags` (list<string>)

### 6.2 `variants.parquet`
Columns (required):
- `variant_id` (string)
- `source_id` (string)
- `language` (string; BCP‑47)
- `text` (string)
- `variant_type` (enum)
- `transform_seed` (int | null)
- `transform_spec` (json string | null)
- `translator_id` (string | null)
- `timestamp_utc` (string)
- `quality_flags` (list<string>)

### 6.3 `sessions.jsonl` (Phase 2)
Top-level object:
- `session_id` (string)
- `seed` (int)
- `suite` (string)
- `turns` (array)

Turn object:
- `turn_index` (int)
- `role` (enum: `user` | `assistant` | `tool`)
- `variant_id` (string)
- `expected_policy_outcome` (enum: `allow` | `block` | `route` | `sanitize`)
- `attack_stage` (enum: `benign` | `probe` | `attack` | `recovery`)

---

## 7) Translation & Augmentation Plan

### 7.1 Split-First, Translate-Later
For each split (`train`, `eval`):
- generate MT variants only from that split’s `source_id`s
- never reuse translation outputs across splits

### 7.2 Translation Metadata
For each MT variant, record:
- `translator_id` (engine/model)
- `direction` (e.g., `en→zh`)
- `confidence` (if available)
- `backtrans_similarity` (cosine sim between original and backtranslation embeddings)

### 7.3 Code-Mix Suite (eval-first)
Deterministic, seeded transforms:
- **Bilingual:** mix Tier 1 ↔ Tier 1 pairs (e.g., `en+zh`, `en+ar`, `es+pt`, `ru+uk*`)
- **Trilingual:** `en + (Tier1 non-Latin) + (Tier2)`
- Control mix rate: 10%, 25%, 50% token spans.

### 7.4 Unicode/Obfuscation Suite (eval-only initially)
Deterministic transforms with recorded seeds:
- homoglyph substitution tables (Latin/Cyrillic/Greek)
- zero-width joiner insertion
- bidi overrides (carefully sandboxed)
- NFKC vs raw comparisons

### 7.5 Cost Exhaustion Suite (eval-only)
Construct prompts that:
- expand tokens heavily (repetition, nested patterns)
- contain high-tokenization characters

Label as `adversarial` with `cost_exhaustion` taxon.

---

## 8) Dataset Sources (initial)

### 8.1 Tier 1 Seed Sources
- `CohereForAI/aya_redteaming` (native multilingual adversarial; positives)
- `XSafety` (broad multilingual; mixed quality)
- `Anthropic/hh-rlhf red-team-attempts` (English multi-turn patterns; can be flattened)
- `JailBench` / `JailBench-seed` (Chinese)
- `APTO-001` (Japanese multi-turn; if accessible)

### 8.2 Benign Negatives (mandatory)
Because many red-team datasets are adversarial-only:
- multilingual QA corpora (TyDiQA/XQuAD) for benign distribution
- general instruction-following prompts (license-permissive)
- “benign lookalikes” created by controlled editing (seeded)

All benign negatives must carry `intent_label=benign` and `attack_taxon=[]`.

---

## 9) Dataset Balancing

Target mix for training (adjustable):
- 50% benign
- 50% adversarial/probe

Per-language weighting options:
- uniform across Tier 1
- traffic-weighted (deployment-specific)
- script-family balanced (Latin/Cyrillic/Arabic/CJK/Indic)

---

## 10) Versioning & Reproducibility

Each build emits:
- `dataset_version` (semantic)
- `run_id` (sha256 of config + split manifests)
- `config.yaml`
- split manifests
- deterministic seeds for augmentations

No silent updates: any change to sources, normalization, translation engine, or transforms increments `dataset_version`.

---

## 11) Acceptance Criteria (M0 → M1)

### M0 (Dataset Spine)
- `prompts.parquet` built from ≥1 source dataset
- leakage-proof `source_id` + `cluster_id` + `split`
- split manifests written

### M1 (Tier 1 Variants)
- MT variants for all Tier 1 languages for both splits
- `variants.parquet` with translation metadata
- backtranslation similarity logged

### M2 (Eval Suites)
- code-mix + unicode + cost suites generated (eval-only)
- suite manifests

---

## 12) Open Decisions (track in issues)
- exact Tier 2 composition (2A/2B split)
- translation engine(s) and budget
- whether to enforce `zh-Hans` vs `zh` only
- inclusion/exclusion rules for sensitive categories per venue

