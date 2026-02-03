;; pm2-clj.runtime - Runtime for compiled PM2 ecosystem configs
;;
;; This namespace provides the bridge between your CLJS DSL and PM2:
;; - Materialize config from any value (library/ecosystem/proto/fn)
;; - Apply mode/entry selection via environment variables
;; - Export computed config to module.exports for PM2

(ns pm2-clj.runtime
  (:require [clojure.string :as str]
            [pm2-clj.internal :as i]
            [pm2-clj.merge :as m]
            [pm2-clj.dsl :as dsl]))

;; ============================================================================
;; Environment Helpers
;; ============================================================================

(defn getenv
  "Get environment variable with optional default."
  ([k] (getenv k nil))
  ([k default]
   (let [v (aget (.-env js/process) k)]
     (if (or (nil? v) (= "" v)) default v))))

(defn env-kw
  "Get environment variable as keyword."
  ([k] (env-kw k nil))
  ([k default]
   (let [s (getenv k nil)]
     (if (nil? s) default (keyword s)))))

;; ============================================================================
;; Value Materialization
;; ============================================================================

(defn- ecosystem? [x]
  (and (map? x) (contains? x :apps)))

(defn- materialize-value [v]
  "Turn a value into an ecosystem map.
   Supports: ecosystem map, stack proto, or fn returning either."
  (let [v* (cond
             (fn? v) (v)
             :else v)]
    (cond
      (dsl/proto? v*) (dsl/realize-proto v*)
      (map? v*) v*
      :else (throw (ex-info "Config must be an ecosystem map, a stack proto, or a fn returning one"
                            {:value v*})))))

;; ============================================================================
;; Selection & Profile Application
;; ============================================================================

(defn- select-entry [v entry]
  "Select an entry from a library's exports."
  (if (and (map? v) (contains? v i/exports-key))
    (let [exports (get v i/exports-key)
          entry*  (or entry :default)
          picked  (get exports entry*)]
      (when (nil? picked)
        (throw (ex-info "No such entry in exports"
                        {:entry entry* :available (sort (keys exports))})))
      picked)
    v))

(defn- apply-profile [eco mode]
  "Apply profile overrides to ecosystem."
  (if (or (nil? mode) (= mode :default))
    (dissoc eco :profiles)
    (let [p (get-in eco [:profiles mode] {})]
      (-> (dissoc eco :profiles)
          (m/deep-merge p)
          (dissoc :profiles)))))

(defn- strip-internal [eco]
  "Remove internal DSL keys before exporting."
  (-> eco
      (dissoc :profiles)
      (update :apps
              (fn [xs]
                (->> xs
                     (map #(dissoc % i/remove-app-flag i/name-prefix-key i/name-delim-key))
                     (vec))))))

;; ============================================================================
;; Public API
;; ============================================================================

(defn materialize
  "Turn a library/ecosystem/proto/fn into a final PM2 config map.
   
   Options:
     entry: keyword from PM2_CLJ_ENTRY env (or passed directly)
     mode:  keyword from PM2_CLJ_MODE  env (or passed directly)
   
   Selection order:
     1. If value is a library, pick entry from exports
     2. Apply mode profile if present"
  ([v]
   (materialize v
                {:entry (env-kw "PM2_CLJ_ENTRY" :default)
                 :mode  (env-kw "PM2_CLJ_MODE"  :default)}))
  ([v {:keys [entry mode]}]
   (let [picked  (select-entry v entry)
         eco0    (materialize-value picked)]
     (when-not (ecosystem? eco0)
       (throw (ex-info "Materialized config is not an ecosystem map {:apps [...]}"
                       {:value eco0})))
     (-> eco0
         (apply-profile mode)
         (strip-internal)))))

(defn export!
  "Compute and set module.exports for PM2.
   
   This is the critical line that makes the compiled CLJS behave like
   a real CommonJS module that PM2 can require().
   
   Usage:
     (rt/export! my-config)
     (rt/export! my-config {:entry :dev :mode :prod})
   
   After this runs, `require('./ecosystem.config.cjs')` returns the config."
  ([v]
   (export! v nil))
  ([v opts]
   (let [cfg (materialize v opts)]
     (set! (.-exports js/module) (clj->js cfg))
     cfg)))

;; ============================================================================
;; Main Entry Point (for shadow-cljs node-script target)
;; ============================================================================

(defn -main
  "Entry point for shadow-cljs node-script target.
   Does nothing since export! already runs at require-time."
  [& _]
  nil)
