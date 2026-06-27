;; pm2-clj.dsl - Prototype-based DSL for PM2 ecosystem configuration
;;
;; This namespace provides a rich DSL for defining PM2 applications with:
;; - Prototypal extension (extends, with)
;; - Selection/patching (on, where, each, only)
;; - Mode tiers (matrix, tiers, merge-tiers, matrix*, env-tiers)
;; - Grouping (group, services, scope)
;; - Import support for library files
;;
;; All internal keys are defined in pm2-clj.internal.

(ns pm2-clj.dsl
  (:require [clojure.string :as str]
            [pm2-clj.internal :as i]
            [pm2-clj.merge :as m]))

;; ============================================================================
;; Sentinel Values
;; ============================================================================

(def remove i/remove)

;; ============================================================================
;; Prototype Registry (for tracking during evaluation)
;; ============================================================================

(defonce proto-registry (atom {}))
(defonce mixin-registry (atom {}))
(defonce app-registry (atom []))
(defonce profile-registry (atom {}))

(defn reset-registries!
  "Reset all registries. Call before each ecosystem evaluation."
  []
  (reset! proto-registry {})
  (reset! mixin-registry {})
  (reset! app-registry [])
  (reset! profile-registry {}))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn- ->str-id
  "Convert to string identifier."
  [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    (symbol? x) (name x)
    :else (throw (ex-info "id must be string/keyword/symbol" {:id x}))))

(defn- ->mode
  "Convert to mode keyword."
  [x]
  (cond
    (keyword? x) x
    (string? x) (keyword x)
    (symbol? x) (keyword (name x))
    :else (throw (ex-info "mode must be keyword/string/symbol" {:mode x}))))

(defn- opts
  "Accept either a single map, or key/value pairs."
  [& xs]
  (cond
    (and (= 1 (count xs)) (map? (first xs))) (first xs)
    (even? (count xs)) (apply hash-map xs)
    :else (throw (ex-info "expected a map or even number of key/value args" {:args xs}))))

(defn- ecosystem?
  "Check if value is an ecosystem map."
  [x]
  (and (map? x) (contains? x :apps)))

;; ============================================================================
;; Prototype Model - Forward declarations
;; ============================================================================

(declare realize-proto compose)

(defn proto?
  "Check if a map is a prototype object."
  [x]
  (and (map? x) (= (get x i/type-key) :proto)))

(defn- proto-kind [p] (get p i/kind-key))
(defn- proto-id [p] (get p i/id-key))

(defn- mk-proto
  "Create a prototype map."
  [kind id base patch]
  {i/type-key :proto
   i/kind-key kind
   i/id-key   id
   i/base-key base
   i/patch-key patch})

(defn extends
  "Prototypal extension. Returns a new proto that inherits from `base` and applies `patch`."
  [base & patch-args]
  (when-not (proto? base)
    (throw (ex-info "extends expects a proto base" {:base base})))
  (let [patch (apply opts patch-args)]
    (mk-proto (proto-kind base) (proto-id base) base patch)))

(defn- realize-base
  "Realize a base proto/map to a plain map."
  [base]
  (cond
    (nil? base) {}
    (proto? base) (realize-proto base)
    (map? base) base
    :else (throw (ex-info "proto base must be proto/map/nil" {:base base}))))

(defn- compute-app-name
  "Compute final app name with prefix/delim."
  [id merged]
  (let [prefix (get merged i/name-prefix-key)
        delim  (or (get merged i/name-delim-key) "-")
        id*    (->str-id id)]
    (if (and prefix (not (str/blank? (str prefix))))
      (str (str prefix) delim id*)
      id*)))

(defn realize-proto
  "Realize any proto into a plain map (app/profile/mixin/stack)."
  [p]
  (when-not (proto? p)
    (throw (ex-info "realize-proto expects a proto" {:value p})))
  (let [base (get p i/base-key)
        patch (get p i/patch-key)
        realized-base (realize-base base)
        merged (m/deep-merge realized-base patch)]
    (case (proto-kind p)
      :app
      (let [nm (compute-app-name (proto-id p) merged)]
        (-> merged
            (assoc :name nm)
            (dissoc i/name-prefix-key i/name-delim-key)))

      :profile
      (if (ecosystem? merged)
        merged
        (throw (ex-info "profile proto must realize to an ecosystem patch {:apps [...]}"
                        {:id (proto-id p) :value merged})))

      :mixin
      merged

      :stack
      (if (ecosystem? merged)
        merged
        (throw (ex-info "stack proto must realize to an ecosystem {:apps [...]}"
                        {:id (proto-id p) :value merged})))

      (throw (ex-info "unknown proto kind" {:proto p})))))

(defn- coerce-patch
  "Turn proto/map/nil into a map patch."
  [x]
  (cond
    (nil? x) {}
    (proto? x) (realize-proto x)
    (map? x) x
    :else (throw (ex-info "expected proto/map/nil" {:value x}))))

(defn with
  "Extend a proto by composing multiple patches (mixins/maps/protos) left-to-right."
  [base & patches]
  (when-not (proto? base)
    (throw (ex-info "with expects a proto base" {:base base})))
  (let [patch (reduce (fn [acc p] (m/deep-merge acc (coerce-patch p))) {} patches)]
    (extends base patch)))

;; ============================================================================
;; Mixins (first-class, extendable)
;; ============================================================================

(defn def-mixin
  "Define a reusable mixin prototype."
  [id & more]
  (let [id* (->str-id id)
        patch (apply opts more)]
    (swap! mixin-registry assoc id* (mk-proto :mixin id* nil patch))
    (mk-proto :mixin id* nil patch)))

(defn mixin
  "Create an anonymous mixin."
  [& more]
  (mk-proto :mixin "anon" nil (apply opts more)))

(defn mix
  "Compose multiple patches into a mixin."
  [& xs]
  (let [patch (reduce (fn [acc x] (m/deep-merge acc (coerce-patch x))) {} xs)]
    (mk-proto :mixin "mix" nil patch)))

(defn scope
  "Create a scope mixin for name prefixing."
  ([prefix] (scope prefix "-"))
  ([prefix delim]
   (mk-proto :mixin "scope" nil {i/name-prefix-key prefix i/name-delim-key delim})))

(defn env
  "Sugar for environment patches."
  [m]
  (when-not (map? m)
    (throw (ex-info "env expects a map" {:value m})))
  (mixin :env m))

(defn port
  "Set PORT env var."
  [n]
  (mixin :env {:PORT n}))

(defn node-args
  "Set NODE_OPTIONS args."
  [& xs]
  (mixin :node_args (vec xs)))

(defn cluster
  "Enable cluster mode."
  ([] (cluster "max"))
  ([instances]
   (mixin :exec_mode "cluster" :instances instances)))

(defn fork
  "Use fork mode."
  ([] (mixin :exec_mode "fork"))
  ([instances] (mixin :exec_mode "fork" :instances instances)))

(defn log-format
  "Set log date format."
  [fmt]
  (mixin :log_date_format fmt))

(defn merge-logs
  "Enable log merging."
  ([] (merge-logs true))
  ([on?] (mixin :merge_logs (boolean on?))))

;; ============================================================================
;; Apps (first-class, extendable)
;; ============================================================================

(defn def-app
  "Define an app proto."
  [id & more]
  (let [id* (->str-id id)
        [base rest-args] (if (and (seq more) (or (proto? (first more)) (map? (first more))))
                           [(first more) (rest more)]
                           [nil more])
        patch (apply opts rest-args)]
    (mk-proto :app id* base patch)))

(defn app
  "Instantiate an app."
  ([x]
   (cond
     (proto? x) (realize-proto x)
     (map? x) x
     :else (throw (ex-info "app expects proto/map in 1-arg form" {:value x}))))
  ([x & more]
   (cond
     (proto? x) (m/deep-merge (realize-proto x) (apply opts more))
     (map? x) (m/deep-merge x (apply opts more))
     :else
     (let [nm (->str-id x)]
       (m/deep-merge {:name nm} (apply opts more))))))

(defn- app-name
  "Get app name from proto/map/id."
  [x]
  (cond
    (proto? x) (:name (app x))
    (map? x) (:name (app x))
    :else (->str-id x)))

(defn remove-app
  "Mark an app for removal."
  [x]
  {:name (app-name x) i/remove-app-flag true})

(defn apps
  "Create apps fragment."
  [& xs]
  {:apps (vec (map app xs))})

(defn each
  "Apply patch to every app in fragment."
  [patch frag]
  (let [p (coerce-patch patch)]
    (update frag :apps (fn [xs] (mapv #(m/deep-merge % p) xs)))))

(defn- names-in
  "Get app names from fragment."
  [frag]
  (->> (:apps frag) (map app) (map :name) (remove nil?) (vec)))

(defn on
  "Apply patch to selected apps by id/proto/name."
  [ids patch frag]
  (let [names (->> ids (map app-name) set)
        p (coerce-patch patch)
        keep-names (->> (names-in frag) (filter #(contains? names %)) (vec))]
    {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) keep-names)}))

(defn where
  "Apply patch to apps matching predicate."
  [pred patch frag]
  (when-not (fn? pred)
    (throw (ex-info "where expects a predicate fn" {:pred pred})))
  (let [p (coerce-patch patch)
        realized (mapv app (:apps frag))
        selected (->> realized (filter pred) (map :name) (vec))]
    {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) selected)}))

(defn only
  "Keep only selected apps."
  [ids frag]
  (let [names (->> ids (map app-name) set)]
    {:apps (->> (:apps frag) (map app) (filter #(contains? names (:name %))) (vec))}))

;; ============================================================================
;; Profiles (first-class, extendable)
;; ============================================================================

(defn def-profile
  "Define a profile proto."
  [mode & xs]
  (let [mode* (->mode mode)
        [base parts] (if (and (seq xs) (proto? (first xs)))
                       [(first xs) (rest xs)]
                       [nil xs])
        patch (apply compose parts)]
    (mk-proto :profile mode* base patch)))

(defn profile
  "Create a profile fragment."
  ([x]
   (cond
     (proto? x)
     (let [mode (->mode (proto-id x))
           patch (realize-proto x)]
       {:profiles {mode patch}})

     (keyword? x)
     {:profiles {x (compose)}}

     :else
     (throw (ex-info "profile expects keyword or profile proto" {:value x}))))
  ([mode & parts]
   (let [mode* (->mode mode)]
     {:profiles {mode* (apply compose parts)}})))

(defn profiles
  "Compose profile fragments."
  [& ps]
  (apply compose
         (map (fn [p]
                (cond
                  (proto? p) (profile p)
                  (map? p) p
                  :else (throw (ex-info "profiles expects protos or profile fragments" {:value p}))))
              ps)))

(defn matrix
  "Generate tier combinations."
  [frag & mode+patch]
  (when-not (even? (count mode+patch))
    (throw (ex-info "matrix expects pairs: mode patch" {:args mode+patch})))
  (let [names (names-in frag)
        mk-profile
        (fn [mode patch]
          (let [mode* (->mode mode)]
            (cond
              (and (map? patch) (contains? patch :apps))
              (profile mode* patch)

              (proto? patch)
              (let [p (realize-proto patch)]
                (if (and (map? p) (contains? p :apps))
                  (profile mode* p)
                  (profile mode* {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) names)})))

              (map? patch)
              (profile mode* {:apps (mapv (fn [nm] (m/deep-merge {:name nm} patch)) names)})

              :else
              (throw (ex-info "matrix patch must be proto/map/ecosystem fragment" {:mode mode* :patch patch})))))]
    (apply profiles
           (map (fn [[a b]] (mk-profile a b))
                (partition 2 mode+patch)))))

(defn tiers
  "Build mode->patch map."
  [& mode+patch]
  (when-not (even? (count mode+patch))
    (throw (ex-info "tiers expects pairs: mode patch" {:args mode+patch})))
  (reduce
    (fn [acc [mode patch]]
      (let [k (->mode mode)]
        (update acc k (fn [old] (m/deep-merge (or old {}) (coerce-patch patch))))))
    {}
    (partition 2 mode+patch)))

(defn merge-tiers
  "Merge mode->patch maps."
  [& xs]
  (reduce
    (fn [acc t]
      (when-not (map? t)
        (throw (ex-info "merge-tiers expects maps" {:value t})))
      (merge-with m/deep-merge acc t))
    {}
    xs))

(defn matrix*
  "Apply tiers map to fragment."
  [frag tiers-map]
  (when-not (map? tiers-map)
    (throw (ex-info "matrix* expects a map" {:value tiers-map})))
  (apply matrix frag (mapcat identity (seq tiers-map))))

(defn env-tiers
  "Helper for env var tiers."
  [var & mode+value]
  (when-not (even? (count mode+value))
    (throw (ex-info "env-tiers expects pairs: mode value" {:args mode+value})))
  (apply tiers
         (mapcat (fn [[mode v]]
                   [mode {:env {var v}}])
                 (partition 2 mode+value))))

;; ============================================================================
;; Grouping
;; ============================================================================

(defn services
  "Create many service apps from base."
  [base id->opts]
  (when-not (map? id->opts)
    (throw (ex-info "services expects a map of id->opts" {:value id->opts})))
  (let [app-protos (into {}
                         (map (fn [[id opt]]
                                (let [id* (->str-id id)
                                      p (cond
                                          (map? opt) (def-app id* base opt)
                                          :else (throw (ex-info "service opts must be a map" {:id id :opts opt})))]
                                  [(keyword id*) p])))
                         id->opts)]
    app-protos))

(defn group
  "Group apps with scoped names."
  ([prefix base id->opts]
    (group prefix "-" base id->opts))
  ([prefix delim base id->opts]
    (services (mix base (scope prefix delim)) id->opts)))

;; ============================================================================
;; Stacks (first-class ecosystems, extendable)
;; ============================================================================

(defn def-stack
  "Define a stack proto.
   Body composes into an ecosystem.
   Great for reusable \"service bundles\"."
  [id & xs]
  (let [id* (->str-id id)
        [base parts] (if (and (seq xs) (or (proto? (first xs)) (map? (first xs))))
                       [(first xs) (rest xs)]
                       [nil xs])
        patch (apply compose parts)]
    (mk-proto :stack id* base patch)))

(defn stack
  "Realize a stack proto into a plain ecosystem map.
   Optional extra fragments override/extend it."
  ([x]
    (cond
      (proto? x) (realize-proto x)
      (ecosystem? x) x
      :else (throw (ex-info "stack expects a stack proto or ecosystem map" {:value x}))))
  ([x & more]
    (apply compose (stack x) more)))

;; ============================================================================
;; Deploy
;; ============================================================================

(defn deploy
  "Create deploy fragment."
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

;; ============================================================================
;; Export/Library (for multi-entry files)
;; ============================================================================

(defn export
  "Create export fragment."
  [k v]
  {i/exports-key {(->mode k) v}})

(defn library
  "Merge export fragments."
  [& xs]
  (reduce
    (fn [acc x]
      (when-not (and (map? x) (contains? x i/exports-key))
        (throw (ex-info "library expects only (export ...) fragments" {:value x})))
      (update acc i/exports-key merge (get x i/exports-key)))
    {i/exports-key {}}
    xs))

;; ============================================================================
;; Composition
;; ============================================================================

(defn- fragment
  "Convert protos to ecosystem fragments."
  [x]
  (cond
    (nil? x) nil
    (map? x) x
    (proto? x)
    (case (proto-kind x)
      :app (apps x)
      :mixin (throw (ex-info "mixin proto cannot be composed directly; apply via def-app base, with, each, on, where"
                             {:id (proto-id x)}))
      :profile (profile x)
      :stack (stack x)
      (throw (ex-info "unknown proto kind" {:proto x})))
    :else
    (throw (ex-info "compose expects ecosystem fragments or protos" {:value x}))))

(defn compose
  "Compose ecosystem fragments."
  [& parts]
  (let [frags (->> parts (map fragment) (remove nil?))]
    (reduce m/deep-merge {:apps []} frags)))

(defn ecosystem
  "Alias for compose."
  [& parts]
  (apply compose parts))

;; ============================================================================
;; Legacy Compatibility (defapp/defprofile macros as functions)
;; ============================================================================

(defn defapp
  "Legacy: Define and register an app directly."
  [name opts]
  (let [normalized (assoc opts :name name)]
    (swap! app-registry conj normalized)
    normalized))

(defn defprofile
  "Legacy: Define and register a profile."
  [name & body]
  (let [profile-data (apply compose body)]
    (swap! profile-registry assoc name profile-data)
    profile-data))

;; ============================================================================
;; include/import (injected by wrapper)
;; ============================================================================

(defn include
  [& _]
  (throw (ex-info "include is only available when evaluating via pm2-clj wrapper" {})))

(defn import
  [& _]
  (throw (ex-info "import is only available when evaluating via pm2-clj wrapper" {})))

;; ============================================================================
;; Output (for nbb evaluation)
;; ============================================================================

(defn ecosystem-output
  "Generate ecosystem output for nbb."
  []
  {:apps (vec @app-registry)
   :profiles @profile-registry})
