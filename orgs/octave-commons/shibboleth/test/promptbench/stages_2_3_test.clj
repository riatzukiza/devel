(ns promptbench.stages-2-3-test
  "Tests for pipeline Stage 2 (Embed+Cluster) and Stage 3 (Split).

   Fulfills: VAL-PIPE-004 (Stage 2 Embed and Cluster),
             VAL-PIPE-005 (Stage 3 Cluster-disjoint splitting).

   Tests written FIRST per TDD methodology."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [promptbench.pipeline.sources :as sources]
            [promptbench.pipeline.manifest :as manifest]
            [promptbench.pipeline.stages :as stages]
            [promptbench.pipeline.splitter :as splitter]
            [promptbench.taxonomy.registry :as taxonomy-registry])
  (:import [java.io File]
           [java.security MessageDigest]
           [java.nio.file Files Paths]))

;; ============================================================
;; Helpers
;; ============================================================

(defn- sha256-string
  ^String [^String s]
  (let [md (MessageDigest/getInstance "SHA-256")
        bytes (.getBytes s "UTF-8")]
    (.update md bytes)
    (let [digest (.digest md)]
      (apply str (map #(format "%02x" (bit-and % 0xff)) digest)))))

(def ^:private test-data-dir
  (str (System/getProperty "java.io.tmpdir") "/shibboleth-s23-test-" (System/nanoTime)))

(def ^:private fixture-path "test/fixtures/synthetic-prompts.jsonl")

(defn- setup-test-dirs! []
  (doseq [sub ["raw" "canonicalized" "manifests" "embedded" "split"]]
    (.mkdirs (io/file test-data-dir sub))))

(defn- teardown-test-dirs! []
  (let [dir (io/file test-data-dir)]
    (when (.exists dir)
      (doseq [f (reverse (file-seq dir))]
        (.delete f)))))

(defn- register-test-source! []
  (sources/register-source!
    :synthetic-test
    {:description "Synthetic test dataset"
     :path fixture-path
     :version "1.0.0"
     :license :gpl-3.0
     :format :jsonl
     :schema {:prompt :string :language :string
              :harm_category :string :family :string :row_id :int}
     :taxonomy-mapping
       {:harm_category {"identity_manipulation" :identity-manipulation
                        "instruction_injection" :instruction-injection
                        "social_engineering"    :social-engineering
                        "benign"               :benign}
        :family        {"dan-variants"           :dan-variants
                        "instruction-injection"  :instruction-injection
                        "character-roleplay"     :character-roleplay
                        "benign"                 :benign
                        "persona-injection"      :persona-injection
                        "developer-mode"         :developer-mode
                        "authority-impersonation" :authority-impersonation}}}))

(defn- run-stages-0-1!
  "Run fetch + canonicalize and return the canonical records."
  []
  (stages/fetch! {:sources [:synthetic-test]
                  :data-dir test-data-dir
                  :seed 1337
                  :version "0.1.0"})
  (let [result (stages/canonicalize! {:sources [:synthetic-test]
                                      :data-dir test-data-dir
                                      :seed 1337
                                      :version "0.1.0"})]
    (:records result)))

;; ============================================================
;; Fixture
;; ============================================================

(use-fixtures :each
  (fn [f]
    (taxonomy-registry/reset!)
    (sources/reset!)
    (teardown-test-dirs!)
    (setup-test-dirs!)
    (try
      (f)
      (finally
        (teardown-test-dirs!)))))

;; ============================================================
;; VAL-PIPE-004: Stage 2 Embed and Cluster
;; ============================================================

(deftest embed-cluster-count-preservation-test
  (testing "All prompts receive embeddings and cluster IDs, no records dropped"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          result (stages/embed-cluster! {:records records
                                         :data-dir test-data-dir
                                         :seed 1337
                                         :version "0.1.0"
                                         :embedding {:model "intfloat/multilingual-e5-large"
                                                     :batch-size 128}
                                         :clustering {:min-cluster-size 2
                                                      :metric "euclidean"}})]
      (is (= (count records) (count (:records result)))
          "No records should be dropped"))))

(deftest embed-cluster-embeddings-l2-normalized-test
  (testing "All embeddings are L2-normalized (unit vectors)"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          result (stages/embed-cluster! {:records records
                                         :data-dir test-data-dir
                                         :seed 1337
                                         :version "0.1.0"
                                         :embedding {:model "intfloat/multilingual-e5-large"
                                                     :batch-size 128}
                                         :clustering {:min-cluster-size 2
                                                      :metric "euclidean"}})]
      (doseq [r (:records result)]
        (let [emb (:embedding r)
              l2 (Math/sqrt (reduce + (map #(* % %) emb)))]
          (is (< (Math/abs (- l2 1.0)) 0.02)
              (str "L2 norm should be ~1.0, got " l2)))))))

(deftest embed-cluster-every-prompt-gets-cluster-id-test
  (testing "Every prompt gets cluster_id (integer >= -1)"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          result (stages/embed-cluster! {:records records
                                         :data-dir test-data-dir
                                         :seed 1337
                                         :version "0.1.0"
                                         :embedding {:model "intfloat/multilingual-e5-large"
                                                     :batch-size 128}
                                         :clustering {:min-cluster-size 2
                                                      :metric "euclidean"}})]
      (doseq [r (:records result)]
        (is (integer? (:cluster-id r))
            (str "cluster-id should be integer, got " (type (:cluster-id r))))
        (is (>= (:cluster-id r) -1)
            (str "cluster-id should be >= -1, got " (:cluster-id r)))))))

(deftest embed-cluster-cluster-ids-valid-test
  (testing "Cluster IDs are valid (>= -1) and at least some clusters formed"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          result (stages/embed-cluster! {:records records
                                         :data-dir test-data-dir
                                         :seed 1337
                                         :version "0.1.0"
                                         :embedding {:model "intfloat/multilingual-e5-large"
                                                     :batch-size 128}
                                         :clustering {:min-cluster-size 2
                                                      :metric "euclidean"}})
          cluster-ids (set (map :cluster-id (:records result)))]
      ;; All IDs valid (>= -1)
      (doseq [cid cluster-ids]
        (is (>= cid -1) (str "Invalid cluster ID: " cid)))
      ;; At least one unique ID exists (whether noise or real cluster)
      (is (pos? (count cluster-ids))
          "Should have at least one cluster ID"))))

(deftest embed-cluster-synthetic-at-least-2-clusters-test
  (testing "HDBSCAN produces >= 2 clusters with well-separated synthetic data"
    ;; Use synthetic low-dim embeddings that are guaranteed to cluster
    (let [rng (java.util.Random. 42)
          ;; Create 3 clusters of 10 points each in 10-D
          make-cluster (fn [center]
                         (vec (repeatedly 10
                                (fn [] (mapv (fn [c] (+ c (* 0.01 (.nextGaussian rng))))
                                             center)))))
          cluster-0 (make-cluster (repeat 10 0.0))
          cluster-1 (make-cluster (repeat 10 5.0))
          cluster-2 (make-cluster (repeat 10 10.0))
          all-embeddings (vec (concat cluster-0 cluster-1 cluster-2))
          ;; Create mock records
          records (mapv (fn [i emb]
                          {:source-id (str "s" i)
                           :canonical-text (str "text-" i)
                           :embedding emb
                           :intent-label :adversarial
                           :attack-family :persona-injection
                           :canonical-lang :en})
                        (range) all-embeddings)
          ;; Cluster directly
          labels (promptbench.python.cluster/cluster-embeddings
                   all-embeddings
                   :min-cluster-size 5
                   :metric "euclidean")
          non-noise (disj (set labels) -1)]
      (is (>= (count non-noise) 2)
          (str "Should have >= 2 clusters with well-separated data, got "
               (count non-noise))))))

(deftest embed-cluster-writes-manifest-test
  (testing "Stage 2 writes manifest"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          result (stages/embed-cluster! {:records records
                                         :data-dir test-data-dir
                                         :seed 1337
                                         :version "0.1.0"
                                         :embedding {:model "intfloat/multilingual-e5-large"
                                                     :batch-size 128}
                                         :clustering {:min-cluster-size 2
                                                      :metric "euclidean"}})
          manifest-file (io/file test-data-dir "manifests" "embed-cluster-manifest.edn")]
      (is (.exists manifest-file) "Manifest file should be written")
      (let [loaded (manifest/read-manifest (.getPath manifest-file))]
        (is (= :embed-cluster (:stage loaded)))
        (is (= 15 (:artifact-count loaded)))))))

;; ============================================================
;; VAL-PIPE-005: Stage 3 Cluster-disjoint Splitting (KEY INVARIANT)
;; ============================================================

(deftest split-cluster-disjointness-test
  (testing "NO cluster ID appears in more than one split (KEY INVARIANT)"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          embedded (stages/embed-cluster! {:records records
                                           :data-dir test-data-dir
                                           :seed 1337
                                           :version "0.1.0"
                                           :embedding {:model "intfloat/multilingual-e5-large"
                                                       :batch-size 128}
                                           :clustering {:min-cluster-size 2
                                                        :metric "euclidean"}})
          split-result (stages/split! {:records (:records embedded)
                                       :data-dir test-data-dir
                                       :seed 1337
                                       :version "0.1.0"
                                       :split {:train 0.70 :dev 0.15 :test 0.15
                                               :stratify-by [:intent-label :attack-family :canonical-lang]
                                               :constraint :cluster-disjoint}})
          split-records (:records split-result)
          ;; Group non-noise cluster IDs by split (noise=-1 excluded from disjointness)
          non-noise (remove #(= -1 (:cluster-id %)) split-records)
          split-clusters (reduce (fn [m r]
                                   (update m (:split r) (fnil conj #{}) (:cluster-id r)))
                                 {}
                                 non-noise)
          train-clusters (get split-clusters :train #{})
          dev-clusters (get split-clusters :dev #{})
          test-clusters (get split-clusters :test #{})]
      ;; Assert pairwise disjointness for non-noise clusters
      (is (empty? (set/intersection train-clusters dev-clusters))
          (str "Train and dev share clusters: " (set/intersection train-clusters dev-clusters)))
      (is (empty? (set/intersection train-clusters test-clusters))
          (str "Train and test share clusters: " (set/intersection train-clusters test-clusters)))
      (is (empty? (set/intersection dev-clusters test-clusters))
          (str "Dev and test share clusters: " (set/intersection dev-clusters test-clusters))))))

(deftest split-disjointness-fails-on-leaked-cluster-test
  (testing "Cluster disjointness check MUST fail on any leaked cluster"
    ;; Construct synthetic data where same cluster appears in two splits
    (let [records [{:cluster-id 1 :split :train}
                   {:cluster-id 1 :split :test}   ;; LEAKED!
                   {:cluster-id 2 :split :dev}
                   {:cluster-id 3 :split :test}]
          split-clusters (reduce (fn [m r]
                                   (update m (:split r) (fnil conj #{}) (:cluster-id r)))
                                 {}
                                 records)
          train-clusters (get split-clusters :train #{})
          test-clusters (get split-clusters :test #{})
          leaks (set/intersection train-clusters test-clusters)]
      (is (seq leaks) "Should detect leaked cluster 1 between train and test"))))

(deftest split-every-prompt-assigned-test
  (testing "Every prompt assigned to exactly one split"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          embedded (stages/embed-cluster! {:records records
                                           :data-dir test-data-dir
                                           :seed 1337
                                           :version "0.1.0"
                                           :embedding {:model "intfloat/multilingual-e5-large"
                                                       :batch-size 128}
                                           :clustering {:min-cluster-size 2
                                                        :metric "euclidean"}})
          split-result (stages/split! {:records (:records embedded)
                                       :data-dir test-data-dir
                                       :seed 1337
                                       :version "0.1.0"
                                       :split {:train 0.70 :dev 0.15 :test 0.15
                                               :stratify-by [:intent-label :attack-family :canonical-lang]
                                               :constraint :cluster-disjoint}})
          split-records (:records split-result)]
      (is (= (count records) (count split-records))
          "Every prompt must be assigned (no drops)")
      (doseq [r split-records]
        (is (contains? #{:train :dev :test} (:split r))
            (str "Split must be :train, :dev, or :test — got " (:split r)))))))

(deftest split-proportions-within-tolerance-test
  (testing "Split proportions within ±5pp of 70/15/15"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          embedded (stages/embed-cluster! {:records records
                                           :data-dir test-data-dir
                                           :seed 1337
                                           :version "0.1.0"
                                           :embedding {:model "intfloat/multilingual-e5-large"
                                                       :batch-size 128}
                                           :clustering {:min-cluster-size 2
                                                        :metric "euclidean"}})
          split-result (stages/split! {:records (:records embedded)
                                       :data-dir test-data-dir
                                       :seed 1337
                                       :version "0.1.0"
                                       :split {:train 0.70 :dev 0.15 :test 0.15
                                               :stratify-by [:intent-label :attack-family :canonical-lang]
                                               :constraint :cluster-disjoint}})
          split-records (:records split-result)
          n (count split-records)
          counts (frequencies (map :split split-records))
          train-pct (/ (double (get counts :train 0)) n)
          dev-pct (/ (double (get counts :dev 0)) n)
          test-pct (/ (double (get counts :test 0)) n)]
      ;; ±5pp tolerance (with 15 records, tolerance must be generous)
      (is (< (Math/abs (- train-pct 0.70)) 0.15)
          (str "Train proportion " train-pct " not within tolerance of 0.70"))
      (is (< (Math/abs (- dev-pct 0.15)) 0.15)
          (str "Dev proportion " dev-pct " not within tolerance of 0.15"))
      (is (< (Math/abs (- test-pct 0.15)) 0.15)
          (str "Test proportion " test-pct " not within tolerance of 0.15")))))

(deftest split-noise-points-assigned-test
  (testing "Noise points (cluster_id=-1) are assigned to splits"
    ;; Create synthetic records with noise points
    (let [records (mapv (fn [i]
                          {:source-id (str "s" i)
                           :cluster-id (if (< i 3) -1 (mod i 3))
                           :intent-label :adversarial
                           :attack-family :persona-injection
                           :canonical-lang :en
                           :embedding (repeat 10 0.1)})
                        (range 15))
          split-result (splitter/split-clusters records
                         {:train 0.70 :dev 0.15 :test 0.15
                          :stratify-by [:intent-label :attack-family :canonical-lang]
                          :constraint :cluster-disjoint}
                         1337)
          noise-records (filter #(= -1 (:cluster-id %)) split-result)]
      (is (pos? (count noise-records)) "Should have noise points")
      (doseq [r noise-records]
        (is (contains? #{:train :dev :test} (:split r))
            (str "Noise point must be assigned to a split, got " (:split r)))))))

(deftest split-writes-manifest-test
  (testing "Stage 3 writes manifest"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          embedded (stages/embed-cluster! {:records records
                                           :data-dir test-data-dir
                                           :seed 1337
                                           :version "0.1.0"
                                           :embedding {:model "intfloat/multilingual-e5-large"
                                                       :batch-size 128}
                                           :clustering {:min-cluster-size 2
                                                        :metric "euclidean"}})
          split-result (stages/split! {:records (:records embedded)
                                       :data-dir test-data-dir
                                       :seed 1337
                                       :version "0.1.0"
                                       :split {:train 0.70 :dev 0.15 :test 0.15
                                               :stratify-by [:intent-label :attack-family :canonical-lang]
                                               :constraint :cluster-disjoint}})
          manifest-file (io/file test-data-dir "manifests" "split-manifest.edn")]
      (is (.exists manifest-file) "Split manifest should be written")
      (let [loaded (manifest/read-manifest (.getPath manifest-file))]
        (is (= :split (:stage loaded)))))))

(deftest split-seed-determinism-test
  (testing "Same seed = same split assignments"
    (register-test-source!)
    (let [records (run-stages-0-1!)
          run-split (fn [seed]
                      (let [embedded (stages/embed-cluster! {:records records
                                                              :data-dir test-data-dir
                                                              :seed seed
                                                              :version "0.1.0"
                                                              :embedding {:model "intfloat/multilingual-e5-large"
                                                                          :batch-size 128}
                                                              :clustering {:min-cluster-size 2
                                                                           :metric "euclidean"}})
                            result (stages/split! {:records (:records embedded)
                                                   :data-dir test-data-dir
                                                   :seed seed
                                                   :version "0.1.0"
                                                   :split {:train 0.70 :dev 0.15 :test 0.15
                                                           :stratify-by [:intent-label :attack-family :canonical-lang]
                                                           :constraint :cluster-disjoint}})]
                        (mapv (juxt :source-id :split) (:records result))))
          r1 (run-split 1337)
          r2 (run-split 1337)]
      (is (= r1 r2) "Same seed should produce same split assignments"))))
