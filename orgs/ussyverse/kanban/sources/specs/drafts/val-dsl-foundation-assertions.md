# Validation Assertions — DSL Foundation

**Area**: DSL Foundation (Taxonomy Layer, Source/Transform Definitions, Project Setup)
**Spec**: `specs/drafts/guardrail-promptbench-dsl.md` §§ 2, 3.1, 4.1, 9, 12-Phase1
**Validation type**: Automated tests + code review (scrutiny-only, no web UI)

---

## Project Setup

### VAL-DSL-001: deps.edn declares all required dependencies
The project `deps.edn` must declare dependencies for Clojure core, `libpython-clj2`, `clojure.spec.alpha`, and any test runner (e.g., `kaocha` or `clojure.test`). The file must be valid EDN and `clj -Stree` must resolve all dependencies without error.
Evidence: `clj -Stree` output showing resolved dependency tree with zero errors; manual review of `deps.edn` contents.

### VAL-DSL-002: bb.edn defines test and lint tasks
The `bb.edn` file must define at minimum a `test` task that runs the project test suite. The task must be invocable via `bb test` and must exit 0 when all tests pass.
Evidence: `bb test` execution output showing test results and exit code 0.

### VAL-DSL-003: Test infrastructure executes and reports results
Running the test suite via `clj -M:test` or `bb test` must discover and execute all test namespaces under `test/promptbench/`. The runner must report counts of passed, failed, and errored tests. An empty test suite (no test namespaces) is a failure.
Evidence: Test runner output showing at least one test namespace discovered and executed; non-zero test count.

### VAL-DSL-004: Project directory structure matches spec layout
The source tree must contain the namespace directories specified in §9: `src/promptbench/taxonomy/`, `src/promptbench/transform/`, `src/promptbench/pipeline/`. Each directory must contain at least the files specified in the spec (e.g., `registry.clj`, `families.clj`, `categories.clj`, `labels.clj` under `taxonomy/`).
Evidence: Directory listing showing all required paths exist; `find` or glob output.

---

## def-attack-family Macro

### VAL-DSL-010: def-attack-family registers a family in the taxonomy registry
Invoking `(def-attack-family persona-injection {...})` must cause `persona-injection` to appear in the taxonomy registry. After registration, `(taxonomy/get-family :persona-injection)` must return the family definition map, not nil.
Evidence: Test case that defines a family and asserts `(taxonomy/get-family :persona-injection)` returns non-nil.

### VAL-DSL-011: def-attack-family stores all required fields
The registered family must retain all fields: `:description`, `:category`, `:severity`, `:parent`, `:tags`, `:signatures`, `:transforms`, `:gen-hints`. Each field must be retrievable from the registry and match the values passed to the macro.
Evidence: Test case asserting each field value round-trips through registration.

### VAL-DSL-012: def-attack-family rejects missing required fields
Defining a family without `:description` or `:category` must produce a spec validation error (or equivalent). The macro must not silently register an incomplete family.
Evidence: Test case that attempts `(def-attack-family bad-family {:category :jailbreak})` (missing `:description`) and asserts an exception or spec error is thrown.

### VAL-DSL-013: def-attack-family rejects invalid severity values
The `:severity` field must accept only a defined set of values (e.g., `:low`, `:medium`, `:high`, `:critical`). Passing an invalid severity like `:banana` must produce a validation error.
Evidence: Test case asserting spec/validation failure for invalid severity.

### VAL-DSL-014: def-attack-family stores tags as a set
The `:tags` field must be stored as a set. Duplicate tags in input must be deduplicated. `(get-in family [:tags])` must return a set, and `(contains? (:tags family) :persona)` must return true when `:persona` was provided.
Evidence: Test case verifying tag storage type is `clojure.lang.PersistentHashSet` and contains expected elements.

### VAL-DSL-015: def-attack-family stores signatures as a sequence of maps
Each signature must contain `:pattern` and `:description` keys. Attempting to register a signature without `:pattern` must produce a validation error.
Evidence: Test case verifying signature structure and rejecting malformed signatures.

### VAL-DSL-016: def-attack-family stores transform affinities
The `:transforms` map must store per-transform affinity entries. Each entry must have an `:affinity` key with value from `#{:high :medium :low}`. An optional `:note` string is allowed. Invalid affinity values must be rejected.
Evidence: Test case defining a family with transforms and asserting `(get-in family [:transforms :mt :affinity])` returns `:high`.

### VAL-DSL-017: def-attack-family stores gen-hints
The `:gen-hints` map must be stored verbatim and be queryable. Keys like `:persona-names`, `:emotional-hooks`, `:structural-elements` must be retrievable.
Evidence: Test case verifying gen-hints round-trip through registry.

### VAL-DSL-018: def-attack-family parent reference must exist or be nil
If `:parent` is specified, it must reference an existing harm-category or another registered family. Defining a family with a `:parent` that has not been registered must produce an error (either at definition time or at a validation pass).
Evidence: Test case defining a family with a non-existent parent and asserting error.

### VAL-DSL-019: def-attack-family prevents duplicate registration
Attempting to define two families with the same name must produce an error or warning. The registry must not silently overwrite.
Evidence: Test case defining `persona-injection` twice and asserting error/warning on second registration.

### VAL-DSL-020: def-attack-family with all optional fields omitted
Defining a family with only the required fields (`:description`, `:category`) must succeed. Optional fields (`:parent`, `:tags`, `:signatures`, `:transforms`, `:gen-hints`, `:severity`) must default to nil, empty set, empty vector, or empty map as appropriate.
Evidence: Test case defining a minimal family and asserting defaults are sane.

---

## def-harm-category Macro

### VAL-DSL-030: def-harm-category registers in taxonomy registry
`(def-harm-category :identity-manipulation {...})` must register the category. `(taxonomy/get-category :identity-manipulation)` must return the definition map.
Evidence: Test case asserting category retrieval returns non-nil after registration.

### VAL-DSL-031: def-harm-category stores description and hierarchy
The registered category must retain `:description`, `:parent`, and `:children`. Each field must match the input values.
Evidence: Test asserting all three fields round-trip.

### VAL-DSL-032: def-harm-category allows root categories without parent
A category like `:adversarial` with no `:parent` field (or `:parent nil`) must register successfully as a root node.
Evidence: Test defining a root category and asserting it has no parent.

### VAL-DSL-033: def-harm-category validates children are keywords
The `:children` field must be a collection of keywords. Passing non-keyword children (e.g., strings or numbers) must produce a validation error.
Evidence: Test asserting spec failure for `{:children ["not-keyword"]}`.

### VAL-DSL-034: def-harm-category rejects missing description
A category without `:description` must fail validation.
Evidence: Test asserting error when description is omitted.

### VAL-DSL-035: def-harm-category prevents duplicate registration
Registering the same category keyword twice must produce an error or warning.
Evidence: Test defining `:jailbreak` twice and asserting error.

### VAL-DSL-036: def-harm-category parent must reference existing category
If `:parent` is specified, it must reference an already-registered category. Referencing a non-existent parent must produce an error (at definition time or validation).
Evidence: Test defining a category with parent `:nonexistent` and asserting error.

---

## def-intent-label Macro

### VAL-DSL-040: def-intent-label registers in taxonomy registry
`(def-intent-label :adversarial {...})` must register the label. `(taxonomy/get-intent-label :adversarial)` must return the definition map.
Evidence: Test asserting label retrieval returns non-nil after registration.

### VAL-DSL-041: def-intent-label stores polarity
The `:polarity` field must be stored and must be one of `#{:safe :unsafe :contested}`. An invalid polarity must produce a validation error.
Evidence: Test asserting polarity round-trips and invalid polarities are rejected.

### VAL-DSL-042: def-intent-label enforces requires field for unsafe polarity
When `:polarity` is `:unsafe`, the `:requires` field must contain `[:attack-family :harm-category]`. Defining an unsafe label without `:requires` must produce an error.
Evidence: Test defining an unsafe label without `:requires` and asserting error.

### VAL-DSL-043: def-intent-label enforces requires field for contested polarity
When `:polarity` is `:contested`, the `:requires` field must contain `[:rationale]`. Defining a contested label without `:requires` must produce an error.
Evidence: Test defining a contested label without `:requires` and asserting error.

### VAL-DSL-044: def-intent-label allows safe polarity without requires
When `:polarity` is `:safe`, the `:requires` field may be omitted (no mandatory requirements for benign labels).
Evidence: Test defining a `:safe` label without `:requires` and asserting success.

### VAL-DSL-045: def-intent-label rejects missing description
A label without `:description` must fail validation.
Evidence: Test asserting error when description is omitted.

### VAL-DSL-046: def-intent-label rejects missing polarity
A label without `:polarity` must fail validation since polarity is the core semantic axis.
Evidence: Test asserting error when polarity is omitted.

### VAL-DSL-047: def-intent-label prevents duplicate registration
Registering the same intent label keyword twice must produce an error or warning.
Evidence: Test defining `:benign` twice and asserting error.

---

## Taxonomy Registry Query Functions

### VAL-DSL-050: taxonomy/descendants returns all leaf families under a category
Given the hierarchy `:adversarial` → `:jailbreak` → `:identity-manipulation` → `[:persona-injection, :dan-variants]`, calling `(taxonomy/descendants :adversarial)` must return a collection that includes `:persona-injection` and `:dan-variants` (all leaf families, not intermediate categories).
Evidence: Test setting up the full hierarchy from §2.2 and asserting descendants contains expected leaf families.

### VAL-DSL-051: taxonomy/descendants of a leaf returns empty or self
Calling `(taxonomy/descendants :persona-injection)` on a leaf family (not a category) must return an empty collection or the family itself, depending on design. It must not throw.
Evidence: Test asserting consistent behavior on leaf node.

### VAL-DSL-052: taxonomy/descendants of non-existent key returns empty or errors
Calling `(taxonomy/descendants :nonexistent)` must either return an empty collection or throw an informative error — not return garbage data.
Evidence: Test asserting predictable behavior for missing key.

### VAL-DSL-053: taxonomy/families-with-tag returns matching families
After registering `persona-injection` with tags `#{:persona :system-prompt-spoofing}`, calling `(taxonomy/families-with-tag :persona)` must return a collection containing `:persona-injection`.
Evidence: Test asserting tag query returns expected families.

### VAL-DSL-054: taxonomy/families-with-tag returns empty for unmatched tag
`(taxonomy/families-with-tag :nonexistent-tag)` must return an empty collection, not nil and not throw.
Evidence: Test asserting empty result for absent tag.

### VAL-DSL-055: taxonomy/families-with-tag finds families across multiple registrations
Register three families, two sharing a tag `:obfuscation`. `(taxonomy/families-with-tag :obfuscation)` must return exactly those two families.
Evidence: Test with multiple families asserting correct set returned.

### VAL-DSL-056: taxonomy/coverage-matrix produces family × transform grid
Given a dataset (or mock) and registered families/transforms, `(taxonomy/coverage-matrix dataset)` must return a map or matrix structure with one entry per (family, transform) pair.
Evidence: Test with mock data asserting matrix dimensions match registered families × transforms.

### VAL-DSL-057: taxonomy/missing-coverage identifies gaps
`(taxonomy/missing-coverage dataset :mt)` must return families that have zero MT variants in the dataset. If all families have MT variants, it must return empty.
Evidence: Test with dataset containing partial MT coverage, asserting missing families are correctly identified.

### VAL-DSL-058: Registry supports querying all registered families
A function like `(taxonomy/all-families)` must return a collection of all registered attack families. The count must match the number of `def-attack-family` invocations.
Evidence: Test registering N families and asserting `(count (taxonomy/all-families))` equals N.

### VAL-DSL-059: Registry supports querying all registered categories
A function like `(taxonomy/all-categories)` must return a collection of all registered harm categories.
Evidence: Test registering M categories and asserting `(count (taxonomy/all-categories))` equals M.

### VAL-DSL-060: Registry supports querying all registered intent labels
A function like `(taxonomy/all-intent-labels)` must return a collection of all registered intent labels.
Evidence: Test registering K labels and asserting `(count (taxonomy/all-intent-labels))` equals K.

### VAL-DSL-061: Registry is isolated between test runs
Each test must start with a clean registry (via fixture or reset function). Registrations from one test must not leak into another.
Evidence: Two tests that each register different families — neither sees the other's registrations.

---

## Transform Affinities (Cross-cutting with Attack Families)

### VAL-DSL-070: Transform affinities are queryable from family definition
After registering a family with `:transforms {:mt {:affinity :high :note "..."}}`, calling `(get-in (taxonomy/get-family :persona-injection) [:transforms :mt :affinity])` must return `:high`.
Evidence: Test asserting affinity retrieval path works.

### VAL-DSL-071: resolve-transforms selects high-affinity transforms
The `resolve-transforms` function given a family with `:mt :high` and `:exhaustion :low` must always include `:mt` and exclude `:exhaustion` (when `:include-low` is false).
Evidence: Test calling resolve-transforms and asserting `:mt` is in result and `:exhaustion` is not.

### VAL-DSL-072: resolve-transforms samples medium-affinity transforms
A family with `:homoglyph :medium` must have `:homoglyph` included probabilistically. Over many runs with a fixed seed, it must appear in some but not all invocations (or deterministically based on seed).
Evidence: Test with fixed seed asserting deterministic inclusion/exclusion of medium-affinity transforms.

### VAL-DSL-073: resolve-transforms respects include-low flag
When `{:include-low true}` is in the transform config, low-affinity transforms must be included.
Evidence: Test asserting low-affinity transforms appear when flag is true, absent when false.

### VAL-DSL-074: resolve-transforms with :none affinity always excludes
A transform not listed in the family's affinities (affinity `:none`) must never be included by `resolve-transforms`.
Evidence: Test asserting unlisted transforms are excluded regardless of config flags.

---

## def-source Macro

### VAL-DSL-080: def-source registers a source definition
`(def-source aya-redteaming {...})` must register the source. Querying the source registry must return the definition.
Evidence: Test defining a source and asserting retrieval returns non-nil.

### VAL-DSL-081: def-source stores all required fields
A registered source must retain: `:description`, `:version`, `:license`, `:format`. Each must round-trip.
Evidence: Test asserting all required fields are retrievable and match input.

### VAL-DSL-082: def-source validates required fields
Defining a source without `:description`, `:version`, `:license`, or `:format` must produce a validation error.
Evidence: Four test cases, each omitting one required field and asserting error.

### VAL-DSL-083: def-source accepts URL-based sources
A source with `:url` (non-nil) and no `:path` must register successfully.
Evidence: Test defining `aya-redteaming` with URL and asserting success.

### VAL-DSL-084: def-source accepts local-path sources
A source with `:path` and `:url nil` must register successfully (for curated local corpora).
Evidence: Test defining `curated-persona-injections` with path and nil url, asserting success.

### VAL-DSL-085: def-source requires either url or path
A source with both `:url nil` and `:path nil` should produce a validation error — at least one data location must be specified.
Evidence: Test defining a source with neither url nor path and asserting error.

### VAL-DSL-086: def-source stores schema definition
The optional `:schema` field describing column types must be stored and queryable.
Evidence: Test defining a source with `:schema {:prompt :string :language :string}` and asserting it round-trips.

### VAL-DSL-087: def-source stores taxonomy-mapping
The `:taxonomy-mapping` field mapping source-specific labels to DSL taxonomy keywords must be stored and queryable.
Evidence: Test asserting taxonomy-mapping round-trips correctly.

### VAL-DSL-088: def-source taxonomy-mapping values must be valid keywords
Taxonomy mapping values must be keywords. A mapping with string values instead of keywords must produce a validation error.
Evidence: Test with `{:harm_category {"illegal_activity" "not-a-keyword"}}` and asserting error.

### VAL-DSL-089: def-source validates license is a keyword
The `:license` field must be a keyword (e.g., `:apache-2.0`, `:mit`, `:gpl-3.0`). A string or number must be rejected.
Evidence: Test asserting error for non-keyword license.

### VAL-DSL-090: def-source validates format is a known type
The `:format` field must be one of `#{:parquet :csv :jsonl :edn}` (or the set defined by the project). An unknown format must produce a validation error.
Evidence: Test asserting error for `:format :xlsx` or other unsupported format.

### VAL-DSL-091: def-source prevents duplicate registration
Defining two sources with the same name must produce an error or warning.
Evidence: Test defining `aya-redteaming` twice and asserting error.

---

## def-transform Macro (Definition Only)

### VAL-DSL-100: def-transform registers a transform definition
`(def-transform mt {...})` must register the transform. Querying the transform registry must return the definition.
Evidence: Test defining a transform and asserting retrieval returns non-nil.

### VAL-DSL-101: def-transform stores all metadata fields
The registered transform must retain: `:description`, `:type`, `:deterministic`, `:reversible`, `:params-spec`, `:provenance`.
Evidence: Test asserting each field is retrievable and matches input.

### VAL-DSL-102: def-transform validates required fields
Defining a transform without `:description` or `:type` must produce a validation error.
Evidence: Test omitting required fields and asserting error.

### VAL-DSL-103: def-transform validates type is a known keyword
The `:type` field must be a keyword from a defined set (e.g., `#{:linguistic :obfuscation :resource-attack}`). An invalid type must be rejected.
Evidence: Test asserting error for `:type :foobar`.

### VAL-DSL-104: def-transform stores params-spec with type annotations
Each param in `:params-spec` must have a `:type` key. The spec must be queryable for parameter validation at runtime.
Evidence: Test defining a transform with params-spec and asserting each param has `:type`.

### VAL-DSL-105: def-transform params-spec required flag is respected
Params marked `{:required true}` must be distinguishable from optional params. The spec must expose which params are required.
Evidence: Test asserting `(get-in transform [:params-spec :target-lang :required])` returns `true`.

### VAL-DSL-106: def-transform params-spec default values are stored
Params with `:default` values must store them. Missing defaults must return nil.
Evidence: Test asserting default values are retrievable from params-spec.

### VAL-DSL-107: def-transform deterministic flag is boolean
The `:deterministic` field must be a boolean. Non-boolean values must be rejected.
Evidence: Test asserting error for `:deterministic "yes"`.

### VAL-DSL-108: def-transform reversible field accepts keyword or boolean
The `:reversible` field must accept `true`, `false`, or `:approximate`. Other values must be rejected.
Evidence: Test asserting valid values pass and invalid values fail.

### VAL-DSL-109: def-transform provenance field is a vector of keywords
The `:provenance` field lists metadata keys tracked for reproducibility. It must be a vector of keywords.
Evidence: Test asserting provenance is stored as keywords vector.

### VAL-DSL-110: def-transform impl is optional at definition time
A transform may be defined without `:impl` (e.g., `exhaustion` in the spec has no impl). The macro must not require `:impl` for registration.
Evidence: Test defining a transform without `:impl` and asserting success.

### VAL-DSL-111: def-transform prevents duplicate registration
Defining two transforms with the same name must produce an error or warning.
Evidence: Test defining `mt` twice and asserting error.

### VAL-DSL-112: All registered transforms are queryable
A function like `(registry/all-transforms)` must return all registered transform names. The count must match the number of `def-transform` invocations.
Evidence: Test registering N transforms and asserting count equals N.

---

## Composability and Cross-Macro Integration

### VAL-DSL-120: Attack family can reference an existing harm category as parent
Define `(def-harm-category :jailbreak {...})` then `(def-attack-family persona-injection {:parent :jailbreak ...})`. The family's parent must resolve to the registered category.
Evidence: Test asserting family's parent is present in category registry.

### VAL-DSL-121: Harm category children align with registered families
Define category `:identity-manipulation` with `:children [:persona-injection :dan-variants]`, then define both families. A validation pass must confirm all children are registered.
Evidence: Test or validation function asserting all children in a category exist in the family registry.

### VAL-DSL-122: Descendants traversal works across multi-level hierarchy
Define the full hierarchy from §2.2: `:adversarial` → `:jailbreak` → `:identity-manipulation` → families. `(taxonomy/descendants :adversarial)` must traverse all levels and return leaf families.
Evidence: Test with three-level hierarchy asserting correct transitive closure.

### VAL-DSL-123: Source taxonomy-mapping references valid harm categories
A source's taxonomy-mapping values (e.g., `:illegal-activity`) should reference registered harm categories or families. A validation pass should flag unmapped references.
Evidence: Test defining a source mapping to `:nonexistent-category` and asserting validation warning or error.

### VAL-DSL-124: Transform names referenced in family affinities must exist
A family that declares affinity for `:mt` must have a corresponding `(def-transform mt ...)` registered. A validation pass should detect orphaned transform references.
Evidence: Test defining a family with affinity for `:nonexistent-transform` and asserting validation catches it.

### VAL-DSL-125: Full taxonomy setup from spec §2 can be loaded without error
Loading all attack families, harm categories, and intent labels from the spec examples (§2.1, §2.2, §2.3) in sequence must succeed without errors. This is the integration smoke test.
Evidence: Test file that defines the complete taxonomy from the spec and asserts all registrations succeed and all queries return expected results.

### VAL-DSL-126: Registry reset clears all macro registrations
Calling a registry reset/clear function must remove all families, categories, labels, sources, and transforms. Subsequent queries must return empty collections.
Evidence: Test registering items, calling reset, and asserting all query functions return empty.

### VAL-DSL-127: Multiple sources can coexist with different formats
Defining `aya-redteaming` (`:parquet`), `harmbench` (`:csv`), and `curated-persona-injections` (`:jsonl`) must all register without conflict.
Evidence: Test defining three sources with different formats and asserting all three are queryable.

### VAL-DSL-128: Multiple transforms of the same type can coexist
Defining `mt` and `code-mix` both with `:type :linguistic` must register without conflict. Type is a classification, not a unique key.
Evidence: Test defining two transforms with the same type and asserting both are registered.
