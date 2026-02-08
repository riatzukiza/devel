## Next sugar layer

You’ve got the “proto core” already. The next jump is making **selection**, **generation**, and **reuse** feel effortless while staying **100% first-class + prototypal**.

### New forms

* **`with`**: extend a proto with *multiple* patches/mixins at once
  `(with api (env {...}) (cluster) {:max_memory_restart "512M"})`

* **`on` / `where`**: patch **selected apps** using *names OR app-protos*
  `(on [api worker] {:watch true} (apps api worker))`
  `(where #(re-find #"api$" (:name %)) {:instances "max"} (apps api worker))`

* **`tiers` / `merge-tiers` / `matrix*`**: build reusable *mode→patch* maps and apply them to app sets

  ```clojure
  (def node-envs
    (env-tiers "NODE_ENV"
      :dev "development"
      :test "test"
      :prod "production"))

  (matrix* (apps api worker) node-envs)
  ```

* **`group`**: prefix/scoping + services in one shot
  `(group "svc" node {:api {...} :worker {...}})` → names become `svc-api`, `svc-worker`

* **quality mixins**: `env`, `port`, `cluster`, `fork`, `node-args`, `log-format`, `merge-logs`

All of these return either **protos** or plain **ecosystem fragments**, so they’re extendable and composable.

---

# Full file replacement: `src/pm2_clj/dsl.cljs`

Replace the entire file with this:

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

(declare realize-proto)

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
  "Turn proto/map/nil into a map patch."
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
;; Mixins (first-class, extendable)
;; -------------------------

(defn def-mixin
  [id & more]
  (mk-proto :mixin (->str-id id) nil (apply opts more)))

(defn mixin
  [& more]
  (mk-proto :mixin "anon" nil (apply opts more)))

(defn mix
  [& xs]
  (let [patch (reduce (fn [acc x] (m/deep-merge acc (coerce-patch x))) {} xs)]
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

(defn port
  "Sugar: set PORT env. (port 3000) -> {:env {:PORT 3000}}"
  [n]
  (mixin :env {:PORT n}))

(defn node-args
  "Sugar: node arguments. (node-args \"--max-old-space-size=2048\")"
  [& xs]
  (mixin :node_args (vec xs)))

(defn cluster
  "Sugar: cluster mode. Default instances = \"max\"."
  ([] (cluster "max"))
  ([instances]
   (mixin :exec_mode "cluster" :instances instances)))

(defn fork
  "Sugar: fork mode (instances defaults to 1 unless you set it elsewhere)."
  ([] (mixin :exec_mode "fork"))
  ([instances] (mixin :exec_mode "fork" :instances instances)))

(defn log-format
  "Common PM2 log formatting (date format, merge logs).
   (log-format \"YYYY-MM-DD HH:mm:ss Z\")"
  [date-format]
  (mixin :log_date_format date-format))

(defn merge-logs
  "PM2 merge logs switch."
  ([] (merge-logs true))
  ([on?] (mixin :merge_logs (boolean on?))))

;; -------------------------
;; Apps (first-class, extendable)
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

(defn- app-name
  "Accepts: app proto, app map, keyword/string id.
   Returns final resolved :name."
  [x]
  (cond
    (proto? x) (:name (app x))
    (map? x) (:name (app x))
    :else (->str-id x)))

(defn remove-app
  "Marks an app for removal when merged by name.
   Accepts: id/proto/map."
  [x]
  {:name (app-name x) i/remove-app-flag true})

(defn apps
  [& xs]
  {:apps (->> xs (map app) vec)})

(defn each
  "Apply a patch to every app in an ecosystem fragment."
  [patch frag]
  (let [p (coerce-patch patch)]
    (update frag :apps (fn [xs] (mapv #(m/deep-merge % p) xs)))))

(defn- names-in
  "Extract resolved app names from an ecosystem fragment (handles protos)."
  [frag]
  (->> (:apps frag)
       (map app)
       (map :name)
       (remove nil?)
       (vec)))

(defn on
  "Apply a patch only to selected apps (by id/proto/map/name) as minimal overrides.

  (on [api worker] {:watch true} (apps api worker))
  => {:apps [{:name \"svc-api\" :watch true} ...]} (if those apps are scoped)"
  [ids patch frag]
  (let [names (->> ids (map app-name) set)
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

(defn only
  "Keep only selected apps (full app entries, not minimal overrides)."
  [ids frag]
  (let [names (->> ids (map app-name) set)]
    {:apps (->> (:apps frag)
                (map app)
                (filter #(contains? names (:name %)))
                (vec))}))

;; -------------------------
;; Profiles (first-class, extendable)
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
      :prod {:env {:NODE_ENV \"production\"}})

  Patch semantics:
    - patch is a map/mixin/proto => applied as minimal overrides to *all* apps in frag
    - patch is an ecosystem fragment => composed as-is into that profile

  Duplicate modes are OK (they deep-merge via compose)."
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
  "Build a mode->patch map. Duplicate modes deep-merge.
   Patch may be proto/map/ecosystem fragment."
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
  "Deep-merge multiple mode->patch maps."
  [& xs]
  (reduce
    (fn [acc t]
      (when-not (map? t)
        (throw (ex-info "merge-tiers expects maps" {:value t})))
      (merge-with m/deep-merge acc t))
    {}
    xs))

(defn matrix*
  "Apply a tiers map (mode->patch) to an app fragment.
   Equivalent to (apply matrix frag (mapcat identity tiers-map)), but stable-enough and explicit."
  [frag tiers-map]
  (when-not (map? tiers-map)
    (throw (ex-info "matrix* expects a map from mode->patch" {:value tiers-map})))
  (apply matrix frag (mapcat identity (seq tiers-map))))

(defn env-tiers
  "Helper to build tiers where each mode sets a single env var.
   (env-tiers \"NODE_ENV\" :dev \"development\" :prod \"production\")"
  [var & mode+value]
  (when-not (even? (count mode+value))
    (throw (ex-info "env-tiers expects pairs: mode value" {:args mode+value})))
  (apply tiers
         (mapcat (fn [[mode v]]
                   [mode {:env {var v}}])
                 (partition 2 mode+value))))

;; -------------------------
;; Stacks (first-class ecosystems, extendable)
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

(defn group
  "Like services, but scopes names under a prefix.
   (group \"svc\" base {:api {...}}) => app names are svc-api, svc-worker"
  ([prefix base id->opts]
   (services (mix base (scope prefix)) id->opts))
  ([prefix delim base id->opts]
   (services (mix base (scope prefix delim)) id->opts)))

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

# How this looks in practice

## 1) Minimal “service bundle” with tiers and scoped names

```clojure
(let [node (def-mixin :node
            :cwd "."
            :autorestart true
            :max_restarts 10)

      {:keys [stack api worker]}
      (group "svc" node
        {:api {:script "dist/api.js"}
         :worker {:script "dist/worker.js"}})

      common (mix (merge-logs) (log-format "YYYY-MM-DD HH:mm:ss Z"))

      envs (env-tiers "NODE_ENV"
             :dev "development"
             :test "test"
             :prod "production")

      sizes (tiers
              :prod (cluster "max")
              :prod {:max_memory_restart "1024M"}
              :dev  {:watch true})]

  (compose
    stack
    (each common (apps api worker))
    (matrix* (apps api worker) (merge-tiers envs sizes))))
```

## 2) Targeted overrides that work with scoped names

```clojure
(let [{:keys [stack api worker]} (group "svc" (def-mixin :base :cwd ".")
                                 {:api {:script "dist/api.js"}
                                  :worker {:script "dist/worker.js"}})]
  (compose
    stack
    ;; these accept app protos directly, so names match (svc-api)
    (on [api] (cluster "max") (apps api worker))
    (on [worker] {:instances 2} (apps api worker))))
```

---

# Next “continue” step options

Pick whichever direction you want next (I’ll just implement it the same way — first-class protos, extendable, composable):

1. **`group*` with nested groups**
   e.g. `(group* {:svc {...} :jobs {...}})` returns `{ :svc {...} :jobs {...} :stack ... }` and lets you build big stacks from subgroups.

2. **`profiles-as-entries`**
   So `--entry prod` can implicitly set `--mode prod` (optional coupling).

3. **`clobber` MVP commands**
   `clobber up`, `clobber down`, `clobber logs`, `clobber ps` — all delegating to `pm2-clj` but with your workflow defaults (entry/mode conventions, project-root discovery, etc.).
