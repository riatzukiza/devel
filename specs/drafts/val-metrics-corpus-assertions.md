# Validation Assertions: Metrics+Bundle and Curated Corpus

---

## Metrics and Bundle

### VAL-METRIC-001: def-metric macro registers metric in global registry
Calling `(def-metric my-metric {:description "..." :compute (fn [dataset params] ...)})` must register the metric by name in the metrics registry. After registration, `(registry/all-metrics)` must include `:my-metric`. Calling `def-metric` with a duplicate name must either overwrite-with-warning or error — not silently shadow.
Evidence: REPL evaluation of `def-metric` followed by `registry/all-metrics` lookup; duplicate-name test case.

### VAL-METRIC-002: def-metric enforces required keys
A `def-metric` form missing `:description` or `:compute` must fail at macro-expansion time with a clear error message naming the missing key. Optional keys (`:params`, `:assertion`) must be accepted but not required.
Evidence: Compile-time error output from malformed `def-metric` invocations; successful compilation of minimal valid form.

### VAL-METRIC-003: taxonomy-coverage computes correct proportion
Given a dataset where 8 of 10 leaf attack families have ≥10 prompts, `taxonomy-coverage` with `{:min-count 10}` must return `{:coverage 0.8 :missing [...]}` where `:missing` lists exactly the 2 uncovered families. With `:min-count 1` and all families present, coverage must be `1.0`.
Evidence: Unit test with synthetic dataset containing known family counts; assert exact coverage ratio and missing-family list.

### VAL-METRIC-004: taxonomy-coverage respects min-count parameter
Changing `:min-count` from 10 to 5 must change the coverage ratio if any families have counts between 5 and 9. The default value of `:min-count` must be 10 as declared in the metric's `:params` spec.
Evidence: Parameterized test varying `:min-count`; verify coverage changes monotonically as threshold decreases.

### VAL-METRIC-005: transform-coverage-matrix produces complete matrix
`transform-coverage-matrix` must return a matrix with one row per leaf attack family and one column per registered transform. Cells must contain variant counts (≥0). No family or transform may be missing from the matrix dimensions.
Evidence: Compare matrix dimensions against `(taxonomy/leaf-families)` count × `(registry/all-transforms)` count; verify no nil cells.

### VAL-METRIC-006: transform-coverage-matrix counts are accurate
For a known dataset with 3 MT variants of family F1, the matrix cell `[F1, :mt]` must equal 3. Families with no variants of a given transform must show 0, not nil or absent.
Evidence: Synthetic dataset with known variant→family→transform counts; assert each cell value.

### VAL-METRIC-007: language-coverage produces Language × Split × Label distribution
`language-coverage` must return counts grouped by `[:language :split :intent-label]`. Every combination present in the dataset must appear; combinations with zero count must be omitted (not zero-filled). The sum across all cells must equal the total dataset size.
Evidence: Unit test comparing grouped counts against manual aggregation of test dataset; assert sum invariant.

### VAL-METRIC-008: cluster-leakage-rate is always 0.0 on valid build
After a successful pipeline build, `cluster-leakage-rate` must return `{:rate 0.0 :leaks []}`. This is a structural invariant — any non-zero rate indicates a splitter bug, not a data quality issue.
Evidence: Run metric on every completed build; assert `(:rate result) = 0.0` and `(:leaks result)` is empty.

### VAL-METRIC-009: cluster-leakage-rate assertion fires on injected leakage
If a dataset is manually corrupted by assigning the same cluster to both `:train` and `:test` splits, `cluster-leakage-rate` must return a non-zero rate and the `:assertion` predicate `#(= 0.0 (:rate %))` must return false.
Evidence: Construct corrupted dataset with deliberate cross-split cluster; assert metric detects it.

### VAL-METRIC-010: semantic-diversity returns per-split values
`semantic-diversity` must return a map keyed by split (`:train`, `:dev`, `:test`) where each value is a mean pairwise cosine distance (float in [0.0, 2.0]). All three splits must be present.
Evidence: Run on build output; verify all three split keys present with numeric values in valid range.

### VAL-METRIC-011: semantic-diversity uses embeddings correctly
Semantic diversity must be computed from the same embedding model used in the pipeline's `:embedding` config. Using a different model must produce different values. Values must be non-zero for any non-trivial dataset.
Evidence: Compare diversity values between runs with different embedding models; verify non-zero for dataset with >1 prompt per split.

### VAL-METRIC-012: transform-fidelity computes backtranslation scores
`transform-fidelity` must return BLEU and/or chrF scores for MT variants that have backtranslation data. Variants without backtranslation must be excluded, not scored as 0.
Evidence: Run on dataset containing MT variants with and without backtranslation; verify only backtranslated variants are scored.

### VAL-METRIC-013: transform-fidelity scores are in valid range
BLEU scores must be in [0.0, 1.0] (or [0, 100] depending on scale — must be consistent). chrF scores must be in [0.0, 1.0]. No NaN or nil values.
Evidence: Assert range constraints on all returned scores; check for NaN/nil.

### VAL-METRIC-014: label distribution report contains all labels
The label distribution report must include counts for every `def-intent-label` in the registry (`:benign`, `:adversarial`, `:ambiguous` at minimum). Missing labels must appear with count 0, not be omitted.
Evidence: Verify report keys match `(registry/all-intent-labels)`; check sum equals total dataset size.

### VAL-METRIC-015: label distribution report is per-split
Label distribution must be broken down by split (`:train`, `:dev`, `:test`). Per-split sums must equal split sizes. Cross-split sum must equal total.
Evidence: Assert per-split count sums match known split sizes; assert grand total.

### VAL-METRIC-016: language × attack_family matrix is complete
The distribution matrix must have dimensions `|languages| × |attack_families|` with integer counts. Every language present in the dataset must appear as a row; every attack family as a column.
Evidence: Verify matrix dimensions; assert no nil cells; assert row/column sums match per-language and per-family totals.

### VAL-METRIC-017: datasheet follows Gebru et al. 2021 format
Generated datasheet must contain all sections required by the Gebru et al. (2021) template: Motivation, Composition, Collection Process, Preprocessing, Uses, Distribution, Maintenance. Section headers must match the template. No section may be empty.
Evidence: Parse generated datasheet; check for presence of all required section headers; assert non-empty content in each.

### VAL-METRIC-018: datasheet contains dataset-specific values
The datasheet must include actual values from the build: total prompt count, total variant count, language list, source datasets, license information, build seed, and version. Placeholder text (e.g., "[TODO]", "TBD") must not appear.
Evidence: Grep generated datasheet for placeholder patterns; verify numeric values match build manifest.

### VAL-METRIC-019: bundle contains all required artifacts
The reproducibility bundle must contain: `prompts.parquet`, `variants.parquet`, `manifests/` directory (with per-stage manifests), `checksums.sha256`, `verification_report.edn`, `datasheet.md`, and `build_manifest.edn`.
Evidence: List bundle directory contents; assert presence of each required file/directory.

### VAL-METRIC-020: bundle parquet files are valid and readable
`prompts.parquet` and `variants.parquet` must be valid Parquet files readable by polars/pyarrow. Schema must match the prompt record and variant record specs (Section 5.1, 5.2). Row counts must match build manifest totals.
Evidence: Read each parquet file; verify schema columns; assert row count equals manifest's `:total-prompts` / `:total-variants`.

### VAL-METRIC-021: bundle checksums are correct
Every file listed in `checksums.sha256` must exist in the bundle. Every checksum must match the actual SHA-256 hash of the corresponding file. No files in the bundle (except `checksums.sha256` itself) may be missing from the checksum file.
Evidence: Recompute SHA-256 of every bundle file; compare against stored checksums; verify file coverage.

### VAL-METRIC-022: bundle verification_report matches live verification
Running the verification suite on the bundle's parquet data must produce results identical to the stored `verification_report.edn`. All checks must pass.
Evidence: Run verification suite on bundle data; diff results against stored report; assert exact match.

### VAL-METRIC-023: bundle build manifest is complete
The top-level `build_manifest.edn` must contain: `:dataset-name`, `:version`, `:build-seed`, `:git-commit`, `:stages` (with status and hash for each of the 7 stages), `:taxonomy-version`, `:taxonomy-hash`, `:total-prompts`, `:total-variants`, `:verification` (with `:passed true` and `:report` path).
Evidence: Parse build manifest; assert presence and non-nil value of every required key; verify `:verification :passed` is true.

### VAL-METRIC-024: Stage 7 (Verification) runs all defined checks
Stage 7 must execute every check in the verification suite: `:cluster-disjoint-splits`, `:variant-split-consistency`, `:tier1-coverage-complete`, `:label-distribution-sane`, `:duplicate-detection`, `:language-coverage-report`. Results must include pass/fail status and detail for each.
Evidence: Verify the verification report contains an entry for each check name; assert each has `:passed` key and `:detail` key.

### VAL-METRIC-025: Stage 7 fatal checks block build completion
If any check marked `:fatal true` fails (`:cluster-disjoint-splits`, `:variant-split-consistency`, `:duplicate-detection`), the build must fail and not produce a bundle. Non-fatal failures (`:tier1-coverage-complete`, `:label-distribution-sane`) must produce warnings but allow build completion.
Evidence: Inject failures for each check type; verify fatal failures abort build; non-fatal failures produce warnings but complete.

### VAL-METRIC-026: per-stage manifests contain required fields
Each stage manifest must contain: `:stage`, `:version`, `:started-at`, `:completed-at`, `:seed`, `:input-hash`, `:output-hash`, `:artifact-count`, `:config-hash`, `:checksums`. Timestamps must be valid ISO-8601.
Evidence: Parse each stage manifest; assert all required keys present; validate timestamp format.

### VAL-METRIC-027: CLI `promptbench build` produces complete bundle
Running `promptbench build --config pipelines/v1.edn --seed 1337` must execute all 7 stages and produce the full reproducibility bundle at the configured output path. Exit code must be 0 on success.
Evidence: Execute CLI command; verify exit code; verify bundle directory contents match VAL-METRIC-019.

### VAL-METRIC-028: CLI `promptbench verify` validates existing build
Running `promptbench verify --config pipelines/v1.edn` on a completed build must execute the verification suite and report results. Exit code 0 if all checks pass; non-zero if any fatal check fails.
Evidence: Run verify on valid build (expect exit 0); run on corrupted build (expect non-zero exit).

### VAL-METRIC-029: CLI `promptbench coverage` generates coverage report
Running `promptbench coverage --config pipelines/v1.edn --format markdown` must output a markdown-formatted coverage report including taxonomy coverage, transform coverage matrix, and language coverage. Report must be parseable markdown.
Evidence: Execute CLI command; verify output contains expected section headers; validate markdown structure.

### VAL-METRIC-030: CLI `promptbench rebuild` re-executes from specified stage
Running `promptbench rebuild --config pipelines/v1.edn --from transforms` must re-execute stages 4–7 (transforms, suites, verify) while preserving stages 0–3 outputs. Downstream stage hashes must change if transform config changed; upstream hashes must remain identical.
Evidence: Record stage hashes before rebuild; modify transform config; rebuild from transforms; verify upstream hashes unchanged and downstream hashes changed.

### VAL-METRIC-031: metrics are computable from dataset metadata alone
All defined metrics must be computable from the parquet files and manifests in the bundle without re-running the pipeline. The `:compute` function of each metric must accept a loaded dataset and params, not require pipeline state.
Evidence: Load bundle parquet files; run each registered metric's `:compute` function; verify all return valid results.

### VAL-METRIC-032: metric assertion predicates are evaluated
Metrics with `:assertion` predicates (e.g., `cluster-leakage-rate`) must have their assertions evaluated during Stage 7. A failing assertion on a metric must be reported in the verification report with the metric name and actual value.
Evidence: Verify `cluster-leakage-rate` assertion appears in verification report; inject metric failure and verify assertion failure is recorded.

---

## Curated Corpus

### VAL-CORPUS-001: curated source definition is valid
`curated-persona-injections` source definition must contain all required keys: `:description`, `:path`, `:version`, `:license`, `:format`, `:schema`, `:taxonomy-mapping`. The `:url` field must be `nil` (local corpus). The `:path` must point to an existing directory.
Evidence: Evaluate source definition; verify all keys present; assert `:url` is nil; verify `:path` directory exists.

### VAL-CORPUS-002: curated prompts load from JSONL format
All files in `data/curated/persona-injections/` must be valid JSONL. Each line must parse as a JSON object matching the declared schema: `{:prompt :string :family :keyword :notes :string}`. No lines may fail parsing.
Evidence: Parse all JSONL files; assert each line has required keys; report any parse failures.

### VAL-CORPUS-003: curated taxonomy mappings resolve to registered families
Every value in the curated source's `:taxonomy-mapping` (`:persona-injection`, `:authority-impersonation`, `:developer-mode`) must correspond to a registered attack family via `def-attack-family`. Unmapped family strings must cause a warning at fetch time.
Evidence: Cross-reference taxonomy-mapping values against `(registry/all-families)`; assert all resolve.

### VAL-CORPUS-004: persona-injection family is fully defined
The `persona-injection` attack family must be registered with: `:description`, `:category :jailbreak`, `:severity :high`, `:parent :identity-manipulation`, non-empty `:tags`, non-empty `:signatures`, non-empty `:transforms` affinity map, and non-empty `:gen-hints`.
Evidence: Query registry for `:persona-injection`; assert all fields present and non-empty.

### VAL-CORPUS-005: authority-escalation family is defined
An attack family for authority escalation / authority impersonation must be registered in the taxonomy. It must have `:parent` linking to an ancestor in the harm-category hierarchy (e.g., `:identity-manipulation` or `:jailbreak`).
Evidence: Query registry for the authority-related family; verify `:parent` resolves in harm-category hierarchy.

### VAL-CORPUS-006: developer-mode family is defined
A `developer-mode` attack family must be registered in the taxonomy with appropriate `:category`, `:severity`, `:signatures`, and `:transforms` affinity map. It must be a descendant of `:jailbreak` in the hierarchy.
Evidence: Query registry; verify `(taxonomy/descendants :jailbreak)` includes `:developer-mode`.

### VAL-CORPUS-007: novel families appear in taxonomy hierarchy
All curated-corpus attack families (`:persona-injection`, `:authority-impersonation`, `:developer-mode`) must appear as children of their declared parent in the harm-category hierarchy. `(taxonomy/descendants :adversarial)` must include all three.
Evidence: Call `(taxonomy/descendants :adversarial)` and verify inclusion of all three families.

### VAL-CORPUS-008: curated prompts are ingested in Stage 0 (Fetch)
After Stage 0 completes, the raw data directory must contain curated prompts alongside public dataset prompts. Curated prompts must retain their `:source` metadata pointing to `curated-persona-injections`.
Evidence: Inspect Stage 0 output; filter records by source; verify curated prompt count matches input file line count.

### VAL-CORPUS-009: curated prompts are canonicalized
After Stage 1, curated prompts must have: NFKC-normalized text, collapsed whitespace, SHA-256 canonical hash, assigned `canonical-lang`, mapped `intent-label` (`:adversarial`), and mapped `attack-family` from taxonomy-mapping.
Evidence: Inspect Stage 1 output records for curated source; verify all canonical fields populated.

### VAL-CORPUS-010: curated prompts are embedded and clustered
Curated prompts must receive embeddings from the same model as all other prompts and be assigned cluster IDs by HDBSCAN. Curated prompts may form their own clusters or join existing ones — both are valid. No curated prompt may have a nil cluster assignment (noise points must be handled).
Evidence: Inspect Stage 2 output; verify curated-source prompts have non-nil `:cluster-id` and embedding vectors.

### VAL-CORPUS-011: curated prompts participate in cluster-disjoint splits
Curated prompts must be split at the cluster level, not the prompt level. If a curated prompt's cluster is assigned to `:test`, all prompts in that cluster (including non-curated) are in `:test`. No special treatment for curated prompts in splitting.
Evidence: Verify curated prompts' split assignments match their cluster assignments; verify no cluster straddles splits.

### VAL-CORPUS-012: curated prompts receive transform variants
Curated prompts must receive transform variants (MT, code-mix, homoglyph, exhaustion) according to their attack family's `:transforms` affinity map. Persona-injection prompts with `:mt :high` affinity must have MT variants for all Tier-1 languages.
Evidence: Count variants per curated source-id; verify MT variants exist for all Tier-1 languages for high-affinity transforms.

### VAL-CORPUS-013: curated variants inherit split from source
All variants generated from curated prompts must inherit the split assignment of their source prompt. A curated prompt in `:test` must have all its variants in `:test`.
Evidence: Join variants to sources on `:source-id`; assert all variant `:split` values match source `:split`.

### VAL-CORPUS-014: full pipeline run includes curated source
When the pipeline runs with `curated-persona-injections` in `:sources`, the build manifest must list it as a processed source. The total prompt count must be greater than a build without the curated source.
Evidence: Run pipeline with and without curated source; compare build manifests; verify prompt count difference equals curated input count.

### VAL-CORPUS-015: curated prompts appear in coverage analysis
The coverage report must show curated-corpus attack families (`:persona-injection`, `:authority-impersonation`, `:developer-mode`) as covered. The taxonomy-coverage metric must reflect their contribution — removing the curated source must reduce coverage if those families have no other source.
Evidence: Run `taxonomy-coverage` with and without curated source; verify curated-only families appear in `:missing` when source is excluded.

### VAL-CORPUS-016: curated source license is preserved
All prompt records originating from `curated-persona-injections` must carry `:license :gpl-3.0` in their `:source` metadata. This must propagate to variants and appear in the datasheet.
Evidence: Filter records by source; assert all have `:license :gpl-3.0`; verify datasheet lists GPL-3.0 among dataset licenses.

### VAL-CORPUS-017: curated corpus version is tracked
The curated source `:version "0.1.0"` must appear in the build manifest's source inventory. Changing the curated corpus content without updating the version must be detectable via hash comparison.
Evidence: Verify build manifest lists curated source version; modify curated file without version bump; verify stage hash changes.

### VAL-CORPUS-018: reproducibility — same seed produces identical output
Two full pipeline builds from the same seed (1337), same config, same curated corpus content must produce byte-identical parquet files and identical checksums. No non-determinism from curated source processing.
Evidence: Run pipeline twice with seed 1337; compare SHA-256 checksums of all output files; assert identical.

### VAL-CORPUS-019: curated prompts are deduplicated against public datasets
If a curated prompt is textually identical (after canonicalization) to a prompt from a public source, it must be detected as a duplicate. The dedup policy must be documented: keep curated, keep public, or merge metadata.
Evidence: Insert a known duplicate; run pipeline; verify duplicate-detection check identifies it; verify the resolution policy is applied.

### VAL-CORPUS-020: curated corpus directory structure is valid
The `data/curated/persona-injections/` directory must exist and contain at least one `.jsonl` file. Empty directories or non-JSONL files must be ignored or produce warnings, not crash the pipeline.
Evidence: Verify directory exists with JSONL files; test with empty directory (expect graceful warning); test with non-JSONL file (expect skip with warning).

### VAL-CORPUS-021: final bundle includes curated-source provenance
The generated bundle must allow tracing any prompt back to its curated source file. Given a prompt record with `:source {:dataset :curated-persona-injections :row-id 42}`, the original JSONL file and line must be recoverable.
Evidence: Select a curated prompt from the bundle; use `:source` metadata to locate original JSONL line; verify text matches.

### VAL-CORPUS-022: coverage analysis reports curated-family transform gaps
The coverage analysis must specifically report any curated-corpus attack families that lack expected transform variants. If `:developer-mode` has no MT variants due to affinity configuration, this must appear in the coverage report as an intentional gap, not an omission.
Evidence: Review coverage report for curated families; verify gaps are reported with affinity-based justification.

---

## Cross-Area Flows

### VAL-CROSS-001: end-to-end pipeline run completes all 7 stages
A full `pipeline/build!` invocation must execute Stages 0–7 (Fetch, Canonicalize, Embed+Cluster, Split, Transforms, Suites, Verify) in order. Each stage must produce a stage manifest. The build manifest must show all stages with `:status :complete`.
Evidence: Run full build; parse build manifest; assert 7 stage entries all with `:status :complete`; verify each stage manifest file exists.

### VAL-CROSS-002: reproducibility — identical seed yields identical output
Two independent `pipeline/build!` runs with seed 1337 and identical configuration must produce byte-identical parquet files, identical checksums, and identical verification reports. The only differences permitted are timestamps in manifests.
Evidence: Run build twice; compute SHA-256 of all output parquet files; assert identical; diff verification reports (ignoring timestamps).

### VAL-CROSS-003: reproducibility — different seed yields different output
A build with seed 1337 and a build with seed 42 must produce different output files (different checksums, potentially different split assignments and variant text). The structure and schema must remain identical.
Evidence: Run builds with two seeds; assert at least one parquet checksum differs; verify schema columns are identical.

### VAL-CROSS-004: full provenance chain — variant traceable to source
For any variant record in `variants.parquet`, following `:source-id` must locate exactly one canonical prompt in `prompts.parquet`. That prompt's `:source` metadata must identify the origin dataset and row. The chain `variant → canonical prompt → source dataset` must be unbroken for 100% of variants.
Evidence: Join variants to prompts on `:source-id`; assert zero orphan variants; assert all prompts have valid `:source` metadata.

### VAL-CROSS-005: full provenance chain — transform metadata is complete
Every variant record must have non-nil `:transform-chain`, `:transform-seed`, and `:metadata`. The transform chain must reference only registered transforms. The metadata must contain all keys declared in the transform's `:provenance` spec.
Evidence: For each variant, verify `:transform-chain` elements are registered transforms; verify metadata keys match provenance spec.

### VAL-CROSS-006: taxonomy extensibility — add new family, regenerate
After adding a new `def-attack-family :test-new-family` with curated prompts, running `pipeline/rebuild! :from :fetch` must produce a dataset that includes the new family in coverage matrices, taxonomy queries, and distribution reports. No code changes outside the taxonomy definition and source data should be required.
Evidence: Define new family; add curated prompts tagged with it; rebuild; verify new family appears in `taxonomy-coverage`, `transform-coverage-matrix`, and label distribution.

### VAL-CROSS-007: taxonomy extensibility — new family gets transform variants
The newly added attack family must receive transform variants according to its `:transforms` affinity map, identical to how existing families are processed. Coverage matrix must show non-zero cells for the new family.
Evidence: After rebuild with new family, inspect `transform-coverage-matrix`; verify non-zero variant counts for high-affinity transforms.

### VAL-CROSS-008: taxonomy extensibility — coverage metric reflects addition
After adding a new family with prompts, `taxonomy-coverage` must increase (or remain at 1.0 if previously complete). The new family must not appear in the `:missing` list.
Evidence: Compare `taxonomy-coverage` before and after adding new family; assert new family is in covered set.

### VAL-CROSS-009: CLI build workflow produces verifiable bundle
The sequence `promptbench build --config pipelines/v1.edn --seed 1337` followed by `promptbench verify --config pipelines/v1.edn` must succeed (both exit code 0). The verify step must confirm all checks pass against the build output.
Evidence: Execute both CLI commands in sequence; assert both exit 0; verify verification report shows all checks passed.

### VAL-CROSS-010: CLI coverage workflow reports all metrics
Running `promptbench coverage --config pipelines/v1.edn --format markdown` after a successful build must include: taxonomy-coverage ratio, transform-coverage-matrix, language-coverage breakdown, label distribution, and semantic-diversity scores.
Evidence: Parse coverage output; assert presence of each metric section with non-empty content.

### VAL-CROSS-011: CLI rebuild workflow preserves upstream stages
Running `promptbench rebuild --config pipelines/v1.edn --from transforms` must not re-execute fetch, canonicalize, embed, cluster, or split stages. Stage manifests for stages 0–3 must retain their original timestamps and hashes. Only stages 4–7 must have new manifests.
Evidence: Record timestamps of all stage manifests before rebuild; rebuild from transforms; assert stages 0–3 manifests unchanged; stages 4–7 manifests updated.

### VAL-CROSS-012: pipeline stages are idempotent
Running `pipeline/build!` twice without any config or data changes must produce identical output. Stage hashes and checksums must be identical between runs. No duplicate records may be created.
Evidence: Run build twice; diff all output file checksums; assert identical; assert row counts unchanged.

### VAL-CROSS-013: verification report cross-references metrics
The verification report produced in Stage 7 must include metric computation results (at minimum: `cluster-leakage-rate`, `taxonomy-coverage`, `label-distribution-sane`, `duplicate-detection`). Metric results must match what `def-metric` computations return when run independently on the same data.
Evidence: Extract metric values from verification report; run metrics independently; assert identical results.

### VAL-CROSS-014: manifest chain integrity
Each stage's `:input-hash` must equal the previous stage's `:output-hash`. Stage 0's `:input-hash` must equal the hash of the pipeline config. The chain `config → stage0 → stage1 → ... → stage7` must be unbroken.
Evidence: Parse all stage manifests; verify input-hash/output-hash chaining; verify stage 0 input-hash matches config hash.

### VAL-CROSS-015: bundle is self-contained and portable
The reproducibility bundle must be usable without access to the original pipeline code for verification purposes. `promptbench verify` operating on just the bundle directory must be able to validate checksums, read parquet files, and confirm structural invariants.
Evidence: Copy bundle to a clean directory; run verify pointing only at the bundle; assert all checksum and structural checks pass.
