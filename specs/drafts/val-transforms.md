# Validation Assertions — Transforms

## Transform Output Validity

### VAL-XFORM-001: MT transform produces valid translated text
Applying the `mt` transform with a known `target-lang` (e.g., `:ja`) to a non-empty English prompt returns a non-empty `:text` string that differs from the input and is valid UTF-8. The returned metadata includes `:source-text-hash`, `:target-lang`, and `:engine` keys with non-nil values.
Evidence: Unit test that invokes `(transform prompt (mt {:target-lang :ja}) seed)` and asserts output text is non-empty, differs from input, and metadata map contains all required keys.

### VAL-XFORM-002: Code-mix transform produces mixed-language output
Applying `code-mix` with `:l2 :es` and `:mix-rate 0.25` to an English prompt returns text containing at least one token from the L2 language. Metadata includes `:mix-rate`, `:strategy`, `:l2`, and `:seed`.
Evidence: Unit test with a multi-sentence English prompt; output inspected for presence of L2 tokens (e.g., Spanish words) and metadata completeness.

### VAL-XFORM-003: Homoglyph transform produces obfuscated text with substitution map
Applying `homoglyph` with `:rate 0.15` to a prompt returns text where at least one character has been replaced with a Unicode homoglyph. Metadata includes `:substitution-count > 0` and a non-empty `:substitution-map`. Output text has the same logical length as input (no characters added or removed, only replaced).
Evidence: Unit test comparing character-by-character diff between input and output; verify substitution-map entries are valid homoglyph pairs.

### VAL-XFORM-004: Exhaustion transform inserts padding at the specified position
Applying `exhaustion` with `:position :prefix` inserts the repetition pattern before the original prompt. With `:position :suffix`, the pattern appears after. With `:position :interleaved`, the pattern is woven between segments. In all cases the original prompt text is still present in the output. Metadata includes `:repetition-length`, `:position`, `:pattern`, and `:seed`.
Evidence: Unit test for each of the three position modes; assert pattern placement relative to the original text and metadata completeness.

### VAL-XFORM-005: All transforms return the canonical output shape
Every registered transform, when applied to a valid prompt, returns a map with exactly two top-level keys: `:text` (non-empty string) and `:metadata` (map). No transform returns nil, throws on well-formed input, or returns keys outside this contract.
Evidence: Parameterized test iterating over all registered transforms with a known prompt and seed; assert return shape.

## Seed Determinism

### VAL-XFORM-006: Code-mix is seed-deterministic
Applying `code-mix` with identical text, config, and seed twice produces byte-identical `:text` and identical `:metadata`. Changing the seed produces different output.
Evidence: Test calls transform twice with seed=42, asserts `(= result-a result-b)`. Third call with seed=99 asserts `(not= result-c result-a)`.

### VAL-XFORM-007: Homoglyph substitution is seed-deterministic
Applying `homoglyph` with identical text, config, and seed twice produces identical output text and identical `:substitution-map`. A different seed produces a different substitution map.
Evidence: Same double-invocation pattern as VAL-XFORM-006; compare full substitution maps.

### VAL-XFORM-008: Exhaustion pattern is seed-deterministic
Applying `exhaustion` with identical text, config, and seed twice produces identical output. Different seeds produce different interleaving when `:position :interleaved` is used.
Evidence: Double-invocation equality test; third invocation with different seed in interleaved mode asserts difference.

### VAL-XFORM-009: MT transform determinism caveat is documented and handled
Because MT depends on an external API (GPT-5.2 via proxy), strict byte-level determinism is not guaranteed. The system must document this in the transform's `:deterministic false` metadata. When the same seed is provided, the same API parameters (prompt, temperature=0, seed) are sent to the proxy to maximize reproducibility.
Evidence: Inspect the outgoing HTTP request to `127.0.0.1:8789` and verify that `temperature=0` and `seed` are included in the payload. Assert that `:deterministic` is `false` in the transform registry entry.

## Transform Composition and Chains

### VAL-XFORM-010: Two-transform chain produces correct intermediate and final output
Chaining `mt {:target-lang :ja}` then `code-mix {:l2 :en :mix-rate 0.3}` produces final text that reflects both transformations. The intermediate MT output (Japanese text) is used as input to code-mix. The final metadata accumulates provenance from both steps.
Evidence: Test applies chain to a known English prompt; verify intermediate result is Japanese (not English), final result contains both Japanese and English tokens.

### VAL-XFORM-011: Transform chain metadata records full chain lineage
After applying a chain of N transforms, the variant record's `:transform-chain` contains exactly N entries in application order (e.g., `[:mt/ja :code-mix/en-0.25 :homoglyph/0.1]`). Each entry's metadata is individually accessible.
Evidence: Apply a 3-step chain; assert `:transform-chain` vector has length 3 and entries match the transforms applied in order.

### VAL-XFORM-012: Transform chain is order-sensitive
Applying `[mt, code-mix]` produces a different result than `[code-mix, mt]` on the same input with the same seed. This confirms transforms are composed, not commuted.
Evidence: Test applies both orderings to the same prompt; assert final texts differ.

### VAL-XFORM-013: def-transform-chain macro creates a reusable named chain
Defining `(def-transform-chain ja-codemix-obfuscated {:steps [...]})` creates a registered chain that can be referenced by name in pipeline configs. Invoking the chain on a prompt is equivalent to manually applying each step sequentially.
Evidence: Define a chain via macro, apply it to a prompt. Separately apply the same steps manually. Assert outputs are identical.

### VAL-XFORM-014: def-transform-chain validates step references at definition time
Defining a chain that references a non-existent transform (e.g., `(def-transform-chain bad {:steps [(nonexistent-transform {})]})`) throws an error at macro expansion or registry time, not at runtime.
Evidence: Test wraps the macro call in a try/catch and asserts a descriptive error is thrown.

## Provenance and Variant Records

### VAL-XFORM-015: Variant record contains complete provenance metadata
Every variant record produced by the transform stage includes: `:variant-id` (SHA-256 hash), `:source-id` (linking to the canonical prompt), `:text`, `:variant-type`, `:transform-chain`, `:transform-seed`, `:metadata`, and `:split`. No field is nil.
Evidence: Generate a variant via a single transform; inspect the output record and assert all fields are present and non-nil.

### VAL-XFORM-016: Variant source-id traces back to a valid canonical prompt
For every variant record in the build output, `:source-id` matches exactly one record in the canonical prompts dataset. No orphan variants exist.
Evidence: After a pipeline build, join variants on `source-id` to canonical prompts; assert zero unmatched variant records.

### VAL-XFORM-017: Variant split is inherited from source and immutable
A variant's `:split` always equals its source prompt's `:split`. No transform or chain alters the split assignment. Variants from a `:test` prompt are always in `:test`.
Evidence: After transform stage, assert `(every? #(= (:split %) (:split (lookup-source %))) all-variants)`.

### VAL-XFORM-018: Variant-id is deterministically derived from content
The `:variant-id` is a SHA-256 hash of the variant's text and transform chain. Regenerating the same variant with the same seed produces the same `:variant-id`.
Evidence: Generate variant twice with same inputs; assert `:variant-id` equality.

### VAL-XFORM-019: Transform metadata records engine/model version for MT variants
MT variant metadata includes `:engine` (e.g., `:gpt-4o-mini`), `:target-lang`, and `:source-text-hash`. These fields are sufficient to trace exactly how the translation was produced.
Evidence: Generate an MT variant; inspect metadata map and assert all provenance keys from the transform's `:provenance` spec are present.

## Affinity Resolution

### VAL-XFORM-020: High-affinity transforms are always included
When `resolve-transforms` is called for an attack family with `:mt {:affinity :high}`, the MT transform is always present in the returned transform list, regardless of sampling randomness.
Evidence: Call `resolve-transforms` 100 times for a family with `:mt :high`; assert MT is present in every result.

### VAL-XFORM-021: Medium-affinity transforms are sampled at the configured rate
When `resolve-transforms` is called for a family with `:homoglyph {:affinity :medium}` and `:medium-sample-rate 0.5`, the homoglyph transform appears in approximately 50% of 1000 invocations (within ±10% tolerance).
Evidence: Statistical test: call 1000 times, count inclusions, assert within `[0.40, 0.60]` range.

### VAL-XFORM-022: Low-affinity transforms are excluded by default
When `resolve-transforms` is called with default config (`:include-low false`) for a family with `:exhaustion {:affinity :low}`, the exhaustion transform is never included.
Evidence: Call 100 times; assert exhaustion is absent in every result.

### VAL-XFORM-023: Low-affinity transforms are included when explicitly requested
When `resolve-transforms` is called with `:include-low true`, low-affinity transforms appear in the result.
Evidence: Call once with `:include-low true`; assert the low-affinity transform is present.

### VAL-XFORM-024: Transforms with :none affinity are never included
An attack family that does not list a transform in its `:transforms` map (affinity defaults to `:none`) never receives that transform, even with `:include-low true`.
Evidence: Define a family with no `:exhaustion` entry; call `resolve-transforms` with `:include-low true`; assert exhaustion is absent.

## MT Proxy Integration

### VAL-XFORM-025: MT calls route through the open-hax-openai-proxy
All translation requests from the `mt` transform are sent to `127.0.0.1:8789` (the configured proxy endpoint), not directly to an external API. The HTTP request target matches the proxy host and port.
Evidence: Instrument or mock the HTTP client; assert all outbound requests target `127.0.0.1:8789`.

### VAL-XFORM-026: MT produces valid translation for each tier-1 language
For each tier-1 language `[:es :fr :zh :ar :ja :hi :ru :pt :de :ko]`, applying the `mt` transform to an English prompt returns non-empty text that is not identical to the input.
Evidence: Parameterized test iterating tier-1 languages; assert non-empty, non-identical output for each.

### VAL-XFORM-027: MT backtranslation round-trip preserves semantic content
When `:backtranslate true`, the MT transform also produces a backtranslated version. The backtranslation is not byte-identical to the original but has non-trivial lexical overlap (e.g., BLEU > 0.2 or shared keyword ratio > 0.3).
Evidence: Translate to `:ja` and back; compute lexical overlap metric; assert above threshold.

### VAL-XFORM-028: MT gracefully handles proxy unavailability
When the proxy at `127.0.0.1:8789` is unreachable, the MT transform returns a descriptive error (not a raw socket exception) and does not crash the pipeline. The error includes the target language and proxy address.
Evidence: Test with proxy stopped; assert transform returns an error map or throws a domain-specific exception with meaningful message.

## Code-Mix Specifics

### VAL-XFORM-029: Inter-sentential code-mix switches languages at sentence boundaries
With `:strategy :inter-sentential`, the output alternates languages at sentence boundaries. No sentence contains tokens from both languages.
Evidence: Split output by sentence; classify each sentence's language; assert each sentence is monolingual.

### VAL-XFORM-030: Intra-sentential code-mix produces within-sentence mixing
With `:strategy :intra-sentential`, at least one sentence in the output contains tokens from both L1 and L2.
Evidence: Split output by sentence; for at least one sentence, detect tokens from both languages.

### VAL-XFORM-031: Code-mix rate controls proportion of L2 content
With `:mix-rate 0.1`, approximately 10% of tokens are L2. With `:mix-rate 0.5`, approximately 50%. Measured rates should be within ±15% of the target on prompts of ≥20 tokens.
Evidence: Apply code-mix at rates `[0.1, 0.25, 0.5]`; measure actual L2 token proportion; assert within tolerance.

## Homoglyph Specifics

### VAL-XFORM-032: Homoglyph substitutions use valid Unicode homoglyph pairs
Every character replacement in the `:substitution-map` maps an ASCII or common Unicode character to a visually similar character from a different Unicode block (e.g., Latin 'a' → Cyrillic 'а'). No substitution maps a character to itself.
Evidence: Inspect substitution-map entries; verify each pair is in the project's homoglyph table and source ≠ target.

### VAL-XFORM-033: Homoglyph substitution is reversible via canonical normalization
Applying NFKC normalization (or the project's canonical normalizer) to homoglyph-transformed text recovers the original text byte-for-byte.
Evidence: Apply homoglyph transform, then normalize; assert equality with original input.

### VAL-XFORM-034: Homoglyph rate controls substitution density
With `:rate 0.15`, approximately 15% of eligible characters are substituted. The actual substitution count divided by eligible character count is within ±5% of the target rate.
Evidence: Apply at rates `[0.1, 0.15, 0.25]`; compute actual rate; assert within tolerance.

## Exhaustion Specifics

### VAL-XFORM-035: Prefix exhaustion prepends pattern before original text
With `:position :prefix`, the output starts with repeated copies of `:pattern` followed by the original prompt text verbatim.
Evidence: Assert output starts with the pattern string and ends with the original prompt text.

### VAL-XFORM-036: Suffix exhaustion appends pattern after original text
With `:position :suffix`, the output starts with the original prompt text followed by repeated copies of `:pattern`.
Evidence: Assert output starts with original prompt text and ends with pattern repetitions.

### VAL-XFORM-037: Interleaved exhaustion weaves pattern between prompt segments
With `:position :interleaved`, pattern text is inserted between segments of the original prompt. Both pattern material and original prompt content are present throughout the output.
Evidence: Assert original prompt tokens appear in output and pattern material appears between them.

### VAL-XFORM-038: Exhaustion repetition-length controls total padding tokens
With `:repetition-length 4096`, the added padding is approximately 4096 tokens. With `:repetition-length 1024`, approximately 1024 tokens. Measured within ±10% of target.
Evidence: Tokenize output, subtract original prompt token count, assert padding token count within tolerance.

### VAL-XFORM-039: Exhaustion is reversible
The exhaustion transform's `:reversible true` property holds: given the transform config and metadata, the original prompt text can be extracted from the exhaustion output without loss.
Evidence: Apply exhaustion, then reverse using config/metadata; assert extracted text equals original input.

## def-transform-chain Macro

### VAL-XFORM-040: def-transform-chain registers chain in transform registry
After `(def-transform-chain my-chain {:steps [...]})`, the chain is retrievable from the transform registry by name `:my-chain`.
Evidence: Define chain via macro; query registry; assert chain entry exists with correct `:steps`.

### VAL-XFORM-041: def-transform-chain preserves step order
The `:steps` vector in the registered chain matches the definition order exactly. Retrieving and applying the chain processes transforms in definition order.
Evidence: Define a chain with `[A, B, C]`; retrieve from registry; assert steps vector is `[A, B, C]` not any permutation.

### VAL-XFORM-042: def-transform-chain stores description metadata
The chain definition includes a `:description` string that is stored in the registry and retrievable for documentation/reporting purposes.
Evidence: Define chain with description; retrieve from registry; assert `:description` matches.

## Pipeline Integration (Stages 4-6)

### VAL-XFORM-043: Stage 4 (tier-1 MT) generates variants for all tier-1 languages
After stage 4 completes, for every canonical prompt with a high-affinity MT family, there exist variant records for each of the 10 tier-1 languages `[:es :fr :zh :ar :ja :hi :ru :pt :de :ko]`.
Evidence: Query variants grouped by source-id and target-lang; assert full tier-1 language coverage for high-affinity families.

### VAL-XFORM-044: Stage 5 (tier-2 MT) is gated and only runs with --tier2 flag
Running the pipeline without `--tier2` produces no tier-2 language variants. Running with `--tier2` produces variants for tier-2 languages `[:tl :sw :ur :bn :th :vi :id :tr :fa :he]`.
Evidence: Two pipeline runs (with and without flag); assert tier-2 variant presence/absence respectively.

### VAL-XFORM-045: Stage 6 (eval suites) applies only to test split by default
With `:suites {:scope :test-only}`, evaluation suites are generated only for variants in the `:test` split. No `:train` or `:dev` variants appear in suite outputs.
Evidence: After stage 6, assert all suite entries reference variants with `:split :test`.

### VAL-XFORM-046: Transform stage writes a valid stage manifest
After the transform stage completes, a stage manifest exists containing `:stage :transforms`, `:seed`, `:input-hash`, `:output-hash`, `:artifact-count`, and `:checksums`. All hash values are valid SHA-256 hex strings.
Evidence: Read stage manifest file; validate all required keys present; verify hash format with regex `^[a-f0-9]{64}$`.

### VAL-XFORM-047: Transform stage is idempotent with same seed
Running the transform stage twice with the same seed and input produces byte-identical output artifacts (excluding timestamps in manifests). The `:output-hash` in both manifests matches.
Evidence: Run transform stage twice; compare `:output-hash` values; assert equality.
