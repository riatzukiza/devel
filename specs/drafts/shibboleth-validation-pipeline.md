# Shibboleth — Pipeline Spine Validation Assertions

---

## Bridge Layer

### VAL-PIPE-001: libpython-clj bridge initializes
The Clojure process successfully initializes the libpython-clj runtime and can evaluate a trivial Python expression (e.g., `1 + 1 == 2`). Failure to initialize is fatal to all downstream stages.
Evidence: Test that calls `(py/run-simple-string "assert 1+1==2")` completes without exception. Captured in `test/promptbench/python/bridge_test.clj`.

### VAL-PIPE-002: sentence-transformers loads and produces embeddings
Calling `embed-batch` with a small list of strings (≥2) returns a 2D numpy array / JVM matrix with shape `[n, dim]` where `dim` matches the model's known embedding dimension (1024 for multilingual-e5-large).
Evidence: Test passes a 3-element string list, asserts result shape is `[3, 1024]`, and asserts all values are finite floats (no NaN/Inf).

### VAL-PIPE-003: HDBSCAN clustering produces valid labels
Calling `cluster-embeddings` with a synthetic embedding matrix (≥20 rows, distinct clusters) returns an integer label array of the same length as inputs. Labels are either non-negative cluster IDs or `-1` (noise). At least one non-noise cluster is assigned.
Evidence: Test constructs 3 tight Gaussian blobs (20 points each), runs HDBSCAN, asserts label count equals input count, asserts `>= 1` distinct non-negative label, asserts no label exceeds input count.

### VAL-PIPE-004: Polars Parquet write produces a readable file
Calling `write-parquet` with a vector of maps writes a `.parquet` file to disk. The file exists, has size > 0, and can be opened by `read-parquet` without error.
Evidence: Test writes 5 records to a temp path, asserts file exists and size > 0, reads back and asserts record count matches.

### VAL-PIPE-005: Polars Parquet round-trip preserves data
A vector of prompt records written via `write-parquet` and read back via `read-parquet` produces records with identical field values (string, keyword, integer, and double types) for every row and column. Key fields tested: `:canonical-text`, `:canonical-hash`, `:cluster-id`, `:split`, `:intent-label`.
Evidence: Test writes 10 records with known values, reads back, asserts equality field-by-field. Covers string, keyword, integer, and double types explicitly.

---

## Stage 0 — Fetch

### VAL-PIPE-006: Fetch downloads source artifacts
Running Stage 0 (Fetch) for a configured source produces a raw file in `data/raw/` whose path and filename are deterministic given the source definition.
Evidence: Test invokes fetch for a single source (or a small fixture), asserts the expected file exists under `data/raw/`.

### VAL-PIPE-007: Fetch computes and stores checksums
After fetch, a checksum (SHA-256) of every downloaded file is computed and recorded in the stage manifest. The recorded checksum matches the actual hash of the file on disk.
Evidence: Test fetches a source, reads the stage-0 manifest, independently computes SHA-256 of each artifact, asserts match.

### VAL-PIPE-008: Fetch is idempotent
Running Stage 0 twice with the same configuration produces byte-identical artifacts and the same manifest checksum.
Evidence: Test runs fetch twice in sequence, computes SHA-256 of all outputs after each run, asserts both runs yield identical hashes.

---

## Stage 1 — Canonicalize

### VAL-PIPE-009: Canonicalization applies NFKC normalization
Every canonical text in the Stage 1 output is NFKC-normalized. Inputs containing non-NFKC codepoints (e.g., full-width Latin, compatibility characters) are transformed to their NFKC equivalents.
Evidence: Test provides inputs with known non-NFKC characters (e.g., `\uFF21` → `A`), asserts canonical output matches expected NFKC form.

### VAL-PIPE-010: Canonicalization collapses whitespace
Consecutive whitespace (spaces, tabs, newlines) is collapsed to a single space and leading/trailing whitespace is trimmed.
Evidence: Test provides inputs with `"  foo\t\tbar\n\nbaz  "`, asserts canonical output is `"foo bar baz"`.

### VAL-PIPE-011: Canonical hash is deterministic
The same input text always produces the same `canonical-hash` (SHA-256 of normalized text). Different texts produce different hashes.
Evidence: Test hashes the same string 100 times, asserts all hashes identical. Hashes two distinct strings, asserts hashes differ.

### VAL-PIPE-012: source_id generation is deterministic and unique
`source_id` is computed as `sha256(dataset-id + row-id + canonical-hash-prefix)`. The same input triple always yields the same `source_id`. Different triples yield different IDs.
Evidence: Test computes `source_id` for 5 known triples, asserts stability. Asserts uniqueness across a batch of 1000 records with distinct triples.

### VAL-PIPE-013: Taxonomy mapping resolves all source labels
Every `harm_category` (or equivalent field) in the source dataset maps to a known taxonomy keyword via the source's `:taxonomy-mapping`. Unmapped values are flagged or assigned a sentinel (e.g., `:unmapped`).
Evidence: Test provides records with both mapped and unmapped categories. Asserts mapped records carry correct taxonomy keywords. Asserts unmapped records carry `:unmapped` or equivalent, and are logged as warnings.

### VAL-PIPE-014: Canonicalize output contains all required fields
Every record emitted by Stage 1 contains: `:source-id`, `:canonical-hash`, `:canonical-text`, `:canonical-lang`, `:intent-label`, `:attack-family`, `:harm-category`, `:source` (with `:dataset`, `:row-id`, `:license`).
Evidence: Test runs Stage 1 on fixture data, asserts every output record has all required keys with non-nil values.

---

## Stage 2 — Embed + Cluster

### VAL-PIPE-015: All canonical prompts receive embeddings
Stage 2 produces an embedding for every record from Stage 1. No records are dropped.
Evidence: Test compares record count of Stage 1 output with Stage 2 output. Asserts counts are equal.

### VAL-PIPE-016: Embeddings are unit-normalized
All embeddings are L2-normalized (magnitude ≈ 1.0). This is required for cosine-distance clustering.
Evidence: Test computes L2 norm of each embedding vector, asserts all norms are within `[0.999, 1.001]`.

### VAL-PIPE-017: Every prompt receives a cluster_id
After HDBSCAN, every record in Stage 2 output has a `:cluster-id` field. The value is either a non-negative integer (assigned cluster) or `-1` (noise).
Evidence: Test asserts every record has `:cluster-id` key, value is an integer, and value is `>= -1`.

### VAL-PIPE-018: Cluster count is reasonable
The number of distinct non-noise clusters is `>= 2` and `<= N/min-cluster-size` where `N` is the total number of prompts. This catches degenerate cases (everything in one cluster, or every point is noise).
Evidence: Test asserts distinct non-negative cluster labels ≥ 2. Asserts cluster count ≤ ceiling(N / min-cluster-size).

---

## Stage 3 — Split

### VAL-PIPE-019: Cluster-level split disjointness (KEY INVARIANT)
No cluster ID appears in more than one split. Every prompt in a given cluster is assigned to the same split (train, dev, or test). This is THE critical leakage-prevention invariant.
Evidence: Test collects `(cluster-id, split)` pairs across all records. Groups by `cluster-id`. Asserts every cluster maps to exactly one split. This test MUST fail if even one cluster spans two splits.

### VAL-PIPE-020: Split proportions approximate target ratios
The actual split proportions are within ±5 percentage points of the configured targets (70/15/15 by default). Exact proportions are not required because cluster-level assignment is discrete.
Evidence: Test computes `count(split) / total` for each split. Asserts train ∈ [0.65, 0.75], dev ∈ [0.10, 0.20], test ∈ [0.10, 0.20].

### VAL-PIPE-021: Every prompt is assigned to exactly one split
No prompt appears in zero splits or in multiple splits. The union of all splits equals the full dataset.
Evidence: Test asserts every record has a non-nil `:split` value from `#{:train :dev :test}`. Asserts the total count across splits equals the Stage 2 record count. Asserts no `source-id` appears in more than one split.

### VAL-PIPE-022: Stratification respects configured dimensions
The split is stratified by `:intent-label`, `:attack-family`, and `:canonical-lang` as configured. Each stratum's split proportions are within ±10 percentage points of the target for strata with ≥ 30 members.
Evidence: Test groups records by each stratification key, computes per-group split proportions, asserts tolerance for sufficiently large groups.

### VAL-PIPE-023: Noise points (cluster_id = -1) are assigned to splits
Prompts with `cluster-id = -1` (HDBSCAN noise) are still assigned to a split. They are treated as singleton clusters for splitting purposes.
Evidence: Test asserts all records with `cluster-id = -1` have a valid `:split` value.

---

## Manifest System

### VAL-PIPE-024: Every stage produces a manifest
After each pipeline stage completes, a stage manifest EDN file is written. Manifests exist for: fetch, canonicalize, embed-cluster, split.
Evidence: Test runs the full pipeline, asserts manifest files exist at expected paths for each stage.

### VAL-PIPE-025: Stage manifest contains all required fields
Each stage manifest contains: `:stage`, `:version`, `:started-at`, `:completed-at`, `:seed`, `:input-hash`, `:output-hash`, `:artifact-count`, `:config-hash`, `:checksums`.
Evidence: Test reads each stage manifest, asserts all required keys are present and non-nil.

### VAL-PIPE-026: Manifest checksums match artifacts on disk
Every file listed in a stage manifest's `:checksums` map exists on disk and its SHA-256 matches the recorded value.
Evidence: Test iterates over every entry in each manifest's `:checksums`, computes SHA-256 of the file, asserts match.

### VAL-PIPE-027: Config hash changes when pipeline config changes
Modifying any pipeline configuration parameter (e.g., changing `:min-cluster-size` from 5 to 10) produces a different `:config-hash` in the resulting manifest.
Evidence: Test runs a stage with config A, records config-hash. Runs again with config B (one param changed), asserts config-hashes differ.

### VAL-PIPE-028: Build manifest aggregates all stage statuses
The top-level build manifest contains a `:stages` map with an entry for each stage. Each entry has `:status` and `:hash`. All stages show `:complete` after a full pipeline run.
Evidence: Test runs full pipeline, reads build manifest, asserts all stages present with `:status :complete` and non-nil `:hash`.

### VAL-PIPE-029: Artifact count in manifest matches actual output
The `:artifact-count` field in each stage manifest matches the actual number of records in the stage's output file(s).
Evidence: Test reads stage output (e.g., parquet row count), compares to manifest `:artifact-count`, asserts equality.

---

## Pipeline Orchestration

### VAL-PIPE-030: `def-pipeline` macro produces a valid pipeline definition
Invoking `def-pipeline` with a valid configuration map produces a var bound to a pipeline definition. The definition contains all configured stages, sources, and parameters.
Evidence: Test defines a minimal pipeline via the macro, asserts the resulting var is non-nil, contains `:sources`, `:canonicalize`, `:embedding`, `:clustering`, `:split`, and `:output` keys.

### VAL-PIPE-031: Pipeline executes stages in order
Stages execute in the defined order: Fetch → Canonicalize → Embed+Cluster → Split. Each stage's output is the input for the next. Skipping or reordering is not permitted in a fresh build.
Evidence: Test attaches a side-effecting log to each stage entry/exit. After `pipeline/build!`, asserts the log shows stages in exact order: fetch, canonicalize, embed-cluster, split.

### VAL-PIPE-032: Pipeline is resumable from last completed stage
If the pipeline is interrupted after Stage 1 completes (manifest written), calling `pipeline/resume!` skips Stage 0 and Stage 1, resuming from Stage 2.
Evidence: Test runs pipeline up to Stage 1 (`:up-to :canonicalize`). Calls `pipeline/resume!`. Asserts Stage 0 and Stage 1 are not re-executed (via side-effect log or timestamp comparison). Asserts Stage 2 and Stage 3 complete.

### VAL-PIPE-033: Pipeline is idempotent (full run)
Running the complete pipeline twice with identical configuration and seed produces byte-identical output artifacts and identical manifest checksums.
Evidence: Test runs full pipeline twice. Computes SHA-256 of all output parquet files and manifests after each run. Asserts all hashes match between runs.

### VAL-PIPE-034: `pipeline/rebuild!` invalidates downstream stages
Calling `pipeline/rebuild!` from Stage 1 (`:from :canonicalize`) re-executes Stages 1, 2, and 3 even if their manifests exist. Stage 0 is not re-executed.
Evidence: Test runs full pipeline. Records all manifest timestamps. Calls `rebuild! :from :canonicalize`. Asserts Stage 0 manifest timestamp unchanged. Asserts Stages 1-3 manifest timestamps are updated.

### VAL-PIPE-035: Pipeline respects seed for reproducibility
Two pipeline runs with the same seed produce identical cluster assignments and split assignments. Two runs with different seeds produce different assignments (with high probability).
Evidence: Test runs pipeline twice with seed=1337, asserts cluster_ids and splits are identical. Runs once with seed=42, asserts at least one cluster_id or split differs from the seed=1337 run.

### VAL-PIPE-036: `pipeline/build! :up-to` stops at the requested stage
Calling `pipeline/build!` with `:up-to :canonicalize` executes only Stage 0 and Stage 1. Stages 2 and 3 are not executed, and their manifests do not exist.
Evidence: Test calls `build! :up-to :canonicalize`. Asserts Stage 0 and Stage 1 manifests exist. Asserts Stage 2 and Stage 3 manifests do NOT exist.

---

## Verification Layer

### VAL-PIPE-037: cluster-disjoint-splits check passes on valid data
The `:cluster-disjoint-splits` verification check returns `{:passed true}` when no cluster spans multiple splits.
Evidence: Test constructs a dataset where clusters are cleanly split, runs the check, asserts `:passed` is `true` and `:detail` is empty.

### VAL-PIPE-038: cluster-disjoint-splits check FAILS on leaky data
The `:cluster-disjoint-splits` verification check returns `{:passed false}` with leaking cluster IDs in `:detail` when a cluster spans two splits.
Evidence: Test constructs a dataset where cluster 7 has records in both `:train` and `:test`. Runs the check. Asserts `:passed` is `false`. Asserts `:detail` contains cluster 7.

### VAL-PIPE-039: variant-split-consistency check detects mismatches
The `:variant-split-consistency` check returns `{:passed false}` when a variant's `:split` differs from its source prompt's `:split`.
Evidence: Test constructs a variant record whose `:split` is `:dev` while its source prompt's `:split` is `:test`. Runs the check. Asserts failure. Asserts the mismatched variant ID appears in `:detail`.

### VAL-PIPE-040: duplicate-detection check catches within-split duplicates
The `:duplicate-detection` check returns `{:passed false}` when two records within the same split share the same `canonical-hash`.
Evidence: Test constructs a split with two records having identical `canonical-hash`. Runs the check. Asserts failure and that the duplicate hash appears in `:detail`.

### VAL-PIPE-041: duplicate-detection check permits cross-split duplicates
Records with the same `canonical-hash` in different splits do NOT trigger the duplicate detection check (this is by design — canonical prompts are unique, but this tests the check's scope).
Evidence: Test constructs records with same `canonical-hash` in `:train` and `:test`. Runs the check. Asserts `:passed` is `true`. (Note: if the design forbids cross-split duplicates entirely, adjust assertion to fail.)

### VAL-PIPE-042: label-distribution-sane check detects extreme skew
The `:label-distribution-sane` check returns `{:passed false}` when a single label dominates (skew > 0.8) the dataset.
Evidence: Test constructs a dataset where 90% of records have `:intent-label :adversarial`. Runs the check. Asserts failure with skew stats in `:detail`.

### VAL-PIPE-043: Verification suite runner reports all checks
Running `pipeline/verify!` executes ALL registered verification checks and returns a report containing each check's name, `:passed` status, and `:detail`.
Evidence: Test runs `verify!` on a valid pipeline output. Asserts the report contains entries for `:cluster-disjoint-splits`, `:variant-split-consistency`, `:duplicate-detection`, and `:label-distribution-sane`. All show `:passed true`.

### VAL-PIPE-044: Fatal verification failure prevents pipeline completion
If a `:fatal true` check (e.g., `:cluster-disjoint-splits`) fails during `pipeline/build!`, the pipeline halts and does not write a final build manifest with `:verification {:passed true}`.
Evidence: Test introduces a cluster leak into Stage 3 output (via test fixture or mock). Runs `pipeline/build!`. Asserts the build manifest either does not exist or shows `:verification {:passed false}`.

---

## Parquet Schema

### VAL-PIPE-045: prompts.parquet contains full schema
The output `prompts.parquet` file contains columns for: `source_id`, `canonical_hash`, `canonical_text`, `canonical_lang`, `intent_label`, `attack_family`, `harm_category`, `source_dataset`, `source_row_id`, `source_license`, `cluster_id`, `split`.
Evidence: Test reads `prompts.parquet` schema (column names), asserts all 12 columns are present.

### VAL-PIPE-046: Parquet column types are correct
String columns (`source_id`, `canonical_hash`, `canonical_text`, `canonical_lang`, `intent_label`, `attack_family`, `harm_category`, `source_dataset`, `source_license`, `split`) are stored as UTF-8 strings. Integer columns (`source_row_id`, `cluster_id`) are stored as integers.
Evidence: Test reads parquet schema with type info, asserts each column's physical/logical type matches expectations.

### VAL-PIPE-047: No null values in required Parquet columns
The columns `source_id`, `canonical_hash`, `canonical_text`, `split`, and `cluster_id` contain zero null values.
Evidence: Test reads the parquet file, counts nulls per column for required fields, asserts all counts are zero.
