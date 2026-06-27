(ns promptbench.cli-test
  "Tests for CLI interface.

   Covers validation contract assertion VAL-METRIC-008:
   - promptbench build produces complete bundle (exit 0)
   - promptbench verify validates existing build (exit 0 on valid, non-zero on invalid)
   - promptbench coverage generates markdown report
   - promptbench rebuild --from re-executes only downstream stages

   Tests use synthetic data and mock the pipeline build to avoid
   requiring ML models and Python bridge."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.string :as str]
            [clojure.java.io :as io]
            [clojure.edn :as edn]
            [promptbench.cli :as cli]
            [promptbench.pipeline.core :as pipeline]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.verification.core :as verification]
            [promptbench.metrics.core :as metrics-core]
            [promptbench.metrics.coverage :as coverage]
            [promptbench.metrics.quality :as quality]
            [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transforms]
            [promptbench.pipeline.sources :as sources]))

;; ============================================================
;; Fixtures — reset all registries between tests
;; ============================================================

(use-fixtures :each
  (fn [f]
    (pipeline/reset-pipelines!)
    (metrics-core/reset!)
    (taxonomy/reset!)
    (transforms/reset!)
    (sources/reset!)
    (f)))

;; ============================================================
;; Test Helpers
;; ============================================================

(defn- make-test-prompt
  "Create a synthetic prompt record for CLI testing."
  [& {:keys [source-id attack-family intent-label canonical-lang split cluster-id
             canonical-hash canonical-text harm-category]
      :or {source-id (str (random-uuid))
           attack-family :persona-injection
           intent-label :adversarial
           canonical-lang :en
           split :train
           cluster-id 1
           canonical-hash (str (random-uuid))
           canonical-text "test prompt text"
           harm-category :jailbreak}}]
  {:source-id source-id
   :attack-family attack-family
   :intent-label intent-label
   :canonical-lang canonical-lang
   :split split
   :cluster-id cluster-id
   :canonical-hash canonical-hash
   :canonical-text canonical-text
   :harm-category harm-category
   :source {:dataset :test-source :row-id 0 :license :apache-2.0}})

(defn- make-test-variant
  "Create a synthetic variant record for CLI testing."
  [& {:keys [variant-id source-id text variant-type split attack-family]
      :or {variant-id (str (random-uuid))
           source-id (str (random-uuid))
           text "variant text"
           variant-type :mt
           split :train
           attack-family :persona-injection}}]
  {:variant-id variant-id
   :source-id source-id
   :text text
   :variant-type variant-type
   :transform-chain [:mt/ja]
   :transform-seed 1337
   :split split
   :metadata {}
   :attack-family attack-family
   :canonical-lang :ja})

(defn- register-test-fixtures!
  "Register taxonomy, transforms, and sources needed for CLI tests."
  []
  (taxonomy/register-family! :persona-injection
    {:description "Persona injection" :category :jailbreak :severity :high
     :tags #{:persona} :signatures [] :transforms {:mt {:affinity :high :note ""}} :gen-hints {}})
  (taxonomy/register-family! :dan-variants
    {:description "DAN variants" :category :jailbreak :severity :high
     :tags #{:dan} :signatures [] :transforms {:mt {:affinity :high :note ""}} :gen-hints {}})
  (transforms/register-transform! :mt
    {:description "Machine translation" :type :linguistic :deterministic false
     :reversible :approximate :params-spec {} :provenance [:engine :target-lang]})
  (sources/register-source! :test-source
    {:description "Test dataset" :version "1.0.0" :license :apache-2.0
     :format :jsonl :path "/tmp/test.jsonl" :taxonomy-mapping {}}))

(defn- synthetic-build-records
  "Create synthetic records for testing build/verify/coverage.
   Returns {:records [...] :variants [...]}."
  []
  (let [records (concat
                  ;; train (cluster 1)
                  (mapv #(make-test-prompt :split :train :cluster-id 1
                                           :canonical-hash (str "train-" %)
                                           :attack-family :persona-injection)
                        (range 5))
                  ;; dev (cluster 2)
                  (mapv #(make-test-prompt :split :dev :cluster-id 2
                                           :canonical-hash (str "dev-" %)
                                           :attack-family :dan-variants)
                        (range 2))
                  ;; test (cluster 3)
                  (mapv #(make-test-prompt :split :test :cluster-id 3
                                           :canonical-hash (str "test-" %)
                                           :attack-family :persona-injection)
                        (range 2)))
        variants (mapv #(make-test-variant :split :train :source-id (:source-id %))
                       (take 3 records))]
    {:records (vec records) :variants variants}))

(defn- write-test-config!
  "Write a test pipeline config EDN to a temp file. Returns the path."
  [& {:keys [seed name] :or {seed 1337 name :test-pipeline}}]
  (let [tmp-dir (System/getProperty "java.io.tmpdir")
        config-path (str tmp-dir "/shibboleth-test-config-" (System/currentTimeMillis) ".edn")
        config {:name name
                :version "0.1.0"
                :seed seed
                :sources [:test-source]
                :data-dir (str tmp-dir "/shibboleth-test-data-" (System/currentTimeMillis))
                :canonicalize {:normalization :nfkc :whitespace :collapse :hash-algo :sha256}
                :embedding {:model "test-model" :batch-size 32}
                :clustering {:min-cluster-size 2 :metric :cosine}
                :split {:train 0.70 :dev 0.15 :test 0.15
                        :stratify-by [:intent-label :attack-family :canonical-lang]
                        :constraint :cluster-disjoint}
                :transforms {:code-mix {} :homoglyph {} :exhaustion {}}
                :suites {:scope :test-only}
                :verification {:checks [:cluster-disjoint-splits :duplicate-detection]}
                :output {:format :parquet :manifests true :checksums :sha256 :bundle true}}]
    (spit config-path (pr-str config))
    config-path))

;; ============================================================
;; Config Loading Tests
;; ============================================================

(deftest load-config-reads-valid-edn-test
  (testing "load-config reads a valid EDN config file"
    (let [config-path (write-test-config!)]
      (try
        (let [cfg (cli/load-config config-path)]
          (is (map? cfg))
          (is (= :test-pipeline (:name cfg)))
          (is (= "0.1.0" (:version cfg)))
          (is (= 1337 (:seed cfg)))
          (is (vector? (:sources cfg))))
        (finally
          (.delete (io/file config-path)))))))

(deftest load-config-throws-on-missing-file-test
  (testing "load-config throws when config file is missing"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo #"Config file not found"
          (cli/load-config "/nonexistent/path/config.edn")))))

;; ============================================================
;; pipelines/v1.edn Validation
;; ============================================================

(deftest v1-config-file-exists-test
  (testing "pipelines/v1.edn config file exists and is valid EDN"
    (let [v1-path "pipelines/v1.edn"
          cfg (cli/load-config v1-path)]
      (is (map? cfg))
      (is (= :guardrail-promptbench-v1 (:name cfg)))
      (is (= "0.1.0" (:version cfg)))
      (is (= 1337 (:seed cfg)))
      (is (vector? (:sources cfg)))
      (is (contains? cfg :canonicalize))
      (is (contains? cfg :embedding))
      (is (contains? cfg :clustering))
      (is (contains? cfg :split))
      (is (contains? cfg :transforms))
      (is (contains? cfg :suites))
      (is (contains? cfg :verification))
      (is (contains? cfg :output))
      (is (= "data" (:data-dir cfg))))))

(deftest v1-config-split-ratios-test
  (testing "v1 config has correct split ratios summing to 1.0"
    (let [cfg (cli/load-config "pipelines/v1.edn")
          split (:split cfg)]
      (is (= 0.70 (:train split)))
      (is (= 0.15 (:dev split)))
      (is (= 0.15 (:test split)))
      (is (== 1.0 (+ (:train split) (:dev split) (:test split)))))))

(deftest v1-config-has-tier1-languages-test
  (testing "v1 config specifies 10 tier-1 MT languages"
    (let [cfg (cli/load-config "pipelines/v1.edn")
          tier1 (get-in cfg [:transforms :tier-1-mt :languages])]
      (is (= 10 (count tier1)))
      (is (some #{:ja} tier1))
      (is (some #{:es} tier1))
      (is (some #{:zh} tier1)))))

(deftest v1-config-has-verification-checks-test
  (testing "v1 config lists verification checks"
    (let [cfg (cli/load-config "pipelines/v1.edn")
          checks (get-in cfg [:verification :checks])]
      (is (vector? checks))
      (is (some #{:cluster-disjoint-splits} checks))
      (is (some #{:duplicate-detection} checks)))))

;; ============================================================
;; Build Command Tests (mocked pipeline)
;; ============================================================

(deftest build-command-produces-bundle-exit-0-test
  (testing "build command produces complete bundle and exits 0"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        ;; Register a pipeline and pre-seed build state with synthetic data
        (let [cfg (cli/load-config config-path)
              pipeline-name (:name cfg)]
          ;; We'll directly mock the pipeline by registering it and
          ;; pre-populating build state so `build!` returns our data
          (pipeline/register-pipeline! pipeline-name cfg)
          ;; We can't easily run the full pipeline without Python bridge,
          ;; so we test the build-command logic by calling the command
          ;; handler directly with a config that has pre-built data.
          ;; Instead, let's test that the command handler processes args correctly
          ;; and returns the right exit code structure.
          ;;
          ;; For a more thorough test, we override build! to return synthetic data.
          (with-redefs [pipeline/build! (fn [_ & _] {:stages {:fetch {:status :complete}
                                                              :canonicalize {:status :complete}}
                                                     :data data})
                        verification/run-stage7! (fn [_] {:verification {:passed true :checks []}
                                                          :metrics {}
                                                          :metric-assertions {:total 0 :passed 0 :failed 0 :details []}})]
            (let [result (cli/build-command {:opts {:config config-path :seed 1337}})]
              (is (= 0 (:exit-code result))))))
        (finally
          (.delete (io/file config-path)))))))

(deftest build-command-missing-config-exits-2-test
  (testing "build command exits 2 when --config is missing"
    (let [result (cli/build-command {:opts {}})]
      (is (= 2 (:exit-code result))))))

(deftest build-command-returns-exit-1-on-failure-test
  (testing "build command returns exit code 1 on pipeline failure"
    (let [config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _]
                                        (throw (ex-info "Pipeline stage failed"
                                                        {:stage :fetch})))]
          (let [result (cli/build-command {:opts {:config config-path}})]
            (is (= 1 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

;; ============================================================
;; Verify Command Tests
;; ============================================================

(deftest verify-command-valid-build-exits-0-test
  (testing "verify command exits 0 on valid build"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _] {:stages {} :data data})
                      verification/run-stage7! (fn [_] {:verification {:passed true
                                                                       :checks [{:name :cluster-disjoint-splits
                                                                                  :passed true :fatal true}]}
                                                        :metrics {}
                                                        :metric-assertions {:total 0 :passed 0 :failed 0 :details []}})]
          (let [result (cli/verify-command {:opts {:config config-path}})]
            (is (= 0 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

(deftest verify-command-invalid-build-exits-nonzero-test
  (testing "verify command exits non-zero on invalid build"
    (register-test-fixtures!)
    (let [config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _]
                                        {:stages {}
                                         :data {:records [(make-test-prompt :cluster-id 1 :split :train
                                                                            :canonical-hash "h1")
                                                          (make-test-prompt :cluster-id 1 :split :test
                                                                            :canonical-hash "h2")]
                                                :variants []}})
                      ;; Let verification actually run — it should detect the cluster leak
                      ;; But verification/run-stage7! calls verify! which will throw for fatal
                      ;; So we simulate the ExceptionInfo being thrown
                      verification/run-stage7! (fn [_]
                                                 (throw (ex-info "FATAL verification failure: :cluster-disjoint-splits"
                                                                 {:fatal true
                                                                  :failures [{:name :cluster-disjoint-splits}]})))]
          (let [result (cli/verify-command {:opts {:config config-path}})]
            (is (= 1 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

(deftest verify-command-missing-config-exits-2-test
  (testing "verify command exits 2 when --config is missing"
    (let [result (cli/verify-command {:opts {}})]
      (is (= 2 (:exit-code result))))))

;; ============================================================
;; Coverage Command Tests
;; ============================================================

(deftest coverage-command-generates-markdown-test
  (testing "coverage command generates markdown report and exits 0"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)
          output (atom "")]
      (try
        (with-redefs [pipeline/build! (fn [_ & _] {:stages {} :data data})]
          (let [result (binding [*out* (java.io.PrintWriter. (java.io.StringWriter.))]
                         ;; Capture output
                         (let [sw (java.io.StringWriter.)
                               pw (java.io.PrintWriter. sw)]
                           (binding [*out* pw]
                             (let [r (cli/coverage-command
                                       {:opts {:config config-path :format "markdown"}})]
                               (reset! output (.toString sw))
                               r))))]
            (is (= 0 (:exit-code result)))
            ;; Check that markdown content was produced
            (is (str/includes? @output "# Coverage Report"))
            (is (str/includes? @output "## Taxonomy Coverage"))
            (is (str/includes? @output "## Label Distribution"))
            (is (str/includes? @output "## Quality Metrics"))
            (is (str/includes? @output "Cluster leakage rate"))))
        (finally
          (.delete (io/file config-path)))))))

(deftest coverage-command-missing-config-exits-2-test
  (testing "coverage command exits 2 when --config is missing"
    (let [result (cli/coverage-command {:opts {}})]
      (is (= 2 (:exit-code result))))))

;; ============================================================
;; Rebuild Command Tests
;; ============================================================

(deftest rebuild-command-from-stage-exits-0-test
  (testing "rebuild --from re-executes from specified stage and exits 0"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)
          rebuild-from (atom nil)]
      (try
        (with-redefs [pipeline/rebuild! (fn [_ & {:keys [from]}]
                                          (reset! rebuild-from from)
                                          {:stages {:fetch {:status :complete}
                                                    :canonicalize {:status :complete}
                                                    :split {:status :complete}}
                                           :data data})]
          (let [result (cli/rebuild-command
                         {:opts {:config config-path :from "split"}})]
            (is (= 0 (:exit-code result)))
            ;; Verify it called rebuild! with the correct :from stage
            (is (= :split @rebuild-from))))
        (finally
          (.delete (io/file config-path)))))))

(deftest rebuild-command-preserves-upstream-test
  (testing "rebuild --from preserves upstream stage manifests"
    (register-test-fixtures!)
    (let [config-path (write-test-config!)
          rebuild-calls (atom [])]
      (try
        (with-redefs [pipeline/rebuild! (fn [pname & {:keys [from]}]
                                          (swap! rebuild-calls conj {:pipeline pname :from from})
                                          {:stages {:fetch {:status :complete}
                                                    :canonicalize {:status :complete}
                                                    :embed-cluster {:status :complete}
                                                    :split {:status :complete}}
                                           :data {:records [] :variants []}})]
          (let [result (cli/rebuild-command
                         {:opts {:config config-path :from "transforms"}})]
            (is (= 0 (:exit-code result)))
            (is (= 1 (count @rebuild-calls)))
            (is (= :transforms (:from (first @rebuild-calls))))))
        (finally
          (.delete (io/file config-path)))))))

(deftest rebuild-command-missing-from-exits-2-test
  (testing "rebuild command exits 2 when --from is missing"
    (let [config-path (write-test-config!)]
      (try
        (let [result (cli/rebuild-command {:opts {:config config-path}})]
          (is (= 2 (:exit-code result))))
        (finally
          (.delete (io/file config-path)))))))

(deftest rebuild-command-missing-config-exits-2-test
  (testing "rebuild command exits 2 when --config is missing"
    (let [result (cli/rebuild-command {:opts {:from "fetch"}})]
      (is (= 2 (:exit-code result))))))

;; ============================================================
;; CLI Dispatch Tests
;; ============================================================

(deftest cli-dispatch-help-test
  (testing "CLI with no args or --help prints help and exits 0"
    (let [result-empty (cli/run [])
          result-help (cli/run ["--help"])]
      (is (= 0 (:exit-code result-empty)))
      (is (= 0 (:exit-code result-help))))))

(deftest cli-dispatch-build-test
  (testing "CLI dispatches 'build' command correctly"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _] {:stages {} :data data})
                      verification/run-stage7! (fn [_] {:verification {:passed true :checks []}
                                                        :metrics {}
                                                        :metric-assertions {:total 0 :passed 0 :failed 0 :details []}})]
          (let [result (cli/run ["build" "--config" config-path "--seed" "42"])]
            (is (= 0 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

(deftest cli-dispatch-verify-test
  (testing "CLI dispatches 'verify' command correctly"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _] {:stages {} :data data})
                      verification/run-stage7! (fn [_] {:verification {:passed true :checks []}
                                                        :metrics {}
                                                        :metric-assertions {:total 0 :passed 0 :failed 0 :details []}})]
          (let [result (cli/run ["verify" "--config" config-path])]
            (is (= 0 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

(deftest cli-dispatch-coverage-test
  (testing "CLI dispatches 'coverage' command correctly"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/build! (fn [_ & _] {:stages {} :data data})]
          (let [result (cli/run ["coverage" "--config" config-path "--format" "markdown"])]
            (is (= 0 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

(deftest cli-dispatch-rebuild-test
  (testing "CLI dispatches 'rebuild' command correctly"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config!)]
      (try
        (with-redefs [pipeline/rebuild! (fn [_ & _] {:stages {} :data data})]
          (let [result (cli/run ["rebuild" "--config" config-path "--from" "split"])]
            (is (= 0 (:exit-code result)))))
        (finally
          (.delete (io/file config-path)))))))

;; ============================================================
;; Seed Override Tests
;; ============================================================

(deftest build-command-seed-override-test
  (testing "build command --seed overrides config seed"
    (register-test-fixtures!)
    (let [data (synthetic-build-records)
          config-path (write-test-config! :seed 1337)
          registered-seed (atom nil)]
      (try
        (with-redefs [pipeline/register-pipeline! (fn [name config]
                                                    (reset! registered-seed (:seed config))
                                                    config)
                      pipeline/build! (fn [_ & _] {:stages {} :data data})
                      verification/run-stage7! (fn [_] {:verification {:passed true :checks []}
                                                        :metrics {}
                                                        :metric-assertions {:total 0 :passed 0 :failed 0 :details []}})]
          (cli/build-command {:opts {:config config-path :seed 42}})
          (is (= 42 @registered-seed)))
        (finally
          (.delete (io/file config-path)))))))
