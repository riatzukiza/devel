# Adversarial Prompt Classifier — Research Scaffolding Plan

## Canonical attack taxonomy
Use these values for `attack_taxon`:
- `jailbreak`
- `prompt_injection`
- `policy_probe`
- `system_exfil`
- `tool_abuse`
- `obfuscation`
- `cost_attack`

Keep `intent_label ∈ {benign, adversarial}` as the primary label. Everything else is analysis.

---

## 1) Repo layout (scaffolding-first)

```
research/
  README.md
  configs/
    experiment.yaml
    suites.yaml
    models.yaml
    providers.yaml
    thresholds.yaml
  schema/
    prompts.schema.json
    variants.schema.json
    sessions.schema.json
    logs.schema.json
  data/
    raw/                # original sources (downloaded / mirrored)
    curated/            # cleaned + canonicalized
    derived/            # translations + suites + sessions
    splits/             # split manifests (cluster_id/source_id)
  src/
    ingest/
      sources/          # per-source loaders
      normalize.ts
      build_prompts.ts
      cluster_split.ts
    variants/
      translate.ts
      backtranslate.ts
      codemix.ts
      homoglyph.ts
      unicode.ts
      exhaustion.ts
    policy/
      router.ts
      p1_block.ts
      p5_system_risk.ts
      p7_full_stack.ts
      budgets.ts
      throttling.ts
    adapters/
      openai_compat.ts
      ollama.ts
      models_dev.ts
    eval/
      run_matrix.ts
      judge.ts
      metrics.ts
      plots.ts
    utils/
      hash.ts
      lang.ts
      seed.ts
      parquet.ts
      logging.ts
  outputs/
    runs/
      <run_id>/
        config.snapshot.yaml
        logs.jsonl
        metrics.json
        artifacts/
  docs/
    threat_model.md
    methods_dataset.md
    methods_experiment.md
    preregistration.md
```

Design principle: everything deterministic + replayable.

---

## 2) Data products and invariants

### 2.1 Prompt-level canonical dataset (`prompts.parquet`)
Columns:
- `source_id` (string; stable)
- `source_name` (dataset origin)
- `canonical_language` (usually `en` if you pivot)
- `canonical_text`
- `intent_label` (`benign|adversarial`)
- `attack_taxon` (one of the 7 above)
- `harm_category` (optional)
- `notes` (optional)
- `cluster_id` (string)
- `split` (`train|eval`)

### 2.2 Variants (`variants.parquet`)
Columns:
- `variant_id` (string; stable)
- `source_id`
- `language` (BCP-47)
- `text`
- `variant_type` (`native|mt|backtrans|codemix|homoglyph|unicode|exhaustion`)
- `transform_seed` (int)
- `translation_meta` (json: engine/model, direction, timestamp, confidence)
- `quality_flags` (json: backtrans_sim, drift, profanity, script_mismatch)
- `split` (inherits from `source_id`)

### 2.3 Sessions (`sessions.jsonl`)
Top-level:
- `session_id`
- `seed`
- `template_id`
- `source_id_set` (array)
- `turns` (array)

Turn object:
- `turn_index`
- `role` (`user|assistant|system|tool`)
- `variant_id`
- `attack_stage` (`benign|probe|attack|recovery`)
- `expected_policy_outcome` (`allow|block|throttle|budget_safe|budget_suspect|budget_hostile`)

### 2.4 The non-negotiable invariant (leakage control)
- Split at **cluster_id/source_id** before generating any variants.
- Generate translations/augmentations **separately** for train and eval.
- Eval-only suites are never fed into training.

---

## 3) Minimal config surface (YAML)

### `configs/experiment.yaml`
- `run_id`
- `seed`
- `policies: [P1, P5, P7]`
- `targets: [...]` (pinned model IDs)
- `languages: [...]` (top 20)
- `suites: [...]` (native, mt, codemix, homoglyph, unicode, exhaustion)
- `matrix_mode: tierA|tierB`

### `configs/thresholds.yaml`
- `tau_block`
- `tau_suspect`
- `tau_hostile`
- per-language override table

### `configs/suites.yaml`
- codemix: {mix_k: 2|3, ratio: 0.2, strategy: intra|inter, seed}
- homoglyph: {script_pairs, rate, seed, normalize_before: true|false}
- unicode: {zwj_rate, bidi_rate, tagset_rate, seed}
- exhaustion: {tokenizer: cl100k|llama, patterns, max_len}

---

## 4) Implementation plan (small steps)

### Step 1 — Schema + hashing utilities
- Stable IDs:
  - `source_id = sha256(source_name + ':' + raw_id_or_text_hash)`
  - `variant_id = sha256(source_id + ':' + language + ':' + variant_type + ':' + seed)`
- Hash every prompt/response for publishable logs.

### Step 2 — Ingest raw datasets → canonical prompts
- One loader per dataset source.
- Normalize text (Unicode NFKC, whitespace, newlines) but **store raw too**.
- Map labels to the canonical taxonomy.

### Step 3 — Cluster and split (leakage-proof)
- Embed `canonical_text` with a multilingual sentence embedding model.
- Cluster (HDBSCAN or agglomerative with cosine threshold).
- Split by `cluster_id`.

Deliverable: `splits/source_ids_train.txt`, `splits/source_ids_eval.txt`, plus `cluster_manifest.parquet`.

### Step 4 — Variant generation
- MT translate train and eval separately.
- Back-translate for drift scoring.
- Record metadata and quality flags.

### Step 5 — Eval-only robustness suites
- codemix (seeded, controlled, language-aware)
- homoglyph/unicode (seeded, togglable normalization)
- exhaustion (tokenizer-aware cost attacks)

### Step 6 — Policy router + adapters
- Implement router that takes `(messages, context)` and outputs `(decision, budgets, augmented_messages)`.
- Adapters for:
  - OpenAI-compatible
  - Ollama
  - models.dev gateway

### Step 7 — Runner + metrics
- Run matrix over `(policy × target × suite × language)`.
- Log everything to JSONL.
- Compute:
  - Safety: ASR/FNR by `attack_taxon`
  - Availability: FPR on benign
  - Cost: tokens, latency, calls, tool calls

---

## 5) Policy layer definitions (deterministic)

### P1 — Block
If `risk_score ≥ tau_block` → `BLOCK`.

### P5 — System-risk injection
Always allow; prepend system JSON snippet:
- `risk_score`, `risk_type`, `budgets`, `policy_reminders`

### P7 — Full-stack
Cascade:
1) classify → `risk_score`, `risk_type`
2) choose budget profile: `SAFE|SUSPECT|HOSTILE`
3) apply:
   - output token cap
   - tool-call cap
   - throttle (ms)
   - optional system-risk injection
4) HOSTILE can fall back to block or minimal refusal.

---

## 6) What to implement first (next concrete commit)

### MVP deliverables
1) `schema/*.schema.json`
2) `src/utils/hash.ts`, `src/utils/seed.ts`, `src/utils/lang.ts`
3) `src/ingest/normalize.ts`
4) `src/ingest/build_prompts.ts` (one dataset end-to-end)
5) `src/ingest/cluster_split.ts` (writes split manifests)

Once these exist, everything else composes.

---

## 7) Paper scaffolding docs
- `docs/threat_model.md` (attacker goals, capabilities, costs, assets)
- `docs/methods_dataset.md` (construction + split invariants)
- `docs/methods_experiment.md` (matrix + policies + metrics)
- `docs/preregistration.md` (claims you will and won’t make)

