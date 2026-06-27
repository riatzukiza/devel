(ns promptbench.python-bridge-test
  "Tests for the libpython-clj bridge layer:
   - Python initialization
   - Embeddings (sentence-transformers, multilingual-e5-large)
   - Clustering (HDBSCAN)
   - Parquet I/O (polars)"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.python.embed :as embed]
            [promptbench.python.cluster :as cluster]
            [promptbench.python.parquet :as parquet]
            [libpython-clj2.python :as py])
  (:import [java.io File]))

;; ---------------------------------------------------------------------------
;; Fixtures
;; ---------------------------------------------------------------------------

(defn python-fixture
  "Ensure Python is initialized once for all tests in this namespace."
  [f]
  (embed/ensure-python!)
  (f))

(use-fixtures :once python-fixture)

;; ---------------------------------------------------------------------------
;; 1. Bridge initialization
;; ---------------------------------------------------------------------------

(deftest bridge-initializes
  (testing "libpython-clj initializes and can call Python"
    (let [sys (py/import-module "sys")
          ver (py/get-attr sys "version")]
      (is (string? (str ver)))
      (is (.contains (str ver) "3.")))))

;; ---------------------------------------------------------------------------
;; 2. Embeddings — shape [n, 1024], unit-normalized
;; ---------------------------------------------------------------------------

(deftest embed-batch-shape
  (testing "embed-batch returns [n, 1024] matrix for multilingual-e5-large"
    (let [texts      ["query: Hello world"
                      "query: This is a test"
                      "query: Adversarial prompt injection"]
          embeddings (embed/embed-batch texts "intfloat/multilingual-e5-large"
                       :batch-size 128)]
      (is (= 3 (count embeddings))
          "Should return one embedding per input text")
      (is (every? #(= 1024 (count %)) embeddings)
          "Each embedding should have 1024 dimensions")
      (is (every? #(every? number? %) embeddings)
          "All values should be numbers"))))

(deftest embed-batch-unit-normalized
  (testing "embeddings are L2-normalized (unit vectors)"
    (let [texts      ["query: Normalization test"]
          embeddings (embed/embed-batch texts "intfloat/multilingual-e5-large"
                       :batch-size 128)
          emb        (first embeddings)
          l2-norm    (Math/sqrt (reduce + (map #(* % %) emb)))]
      (is (< (Math/abs (- l2-norm 1.0)) 0.01)
          (str "L2 norm should be ~1.0, got " l2-norm)))))

;; ---------------------------------------------------------------------------
;; 3. Clustering — HDBSCAN labels >= -1, at least 1 cluster
;; ---------------------------------------------------------------------------

(deftest cluster-embeddings-valid-labels
  (testing "HDBSCAN produces valid labels with synthetic Gaussian blobs"
    ;; Generate 3 synthetic Gaussian blobs in 10-D space via numpy
    (let [np        (py/import-module "numpy")
          np-random (py/get-attr np "random")
          rng       (py/call-attr np-random "default_rng" 42)
          ;; Create 3 blobs: 30 points each, 10 dimensions
          blob-1   (py/call-attr-kw rng "normal"
                     [] {:loc 0.0 :scale 0.1 :size (py/->py-tuple [30 10])})
          blob-2   (py/call-attr-kw rng "normal"
                     [] {:loc 5.0 :scale 0.1 :size (py/->py-tuple [30 10])})
          blob-3   (py/call-attr-kw rng "normal"
                     [] {:loc 10.0 :scale 0.1 :size (py/->py-tuple [30 10])})
          combined (py/call-attr np "concatenate"
                     (py/->py-list [blob-1 blob-2 blob-3]))
          ;; Convert to Clojure for our API
          emb-list (py/->jvm (py/call-attr combined "tolist"))
          emb-vecs (mapv vec emb-list)
          labels   (cluster/cluster-embeddings emb-vecs
                     :min-cluster-size 5
                     :metric "euclidean")]
      (is (= 90 (count labels))
          "Should return one label per input point")
      (is (every? #(>= % -1) labels)
          "All labels should be >= -1")
      (is (> (count (disj (set labels) -1)) 0)
          "Should have at least 1 non-noise cluster")
      (is (every? integer? labels)
          "All labels should be integers"))))

;; ---------------------------------------------------------------------------
;; 4. Parquet round-trip — preserves string, keyword, integer, double types
;; ---------------------------------------------------------------------------

(deftest parquet-round-trip
  (testing "write-parquet then read-parquet preserves data field-by-field"
    (let [records (vec (for [i (range 10)]
                         {:name     (str "item-" i)
                          :category (nth [:alpha :beta :gamma] (mod i 3))
                          :count    (long i)
                          :score    (+ 1.0 (* i 0.5))}))
          tmp     (File/createTempFile "parquet-test-" ".parquet")
          path    (.getAbsolutePath tmp)]
      (try
        ;; Write
        (parquet/write-parquet records path)
        (is (.exists tmp) "Parquet file should exist after write")
        (is (> (.length tmp) 0) "Parquet file should be non-empty")

        ;; Read back (with keyword-columns for :category)
        (let [read-back (parquet/read-parquet path
                          :keyword-columns #{"category"})]
          (is (= 10 (count read-back))
              "Should read back same number of records")

          ;; Field-by-field equality
          (doseq [i (range 10)]
            (let [orig (nth records i)
                  read (nth read-back i)]
              (is (= (:name orig) (:name read))
                  (str "String field :name mismatch at row " i))
              (is (= (:category orig) (:category read))
                  (str "Keyword field :category mismatch at row " i))
              (is (= (:count orig) (:count read))
                  (str "Integer field :count mismatch at row " i))
              (is (< (Math/abs (- (double (:score orig))
                                  (double (:score read))))
                     0.001)
                  (str "Double field :score mismatch at row " i)))))
        (finally
          (.delete tmp))))))

(deftest parquet-file-created
  (testing "write-parquet creates a valid .parquet file"
    (let [records [{:text "hello" :id 1}
                   {:text "world" :id 2}]
          tmp     (File/createTempFile "parquet-valid-" ".parquet")
          path    (.getAbsolutePath tmp)]
      (try
        (parquet/write-parquet records path)
        (is (.exists tmp) "File should exist")
        (is (> (.length tmp) 0) "File should be non-empty")

        ;; Verify via pyarrow that it's valid parquet
        (let [pq (py/import-module "pyarrow.parquet")
              table (py/call-attr pq "read_table" path)
              num-rows (py/->jvm (py/get-attr table "num_rows"))
              num-cols (py/->jvm (py/get-attr table "num_columns"))]
          (is (= 2 num-rows) "Should have 2 rows")
          (is (= 2 num-cols) "Should have 2 columns"))
        (finally
          (.delete tmp))))))
