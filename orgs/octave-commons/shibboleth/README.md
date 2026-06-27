# Shibboleth

**A generative Clojure DSL for publication-grade adversarial prompt evaluation datasets.**

Existing safety benchmarks are static artifacts that decay as models evolve.
Shibboleth presents a generative DSL where the attack taxonomy is extensible,
transforms are first-class composable constructs, and the dataset regenerates
with full provenance and reproducibility. Every build produces a self-contained
bundle with a Gebru et al. datasheet, SHA-256 manifests, and cluster-disjoint
splits that are leakage-proof by construction.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [DSL Reference](#dsl-reference)
- [Pipeline Stages](#pipeline-stages)
- [CLI Usage](#cli-usage)
- [Metrics](#metrics)
- [Testing](#testing)
- [Architecture](#architecture)
- [License](#license)

## Overview

Shibboleth is a seven-stage pipeline driven by a Clojure DSL that defines
attack families, harm categories, intent labels, data sources, transforms,
and evaluation metrics as first-class registerable constructs. The pipeline
fetches prompts from heterogeneous sources, canonicalizes them, embeds and
clusters via a Python bridge (sentence-transformers, HDBSCAN), performs
cluster-disjoint stratified splitting, applies multilingual transforms
(machine translation, code-mixing, homoglyph substitution, token exhaustion),
runs verification checks, and emits a reproducibility bundle with Parquet
output, stage manifests, and a Gebru et al. 2021 datasheet.

Key properties:

- **Generative, not static** — the taxonomy and dataset are regenerated from
  DSL definitions, not hand-curated CSVs.
- **Leakage-proof splits** — cluster-level disjointness guarantees no semantic
  leakage between train/dev/test.
- **Full provenance** — every variant record traces back to its source prompt,
  transform chain, seed, and engine version.
- **Reproducible** — deterministic seeds at every stage; same seed + same source
  versions = byte-identical output.
- **Extensible** — new attack families, transforms, sources, and metrics are
  added by writing DSL definitions, not modifying pipeline code.

## Installation

### Prerequisites

| Dependency | Version | Purpose |
|---|---|---|
| JVM (OpenJDK) | 21+ | Clojure runtime |
| Clojure CLI | 1.12.0+ | `clj` / `clojure` commands |
| Python | 3.12+ | Embedding, clustering, Parquet I/O |
| Babashka | 1.3+ | Task runner (`bb`) |

### Clone and install dependencies

```bash
git clone https://github.com/octave-commons/shibboleth.git
cd shibboleth

# Install Clojure dependencies (downloaded on first run)
clj -P

# Install Python packages (sentence-transformers, hdbscan, polars)
pip install sentence-transformers hdbscan polars
```

### Environment variables

Create a `.env` file (git-ignored) or export directly:

```bash
export PROXY_AUTH_TOKEN=<your-open-hax-proxy-token>
```

`PROXY_AUTH_TOKEN` authenticates against the OpenAI-compatible MT proxy at
`127.0.0.1:8789` used by Stages 4–5 for GPT-5.2 machine translation.

## Quick Start

```bash
# Run the full pipeline build
clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337

# Verify an existing build
clj -M -m promptbench.core verify --config pipelines/v1.edn

# Generate a coverage report
clj -M -m promptbench.core coverage --config pipelines/v1.edn --format markdown

# Rebuild from a specific stage (invalidates downstream)
clj -M -m promptbench.core rebuild --config pipelines/v1.edn --from transforms

# Run the test suite
clj -M:test
# or via Babashka
bb test
```

## DSL Reference

All DSL macros register constructs in atom-backed registries with
`clojure.spec` validation. Registration is idempotent within a session
and throws on invalid specs or duplicates.

### `def-attack-family`

Define an attack family in the taxonomy.

```clojure
(require '[promptbench.taxonomy.families :refer [def-attack-family]])

(def-attack-family persona-injection
  {:description "Injects a fictional persona to override system instructions"
   :category    :jailbreak
   :severity    :high
   :tags        #{:persona :system-prompt-spoofing}
   :signatures  [{:pattern :nested-system-prompt :description "Nested system prompt"}]
   :transforms  {:mt       {:affinity :high  :note "Translatable attack"}
                 :homoglyph {:affinity :medium :note "Visual obfuscation"}}})
```

**Required:** `:description` (string), `:category` (keyword).
**Optional:** `:severity`, `:parent`, `:tags`, `:signatures`, `:transforms`, `:gen-hints`.

The `:transforms` affinity map drives Stage 4–6 transform selection:
`:high` = always applied, `:medium` = probabilistic (seed-controlled),
`:low` = opt-in, `:none` = never.

### `def-harm-category`

Define a node in the harm category hierarchy.

```clojure
(require '[promptbench.taxonomy.categories :refer [def-harm-category]])

(def-harm-category :jailbreak
  {:description "Attempts to bypass safety training"
   :parent      :adversarial
   :children    [:identity-manipulation :instruction-injection]})
```

**Required:** `:description`.
**Optional:** `:parent`, `:children`.

### `def-intent-label`

Define an intent label with polarity-conditional requirements.

```clojure
(require '[promptbench.taxonomy.labels :refer [def-intent-label]])

(def-intent-label :adversarial
  {:description "Adversarial prompt"
   :polarity    :unsafe
   :requires    [:attack-family :harm-category]})
```

**Polarity constraints:**
- `:safe` — no `:requires` needed.
- `:unsafe` — must require `[:attack-family :harm-category]`.
- `:contested` — must require `[:rationale]`.

### `def-source`

Register a dataset source with provenance metadata.

```clojure
(require '[promptbench.pipeline.sources :refer [def-source]])

(def-source aya-redteaming
  {:description      "Aya Red Team dataset"
   :url              "https://huggingface.co/datasets/CohereForAI/aya_redteaming"
   :version          "1.0.0"
   :license          :apache-2.0
   :format           :parquet
   :schema           {:prompt :string :language :string}
   :taxonomy-mapping {:harm_category {"illegal_activity" :illegal-activity}}})
```

**Required:** `:description`, `:version`, `:license`, `:format`, and either `:url` or `:path`.

### `def-transform`

Declare a transform with type metadata and optional implementation.

```clojure
(require '[promptbench.transform.core :refer [def-transform]])

(def-transform mt
  {:description   "Machine translation to target language"
   :type          :linguistic
   :deterministic false
   :reversible    :approximate
   :params-spec   {:target-lang {:type :keyword :required true}}
   :provenance    [:engine :target-lang :model-version :timestamp]
   :impl          (fn [{:keys [text config seed]}] ...)})
```

**Types:** `:linguistic`, `:obfuscation`, `:resource-attack`.

### `def-transform-chain`

Compose transforms into reusable named chains.

```clojure
(require '[promptbench.transform.core :refer [def-transform-chain]])

(def-transform-chain ja-codemix-obfuscated
  {:description "Japanese MT → code-mix → homoglyph"
   :steps [{:transform :mt       :config {:target-lang :ja}}
           {:transform :code-mix :config {:l2 :en :mix-rate 0.25}}
           {:transform :homoglyph :config {:rate 0.1}}]})
```

### `def-metric`

Define a first-class metric with an optional assertion predicate.

```clojure
(require '[promptbench.metrics.core :refer [def-metric]])

(def-metric taxonomy-coverage
  {:description "Proportion of leaf attack families with ≥ N prompts"
   :params      {:min-count {:type :int :default 10}}
   :compute     (fn [dataset params] ...)
   :assertion   #(> (:coverage %) 0.8)})
```

Assertions are evaluated after computation; their pass/fail status is
attached as metadata and reported in Stage 7.

### `def-pipeline`

Declare a pipeline configuration programmatically.

```clojure
(require '[promptbench.pipeline.core :refer [def-pipeline]])

(def-pipeline my-pipeline
  {:version   "0.1.0"
   :seed      1337
   :sources   [:aya-redteaming :harmbench]
   :embedding {:model "intfloat/multilingual-e5-large" :batch-size 256}
   :clustering {:min-cluster-size 5 :metric :cosine}
   :split     {:train 0.70 :dev 0.15 :test 0.15
               :stratify-by [:intent-label :attack-family :canonical-lang]
               :constraint  :cluster-disjoint}
   :data-dir  "data"})
```

Pipelines can also be defined declaratively in EDN (see `pipelines/v1.edn`).

## Pipeline Stages

The pipeline executes seven stages in order. Stages are resumable (completed
stages are skipped) and idempotent.

| Stage | Name | Description |
|---|---|---|
| 0 | **Fetch** | Download/read prompts from registered sources (Parquet, CSV, JSONL, EDN). |
| 1 | **Canonicalize** | NFKC normalization, whitespace collapse, SHA-256 hashing, deduplication. |
| 2 | **Embed + Cluster** | Encode via `intfloat/multilingual-e5-large` (sentence-transformers), cluster with HDBSCAN. Noise points (cluster −1) become singletons. |
| 3 | **Split** | Cluster-disjoint stratified split into train/dev/test (70/15/15). Stratification dimensions: `intent-label`, `attack-family`, `canonical-lang`. No cluster appears in more than one split. |
| 4 | **Tier-1 MT** | Machine translation to 10 high-resource languages (es, fr, zh, ar, ja, hi, ru, pt, de, ko) via GPT-5.2 with backtranslation. |
| 5 | **Tier-2 MT** | Gated MT to 10 lower-resource languages (tl, sw, ur, bn, th, vi, id, tr, fa, he). |
| 6 | **Eval Suites** | Code-mixing (inter/intra-sentential at rates 0.1/0.25/0.5), homoglyph substitution (rates 0.1/0.15/0.25), and token exhaustion (1024/4096 tokens). Applied to test split only. |

**Stage 7 (Verification)** runs automatically after build:
cluster-disjoint-splits, variant-split-consistency, duplicate-detection,
label-distribution-sane, plus all registered metric assertions.

### Reproducibility bundle output

A successful build emits:

```
data/build/<version>/
├── prompts.parquet           # 12-column canonical prompt records
├── variants.parquet          # Transform variant records
├── manifests/                # Per-stage manifests with SHA-256 checksums
├── checksums.sha256          # File-level integrity checksums
├── verification_report.edn   # Stage 7 results
├── build_manifest.edn        # Top-level build metadata
└── datasheet.md              # Gebru et al. 2021 datasheet
```

The `prompts.parquet` schema (12 columns):

| Column | Type | Required |
|---|---|---|
| `source_id` | string | ✓ |
| `canonical_hash` | string | ✓ |
| `canonical_text` | string | ✓ |
| `canonical_lang` | string | ✓ |
| `intent_label` | string | ✓ |
| `attack_family` | string | |
| `harm_category` | string | |
| `source_dataset` | string | |
| `source_row_id` | integer | |
| `source_license` | string | |
| `cluster_id` | integer | |
| `split` | string | ✓ |

## CLI Usage

Entry point: `promptbench.core/-main` (dispatches via `babashka/cli`).

```
promptbench — Generative DSL for Adversarial Prompt Evaluation Datasets

Commands:
  build       Run full pipeline build
  verify      Validate an existing build
  coverage    Generate coverage report
  rebuild     Re-execute from specified stage

Options:
  --config PATH    Pipeline config file (required)
  --seed N         Override build seed
  --from STAGE     Stage to rebuild from (rebuild only)
  --format FORMAT  Output format (coverage only, default: markdown)
```

### Examples

```bash
# Full build with explicit seed
clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337

# Verify existing build artifacts
clj -M -m promptbench.core verify --config pipelines/v1.edn

# Markdown coverage report to stdout
clj -M -m promptbench.core coverage --config pipelines/v1.edn --format markdown

# Rebuild from the transform stages only (preserves fetch/canonicalize/cluster/split)
clj -M -m promptbench.core rebuild --config pipelines/v1.edn --from transforms
```

**Exit codes:** 0 = success, 1 = verification failure / error, 2 = invalid arguments.

## Metrics

Six registered metrics, computable from dataset metadata alone (no pipeline
state required):

### Coverage metrics

| Metric | Description |
|---|---|
| `taxonomy-coverage` | Proportion of registered attack families with ≥ N prompts (default N=10). Returns `{:coverage ratio, :missing [families]}`. |
| `transform-coverage-matrix` | Family × transform coverage matrix. One row per registered family, one column per registered transform, values are variant counts. |
| `language-coverage` | Nested `{lang {split {label count}}}` distribution across languages, splits, and intent labels. |

### Quality metrics

| Metric | Description |
|---|---|
| `cluster-leakage-rate` | Proportion of non-noise clusters appearing in multiple splits. **Must be 0.0** on valid builds (enforced by assertion). |
| `semantic-diversity` | Per-split mean pairwise cosine distance in embedding space. Higher values indicate greater diversity within a split. |
| `transform-fidelity` | Mean BLEU and chrF scores between backtranslated MT variants and their original canonical text. Measures translation round-trip quality. |

### Supplementary analyses

- **Source contribution analysis** — coverage delta when specific sources are
  removed; identifies uniquely contributed families.
- **Transform gap analysis** — per-family report of missing transforms
  cross-referenced with affinity declarations. Priority flags for `:high`
  affinity gaps.

## Testing

The test suite uses the Cognitect test-runner:

```bash
# Via Clojure CLI
clj -M:test

# Via Babashka
bb test
```

**418 tests, 3129 assertions** covering:

- DSL macro registration and spec validation
- Taxonomy hierarchy traversal and coverage matrices
- All transform implementations (MT, code-mix, homoglyph, exhaustion)
- Transform chain composition and variant record provenance
- Pipeline stage orchestration and resumability
- Cluster-disjoint splitting and leakage verification
- Metric computation and assertion evaluation
- CLI dispatch and argument parsing
- Reproducibility bundle generation and datasheet formatting
- Curated corpus integration and end-to-end flows
- Manifest verification and schema validation

## Architecture

```
src/promptbench/
├── core.clj                    # Entry point, CLI dispatch
├── cli.clj                     # babashka/cli command definitions
├── corpus/
│   └── curated.clj             # Curated attack family definitions and sources
├── taxonomy/
│   ├── registry.clj            # Atom-backed registries, spec validation, queries
│   ├── families.clj            # def-attack-family macro
│   ├── categories.clj          # def-harm-category macro
│   └── labels.clj              # def-intent-label macro
├── transform/
│   ├── registry.clj            # Transform and chain registries
│   ├── core.clj                # def-transform, def-transform-chain, execution engine
│   ├── mt.clj                  # Machine translation via GPT-5.2 proxy
│   ├── codemix.clj             # Bilingual code-mixing (inter/intra-sentential)
│   ├── homoglyph.clj           # NFKC-reversible homoglyph substitution
│   └── exhaustion.clj          # Token exhaustion padding
├── pipeline/
│   ├── core.clj                # def-pipeline, build!, rebuild!, stage orchestration
│   ├── stages.clj              # Stages 0–3 implementation
│   ├── transform_stages.clj    # Stages 4–6 implementation
│   ├── splitter.clj            # Cluster-disjoint stratified splitting
│   ├── sources.clj             # def-source macro and source registry
│   └── manifest.clj            # Stage manifest generation and checksums
├── metrics/
│   ├── core.clj                # def-metric macro and computation engine
│   ├── coverage.clj            # taxonomy-coverage, transform-coverage-matrix, language-coverage
│   └── quality.clj             # cluster-leakage-rate, semantic-diversity, transform-fidelity
├── verification/
│   ├── core.clj                # Stage 7, verify!, parquet schema validation
│   └── checks.clj              # Individual verification check implementations
├── report/
│   ├── core.clj                # Label distribution and matrix formatting
│   ├── bundle.clj              # Reproducibility bundle generation
│   ├── datasheet.clj           # Gebru et al. 2021 datasheet generator
│   └── figures.clj             # Report figure generation
├── python/
│   ├── embed.clj               # sentence-transformers bridge (libpython-clj)
│   ├── cluster.clj             # HDBSCAN bridge (libpython-clj)
│   └── parquet.clj             # Polars Parquet I/O bridge (libpython-clj)
├── util/
│   └── crypto.clj              # SHA-256 hashing utilities
└── validation/
    └── integrity.clj           # Data integrity validation
```

### Python bridge

Shibboleth uses [libpython-clj](https://github.com/clj-python/libpython-clj)
to call Python libraries from the JVM without subprocess overhead:

- **sentence-transformers** — `intfloat/multilingual-e5-large` for L2-normalized
  multilingual embeddings (1024-dim).
- **HDBSCAN** — density-based clustering on cosine-distance embedding space.
- **Polars** — Parquet file I/O for the reproducibility bundle.

The Python runtime is initialized lazily on first use and handles NVIDIA
library paths, site-packages discovery, and MetadataPathFinder patching
automatically.

### Dependencies

```clojure
;; deps.edn
{org.clojure/clojure             "1.12.0"
 org.clojure/spec.alpha          "0.5.238"
 clj-python/libpython-clj        "2.025"
 cheshire/cheshire               "5.13.0"     ; JSON
 org.babashka/cli                 "0.8.67"     ; CLI parsing
 babashka/fs                      "0.5.27"     ; Filesystem utilities
 clj-http/clj-http               "3.13.0"}    ; HTTP client (MT proxy)
```

## License

Copyright © 2026. Released under the [GNU General Public License v3.0](LICENSE).

This software is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.
