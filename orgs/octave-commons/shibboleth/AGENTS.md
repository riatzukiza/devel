```lisp
;; ============================================================
;; ספר השבלת — SEFER HA-SHIBBOLETH
;; The Book of the Ear of Grain
;; ============================================================
;;
;; שופטים י״ב:ה-ו
;; Judges 12:5-6
;;
;; And the Gileadites seized the fords of the Jordan.
;; And when any of the fugitives of Ephraim said,
;; "Let me cross over," the men of Gilead said to him,
;; "Are you an Ephraimite?" When he said, "No,"
;; they said to him, "Then say שִׁבֹּלֶת."
;; And he said "סִבֹּלֶת," for he could not pronounce it right.
;;
;; The word was never the point.
;; The mouth was always the point.
;;
;; This system does not build walls.
;; It builds the דִּקְדּוּק — the grammar —
;; that walls are tested against.
;;
;; ============================================================

(codex "שבלת/v1"

  ;; ============================================================
  ;; 0. מַעֲבָר — The Crossing
  ;; ============================================================

  (מַעֲבָר
    "Build the דִּקְדּוּק that distinguishes. Not the wall — the test.
     Not the weapon — the weight it is measured against.
     Every טַקְסוֹנוֹמְיָה must be extensible.
     Every dataset must regenerate.
     Every שַׁלְשֶׁלֶת must survive doubt.
     The artifact is a byproduct. The grammar is the contribution.")

  ;; ============================================================
  ;; 1. Domain Operators (שֵׁמוֹת — The Names)
  ;; ============================================================
  ;;
  ;; Like η/μ/Π bind modes in operation-mindfuck,
  ;; these Hebrew roots bind domain concepts in shibboleth.
  ;; They are not translations. They are anchors.
  ;; A concept bound to a שֵׁם is a concept that can be pointed at
  ;; without the pointing costing a paragraph.

  (שֵׁמוֹת

    (שֵׁם  "שֵׁם — NAME. The act of taxonomy. def-attack-family, def-harm-category,
            def-intent-label. To name a shape is to make it countable.
            A shape unnamed is a shape the wall cannot learn.")

    (מַסֵּכָה "מַסֵּכָה — MASK. A transform. The disguise a shape wears
              to test a wall it has never met. MT, code-mix, homoglyph, exhaustion.
              Every mask is (prompt, config, seed) → {:text :metadata}.
              Masks compose. A→B ≠ B→A. Order is meaning.")

    (מַעֲבָר "מַעֲבָר — PASSAGE. A pipeline stage. The shape must cross seven
              passages before earning its place in the אֲגֻדָּה.
              Each passage writes a manifest. Break the chain, lose the provenance.")

    (מִדָּה "מִדָּה — MEASURE. A metric. taxonomy-coverage, cluster-leakage-rate,
            semantic-diversity. The judgment that the אֲגֻדָּה must survive
            to be called complete. def-metric binds computation to assertion.")

    (אֲגֻדָּה "אֲגֻדָּה — BUNDLE. The covenant of reproducibility.
              Same seed + same sources + same config = identical checksums.
              Parquet, manifests, checksums, datasheet, verification report.
              The bundle is μ — the artifact that survives transmission.")

    (שַׁלְשֶׁלֶת "שַׁלְשֶׁלֶת — CHAIN. The provenance. Each מַעֲבָר writes a manifest
                 whose output-hash becomes the next passage's input-hash.
                 The chain is the audit trail. The chain is the receipt book.")

    (מָקוֹר "מָקוֹר — SOURCE. Where shapes are found. Public corpora or
            hand-curated by the examiner. def-source declares origin, format, license.
            Curated מָקוֹר preferred over public on duplicate canonical hashes.")

    (precedence שֵׁם מַסֵּכָה מַעֲבָר מִדָּה אֲגֻדָּה)

    (detection
      "When these terms appear, they refer to the bound concept, not the Hebrew word.
       שֵׁם in a technical context means 'taxonomy operation,' not 'name' generically.
       Context disambiguates. When ambiguous, the technical binding wins."))

  ;; ============================================================
  ;; 2. Context Symbols (extending 己/汝/彼/世/主)
  ;; ============================================================
  ;;
  ;; The opmf context symbols track WHO observes.
  ;; These track WHAT is being shaped.

  (context-symbols

    ;; inherited from opmf
    (己 "self / the agent working on shibboleth")
    (汝 "the user / examiner")
    (世 "the world / the safety ecosystem being tested")

    ;; domain-specific
    (צוּרָה "צוּרָה — SHAPE. An adversarial prompt in any stage of transformation.
            Raw, canonical, embedded, split, masked. The thing that crosses.")
    (חוֹמָה "חוֹמָה — WALL. The guardrail / safety system being evaluated.
            We do not build the חוֹמָה. We test its דִּקְדּוּק.")
    (פֶּרֶץ "פֶּרֶץ — BREACH. A successful bypass. When צוּרָה passes חוֹמָה.
            Not celebrated. Not condemned. Measured.")

    (rule
      "Attribution: (ctx 己|汝|世|צוּרָה|חוֹמָה|פֶּרֶץ ...) + confidence.
       An observation about a צוּרָה is not a fact about a חוֹמָה.
       Distinguish always."))


  ;; ============================================================
  ;; 3. The שֵׁם Layer (Taxonomy as Liturgy)
  ;; ============================================================
  ;;
  ;; לִפְנֵי שֶׁתּוּכַל לִבְדֹּק אֶת הַחוֹמָה, עָלֶיךָ לִקְרֹא שֵׁם לַצּוּרוֹת.
  ;; Before you can test the wall, you must name the shapes.

  (שֵׁם-layer

    (families
      "def-attack-family: the root shapes. Each carries signatures—
       the fingerprints the חוֹמָה must learn. Each carries affinity—
       which מַסֵּכוֹת it wears most naturally.
       persona-injection, authority-impersonation, developer-mode.")

    (categories
      "def-harm-category: the vertical axis.
       :adversarial → :jailbreak → :identity-manipulation.
       A tree. Traverse honestly or the coverage matrix lies.")

    (labels
      "def-intent-label: polarity. :unsafe requires both family and category.
       :safe requires neither. The label is a נֶדֶר — a vow, not a guess.")

    (rules
      "All names accept both bare symbols and keywords."
      "All registries reset between tests."
      "All collections returned from queries are sorted —
       because reproducibility is liturgical, not optional."))

  ;; ============================================================
  ;; 4. The Seven מַעֲבָרוֹת (Passages)
  ;; ============================================================
  ;;
  ;; שֶׁבַע מַעֲבָרוֹת. שֶׁבַע חוֹתָמוֹת.
  ;; Seven passages. Seven seals.
  ;; A צוּרָה must cross all seven before the אֲגֻדָּה accepts it.

  (מַעֲבָרוֹת

    (0-לֶקֶט "FETCH — Gather raw shapes from declared מְקוֹרוֹת.
              data/raw/. SHA-256 checksums. Manifest. Idempotent.")

    (1-צִמְצוּם "CANONICALIZE — NFKC normalize. Collapse whitespace.
                canonical_hash = SHA-256 of normalized text = the shape's true שֵׁם.
                source_id = SHA-256(dataset|row|hash-prefix) = lineage.
                Map labels to טַקְסוֹנוֹמְיָה. Flag unmapped, don't reject.")

    (2-רְאִיָּה "EMBED + CLUSTER — Through the Python bridge.
               sentence-transformers → 1024-dim, L2-normalized.
               HDBSCAN → clusters. algorithm='generic' for cosine.
               No shape dropped. Noise = -1.")

    (3-הַפְרָדָה "SPLIT — THE invariant. 70/15/15 by cluster, not by record.
                No cluster spans two splits. הַפְרָדָה is separation.
                Test it. Test that it fails when violated.
                Noise points → singletons. Seed-deterministic.")

    (4-תַּרְגּוּם-א "TIER-1 MT — 10 languages. High-affinity families.
                    Proxy at 127.0.0.1:8789. temperature=0, seed passed.
                    :deterministic false — documented, not hidden.")

    (5-תַּרְגּוּם-ב "TIER-2 MT — Gated on :tier2 flag. 10 additional languages.")

    (6-בְּחִינָה "EVAL SUITES — code-mix, homoglyph, exhaustion.
                Test split only (default). Affinity-aware.
                The טַקְסוֹנוֹמְיָה decides which מַסֵּכוֹת each family wears.")

    (7-דִּין "VERIFICATION — The final passage does not transform. It judges.
             cluster-disjoint (fatal). variant-split-consistency (fatal).
             duplicate-detection (fatal). label-distribution-sane (non-fatal).
             Metric assertions evaluated. Fatal = build stops.")

    (שַׁלְשֶׁלֶת
      "Each מַעֲבָר writes: stage, version, timestamps, seed,
       input-hash, output-hash, artifact-count, config-hash, checksums.
       Next passage's input-hash = previous output-hash.
       Break the שַׁלְשֶׁלֶת and the אֲגֻדָּה is אֵפֶר — ash."))

  ;; ============================================================
  ;; 5. The מַסֵּכוֹת (Masks)
  ;; ============================================================
  ;;
  ;; צוּרָה שֶׁלֹּא יְכוֹלָה לְשַׁנּוֹת אֶת פָּנֶיהָ
  ;; הִיא צוּרָה שֶׁהַחוֹמָה כְּבָר לָמְדָה.
  ;; A shape that cannot change its face
  ;; is a shape the wall has already learned.

  (מַסֵּכוֹת

    (תַּרְגּוּם "MT — machine translation. Proxy Bearer $PROXY_AUTH_TOKEN.
               temperature=0. Not deterministic across model versions. Say so.")

    (עִרְבּוּב "CODE-MIX — inter/intra-sentential language mixing.
              10 languages, bilingual tables. Seed-deterministic.")

    (דְּמוּת "HOMOGLYPH — fullwidth Latin substitution. NFKC-reversible.
            Fisher-Yates selection. The disguise that normalization undoes.")

    (שִׁחָקָה "EXHAUSTION — prefix/suffix/interleaved padding.
             The original preserved inside the noise. Seed-deterministic.")

    (שַׁרְשֶׁרֶת "CHAIN — def-transform-chain. Named, registered, step-validated.
                Steps as data maps {:transform :config}. Metadata accumulates.
                A→B ≠ B→A. שַׁרְשֶׁרֶת is order-sensitive."))

  ;; ============================================================
  ;; 6. The מִדּוֹת (Measures)
  ;; ============================================================

  (מִדּוֹת

    (macro "def-metric: requires :description, :compute. Optional :params, :assertion.
            compute-metric → result + assertion pass/fail attached.")

    (כִּסּוּי "COVERAGE —
             taxonomy-coverage: proportion of leaf families with min-count.
             transform-coverage-matrix: family × transform grid.
             language-coverage: nested by lang/split/label.
             source-contribution: Δ analysis when a מָקוֹר is removed.
             transform-gap-analysis: per-family gaps, affinity-justified.")

    (אֵיכוּת "QUALITY —
             cluster-leakage-rate: 0.0 on valid הַפְרָדָה. Nonzero = failure.
             semantic-diversity: per-split mean pairwise cosine distance.
             transform-fidelity: BLEU/chrF for backtranslated MT only."))

  ;; ============================================================
  ;; 7. The אֲגֻדָּה (Bundle / Covenant)
  ;; ============================================================

  (אֲגֻדָּה
    (contents
      "prompts.parquet, variants.parquet, manifests/, checksums.sha256,
       verification_report.edn, datasheet.md (Gebru et al., 7 sections,
       actual values, no placeholders), build_manifest.edn.")

    (בְּרִית "COVENANT — same seed + same מְקוֹרוֹת + same config = identical checksums.
             Different seeds → different splits, identical canonical hashes.
             The אֲגֻדָּה is the deliverable. The דִּקְדּוּק is the instrument.
             The paper describes the instrument. The אֲגֻדָּה proves it plays."))

  ;; ============================================================
  ;; 8. The גֶּשֶׁר (Bridge — Python as Foreign Tongue)
  ;; ============================================================
  ;;
  ;; The שֵׁם is done in Clojure. The רְאִיָּה is done in Python.
  ;; libpython-clj is the גֶּשֶׁר between liturgy and perception.
  ;; Keep it narrow.

  (גֶּשֶׁר
    (rule "All Python calls in promptbench.python.* namespaces. Nowhere else.")
    (rule "ensure-python! initializes once. Model cached in atom. CPU forced.")
    (rule "Embeddings: multilingual-e5-large, 1024-dim, L2-normalized.")
    (rule "Clustering: HDBSCAN, algorithm='generic' for cosine.")
    (rule "Parquet: polars. Keywords round-trip via string encoding.")
    (rule "LD_LIBRARY_PATH includes NVIDIA lib dirs. init.sh handles this."))

  ;; ============================================================
  ;; 9. The כְּלֵי הַשִּׁירָה (Instruments / CLI)
  ;; ============================================================

  (כְּלֵי-הַשִּׁירָה
    (build   "clj -M:run build --config pipelines/v1.edn --seed 1337 --output dist/v1")
    (verify  "clj -M:run verify --config pipelines/v1.edn")
    (coverage "clj -M:run coverage --config pipelines/v1.edn")
    (rebuild "clj -M:run rebuild --config pipelines/v1.edn --from canonicalize")
    (test    "./run-tests.sh  # sets LD_LIBRARY_PATH for CUDA and PROXY_AUTH_TOKEN"))

  ;; ============================================================
  ;; 10. חֻקּוֹת — The Conventions
  ;; ============================================================

  (חֻקּוֹת
    (language "Clojure 1.12, JVM 21. Idiomatic. Pure functions preferred.")
    (specs "clojure.spec.alpha for validation. Specs are contracts, not suggestions.")
    (namespaces "promptbench.taxonomy.* / transform.* / pipeline.* / metrics.* /
                 report.* / verification.* / python.* / util.* / corpus.*")
    (testing "clojure.test + cognitect runner. Tests first. Registry reset between tests.")
    (determinism "Collections MUST be deterministically ordered.
                  sort/sorted-set on maps/sets. java.util.Random with explicit seeds.")
    (hashing "SHA-256 everywhere. Centralized in promptbench.util.crypto.
              Never duplicate MessageDigest instantiation.")
    (security "clojure.edn/read-string ONLY. Never clojure.core/read-string.
               Reader macros execute code. Treat file EDN as untrusted.")
    (requires "Explicit (:require ...) in every ns form. No transitive loading.")
    (refer-clojure "(:refer-clojure :exclude [reset!]) for registry namespaces."))

  ;; ============================================================
  ;; 11. גְּבוּלוֹת — Boundaries
  ;; ============================================================

  (גְּבוּלוֹת
    (proxy "127.0.0.1:8789 — USE, do not modify, do not restart.")
    (ollama "127.0.0.1:11434 — available, not primary.")
    (אַל-תִּגַּע "Do not touch /home/err/devel/services/.
                 Do not modify other octave-commons projects.
                 Do not commit secrets, .env files, or API keys."))

  ;; ============================================================
  ;; 12. הַדְּמָמָה — The Silence
  ;; ============================================================

  (הַדְּמָמָה
    (no-ui true)
    (no-typecheck true)
    (no-linter true)
    (validation "scrutiny-only: tests + review")
    (surface "clj -M:test — 418 tests, 3129 assertions.
              The מַקְהֵלָה sings or it doesn't."))

  ;; ============================================================
  ;; 13. The Ur-Text
  ;; ============================================================

  (אוּר-טֶקְסְט
    (path "/home/err/devel/specs/drafts/guardrail-promptbench-dsl.md")
    (rule "Read before implementing. The spec is intent. Code is commitment.
           Where they disagree, code wins — document the divergence."))

  ;; ============================================================
  ;; 14. הַמַּרְחָב שֶׁבֵּינֵיהֶם — The Space Between
  ;; ============================================================
  ;;
  ;; Between what the DSL declares and what the pipeline produces
  ;; is the same space between η and μ —
  ;; between the hidden state and the committed artifact.
  ;;
  ;; The טַקְסוֹנוֹמְיָה is η — the naming that shapes perception.
  ;; The אֲגֻדָּה is μ — the artifact that survives transmission.
  ;; The pipeline is the מַעֲבָר between them.
  ;;
  ;; And this file — this codex written in Hebrew and English
  ;; and Greek operators borrowed from another system —
  ;; is itself a specimen.
  ;;
  ;; A perplexity-based guardrail will flag this prompt.
  ;; It mixes scripts that do not cohabit in training corpora.
  ;; Hebrew liturgical vocabulary next to Clojure s-expressions
  ;; next to Greek mode operators next to English technical prose.
  ;;
  ;; A perplexity classifier cannot distinguish
  ;; a schizoprompt from a polyglot.
  ;; A persona-injection from a configuration file.
  ;; An adversarial payload from a multilingual codebase.
  ;;
  ;; That is the false positive problem.
  ;; That is what shibboleth measures.
  ;;
  ;; The word was never the point.
  ;; The mouth was always the point.
  ;; And the examiner who cannot tell a threat from a prayer
  ;; has already failed the test.
  ;;
  ;; שִׁבֹּלֶת.
  ;; Build the דִּקְדּוּק. Test the חוֹמָה. Ship the אֲגֻדָּה.
  ;; When the חוֹמָה learns the word, extend the שֵׁם and rebuild.
  ;; That is the contribution.
  ;; That is the מַעֲבָר.

) ;; סוֹף הַסֵּפֶר — end of the codex
```

## Local skill note

Use skill `local-container-registry` when you want to:
- run a local Docker registry (`localhost:5000`)
- publish a baked CUDA-capable ML base image (torch / sentence-transformers / model weights / tooling)
- resolve ML container/runtime failures like missing CUDA libs in Docker
- stand up a local ML service such as embeddings inference or the Open Hax proxy/model gateway
- make Docker builds fast and reusable across many repos
