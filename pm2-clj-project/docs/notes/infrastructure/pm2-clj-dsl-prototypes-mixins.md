**Note (2026-02-03):** This document is historical. The current workflow uses `ecosystems/*.cljs` with `npx shadow-cljs release clobber` and `pm2 start ecosystem.config.cjs`. `pm2-clj` and `.pm2.edn` are legacy.

## Next layer of sugar: *prototypes everywhere* + *selection + generators*

You already have `def-app`, `def-profile`, `def-mixin`, `def-stack`, `extends`, `mix`, `each`, `scope`.

This continuation adds the stuff that makes big ecosystems feel “DSL-y” instead of “data-y”:

### New high-level forms

* **`with`** — extend a proto by composing multiple mixins/maps in one go

  ```clojure
  (with api (env {:NODE_ENV "production"}) {:instances "max"} (scope "svc"))
  ```
* **`env`** — a tiny sugar mixin for `:env` patches

  ```clojure
  (env {:NODE_ENV "production" :LOG_LEVEL "info"})
  ```
* **`on` / `where`** — patch selected apps by name or predicate (minimal override maps)

  ```clojure
  (on [:api :worker] {:watch true} base-frag)
  (where #(re-find #"^svc-" (:name %)) {:max_memory_restart "512M"} base-frag)
  ```
* **`matrix`** — generate many profiles from the same app-set (dev/test/stage/prod)

  ```clojure
  (matrix (apps api worker)
    :dev  {:watch true :env {:NODE_ENV "development"}}
    :test {:env {:NODE_ENV "test"}}
    :prod {:env {:NODE_ENV "production"} :instances "max"})
  ```

  `matrix` produces a `{:profiles {...}}` fragment you `compose` in.
* **`services`** — build a bunch of app protos from one base mixin + return a stack proto + a map of app protos

  ```clojure
  (let [{:keys [stack api worker]} (services node
                                    {:api {:script "dist/api.js"}
                                     :worker {:script "dist/worker.js"}})]
    (compose stack
             (matrix (apps api worker) ...)))
  ```
* **`export` / `library` + `--entry`** — put multiple stacks/profiles in one file, select which one to run

  ```clojure
  (library
    (export :dev  dev-stack)
    (export :prod prod-stack))
  ```

  Run with:

  ```bash
  pm2-clj start ecosystems/all.pm2.clj --entry prod
  ```

This last one is the big “composition” unlock: a file can be a **library** *or* a runnable ecosystem.

---

# Code changes

Below are **full-file replacements** (no diffs). Add/replace these exactly.

---

## 1) REPLACE `src/pm2_clj/internal.cljs`

```clojure
(ns pm2-clj.internal)

(def remove ::remove)

(def type-key :pm2-clj/type)
(def kind-key :pm2-clj/kind)
(def id-key   :pm2-clj/id)
(def base-key :pm2-clj/base)
(def patch-key :pm2-clj/patch)

(def remove-app-flag :pm2-clj/remove)

(def name-prefix-key :pm2-clj/name-prefix)
(def name-delim-key  :pm2-clj/name-delim)

(def exports-key :pm2-clj/exports)
```

---

## 2) REPLACE `src/pm2_clj/dsl.cljs`

This keeps everything you had, and adds: `with`, `env`, `on`, `where`, `matrix`, `services`, `export`, `library`.

```clojure
(ns pm2-clj.dsl
  (:require [clojure.string :as str]
            [pm2-clj.internal :as i]
            [pm2-clj.merge :as m]))

(def remove i/remove)

;; -------------------------
;; small utils
;; -------------------------

(defn- ->str-id [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    (symbol? x) (name x)
    :else (throw (ex-info "id must be string/keyword/symbol" {:id x}))))

(defn- ->mode [x]
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

(defn- ecosystem? [x]
  (and (map? x) (contains? x :apps)))

;; -------------------------
;; prototype model
;; -------------------------

(defn proto?
  [x]
  (and (map? x) (= (get x i/type-key) :proto)))

(defn- proto-kind [p] (get p i/kind-key))
(defn- proto-id [p] (get p i/id-key))

(defn- mk-proto
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
  [base]
  (cond
    (nil? base) {}
    (proto? base) (realize-proto base)
    (map? base) base
    :else (throw (ex-info "proto base must be proto/map/nil" {:base base}))))

(defn- compute-app-name
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
  "Turn proto/map/nil into a map patch.
   - app proto => realized app map (usually not what you want as a patch)
   - mixin proto => realized map patch
   - profile/stack proto => realized ecosystem map (still a map)"
  [x]
  (cond
    (nil? x) {}
    (proto? x) (realize-proto x)
    (map? x) x
    :else (throw (ex-info "expected proto/map/nil" {:value x}))))

(defn with
  "Extend a proto by composing multiple patches (mixins/maps/protos) left-to-right.

  (with api (env {...}) {:instances 2} other-mixin)
  => (extends api <merged-patch>)"
  [base & patches]
  (when-not (proto? base)
    (throw (ex-info "with expects a proto base" {:base base})))
  (let [patch (reduce (fn [acc p] (m/deep-merge acc (coerce-patch p))) {} patches)]
    (extends base patch)))

;; -------------------------
;; Mixins
;; -------------------------

(defn def-mixin
  [id & more]
  (mk-proto :mixin (->str-id id) nil (apply opts more)))

(defn mixin
  [& more]
  (mk-proto :mixin "anon" nil (apply opts more)))

(defn mix
  [& xs]
  (let [patch (reduce
                (fn [acc x] (m/deep-merge acc (coerce-patch x)))
                {}
                xs)]
    (mk-proto :mixin "mix" nil patch)))

(defn scope
  ([prefix] (scope prefix "-"))
  ([prefix delim]
   (mixin i/name-prefix-key prefix
          i/name-delim-key delim)))

(defn env
  "Sugar for environment patches."
  [m]
  (when-not (map? m)
    (throw (ex-info "env expects a map" {:value m})))
  (mixin :env m))

;; -------------------------
;; Apps
;; -------------------------

(defn def-app
  [id & more]
  (let [id* (->str-id id)
        [base rest-args] (if (and (seq more) (or (proto? (first more)) (map? (first more))))
                           [(first more) (rest more)]
                           [nil more])
        patch (apply opts rest-args)]
    (mk-proto :app id* base patch)))

(defn app
  "Instantiate an app.

  Single-arg:
    - proto -> realized app map
    - map -> returned

  Multi-arg:
    - (app proto :watch true)
    - (app :api :instances 2) => {:name \"api\" :instances 2}"
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

(defn remove-app
  [id]
  {:name (->str-id id) i/remove-app-flag true})

(defn apps
  [& xs]
  {:apps (->> xs (map app) vec)})

(defn each
  "Apply a patch to every app in an ecosystem fragment."
  [patch frag]
  (let [p (coerce-patch patch)]
    (update frag :apps (fn [xs] (mapv #(m/deep-merge % p) xs)))))

(defn- names-in
  "Extract app names from an ecosystem fragment."
  [frag]
  (->> (:apps frag)
       (map app)
       (map :name)
       (remove nil?)
       (vec)))

(defn on
  "Apply a patch only to selected app names (minimal overrides).

  (on [:api :worker] {:watch true} (apps api worker))
  => {:apps [{:name \"api\" :watch true} {:name \"worker\" :watch true}]}"
  [ids patch frag]
  (let [names (->> ids (map ->str-id) set)
        p (coerce-patch patch)
        keep-names (->> (names-in frag)
                        (filter #(contains? names %))
                        (vec))]
    {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) keep-names)}))

(defn where
  "Apply a patch to apps matching predicate (minimal overrides).

  pred gets realized app maps from the fragment."
  [pred patch frag]
  (when-not (fn? pred)
    (throw (ex-info "where expects a predicate fn" {:pred pred})))
  (let [p (coerce-patch patch)
        realized (mapv app (:apps frag))
        selected (->> realized (filter pred) (map :name) (vec))]
    {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) selected)}))

;; -------------------------
;; Profiles
;; -------------------------

(defn def-profile
  [mode & xs]
  (let [mode* (->mode mode)
        [base parts] (if (and (seq xs) (proto? (first xs)))
                       [(first xs) (rest xs)]
                       [nil xs])
        patch (apply compose parts)]
    (mk-proto :profile mode* base patch)))

(defn profile
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
  [& ps]
  (apply compose
         (map (fn [p]
                (cond
                  (proto? p) (profile p)
                  (map? p) p
                  :else (throw (ex-info "profiles expects protos or profile fragments" {:value p}))))
              ps)))

(defn matrix
  "Generate many profile patches from a shared app-fragment.

  Usage:
    (matrix (apps api worker)
      :dev  {:watch true}
      :prod {:env {:NODE_ENV \"production\"} :instances \"max\"})

  Patch semantics:
    - patch is a map/mixin/proto => applied as minimal overrides to *all* apps in frag
    - patch is an ecosystem fragment => composed as-is into that profile"
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
                  ;; treat as map patch to all apps
                  (profile mode* {:apps (mapv (fn [nm] (m/deep-merge {:name nm} p)) names)})))

              (map? patch)
              (profile mode* {:apps (mapv (fn [nm] (m/deep-merge {:name nm} patch)) names)})

              :else
              (throw (ex-info "matrix patch must be proto/map/ecosystem fragment" {:mode mode* :patch patch})))))]
    (apply profiles
           (map (fn [[a b]] (mk-profile a b))
                (partition 2 mode+patch)))))

;; -------------------------
;; Stacks
;; -------------------------

(defn def-stack
  [id & xs]
  (let [id* (->str-id id)
        [base parts] (if (and (seq xs) (or (proto? (first xs)) (map? (first xs))))
                       [(first xs) (rest xs)]
                       [nil xs])
        patch (apply compose parts)]
    (mk-proto :stack id* base patch)))

(defn stack
  ([x]
   (cond
     (proto? x) (realize-proto x)
     (ecosystem? x) x
     :else (throw (ex-info "stack expects a stack proto or ecosystem map" {:value x}))))
  ([x & more]
   (apply compose (stack x) more)))

(defn services
  "Create many service app protos from one base (mixin/app proto/map), plus a stack proto.

  (services node {:api {...} :worker {...}})

  Returns: {:stack <stack-proto> :api <app-proto> :worker <app-proto> ...}"
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
                         id->opts)
        stk (def-stack "services" (apply apps (vals app-protos)))]
    (assoc app-protos :stack stk)))

;; -------------------------
;; Deploy
;; -------------------------

(defn deploy
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

;; -------------------------
;; Export / library selection (multi-entry files)
;; -------------------------

(defn export
  "Create an exports fragment: (export :prod some-stack-or-ecosystem)"
  [k v]
  {i/exports-key {(->mode k) v}})

(defn library
  "Merge multiple exports fragments. Later keys override earlier keys."
  [& xs]
  (reduce
    (fn [acc x]
      (when-not (and (map? x) (contains? x i/exports-key))
        (throw (ex-info "library expects only (export ...) fragments" {:value x})))
      (update acc i/exports-key merge (get x i/exports-key)))
    {i/exports-key {}}
    xs))

;; -------------------------
;; Composition (accepts fragments + protos)
;; -------------------------

(defn- fragment
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
  [& parts]
  (let [frags (->> parts (map fragment) (remove nil?))]
    (reduce m/deep-merge {:apps []} frags)))

(defn ecosystem
  [& parts]
  (apply compose parts))

;; -------------------------
;; include/import injected by wrapper
;; -------------------------

(defn include
  [& _]
  (throw (ex-info "include is only available when evaluating via pm2-clj wrapper" {})))

(defn import
  [& _]
  (throw (ex-info "import is only available when evaluating via pm2-clj wrapper" {})))
```

---

## 3) REPLACE `src/pm2_clj/eval.cljs`

This adds **multi-entry file selection** via `:pm2-clj/exports` and CLI `--entry`.

```clojure
(ns pm2-clj.eval
  (:require [sci.core :as sci]
            [pm2-clj.internal :as i]
            [pm2-clj.dsl :as dsl]
            [pm2-clj.util :as u]))

(def ^:dynamic *cwd* nil)
(def ^:dynamic *entry* nil) ;; keyword or nil

(defn- ensure-cwd! [cwd]
  (when-not (and (string? cwd) (not= "" cwd))
    (throw (ex-info "cwd must be a non-empty string" {:cwd cwd}))))

(defn- ecosystem? [x]
  (and (map? x) (contains? x :apps)))

(defn eval-file-any
  "Evaluate a DSL file via SCI and return its value (any type)."
  [file-path]
  (ensure-cwd! *cwd*)
  (let [abs (u/resolve-path *cwd* file-path)
        dir (u/dirname abs)
        src (u/read-file abs)]
    (when-not (u/exists? abs)
      (throw (ex-info "DSL file not found" {:path abs})))

    (letfn [(include-fn [rel]
              (binding [*cwd* dir]
                (eval-file rel)))
            (import-fn [rel]
              (binding [*cwd* dir]
                (eval-file-any rel)))]

      (let [ctx (sci/init
                  {:namespaces
                   {'pm2-clj.dsl
                    (sci/copy-ns pm2-clj.dsl (sci/create-ns 'pm2-clj.dsl))}
                   :bindings
                   {'pm2-clj.dsl/include include-fn
                    'pm2-clj.dsl/import  import-fn}})
            result (sci/eval-string* ctx src)]
        result))))

(defn- select-entry
  "If the value is a library (contains :pm2-clj/exports), select one entry."
  [v]
  (if (and (map? v) (contains? v i/exports-key))
    (let [exports (get v i/exports-key)
          entry   (or *entry* :default)
          picked  (get exports entry)]
      (when (nil? picked)
        (throw (ex-info "No such --entry in exports"
                        {:entry entry :available (sort (keys exports))})))
      picked)
    v))

(defn- realize-runnable
  "Allow exported values to be ecosystems or stack protos."
  [v]
  (cond
    (ecosystem? v) v
    (dsl/proto? v)
    (let [rv (dsl/realize-proto v)]
      (if (ecosystem? rv)
        rv
        (throw (ex-info "Exported proto did not realize to an ecosystem" {:value rv}))))
    :else
    (throw (ex-info "Runnable value must be an ecosystem map or a stack proto" {:value v}))))

(defn eval-file
  "Evaluate a DSL file and return an ecosystem. Supports library files via :pm2-clj/exports + --entry."
  [file-path]
  (let [result (-> (eval-file-any file-path)
                   (select-entry)
                   (realize-runnable))]
    result))
```

---

## 4) REPLACE `src/pm2_clj/cli.cljs` (add `--entry`)

Only change vs your last version: parse `--entry`, bind `peval/*entry*`.

```clojure
(ns pm2-clj.cli
  (:require [clojure.string :as str]
            [pm2-clj.internal :as i]
            [pm2-clj.eval :as peval]
            [pm2-clj.merge :as m]
            [pm2-clj.pm2 :as pm2]
            [pm2-clj.util :as u]))

(def dsl-exts
  #{".pm2.edn" ".pm2.clj" ".pm2.cljs" ".edn" ".clj" ".cljs"})

(defn- dsl-file? [p]
  (and (string? p)
       (u/exists? p)
       (some #(str/ends-with? p %) dsl-exts)))

(defn- parse-kv [s]
  (let [i0 (.indexOf s "=")]
    (when (neg? i0)
      (throw (ex-info "--set expects key=value" {:value s})))
    [(subs s 0 i0) (subs s (inc i0))]))

(defn- parse-value [s]
  (cond
    (= s "true") true
    (= s "false") false
    (= s "null") nil
    (re-matches #"^-?\d+$" s) (js/parseInt s 10)
    (re-matches #"^-?\d+\.\d+$" s) (js/parseFloat s)
    :else s))

(defn- split-path [k]
  (->> (str/split k #"\.")
       (remove str/blank?)
       (vec)))

(defn- set-in-eco [eco k v]
  (let [parts (split-path k)]
    (when (empty? parts)
      (throw (ex-info "empty keypath" {:key k})))
    (if (= "apps" (first parts))
      (let [app-name (second parts)
            ks       (mapv keyword (drop 2 parts))]
        (when-not (and app-name (not (str/blank? app-name)))
          (throw (ex-info "apps.<name>.<key> required for apps keypaths" {:key k})))
        (let [patch (if (empty? ks)
                      {:name app-name :value v}
                      (assoc-in {:name app-name} ks v))]
          (m/deep-merge eco {:apps [patch]})))
      (assoc-in eco (mapv keyword parts) v))))

(defn- unset-in-eco [eco k]
  (let [parts (split-path k)]
    (when (empty? parts)
      (throw (ex-info "empty keypath" {:key k})))
    (if (= "apps" (first parts))
      (let [app-name (second parts)
            ks       (mapv keyword (drop 2 parts))]
        (when-not (and app-name (not (str/blank? app-name)))
          (throw (ex-info "apps.<name>.<key> required for apps keypaths" {:key k})))
        (let [patch (if (empty? ks)
                      {:name app-name i/remove-app-flag true}
                      (assoc-in {:name app-name} ks i/remove))]
          (m/deep-merge eco {:apps [patch]})))
      (assoc-in eco (mapv keyword parts) i/remove))))

(defn- apply-profile [eco mode]
  (if (or (nil? mode) (= mode :default))
    (dissoc eco :profiles)
    (let [p (get-in eco [:profiles mode] {})]
      (-> (dissoc eco :profiles)
          (m/deep-merge p)
          (dissoc :profiles)))))

(defn- strip-internal [eco]
  (-> eco
      (dissoc :profiles)
      (update :apps
              (fn [xs]
                (->> xs
                     (map #(dissoc % i/remove-app-flag i/name-prefix-key i/name-delim-key))
                     (vec))))))

(defn- render-config [dsl-path entry mode sets unsets]
  (let [cwd (.cwd js/process)
        eco0 (binding [peval/*cwd* cwd
                       peval/*entry* entry]
               (peval/eval-file dsl-path))
        eco1 (apply-profile eco0 mode)
        eco2 (reduce (fn [e s]
                       (let [[k v] (parse-kv s)]
                         (set-in-eco e k (parse-value v))))
                     eco1
                     sets)
        eco3 (reduce (fn [e k] (unset-in-eco e k)) eco2 unsets)]
    (strip-internal eco3)))

(defn- write-temp-cjs! [cfg]
  (let [dir (u/mkdtemp! "pm2-clj-")
        out (u/join dir "ecosystem.config.cjs")
        json (js/JSON.stringify (clj->js cfg) nil 2)
        body (str "module.exports = " json ";\n")]
    (u/write-file! out body)
    out))

(defn- consume-flag [args flag]
  (let [i0 (.indexOf (clj->js args) flag)]
    (if (neg? i0)
      [nil args]
      (let [v (nth args (inc i0) nil)
            new-args (-> (vec args)
                         (subvec 0 i0)
                         (into (subvec (vec args) (+ i0 2))))]
        [v new-args]))))

(defn- consume-multi-flag [args flag]
  (loop [acc [] xs (vec args)]
    (let [i0 (.indexOf (clj->js xs) flag)]
      (if (neg? i0)
        [acc xs]
        (let [v (nth xs (inc i0) nil)
              xs2 (-> xs
                      (subvec 0 i0)
                      (into (subvec xs (+ i0 2))))]
          (recur (conj acc v) (vec xs2)))))))

(defn- keywordize-mode [s]
  (cond
    (nil? s) :default
    (str/blank? s) :default
    :else (keyword s)))

(defn- keywordize-entry [s]
  (cond
    (nil? s) nil
    (str/blank? s) nil
    :else (keyword s)))

(defn- replace-first-dsl-file [args temp-path]
  (let [idx (->> args (map-indexed vector) (filter (fn [[_ a]] (dsl-file? a))) first first)]
    (if (nil? idx)
      args
      (assoc (vec args) idx temp-path))))

(defn- cmd-render? [args]
  (= "render" (first args)))

(defn main []
  (let [argv (vec (-> js/process .-argv (.slice 2)))]

    (when (empty? argv)
      (println "pm2-clj: pass-through PM2 wrapper + DSL translator")
      (println "Usage:")
      (println "  pm2-clj <pm2 args...> <ecosystem.pm2.clj> --mode dev [--entry prod]")
      (println "  pm2-clj render <ecosystem.pm2.clj> --mode prod [--entry prod]")
      (js/process.exit 1))

    (let [[entry-str argv0] (consume-flag argv "--entry")
          entry             (keywordize-entry entry-str)
          [mode-str argv1]  (consume-flag argv0 "--mode")
          mode              (keywordize-mode mode-str)
          [sets argv2]      (consume-multi-flag argv1 "--set")
          [unsets argv3]    (consume-multi-flag argv2 "--unset")]

      (if (cmd-render? argv3)
        (let [dsl-path (second argv3)]
          (when-not dsl-path
            (throw (ex-info "render requires a DSL path" {:args argv3})))
          (let [cfg (render-config dsl-path entry mode sets unsets)]
            (println (js/JSON.stringify (clj->js cfg) nil 2))
            (js/process.exit 0)))

        (if-let [dsl-path (->> argv3 (filter dsl-file?) first)]
          (let [cfg (render-config dsl-path entry mode sets unsets)
                tmp (write-temp-cjs! cfg)
                pm2-args (-> argv3 (replace-first-dsl-file tmp))]
            (js/process.exit (pm2/run! pm2-args)))
          (js/process.exit (pm2/run! argv3)))))))
```

---

# How this feels in real DSL files

## A “library” file with two runnable entries

`ecosystems/all.pm2.clj`

```clojure
(let [node (def-mixin :node
            :cwd "."
            :autorestart true
            :max_restarts 10
            :env {:NODE_ENV "development"})

      {:keys [stack api worker]}
      (services node
        {:api {:script "dist/api.js"}
         :worker {:script "dist/worker.js"}})

      base (compose stack)

      dev  (def-stack :dev base
             (matrix (apps api worker)
               :dev {:watch true :env {:NODE_ENV "development"}}))

      prod (def-stack :prod base
             (matrix (apps api worker)
               :prod {:env {:NODE_ENV "production"}}
               ;; extra prod-only overrides:
               :prod (compose
                      (on [:api] {:instances "max" :exec_mode "cluster"} (apps api worker))
                      (on [:worker] {:instances 2} (apps api worker)))))]
  (library
    (export :dev dev)
    (export :prod prod)))
```

Run:

```bash
pm2-clj start ecosystems/all.pm2.clj --entry dev
pm2-clj start ecosystems/all.pm2.clj --entry prod --mode prod
```

Notes:

* `--entry` selects *which stack/ecosystem to run from the library*.
* `--mode` still applies PM2 profile overrides inside that selected ecosystem (if you’re also using `:profiles`).

---

# Next ergonomic jump (if you want it)

If you want this DSL to feel *really* compact for your workflow, the next forms I’d add are:

* **`tier` / `env-tier`**: define standard mode patches once (dev/test/stage/prod) and reuse them.
* **`group`**: `(group "svc" node {:api {...} :worker {...}})` returning `{stack api worker}` with scoped names automatically.
* **`ports` / `health` helpers**: consistent env + metadata patterns you’ll use across services.

If you say “go”, I’ll add those as *first-class protos* too (so they remain extendable).
