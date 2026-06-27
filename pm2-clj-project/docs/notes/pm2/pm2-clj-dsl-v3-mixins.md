Yep — you can get the verbosity way down *and* keep everything first-class by introducing **prototype values** for apps/profiles + a couple of “definition helpers” that build those prototypes.

Below is a concrete design + full-file replacements for the core DSL + evaluator tweaks to support `import` (so prototypes can live in separate files and still be reusable/extendable).

---

## DSL: first-class prototypes + sugar

### What you get

* `def-app` → returns an **app prototype value**
* `def-profile` → returns a **profile prototype value**
* `extends` → prototypal extension (`base → derived`) via deep merge
* `app` → instantiate a proto (optionally with inline overrides)
* `apps` → accepts app protos *or* plain app maps
* `profiles` → accepts profile protos *or* `profile` fragments
* `compose` → accepts ecosystem fragments *and* protos directly (extra sugar)

### Example usage (nice + minimal)

```clojure
(let [node-service (def-app :node-service
                     :cwd "."
                     :autorestart true
                     :max_restarts 10
                     :env {:NODE_ENV "development"})

      api (def-app :api node-service
            :script "dist/api.js")

      worker (def-app :worker node-service
               :script "dist/worker.js")

      prod (def-profile :prod
             (apps
               (extends api :instances "max" :exec_mode "cluster"
                      :env {:NODE_ENV "production"})
               (extends worker :instances 2
                      :env {:NODE_ENV "production"})))

      dev (def-profile :dev
            (apps
              (extends api :watch true)
              (extends worker :watch true)))]

  ;; `compose` can take protos directly (sugar):
  (compose api worker dev prod))
```

That last line works because:

* app proto → treated like `(apps (app proto))`
* profile proto → treated like `(profiles proto)`

---

## Cross-file reuse (import arbitrary values)

Create a “library” file that returns protos:

`ecosystems/lib/protos.pm2.clj`

```clojure
(let [node (def-app :node
            :cwd "."
            :autorestart true
            :env {:NODE_ENV "development"})]
  {:node node
   :api (def-app :api node :script "dist/api.js")
   :worker (def-app :worker node :script "dist/worker.js")})
```

Then in a stack file:

```clojure
(let [{:keys [api worker]} (pm2-clj.dsl/import "./lib/protos.pm2.clj")
      dev (def-profile :dev (apps (extends api :watch true)
                                  (extends worker :watch true)))]
  (compose api worker dev))
```

`import` can return **any value**, while the top-level file that you run with `pm2-clj` must still return an ecosystem map.

---

# Full file replacement: `src/pm2_clj/dsl.cljs`

```clojure
(ns pm2-clj.dsl
  (:require [clojure.string :as str]
            [pm2-clj.merge :as m]))

;; Sentinel used to remove keys during deep merge
(def remove ::remove)

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

;; -------------------------
;; prototype model
;; -------------------------

(defn proto?
  [x]
  (and (map? x) (= (:pm2-clj/type x) :proto)))

(defn- proto-kind [p] (:pm2-clj/kind p))

(defn- mk-proto
  [kind id base patch]
  {:pm2-clj/type :proto
   :pm2-clj/kind kind
   :pm2-clj/id   id
   :pm2-clj/base base
   :pm2-clj/patch patch})

(defn extends
  "Prototypal extension. Returns a new proto that inherits from `base` and applies `patch`."
  [base & patch-args]
  (when-not (proto? base)
    (throw (ex-info "extends expects a proto base" {:base base})))
  (let [patch (apply opts patch-args)]
    (mk-proto (proto-kind base) (:pm2-clj/id base) base patch)))

(defn- realize-proto
  [p]
  (when-not (proto? p)
    (throw (ex-info "realize-proto expects a proto" {:value p})))
  (let [base (:pm2-clj/base p)
        patch (:pm2-clj/patch p)
        realized-base (cond
                        (nil? base) {}
                        (proto? base) (realize-proto base)
                        (map? base) base
                        :else (throw (ex-info "proto base must be proto/map/nil" {:base base})))
        merged (m/deep-merge realized-base patch)]
    (case (proto-kind p)
      :app
      ;; lock name to the proto id (predictable)
      (assoc merged :name (->str-id (:pm2-clj/id p)))

      :profile
      ;; profile proto realizes to a patch map only; `profile` wraps it
      merged

      (throw (ex-info "unknown proto kind" {:proto p})))))

;; -------------------------
;; App sugar
;; -------------------------

(defn def-app
  "Define an app proto.

  Forms:
    (def-app :api {:script \"dist/api.js\" ...})
    (def-app :api :script \"dist/api.js\" :cwd \".\")
    (def-app :api base-proto {:instances 2 ...})
    (def-app :api base-proto :instances 2 ...)"
  [id & more]
  (let [id* (->str-id id)
        [base rest-args] (if (and (seq more) (proto? (first more)))
                           [(first more) (rest more)]
                           [nil more])
        patch (apply opts rest-args)]
    (mk-proto :app id* base patch)))

(defn app
  "Instantiate an app. Accepts either:
    - app proto (optionally with inline overrides)
    - app map (passed through)
    - name + opts (creates app map)

  Examples:
    (app api-proto)
    (app api-proto :watch true)
    (app \"api\" {:script ...})"
  ([x]
   (cond
     (proto? x) (realize-proto x)
     (map? x) x
     :else (throw (ex-info "app expects a proto or map in single-arg form" {:value x}))))
  ([x & more]
   (cond
     (proto? x) (m/deep-merge (realize-proto x) (apply opts more))
     (map? x) (m/deep-merge x (apply opts more))
     :else
     (let [nm (->str-id x)]
       (m/deep-merge {:name nm} (apply opts more))))))

(defn remove-app
  "Marks an app for removal when merged by name."
  [id]
  {:name (->str-id id) :pm2-clj/remove true})

(defn apps
  "Returns an ecosystem fragment containing apps.
  Accepts app protos and/or app maps."
  [& xs]
  {:apps (->> xs (map app) vec)})

;; -------------------------
;; Profile sugar
;; -------------------------

(defn def-profile
  "Define a profile proto.

  Forms:
    (def-profile :dev (apps ...) (deploy ...))
    (def-profile :prod base-profile (apps ...) ...)

  The body is an ecosystem *patch* (composed)."
  [mode & xs]
  (let [mode* (->mode mode)
        [base parts] (if (and (seq xs) (proto? (first xs)))
                       [(first xs) (rest xs)]
                       [nil xs])
        patch (apply compose parts)]
    (mk-proto :profile mode* base patch)))

(defn profile
  "Returns an ecosystem fragment that registers a profile override.

  Forms:
    (profile :dev (apps ...))
    (profile profile-proto)"
  ([x]
   (cond
     (proto? x)
     (let [mode (->mode (:pm2-clj/id x))
           patch (realize-proto x)]
       {:profiles {mode patch}})

     (keyword? x)
     {:profiles {x {}}}

     :else
     (throw (ex-info "profile expects keyword or profile proto" {:value x}))))
  ([mode & parts]
   (let [mode* (->mode mode)]
     {:profiles {mode* (apply compose parts)}})))

(defn profiles
  "Convenience wrapper for grouping profile fragments/protos."
  [& ps]
  (apply compose (map (fn [p]
                        (cond
                          (proto? p) (profile p)
                          (map? p) p
                          :else (throw (ex-info "profiles expects protos or profile fragments" {:value p}))))
                      ps)))

;; -------------------------
;; Deploy (unchanged)
;; -------------------------

(defn deploy
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

;; -------------------------
;; Composition
;; -------------------------

(defn- fragment
  "Convert protos into ecosystem fragments for sugar:
    - app proto => (apps (app p))
    - profile proto => (profile p)"
  [x]
  (cond
    (nil? x) nil
    (map? x) x
    (proto? x)
    (case (proto-kind x)
      :app (apps x)
      :profile (profile x)
      (throw (ex-info "unknown proto kind" {:proto x})))
    :else
    (throw (ex-info "compose expects ecosystem fragments or protos" {:value x}))))

(defn compose
  "Deep-merge ecosystem fragments with special handling for :apps merging by name.
   Also accepts protos directly (sugar)."
  [& parts]
  (let [frags (->> parts (map fragment) (remove nil?))]
    (reduce m/deep-merge {:apps []} frags)))

(defn ecosystem
  "Alias for compose"
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

# Full file replacement: `src/pm2_clj/eval.cljs`

This adds `import` support and allows imported files to return **any** value (only the root file must be an ecosystem).

```clojure
(ns pm2-clj.eval
  (:require [sci.core :as sci]
            [pm2-clj.dsl :as dsl]
            [pm2-clj.util :as u]))

(def ^:dynamic *cwd* nil)

(defn- ensure-cwd! [cwd]
  (when-not (and (string? cwd) (not= "" cwd))
    (throw (ex-info "cwd must be a non-empty string" {:cwd cwd}))))

(defn- is-ecosystem? [x]
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
              ;; include is ecosystem-only (common for compose stacks)
              (binding [*cwd* dir]
                (let [v (eval-file rel)]
                  v)))
            (import-fn [rel]
              ;; import can return any value (protos libs, helpers, etc.)
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

(defn eval-file
  "Evaluate a DSL file and enforce that it returns an ecosystem map (at least {:apps [...]})"
  [file-path]
  (let [result (eval-file-any file-path)]
    (when-not (is-ecosystem? result)
      (throw (ex-info "DSL file did not return an ecosystem map {:apps [...]}"
                      {:path file-path :result result})))
    result))
```

---

## “Prototypal” extension patterns you’ll probably use a lot

### Mixins as functions (super composable)

```clojure
(defn with-node-env [env]
  (fn [p] (extends p :env {:NODE_ENV env})))

(def prodify (with-node-env "production"))

(let [api (def-app :api :script "dist/api.js")
      api-prod (prodify api)]
  (compose api (def-profile :prod (apps api-prod))))
```

### Prototype chains for tiers (base → runtime → service → env)

```clojure
(let [base (def-app :base :cwd "." :autorestart true)
      node (def-app :node base :env {:NODE_ENV "development"})
      api  (def-app :api node :script "dist/api.js")
      api-prod (extends api :env {:NODE_ENV "production"} :instances "max")]
  (compose api (def-profile :prod (apps api-prod))))
```

---

If you want the next level of sugar, two obvious adds that fit this model cleanly:

* `def-stack` (a proto-kind `:stack`) so `compose` can accept *stacks* too
* `group` / `namespace` helper that prefixes app names and sets a shared `:cwd` / `:env` / `:interpreter_args` etc.

But with `def-app`, `def-profile`, `extends`, and `import`, you’ve already got a pretty ergonomic, prototype-driven DSL that stays pure-data and composable.
