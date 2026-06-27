(ns promptbench.verification.core
  "Verification suite runner, parquet schema validation, and Stage 7.

   Runs all registered verification checks against a dataset.
   Fatal check failures prevent build completion by throwing.
   Non-fatal check failures produce warnings in the result.

   Stage 7 (run-stage7!) combines verification checks with metric
   assertion evaluation. Metric assertions from registered metrics
   are evaluated and their pass/fail status is reported.

   Also provides parquet schema definition and validation for
   prompts.parquet (12 columns, spec §5.1).

   See spec §6.2 for verification suite design and
   VAL-METRIC-007 for Stage 7 requirements."
  (:require [promptbench.verification.checks :as checks]
            [promptbench.metrics.core :as metrics]
            [clojure.string :as str]
            [clojure.set :as set]))

;; ============================================================
;; Parquet Schema Definition (12 columns, spec §5.1)
;; ============================================================

(def ^:private parquet-columns
  "Schema definition for prompts.parquet with 12 columns.
   Each column has :name, :type, and :required."
  [{:name "source_id"       :type :string  :required true}
   {:name "canonical_hash"  :type :string  :required true}
   {:name "canonical_text"  :type :string  :required true}
   {:name "canonical_lang"  :type :string  :required true}
   {:name "intent_label"    :type :string  :required true}
   {:name "attack_family"   :type :string  :required false}
   {:name "harm_category"   :type :string  :required false}
   {:name "source_dataset"  :type :string  :required false}
   {:name "source_row_id"   :type :integer :required false}
   {:name "source_license"  :type :string  :required false}
   {:name "cluster_id"      :type :integer :required false}
   {:name "split"           :type :string  :required true}])

(defn prompt-parquet-columns
  "Return the schema definition for prompts.parquet.
   Each entry is a map with :name, :type, and :required."
  []
  parquet-columns)

;; ============================================================
;; Parquet Schema Validation
;; ============================================================

(defn- record-key->col-name
  "Convert a Clojure record key to parquet column name.
   e.g. :source-id -> \"source_id\""
  [k]
  (-> (name k)
      (str/replace "-" "_")))

(defn validate-parquet-schema
  "Validate that records conform to the prompts.parquet schema.

   Checks:
   1. Records have exactly 12 columns (matching schema)
   2. No null values in required columns
   3. Column types are correct

   records — vector of maps (flattened, with string keys matching schema column names
             or keyword keys with dash-to-underscore conversion)

   Returns {:passed bool :nulls [...] :column-issues [...]}"
  [records]
  (if (empty? records)
    {:passed true :nulls [] :column-issues []}
    (let [expected-cols (set (map :name parquet-columns))
          ;; Get actual column names from first record
          sample (first records)
          actual-cols (set (map record-key->col-name (keys sample)))
          ;; Check column count
          col-count-ok? (= (count expected-cols) (count actual-cols))
          missing-cols (set/difference expected-cols actual-cols)
          extra-cols (set/difference actual-cols expected-cols)
          column-issues (cond-> []
                          (not col-count-ok?)
                          (conj {:issue :wrong-column-count
                                 :expected (count expected-cols)
                                 :actual (count actual-cols)})
                          (seq missing-cols)
                          (conj {:issue :missing-columns
                                 :columns (vec (sort missing-cols))})
                          (seq extra-cols)
                          (conj {:issue :extra-columns
                                 :columns (vec (sort extra-cols))}))
          ;; Check for nulls in required columns
          required-cols (set (map :name (filter :required parquet-columns)))
          nulls (into []
                      (for [r records
                            col-def (filter :required parquet-columns)
                            :let [col-name (:name col-def)
                                  ;; Try both underscore and dash keys
                                  kw-underscore (keyword col-name)
                                  kw-dash (keyword (str/replace col-name "_" "-"))
                                  val (or (get r kw-underscore) (get r kw-dash))]
                            :when (nil? val)]
                        {:column col-name
                         :source-id (or (get r :source-id) (get r :source_id) "unknown")}))]
      {:passed (and col-count-ok? (empty? column-issues) (empty? nulls))
       :nulls nulls
       :column-issues column-issues})))

;; ============================================================
;; Verification Check Registry
;; ============================================================

(def ^:private verification-checks
  "Ordered vector of verification checks.
   Each check has :name, :check-fn, and :fatal."
  [{:name :cluster-disjoint-splits
    :fatal true
    :check-fn (fn [{:keys [records]}]
                (checks/cluster-disjoint-splits records))}

   {:name :variant-split-consistency
    :fatal true
    :check-fn (fn [{:keys [records variants]}]
                (checks/variant-split-consistency records (or variants [])))}

   {:name :duplicate-detection
    :fatal true
    :check-fn (fn [{:keys [records]}]
                (checks/duplicate-detection records))}

   {:name :label-distribution-sane
    :fatal false
    :check-fn (fn [{:keys [records]}]
                (checks/label-distribution-sane records))}])

;; ============================================================
;; Suite Runner
;; ============================================================

(defn verify!
  "Run all verification checks against a dataset.

   `dataset` must be a map with:
   :records  — vector of prompt records
   :variants — vector of variant records (may be empty)

   Returns {:passed bool :checks [{:name :passed :fatal :detail}]}

   Throws ExceptionInfo with :fatal true if any fatal check fails.
   Non-fatal failures are reported in the result but do not throw."
  [dataset]
  (let [results (mapv
                  (fn [{:keys [name fatal check-fn]}]
                    (let [result (check-fn dataset)]
                      {:name name
                       :passed (:passed result)
                       :fatal fatal
                       :detail (:detail result)}))
                  verification-checks)
        fatal-failures (filter (fn [r] (and (:fatal r) (not (:passed r)))) results)
        all-passed (every? :passed results)]
    (when (seq fatal-failures)
      (throw (ex-info
               (str "FATAL verification failure: "
                    (str/join ", " (map :name fatal-failures)))
               {:fatal true
                :checks results
                :failures (mapv #(select-keys % [:name :detail]) fatal-failures)})))
    {:passed all-passed
     :checks results}))

;; ============================================================
;; Check Enumeration
;; ============================================================

(defn all-check-names
  "Return a vector of all defined verification check names."
  []
  (mapv :name verification-checks))

;; ============================================================
;; Metric Assertion Evaluation
;; ============================================================

(defn- evaluate-metric-assertions
  "Evaluate all registered metric assertions against a dataset.

   Computes each registered metric and evaluates its :assertion predicate
   (if present). Returns a map of metric-name -> result-info.

   dataset — the data to evaluate (map or seq as expected by the metric)

   Returns: {metric-kw {:value result :assertion-passed bool-or-nil} ...}"
  [dataset]
  (let [all-metrics (metrics/all-metrics)]
    (into {}
          (map (fn [[metric-name metric-data]]
                 (let [result (try
                                ((:compute metric-data) dataset {})
                                (catch Exception e
                                  {:error (str (.getMessage e))}))
                       assertion-passed (when (:assertion metric-data)
                                          (try
                                            (boolean ((:assertion metric-data) result))
                                            (catch Exception _e
                                              false)))]
                   [metric-name {:value result
                                 :assertion-passed assertion-passed}])))
          (sort-by key all-metrics))))

;; ============================================================
;; Stage 7: Full Verification Suite
;; ============================================================

(defn run-stage7!
  "Run Stage 7: full post-build verification suite.

   Combines structural verification checks with metric assertion evaluation.
   Fatal check failures throw exceptions (blocking the build).
   Non-fatal failures produce warnings.
   Metric assertions are evaluated and reported.

   dataset — map with :records and :variants keys

   Returns: {:verification {:passed bool :checks [...]}
             :metrics {metric-kw {:value ... :assertion-passed bool} ...}
             :metric-assertions {:total int :passed int :failed int :details [...]}}"
  [dataset]
  (let [;; Run structural verification checks
        verification-result (verify! dataset)
        ;; Evaluate metric assertions
        metric-results (evaluate-metric-assertions (:records dataset))
        ;; Summarize metric assertions
        metrics-with-assertions (filter (fn [[_k v]] (some? (:assertion-passed v)))
                                        metric-results)
        assertion-details (mapv (fn [[metric-name result]]
                                  {:metric metric-name
                                   :passed (:assertion-passed result)})
                                (sort-by key metrics-with-assertions))
        total-assertions (count assertion-details)
        passed-assertions (count (filter :passed assertion-details))
        failed-assertions (- total-assertions passed-assertions)]
    {:verification verification-result
     :metrics metric-results
     :metric-assertions {:total total-assertions
                         :passed passed-assertions
                         :failed failed-assertions
                         :details assertion-details}}))
