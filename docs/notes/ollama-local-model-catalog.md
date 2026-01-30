Alright — next pass: **make protos more powerful**, add a **mixin** and **stack** layer, and add a few **“I mean what I say” sugar forms** so you stop writing the same boilerplate everywhere.

Also: the previous sketch had a **circular require trap** (`dsl.cljs` ↔ `merge.cljs`). I’m fixing that cleanly by moving shared constants into a tiny `internal` ns.

---

## New higher-level forms

You now have *four* first-class proto kinds, all `extends`-able:

* **App proto**: `(def-app :api base ...opts)`
* **Profile proto**: `(def-profile :prod base ...fragments)`
* **Mixin proto**: `(def-mixin :node ...opts)` (reusable patch blob for apps/profiles/stacks)
* **Stack proto**: `(def-stack :core base ...fragments)` (reusable ecosystem composition)

And a couple quality-of-life helpers:

* **Anonymous mixins**: `(mixin :cwd "." :env {...})`
* **Combine mixins**: `(mix node logging metrics)`
* **Override an app by name only**: `(app :api :instances 2)` → `{:name "api" :instances 2}`
* **Patch every app in a fragment**: `(each {:env {...}} (apps api worker))`
* **Name scoping**: `(scope "svc")` as a mixin; app names become `svc-api`, `svc-worker`, etc.

---

# Code: full replacements + one new file

## 1) NEW: `src/pm2_clj/internal.cljs`

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
```

---

## 2) REPLACE: `src/pm2_clj/merge.cljs` (no more circular deps)

```clojure
(ns pm2-clj.merge
  (:require [pm2-clj.internal :as i]))

(defn- remove-sentinel? [v]
  (= v i/remove))

(defn- merge-apps-by-name
  "Merge PM2 apps vectors by :name.
   - Deep merges app maps.
   - If override app has :pm2-clj/remove true => app is removed."
  [base override deep-merge]
  (let [idx-base (into {} (map (fn [a] [(:name a) a]) base))
        idx-ovr  (into {} (map (fn [a] [(:name a) a]) override))
        names    (-> (into #{} (keys idx-base))
                     (into (keys idx-ovr))
                     (vec))]
    (->> names
         (map (fn [nm]
                (let [a (get idx-base nm)
                      b (get idx-ovr nm)]
                  (cond
                    (and (map? b) (true? (get b i/remove-app-flag))) ::skip
                    (and (map? a) (map? b)) (deep-merge a b)
                    (some? b) b
                    :else a))))
         (remove #(= ::skip %))
         (vec))))

(defn deep-merge
  "Deep merge with special handling:
   - i/remove removes keys
   - vectors of app-like maps (maps w/ :name) merge by :name
   - other vectors are replaced"
  [a b]
  (cond
    (remove-sentinel? b) ::remove-key

    (and (map? a) (map? b))
    (let [ks (into #{} (concat (keys a) (keys b)))]
      (reduce
        (fn [m k]
          (let [va (get a k)
                vb (get b k)]
            (cond
              (contains? b k)
              (let [mv (deep-merge va vb)]
                (if (= mv ::remove-key)
                  (dissoc m k)
                  (assoc m k mv)))

              :else
              (assoc m k va))))
        {}
        ks))

    (and (vector? a) (vector? b))
    (if (and (every? map? a)
             (every? map? b)
             (or (some :name a) (some :name b)))
      (merge-apps-by-name a b deep-merge)
      b)

    :else
    (if (some? b) b a)))
```

---

## 3) REPLACE: `src/pm2_clj/dsl.cljs` (mixins + stacks + sugar)

```clojure
(ns pm2-clj.dsl
  (:require [clojure.string :as str]
            [pm2-clj.internal :as i]
            [pm2-clj.merge :as m]))

;; Public sentinel (nice to type in DSL files)
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
      ;; profile protos realize to ecosystem patches
      (if (ecosystem? merged)
        merged
        (throw (ex-info "profile proto must realize to an ecosystem patch {:apps [...]}"
                        {:id (proto-id p) :value merged})))

      :mixin
      ;; mixins are plain patches (maps)
      merged

      :stack
      ;; stacks are ecosystems
      (if (ecosystem? merged)
        merged
        (throw (ex-info "stack proto must realize to an ecosystem {:apps [...]}"
                        {:id (proto-id p) :value merged})))

      (throw (ex-info "unknown proto kind" {:proto p})))))

;; -------------------------
;; Mixins (first-class, extendable)
;; -------------------------

(defn def-mixin
  "Define a named mixin proto.
   (def-mixin :node :cwd \".\" :env {...})"
  [id & more]
  (mk-proto :mixin (->str-id id) nil (apply opts more)))

(defn mixin
  "Anonymous mixin proto."
  [& more]
  (mk-proto :mixin "anon" nil (apply opts more)))

(defn mix
  "Combine mixins/protos/maps into a single mixin proto.
   Left-to-right deep-merge."
  [& xs]
  (let [patch (reduce
                (fn [acc x]
                  (cond
                    (nil? x) acc
                    (proto? x) (m/deep-merge acc (realize-proto x))
                    (map? x) (m/deep-merge acc x)
                    :else (throw (ex-info "mix expects protos or maps" {:value x}))))
                {}
                xs)]
    (mk-proto :mixin "mix" nil patch)))

(defn scope
  "Mixin that prefixes app names:
    (scope \"svc\") -> svc-api, svc-worker
   Optional delimiter: (scope \"svc\" \"-\")"
  ([prefix] (scope prefix "-"))
  ([prefix delim]
   (mixin i/name-prefix-key prefix
          i/name-delim-key delim)))

;; -------------------------
;; Apps (first-class, extendable)
;; -------------------------

(defn def-app
  "Define an app proto.

  Forms:
    (def-app :api {:script \"dist/api.js\" ...})
    (def-app :api :script \"dist/api.js\" :cwd \".\")
    (def-app :api base-proto {:instances 2 ...})
    (def-app :api base-proto :instances 2 ...)

  base-proto can be app/mixin/stack/profile proto; it realizes to a map and merges."
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
    - map -> returned as-is

  Multi-arg:
    - (app proto :watch true) merges inline overrides
    - (app :api :instances 2) => {:name \"api\" :instances 2} (great for overrides)"
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
  {:name (->str-id id) i/remove-app-flag true})

(defn apps
  "Ecosystem fragment containing apps. Accepts app protos and/or app maps."
  [& xs]
  {:apps (->> xs (map app) vec)})

(defn each
  "Apply a patch (map or mixin/proto) to every app in an ecosystem fragment."
  [patch frag]
  (let [p (cond
            (proto? patch) (realize-proto patch)
            (map? patch) patch
            :else (throw (ex-info "each expects patch as proto/map" {:patch patch})))]
    (update frag :apps (fn [xs] (mapv #(m/deep-merge % p) xs)))))

;; -------------------------
;; Profiles (first-class, extendable)
;; -------------------------

(defn def-profile
  "Define a profile proto. Body is an ecosystem patch.

  (def-profile :prod
    (apps (app :api :instances \"max\"))
    ...)"
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
  "Convenience wrapper for grouping profiles/protos."
  [& ps]
  (apply compose (map (fn [p]
                        (cond
                          (proto? p) (profile p)
                          (map? p) p
                          :else (throw (ex-info "profiles expects protos or profile fragments" {:value p}))))
                      ps)))

;; -------------------------
;; Stacks (first-class ecosystems, extendable)
;; -------------------------

(defn def-stack
  "Define a stack proto. Body composes into an ecosystem.
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

;; -------------------------
;; Deploy
;; -------------------------

(defn deploy
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

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
      :mixin (throw (ex-info "mixin proto cannot be composed directly; apply it via def-app/base or each/mix"
                             {:id (proto-id x)}))
      :profile (profile x)
      :stack (stack x)
      (throw (ex-info "unknown proto kind" {:proto x})))
    :else
    (throw (ex-info "compose expects ecosystem fragments or protos" {:value x}))))

(defn compose
  "Deep-merge ecosystem fragments with special handling for :apps merging by name.
   Also accepts app/profile/stack protos directly (sugar)."
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

## 4) REPLACE: `src/pm2_clj/cli.cljs` (just enough to use new sentinel + strip)

Only change is swapping `dsl/remove` → `internal/remove`, and stripping any remaining internal keys.

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

(defn- render-config [dsl-path mode sets unsets]
  (let [cwd (.cwd js/process)
        eco0 (binding [peval/*cwd* cwd] (peval/eval-file dsl-path))
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
      (println "  pm2-clj <pm2 args...> <ecosystem.pm2.clj> --mode dev")
      (println "  pm2-clj render <ecosystem.pm2.clj> --mode prod")
      (js/process.exit 1))

    (let [[mode-str argv1] (consume-flag argv "--mode")
          mode             (keywordize-mode mode-str)
          [sets argv2]     (consume-multi-flag argv1 "--set")
          [unsets argv3]   (consume-multi-flag argv2 "--unset")]

      (if (cmd-render? argv3)
        (let [dsl-path (second argv3)]
          (when-not dsl-path
            (throw (ex-info "render requires a DSL path" {:args argv3})))
          (let [cfg (render-config dsl-path mode sets unsets)]
            (println (js/JSON.stringify (clj->js cfg) nil 2))
            (js/process.exit 0)))

        (if-let [dsl-path (->> argv3 (filter dsl-file?) first)]
          (let [cfg (render-config dsl-path mode sets unsets)
                tmp (write-temp-cjs! cfg)
                pm2-args (-> argv3 (replace-first-dsl-file tmp))]
            (js/process.exit (pm2/run! pm2-args)))
          (js/process.exit (pm2/run! argv3)))))))
```

---

# Patterns that become *really* clean now

## Pattern A: “runtime mixin” + “service mixin” + “apps”

```clojure
(let [node (def-mixin :node
             :cwd "."
             :autorestart true
             :max_restarts 10
             :env {:NODE_ENV "development"})

      svc (mix node (scope "svc"))

      api (def-app :api svc :script "dist/api.js")
      worker (def-app :worker svc :script "dist/worker.js")]

  (compose api worker))
```

Result names: `svc-api`, `svc-worker`.

---

## Pattern B: profiles that *don’t repeat themselves* via `each`

```clojure
(let [base (def-mixin :base :cwd "." :autorestart true :env {:NODE_ENV "development"})
      api (def-app :api base :script "dist/api.js")
      worker (def-app :worker base :script "dist/worker.js")

      prod (def-profile :prod
             (each {:env {:NODE_ENV "production"}}
               (apps api worker))
             (apps
               (app :api :instances "max" :exec_mode "cluster")
               (app :worker :instances 2)))

      dev (def-profile :dev
            (apps (app :api :watch true)
                  (app :worker :watch true)))]

  (compose api worker prod dev))
```

Note: `app :api :watch true` is an override-only map; it merges into the real `api` by name.

---

## Pattern C: stacks you can extend (like “bundles”)

```clojure
(let [base (def-mixin :base :cwd "." :autorestart true :env {:NODE_ENV "development"})
      api (def-app :api base :script "dist/api.js")
      worker (def-app :worker base :script "dist/worker.js")

      core (def-stack :core
             api worker
             (def-profile :dev (apps (app :api :watch true)
                                     (app :worker :watch true))))

      prod-core (extends core
                 :apps [(app :api :instances "max" :exec_mode "cluster")
                        (app :worker :instances 2)]
                 :profiles {:prod {:apps [(app :api :env {:NODE_ENV "production"})
                                          (app :worker :env {:NODE_ENV "production"})]}})]
  ;; top-level must return ecosystem:
  (stack prod-core))
```

That last `extends` is “proto patching a stack” — it’s legit because stack protos realize to ecosystems.

---

If you want to go even higher level next, the obvious ergonomic jump is:

* a **`matrix`** helper for profiles (cartesian product of env/flags),
* a **`service`** macro-ish helper that creates `def-app` + default logs + health checks,
* and a **`stack/import` convention** so “stack files” can export many named stacks (like libraries) while still allowing one top-level runnable stack.

Say the word and I’ll add those forms in a way that stays first-class + proto-extendable.
