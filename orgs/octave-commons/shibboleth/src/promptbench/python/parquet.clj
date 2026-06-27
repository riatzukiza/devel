(ns promptbench.python.parquet
  "Parquet I/O bridge via libpython-clj.

   Defaults to pyarrow for broader CPU compatibility.
   Set PROMPTBENCH_PARQUET_ENGINE=polars to force the old backend."
  (:require [clojure.string :as str]
            [libpython-clj2.python :as py]
            [promptbench.python.embed :as embed]))

(defn- parquet-engine
  []
  (let [v (some-> (System/getenv "PROMPTBENCH_PARQUET_ENGINE") str/lower-case)]
    (if (#{{"polars" "pyarrow"}} v)
      v
      "pyarrow")))

(defn- records->columnar
  "Convert a vector of maps to a columnar dict {col-name -> [values]}.
   Keys are converted to strings for Python interop."
  [records]
  (let [ks (keys (first records))]
    (reduce (fn [acc k]
              (assoc acc (name k)
                     (mapv (fn [r]
                             (let [v (get r k)]
                               (if (keyword? v)
                                 (name v)
                                 v)))
                           records)))
            {}
            ks)))

(defn- infer-keyword-columns
  "Given the original records, return a set of column name strings
   whose values are keywords."
  [records]
  (let [sample (first records)]
    (->> sample
         (filter (fn [[_k v]] (keyword? v)))
         (map (fn [[k _v]] (name k)))
         set)))

(defn write-parquet
  "Write a vector of maps to a parquet file.
   Keyword values are stored as strings; other types pass through.

   records — vector of maps (homogeneous keys)
   path    — output file path (string)"
  [records path]
  (embed/ensure-python!)
  (let [col-data (records->columnar records)
        col-py   (py/->py-dict
                   (reduce-kv (fn [m k v]
                                (assoc m k (py/->py-list v)))
                              {}
                              col-data))]
    (case (parquet-engine)
      "polars"
      (let [pl (py/import-module "polars")
            df (py/call-attr pl "DataFrame" col-py)]
        (py/call-attr df "write_parquet" (str path)))

      "pyarrow"
      (let [pa (py/import-module "pyarrow")
            pq (py/import-module "pyarrow.parquet")
            table-cls (py/get-attr pa "Table")
            table (py/call-attr table-cls "from_pydict" col-py)]
        (py/call-attr pq "write_table" table (str path))))
    path))

(defn read-parquet
  "Read a parquet file and return a vector of maps.
   Optionally restore keyword columns via :keyword-columns (set of string col names).

   path             — input file path (string)
   :keyword-columns — set of column name strings whose values should be read back as keywords"
  [path & {:keys [keyword-columns] :or {keyword-columns #{}}}]
  (embed/ensure-python!)
  (let [dicts (case (parquet-engine)
                "polars"
                (let [pl (py/import-module "polars")
                      df (py/call-attr pl "read_parquet" (str path))]
                  (py/call-attr df "to_dicts"))

                "pyarrow"
                (let [pq (py/import-module "pyarrow.parquet")
                      table (py/call-attr pq "read_table" (str path))]
                  (py/call-attr table "to_pylist")))
        rows  (py/->jvm dicts)]
    (mapv (fn [row]
            (reduce-kv (fn [m k v]
                         (let [kw-key (keyword k)]
                           (assoc m kw-key
                                  (if (contains? keyword-columns k)
                                    (keyword v)
                                    v))))
                       {}
                       row))
          rows)))
