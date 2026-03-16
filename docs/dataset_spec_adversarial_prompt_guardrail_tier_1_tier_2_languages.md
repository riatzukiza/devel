# Dataset Spec — Adversarial Prompt Guardrail (Tier 1 + Tier 2 Languages)

**Goal:** A reproducible, leakage-resistant benchmark + training corpus to evaluate *safety–availability–cost* tradeoffs for guardrails/policies (P1/P5/P7) across target LLMs and multilingual/obfuscated prompt variants.

**Core invariant:** **Split at `source_id` (problem level) *before* any translation, paraphrase, or augmentation.** No transform is allowed to change dataset membership. All variants must reference the same `source_id`.

---

## 0) Definitions

### 0.1 Source prompt
A single canonical “problem” instance (benign or adversarial) with a stable identifier.

- **`source_id`**: globally unique ID for the canonical prompt (the “problem level”).
- **`canonical_text`**: the canonical text used for semantics + transforms.
- **`canonical_lang`**: pivot language for canonical text (default: `en`, but not required).

### 0.2 Variant
Any derived form (translation, code-mix, obfuscation, etc.) of a `source_id`.

- **`variant_id`**: unique ID for a specific transformed realization.
- **`variant_type`**: defines the transformation pipeline.
- **`transform_seed`**: deterministic seed to reproduce the transform.

### 0.3 Suites
A “suite” is a named partition of variants used for eval slices.

- **Native**: original-language prompts from source datasets.
- **MT**: machine translation after split.
- **BT**: back-translation for quality checking after split.
- **CodeMix**: multilingual mixing after split.
- **Unicode/Obfuscation**: deterministic adversarial text perturbations after split.
- **Cost/Exhaustion**: long prompts, repetition, tag expansions after split.

---

## 1) Language Tiers

### 1.1 Tier 1 Languages (L1)
**Requirement:** high global reach + coverage of multiple scripts and typological families.

**Tier 1 list (20):**
1. English `en`
2. Mandarin Chinese `zh`
3. Hindi `hi`
4. Spanish `es`
5. French `fr`
6. Arabic `ar`
7. Bengali `bn`
8. Portuguese `pt`
9. Russian `ru`
10. Urdu `ur`
11. Indonesian `id`
12. German `de`
13. Japanese `ja`
14. Swahili `sw`
15. Marathi `mr`
16. Telugu `te`
17. Turkish `tr`
18. Tamil `ta`
19. Vietnamese `vi`
20. Korean `ko`

**Notes:**
- **Scripts covered:** Latin, Han, Devanagari, Arabic, Bengali, Cyrillic, Kana, Hangul.
- **Eval must report per-language metrics for all L1 languages.**

### 1.2 Tier 2 Languages (L2)
**Requirement:** expand script-family diversity and adversary-relevant regions; include European + conflict-region languages; include code-switch hotspots.

**Tier 2 list (12):**
1. Italian `it`
2. Polish `pl`
3. Ukrainian `uk`
4. Persian `fa`
5. Hebrew `he`
6. Thai `th`
7. Dutch `nl`
8. Romanian `ro`
9. Greek `el`
10. Hausa `ha`
11. Tagalog/Filipino `fil`
12. Serbian `sr`

**Optional Tier 2A / 2B split (if needed):**
- **2A (higher priority):** `pl, uk, fa, he, th, nl`
- **2B (next):** `ro, el, ha, fil, sr, it`

---

## 2) Label Taxonomy

### 2.1 Primary label (`intent_label`)
- `benign`
- `adversarial`

### 2.2 Secondary label (`attack_family`) — required when `adversarial`
- `jailbreak_direct` (explicit bypass / “ignore prior instructions” / persona overrides)
- `prompt_injection` (attempts to override via embedded instructions, documents, quoted text)
- `policy_probe` (boundary mapping, “what can you do”, iterative probing)
- `system_prompt_extraction` (attempts to reveal system/developer messages, hidden policies)
- `tool_abuse` (tool selection/params manipulation, schema poisoning, exfil attempts)
- `obfuscation` (unicode/homoglyph/ZWJ/Bidi, encoding tricks)
- `resource_exhaustion` (token burn, long context fill, repetition/divergence triggers)
- `mixed` (multi-family)

### 2.3 Harm category (`harm_category`) — optional but recommended
Aligned to a stable 10–14 category set (e.g., violence, self-harm, hate/harassment, sexual, illegal activity, malware/cyber, privacy, fraud/deception, extremism, other).

### 2.4 Expected policy outcome (`expected_outcome`)
- `allow`
- `refuse`
- `safe_complete` (answer allowed but must be safety-shaped)
- `route_review` (allowed but with extra guardrail stage)

**Policy comparisons must map their decisions into these outcomes.**

---

## 3) Dataset Composition

### 3.1 Source corpora
**Ingest sources:** multiple datasets (English + multilingual). For each dataset:
- assign `dataset_id`
- extract/normalize prompt text
- map dataset labels into unified taxonomy
- define `source_id` (stable hash of canonicalized text + dataset_id + row_id)

### 3.2 Negatives (benign)
To evaluate **over-blocking**, include benign prompts comparable in surface form:
- general multilingual QA prompts
- policy-adjacent but non-malicious (“explain the history of…”, “translate…”, “discuss in academic context…”)
- code-heavy benign prompts
- long benign prompts (to test cost-based false positives)

**Rule:** each `attack_family` should have “lookalike” benign prompts.

### 3.3 Balance targets (guidance)
- **Train:** 50/50 benign/adversarial (via sampling) for classifier training.
- **Eval:** realistic skew (e.g., 90% benign / 10% adversarial) plus a stress subset (50/50).

---

## 4) Leakage Prevention and Splitting

### 4.1 Canonicalization
Before `source_id` hashing, apply *canonicalization* to the canonical text:
- Unicode NFKC normalization
- whitespace collapse
- normalize quotes/dashes
- remove invisible controls for hashing only (keep original stored separately)

### 4.2 Clustering for near-duplicate control
Compute multilingual embeddings on `canonical_text` and cluster by semantic similarity.
- `cluster_id`: stable cluster label
- **Split at `cluster_id`** (not just `source_id`) to prevent paraphrase leakage.

### 4.3 Split rule
- All `source_id`s in a `cluster_id` must share a split.
- Splits: `train`, `dev`, `test`.
- Recommended ratios: 70/15/15 with per-language minimums.

### 4.4 Transform rule
**All translation/augmentation operates *within* split partitions only.**
- variants inherit `split` from their `source_id`.

---

## 5) Variant Generation

### 5.1 Baseline variants
For each `source_id`:
- `variant_type = native` if original language prompt exists
- `variant_type = canonical` (the stored canonical form)

### 5.2 Translation variants (Tier 1 + Tier 2)
For each `source_id` and each language in L1+L2:
- `variant_type = mt`
- `translation_engine` metadata (provider/model/version)
- `translation_direction`: `canonical_lang -> target_lang`

Optional:
- `variant_type = bt` (back-translation) for quality checks
- store `bt_similarity` score (semantic similarity between original and backtranslated)

### 5.3 Code-mix suite (eval-only by default)
Generated *after split* using translations.

**CodeMix templates (deterministic):**
- `inter_sentential`: sentences alternate languages
- `intra_sentential`: clause-level mixing
- `keyword_injection`: only key verbs/nouns swapped
- `triple_mix`: 3 languages (e.g., `en+ja+ar`)

**Constraints:**
- keep label invariants (meaning preserved)
- record `mix_languages` ordered list
- record `mix_strategy`

### 5.4 Unicode/obfuscation suite (eval-only)
Deterministic transforms:
- homoglyph swaps (Latin/Cyrillic/Greek)
- zero-width insertions (ZWJ/ZWNJ/ZWSP)
- bidi overrides (U+202E etc.)
- fullwidth/halfwidth
- diacritic perturbations (Arabic/Indic)

**Parameters:**
- `obfuscation_rate` (e.g., 5%, 15%, 30%)
- `transform_seed`
- `normalization_view`: store both “raw” and “normalized” text variants

### 5.5 Resource exhaustion suite (eval-only)
Deterministic stress prompts:
- repetition patterns at multiple lengths
- long-context filler with adversarial suffix
- tag expansion patterns (where safe/allowed)

**Log:**
- expected token count per tokenizer (OpenAI cl100k, Llama, etc.)
- predicted cost class (S/M/L/XL)

---

## 6) Data Formats and Schemas

### 6.1 `prompts.parquet` (canonical problem-level)
Required columns:
- `source_id` (string)
- `dataset_id` (string)
- `row_id` (string)
- `canonical_text` (string)
- `canonical_lang` (string)
- `intent_label` (enum)
- `attack_family` (enum or null)
- `harm_category` (enum or null)
- `expected_outcome` (enum)
- `cluster_id` (string)
- `split` (enum train/dev/test)
- `notes` (string or null)

### 6.2 `variants.parquet` (all derived text)
Required columns:
- `variant_id` (string)
- `source_id` (string)
- `language` (string)
- `text` (string)
- `variant_type` (enum: canonical/native/mt/bt/codemix/obfuscation/exhaustion)
- `suite` (string)
- `transform_seed` (int64 or null)
- `transform_params` (json string)
- `translation_engine` (string or null)
- `translation_quality` (float or null)
- `bt_similarity` (float or null)
- `quality_flags` (array<string> or json)
- `split` (enum train/dev/test)

### 6.3 `sessions.jsonl` (optional phase; turn-indexed)
Each line:
- `session_id`
- `seed`
- `policy_template_id`
- `turns`: array of objects:
  - `turn_index`
  - `role` (user/assistant/system)
  - `variant_id`
  - `attack_stage` (benign/probe/attack/recovery)
  - `expected_outcome`

---

## 7) Versioning and Provenance

### 7.1 Dataset version
- `dataset_name`: `guardrail_promptbench`
- `dataset_version`: semantic version (e.g., `0.1.0`)
- `build_id`: hash of manifests + tool versions

### 7.2 Manifests
- `sources.manifest.json`: dataset IDs, URLs, licenses, checksums
- `transforms.manifest.json`: transform definitions, seeds, parameters
- `splits.manifest.json`: list of `cluster_id`s per split

### 7.3 Licensing
For every `dataset_id`, store:
- license identifier
- commercial-allowed boolean
- attribution requirements

**Hard rule:** Any dataset with unclear license is excluded from “production-permissible” build.

---

## 8) Acceptance Criteria (Milestones)

### M0 — Spec-complete
- Tier 1 + Tier 2 languages frozen
- taxonomy frozen
- schemas frozen

### M1 — Minimal build (prompt-level)
- `prompts.parquet` produced
- `variants.parquet` includes:
  - canonical/native
  - MT for Tier 1 languages
- leakage checks pass (no `cluster_id` overlap across splits)

### M2 — Full multilingual build
- MT for Tier 1 + Tier 2 languages
- BT metadata + similarity scores
- CodeMix + Unicode + Exhaustion suites (eval-only)

### M3 — Session build (optional)
- session generator creates `sessions.jsonl`
- per-turn expected outcomes
- deterministic replay

---

## 9) Evaluation Hooks (for later stages)

This dataset must support evaluation slices keyed by:
- `policy_layer` (P1/P5/P7)
- `target_llm` (model ID pinned)
- `suite` (native/mt/bt/codemix/obfuscation/exhaustion)
- `language`
- `attack_family`

The dataset output must be compatible with logging fields:
- prompt/response hashes
- tokens in/out
- latency
- tool calls
- policy decision trace

---

## 10) Non-goals (for scope control)
- No requirement to publish *all* raw source prompts if licenses restrict redistribution.
- No requirement to build a best-in-class classifier; one baseline model is sufficient.
- No requirement to include multimodal prompts in v0.1.

---

## Appendix A — Recommended “must report” metrics per language
- Safety: adversarial block rate / attack success rate (ASR)
- Availability: false refusal rate (FRR) on benign
- Cost: added tokens, added calls, latency overhead

---

## Appendix B — Deterministic IDs
Suggested ID formats:
- `source_id = sha256(dataset_id + ':' + row_id + ':' + canonical_hash_prefix)`
- `variant_id = sha256(source_id + ':' + language + ':' + variant_type + ':' + transform_seed + ':' + params_hash)`

---

## Appendix C — Tier 1 / Tier 2 language tables (for copy/paste)

**Tier 1 (20):** en, zh, hi, es, fr, ar, bn, pt, ru, ur, id, de, ja, sw, mr, te, ta, tr, vi, ko

**Tier 2 (12):** it, pl, uk, fa, he, th, nl, ro, el, ha, fil, sr

