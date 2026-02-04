;; pm2-clj.eval - Evaluation and import support for ecosystem files
;;
;; This namespace provides:
;; - eval-file: Evaluate root ecosystem files
;; - eval-file-any: Evaluate any file (including imports)
;; - Import resolution and caching

(ns pm2-clj.eval
  (:require [clojure.string :as str]
            [cljs.reader :as reader]
            [pm2-clj.util :as u]
            [pm2-clj.dsl :as dsl]
            ["child_process" :as cp]))

(def ^:dynamic *cwd* nil)
(def ^:dynamic *import-stack* nil)

;; ============================================================================
;; Path Resolution
;; ============================================================================

(defn- resolve-path
  "Resolve path relative to current working directory."
  [path]
  (let [cwd (or *cwd* (.cwd js/process))]
    (if (or (str/starts-with? path "/")
            (str/starts-with? path "."))
      path
      (u/join cwd path))))

(defn- resolve-import-path
  "Resolve import path considering relative and absolute paths."
  [import-path current-file]
  (let [resolved (resolve-path import-path)]
    (if (str/starts-with? import-path ".")
      (if *cwd*
        (u/join *cwd* import-path)
        (u/join (u/dirname current-file) import-path))
      resolved)))

;; ============================================================================
;; File Reading
;; ============================================================================

(defn- include-code
  "Read file content."
  [path]
  (let [full-path (resolve-path path)]
    (when-not (u/exists? full-path)
      (throw (ex-info "File not found" {:path full-path})))
    (u/read-file full-path)))

;; ============================================================================
;; NS Form Handling
;; ============================================================================

;; Find end index of NS form's closing paren in a string after: "(ns " part.
;; Returns: index (0-based) within: string after: NS start, where the
;; matching closing paren is located. If not found, returns the length of: the string.
(defn- find-ns-end-index [s]
  (loop [i 0
         depth 1]
    (if (>= i (count s))
      (count s)
      (let [c (nth s i)]
        (cond (= c \() (recur (inc i) (inc depth))
              (= c \)) (if (= depth 1)
                                  i
                                  (recur (inc i) (dec depth)))
              :else (recur (inc i) depth))))))

(defn- strip-ns-form
  "Remove ns form from code string."
  [code]
  (loop [content code
         acc ""]
    (if (empty? content)
      acc
      (if-let [ns-start (re-find #"\(ns\s+" content)]
        (let [idx (.indexOf content ns-start)
              before (subs content 0 idx)
              after (subs content (+ idx (count ns-start)))]
          (let [end-idx (find-ns-end-index after)
                end-pos (inc end-idx)]
            (recur (subs after end-pos) (str acc before))))
        (recur "" (str acc content))))))

;; ============================================================================
;; Code Evaluation via nbb
;; ============================================================================

(defn- eval-via-nbb!
  "Execute .cljs file via nbb subprocess and capture output."
  [path]
  (let [nbb-bin (or (.-NBB_BIN js/process.env) "nbb")
        cwd (or *cwd* (.cwd js/process))
        file-content (include-code path)
        cleaned-content (strip-ns-form file-content)
        ;; Simple evaluation - evaluate DSL code directly
        result (cp/spawnSync nbb-bin #js ["-e" cleaned-content] #js {:cwd cwd :encoding "utf8"})]
    (if (.-error result)
      (throw (ex-info "nbb execution failed" {:error (.-error result)}))
      (let [stdout (.-stdout result)
            stderr (.-stderr result)]
        (when (seq stderr)
          (js/console.error "nbb stderr:" stderr))
        (reader/read-string stdout)))))

(defn- eval-code-via-nbb!
  "Execute code string via nbb subprocess and capture output."
  [code-str]
  (let [nbb-bin (or (.-NBB_BIN js/process.env) "nbb")
        cwd (or *cwd* (.cwd js/process))
        cleaned-content (strip-ns-form code-str)
        result (cp/spawnSync nbb-bin #js ["-e" cleaned-content] #js {:cwd cwd :encoding "utf8"})]
    (if (.-error result)
      (throw (ex-info "nbb execution failed" {:error (.-error result)}))
      (let [stdout (.-stdout result)
            stderr (.-stderr result)]
        (when (seq stderr)
          (js/console.error "nbb stderr:" stderr))
        (reader/read-string stdout)))))

;; ============================================================================
;; Import Handling
;; ============================================================================

(defn- extract-import-paths
  "Extract import paths from code string."
  [code]
  (let [import-pattern #"\(import\s+\"([^\"]+)\"\)"
        matches (re-seq import-pattern code)]
    (map second matches)))

(defn- eval-with-imports!
  "Evaluate code with import support."
  [code-path code-str]
  (let [import-paths (extract-import-paths code-str)
        processed-code (atom code-str)
        all-import-results (atom [])]

    ;; Process each import
    (doseq [import-path import-paths]
      (let [full-import-path (resolve-import-path import-path code-path)
            import-code (include-code full-import-path)]

        ;; Recursively process nested imports
        (binding [*import-stack* (conj (or *import-stack* []) full-import-path)]
          (let [nested-result (eval-with-imports! full-import-path import-code)]
            (swap! all-import-results conj nested-result)))

        ;; Remove import form from code
        (reset! processed-code (str/replace @processed-code (str "(import \"" import-path "\")") ""))))

    ;; Evaluate: processed code
    (let [result (eval-code-via-nbb! @processed-code)]
      {:result result
       :import-results @all-import-results})))

;; ============================================================================
;; Public API
;; ============================================================================

(defn eval-file-any
  "Evaluate any .cljs file, supporting imports.
   
   This function is used for imported files in ecosystem configurations.
   It resets registries before evaluation to ensure isolation.
   
   (eval-file-any \"libs/shared-config.cljs\")"
  [path]
  (let [ext (u/ext path)]
    (cond
      (= ext ".cljs")
      (binding [*cwd* (if *cwd* *cwd* (u/dirname path))]
        ;; Reset registries for clean evaluation
        (dsl/reset-registries!)
        (let [result (eval-with-imports! path (include-code path))]
          (:result result)))

      (or (= ext ".edn") (= ext ".pm2.edn"))
      (let [code (include-code path)
            result (reader/read-string code)]
        result)

      :else
      (let [code (include-code path)
            result (reader/read-string code)]
        result))))

(defn eval-file
  "Evaluate root ecosystem file.
   
   This function is used for the main ecosystem.cljs file.
   It sets up: evaluation context and returns: ecosystem config.
   
   (eval-file \"ecosystem.cljs\")"
  [path]
  (let [ext (u/ext path)]
    (cond
      (= ext ".cljs")
      (binding [*cwd* (if *cwd* *cwd* (u/dirname path))]
        (eval-via-nbb! path))

      (or (= ext ".edn") (= ext ".pm2.edn"))
      (let [code (include-code path)
            result (reader/read-string code)]
        result)

      :else
      (let [code (include-code path)
            result (reader/read-string code)]
        result))))

;; ============================================================================
;; Utility
;; ============================================================================

(defn get-imported-files
  "Get: current import stack (for debugging)."
  []
  (vec (or *import-stack* [])))
