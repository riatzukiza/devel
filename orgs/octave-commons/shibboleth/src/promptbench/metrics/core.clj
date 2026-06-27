(ns promptbench.metrics.core
  "def-metric macro and metrics registry.

   Provides a DSL for defining first-class metric constructs with:
   - :description (required) — human-readable description
   - :compute (required) — function (dataset, params) -> result
   - :params (optional) — parameter spec with types and defaults
   - :assertion (optional) — predicate on compute result

   Metrics register in an atom-backed registry and can be computed
   by name via `compute-metric`. The assertion predicate, if present,
   is evaluated after computation and its result attached as metadata
   on the returned value.

   See spec §7 for the metrics DSL design."
  (:refer-clojure :exclude [reset!]))

;; ============================================================
;; Registry Atom
;; ============================================================

(defonce ^:private metrics-registry (atom {}))

;; ============================================================
;; Validation
;; ============================================================

(defn- validate-metric-data!
  "Validate metric data. Throws on missing required keys."
  [metric-name metric-data]
  (when-not (:description metric-data)
    (throw (ex-info (str "Metric " metric-name " requires :description")
                    {:name metric-name :data metric-data})))
  (when-not (:compute metric-data)
    (throw (ex-info (str "Metric " metric-name " requires :compute")
                    {:name metric-name :data metric-data})))
  (when-not (fn? (:compute metric-data))
    (throw (ex-info (str "Metric " metric-name " :compute must be a function")
                    {:name metric-name})))
  (when (and (:assertion metric-data) (not (fn? (:assertion metric-data))))
    (throw (ex-info (str "Metric " metric-name " :assertion must be a function")
                    {:name metric-name}))))

;; ============================================================
;; Registration
;; ============================================================

(defn register-metric!
  "Register a metric in the registry. Throws on invalid data.
   Allows re-registration (overwrites) to support register-*-metrics! being called
   multiple times in tests after reset!."
  [metric-name metric-data]
  (validate-metric-data! metric-name metric-data)
  (swap! metrics-registry assoc metric-name metric-data)
  metric-data)

;; ============================================================
;; def-metric Macro
;; ============================================================

(defmacro def-metric
  "Define and register a metric.

   Usage:
     (def-metric taxonomy-coverage
       {:description \"Proportion of leaf attack families with at least N prompts\"
        :params      {:min-count {:type :int :default 10}}
        :compute     (fn [dataset params] ...)
        :assertion   #(> (:coverage %) 0.8)})

   Required keys: :description, :compute
   Optional keys: :params, :assertion"
  [metric-name metric-data]
  (let [kw-name (keyword (name metric-name))]
    `(register-metric! ~kw-name ~metric-data)))

;; ============================================================
;; Query Functions
;; ============================================================

(defn get-metric
  "Retrieve a metric by keyword name."
  [metric-name]
  (get @metrics-registry metric-name))

(defn all-metrics
  "Return all registered metrics as a map of name -> data."
  []
  @metrics-registry)

;; ============================================================
;; Computation
;; ============================================================

(defn compute-metric
  "Compute a metric by name against a dataset.

   Looks up the metric in the registry, invokes its :compute function
   with the given dataset and params. If the metric has an :assertion,
   evaluates it and attaches the result as metadata under :assertion-passed.

   Returns the compute result, with :assertion-passed metadata if applicable."
  [metric-name dataset params]
  (let [metric (get-metric metric-name)]
    (when-not metric
      (throw (ex-info (str "Unknown metric: " metric-name)
                      {:name metric-name})))
    (let [result ((:compute metric) dataset params)
          assertion (:assertion metric)]
      (if assertion
        (let [passed (boolean (assertion result))]
          (with-meta result {:assertion-passed passed}))
        result))))

;; ============================================================
;; Reset (for test isolation)
;; ============================================================

(defn reset!
  "Clear the metrics registry. Used for test isolation."
  []
  (clojure.core/reset! metrics-registry {})
  nil)
