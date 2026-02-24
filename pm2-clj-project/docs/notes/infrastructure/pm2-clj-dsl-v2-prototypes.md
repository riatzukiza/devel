## Goals

**Note (2026-02-03):** This document is historical. The current workflow uses `ecosystems/*.cljs` with `npx shadow-cljs release clobber` and `pm2 start ecosystem.config.cjs`. `pm2-clj` and `.pm2.edn` are legacy.

* **Write ecosystem configs in CLJS DSL files** (readable, composable, versionable).
* **Compose multiple ecosystem fragments** (services, groups, profiles).
* **Clean overrides** via **profiles** (`:dev`, `:test`, `:staging`, `:prod`) + optional CLI `--set/--unset`.
* **Legacy:** `pm2-clj` was a pass-through to PM2, translating DSL → a temp `ecosystem.config.cjs`.
* **Legacy canonical format:** `.pm2.edn` (no longer used).
* **Legacy CLI:** `clobber` previously wrapped `pm2-clj`.
* **Legacy bins:** `pm2-clj`, `clobber`.

---

## Repo layout

```
.
├─ package.json
├─ shadow-cljs.edn
├─ bin/
│  ├─ pm2-clj
│  └─ clobber
├─ src/
│  ├─ pm2_clj/
│  │  ├─ cli.cljs
│  │  ├─ dsl.cljs
│  │  ├─ eval.cljs
│  │  ├─ merge.cljs
│  │  ├─ pm2.cljs
│  │  └─ util.cljs
│  └─ clobber/
│     └─ cli.cljs
└─ ecosystems/
├─ base.pm2.edn
   ├─ services/
│  ├─ api.pm2.edn
│  └─ worker.pm2.edn
   └─ stacks/
└─ all.pm2.edn
```

---

## DSL model (what a DSL file returns)

A DSL file evaluates to an **ecosystem map**:

```clojure
{:apps     [ ...pm2 app maps... ]
 :deploy   { ...pm2 deploy... }        ;; optional
 :profiles { :dev {...overrides...}
            :prod {...overrides...} }  ;; optional
 ;; DSL-only keys are stripped before handing to pm2
}
```

### Merge semantics (composition + overrides)

* Maps merge **deeply**.
* `:apps` merges **by `:name`** (per-app overrides are deep-merged).
* Vectors (other than `:apps`) default to **replacement**.
* You can remove:

  * a **key** with sentinel `pm2-clj.dsl/remove`
  * an **app** by including `{:name "api" :pm2-clj/remove true}` in overrides.

---

## CLI behavior

### `pm2-clj` (wrapper)

* Accepts **any pm2 command**.
* If it sees a DSL ecosystem file (`.pm2.edn`, or plain `.edn`), it:

  1. evaluates it (with includes)
  2. applies `--mode <profile>` (default `:default` which means “no profile”)
  3. applies `--set` / `--unset`
  4. writes a temp `ecosystem.config.cjs`
  5. runs real pm2 with the same args, replacing the DSL file path with the temp file path

Extra utility:

* `pm2-clj render <dslfile> [--mode dev]` prints the final pm2 JSON (no pm2 call)

### `clobber` (your workflow CLI)

* Stubbed; currently delegates to `pm2-clj`.
* You’ll grow this later into your opinionated workflows.

---

## Example DSL files

### `ecosystems/base.pm2.edn`

```clojure
(pm2-clj.dsl/compose
  (pm2-clj.dsl/apps
    (pm2-clj.dsl/app "api"
      {:script "dist/api.js"
       :cwd "."
       :instances 1
       :autorestart true
       :max_restarts 10
       :env {:NODE_ENV "development"}})

    (pm2-clj.dsl/app "worker"
      {:script "dist/worker.js"
       :cwd "."
       :instances 1
       :autorestart true
       :env {:NODE_ENV "development"}}))

  (pm2-clj.dsl/profiles
    (pm2-clj.dsl/profile :dev
      (pm2-clj.dsl/apps
        (pm2-clj.dsl/app "api" {:watch true})
        (pm2-clj.dsl/app "worker" {:watch true})))

    (pm2-clj.dsl/profile :test
      (pm2-clj.dsl/apps
        (pm2-clj.dsl/app "api" {:env {:NODE_ENV "test"}})
        (pm2-clj.dsl/app "worker" {:env {:NODE_ENV "test"}})))

    (pm2-clj.dsl/profile :prod
      (pm2-clj.dsl/apps
        (pm2-clj.dsl/app "api"
          {:instances "max"
           :exec_mode "cluster"
           :env {:NODE_ENV "production"}})
        (pm2-clj.dsl/app "worker"
          {:instances 2
           :env {:NODE_ENV "production"}})))))
```

### `ecosystems/stacks/all.pm2.edn` (composition via include)

```clojure
(pm2-clj.dsl/compose
(pm2-clj.dsl/include "./base.pm2.edn")
(pm2-clj.dsl/include "../ecosystems/services/api.pm2.edn")
(pm2-clj.dsl/include "../ecosystems/services/worker.pm2.edn"))
```

Run:

```bash
pm2-clj start ecosystems/stacks/all.pm2.edn --mode prod
```

---

# Implementation

## `package.json`

```json
{
  "name": "@your-scope/pm2-clj",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "bin": {
    "pm2-clj": "./bin/pm2-clj",
    "clobber": "./bin/clobber"
  },
  "scripts": {
    "build": "shadow-cljs release pm2-clj && shadow-cljs release clobber",
    "dev:pm2": "shadow-cljs watch pm2-clj",
    "dev:clobber": "shadow-cljs watch clobber"
  },
  "dependencies": {
    "pm2": "^5.3.0"
  },
  "devDependencies": {
    "shadow-cljs": "^2.28.20"
  }
}
```

---

## `bin/pm2-clj`

```js
#!/usr/bin/env node
require("../dist/pm2-clj.js");
```

## `bin/clobber`

```js
#!/usr/bin/env node
require("../dist/clobber.js");
```

Make sure these are executable:

```bash
chmod +x bin/pm2-clj bin/clobber
```

---

## `shadow-cljs.edn`

```clojure
{:source-paths ["src"]
 :dependencies [[org.babashka/sci "0.9.44"]]
 :builds
 {:pm2-clj {:target :node-script
            :main pm2-clj.cli/main
            :output-to "dist/pm2-clj.js"}
  :clobber {:target :node-script
            :main clobber.cli/main
            :output-to "dist/clobber.js"}}}
```

---

## `src/pm2_clj/dsl.cljs`

```clojure
(ns pm2-clj.dsl
  (:require [clojure.string :as str]))

;; Sentinel used to remove keys during deep merge
(def remove ::remove)

(defn app
  "Create/normalize an app entry.
   (app \"api\" {:script \"dist/api.js\" ...})
   (app {:name \"api\" :script ...})"
  ([name opts]
   (when-not (and (string? name) (not (str/blank? name)))
     (throw (ex-info "app name must be a non-empty string" {:name name})))
   (when-not (map? opts)
     (throw (ex-info "app opts must be a map" {:opts opts})))
   (assoc opts :name name))
  ([m]
   (when-not (map? m)
     (throw (ex-info "app expects a map" {:value m})))
   (when-not (string? (:name m))
     (throw (ex-info "app map must include :name string" {:app m})))
   m))

(defn remove-app
  "Marks an app for removal when merged by name."
  [name]
  {:name name :pm2-clj/remove true})

(defn apps
  "Returns a partial ecosystem map containing apps."
  [& xs]
  {:apps (vec (map (fn [x] (if (string? x) (throw (ex-info "apps expects app maps, not strings" {:value x})) x)) xs))})

(defn deploy
  "Returns a partial ecosystem map containing deploy config."
  [m]
  (when-not (map? m)
    (throw (ex-info "deploy expects a map" {:value m})))
  {:deploy m})

(defn profile
  "Defines a profile override.
   (profile :dev (apps (app \"api\" {:watch true})))"
  [k & parts]
  (when-not (keyword? k)
    (throw (ex-info "profile key must be a keyword" {:key k})))
  {:profiles {k (apply compose parts)}})

(defn profiles
  "Convenience wrapper to group multiple (profile ...) blocks."
  [& ps]
  (apply compose ps))

(defn ecosystem
  "Alias for compose; useful for readability."
  [& parts]
  (apply compose parts))

;; include is injected by the wrapper at evaluation time.
(defn include
  [& _]
  (throw (ex-info "include is only available when evaluating via pm2-clj wrapper" {})))

(declare compose)

```

---

## `src/pm2_clj/merge.cljs`

```clojure
(ns pm2-clj.merge
  (:require [pm2-clj.dsl :as dsl]))

(defn- remove-sentinel? [v]
  (= v dsl/remove))

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
                    (and (map? b) (true? (:pm2-clj/remove b))) ::skip
                    (and (map? a) (map? b)) (deep-merge a b)
                    (some? b) b
                    :else a))))
         (remove #(= ::skip %))
         (vec))))

(defn deep-merge
  "Deep merge with special handling:
   - dsl/remove removes keys
   - :apps vectors merge by :name
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

    (and (= :apps nil) false) b ;; unused, kept for readability

    (and (vector? a) (vector? b))
    ;; special-case apps vectors (heuristic: vector of maps with :name)
    (if (and (every? map? a)
             (every? map? b)
             (or (some :name a) (some :name b)))
      (merge-apps-by-name a b deep-merge)
      b)

    :else
    (if (some? b) b a)))
```

---

## `src/pm2_clj/util.cljs`

```clojure
(ns pm2-clj.util
  (:require ["fs" :as fs]
            ["path" :as path]
            ["os" :as os]))

(defn exists? [p]
  (try
    (fs/existsSync p)
    (catch :default _ false)))

(defn ext [p]
  (let [e (path/extname p)]
    (if (and e (not= e "")) e "")))

(defn resolve-path [cwd p]
  (if (path/isAbsolute p)
    p
    (path/resolve cwd p)))

(defn dirname [p] (path/dirname p))

(defn read-file [p] (fs/readFileSync p "utf8"))

(defn write-file! [p s] (fs/writeFileSync p s "utf8"))

(defn mkdtemp! [prefix]
  (fs/mkdtempSync (path/join (os/tmpdir) prefix)))

(defn join [& parts]
  (apply path/join parts))
```

---

## `src/pm2_clj/eval.cljs`

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

(defn eval-file
  "Evaluate a DSL file via SCI. The file must return an ecosystem map (at least {:apps [...]})"
  [file-path]
  (ensure-cwd! *cwd*)
  (let [abs (u/resolve-path *cwd* file-path)
        dir (u/dirname abs)
        src (u/read-file abs)]
    (when-not (u/exists? abs)
      (throw (ex-info "DSL file not found" {:path abs})))

    (letfn [(include-fn [rel]
              (binding [*cwd* dir]
                (eval-file rel)))]
      (let [ctx (sci/init
                  {:namespaces
                   {'pm2-clj.dsl
                    (sci/copy-ns pm2-clj.dsl (sci/create-ns 'pm2-clj.dsl))}
                   :bindings
                   {'pm2-clj.dsl/include include-fn}})

            ;; SCI evaluates the whole file string; last form must return the ecosystem map.
            result (sci/eval-string* ctx src)]

        (when-not (is-ecosystem? result)
          (throw (ex-info "DSL file did not return an ecosystem map {:apps [...]}" {:path abs :result result})))
        result))))
```

---

## `src/pm2_clj/pm2.cljs`

```clojure
(ns pm2-clj.pm2
  (:require ["child_process" :as cp]))

(defn resolve-pm2-bin
  "Prefer local pm2 bin via require.resolve; fallback to 'pm2' on PATH."
  []
  (try
    (js/require.resolve "pm2/bin/pm2")
    (catch :default _
      "pm2")))

(defn run!
  "Runs pm2 with args, streaming stdio. Returns exit code."
  [args]
  (let [pm2bin (resolve-pm2-bin)]
    (if (= pm2bin "pm2")
      (let [res (cp/spawnSync "pm2" (clj->js args) #js {:stdio "inherit"})]
        (or (.-status res) 1))
      (let [node (.-execPath js/process)
            res  (cp/spawnSync node (clj->js (into [pm2bin] args)) #js {:stdio "inherit"})]
        (or (.-status res) 1)))))
```

---

## `src/pm2_clj/cli.cljs`

```clojure
(ns pm2-clj.cli
  (:require [clojure.string :as str]
            [pm2-clj.dsl :as dsl]
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
  (let [i (.indexOf s "=")]
    (when (neg? i)
      (throw (ex-info "--set expects key=value" {:value s})))
    [(subs s 0 i) (subs s (inc i))]))

(defn- parse-value [s]
  ;; minimal: booleans, null, numbers, otherwise string
  (cond
    (= s "true") true
    (= s "false") false
    (= s "null") nil
    (re-matches #"^-?\d+$" s) (js/parseInt s 10)
    (re-matches #"^-?\d+\.\d+$" s) (js/parseFloat s)
    :else s))

(defn- split-path [k]
  ;; Supports:
  ;; - top-level keys: deploy.user
  ;; - apps.<name>.<key>... e.g. apps.api.instances
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
        ;; turn this into an override ecosystem with an app override
        (m/deep-merge eco {:apps [(assoc (dsl/app app-name {}) (if (empty? ks) :value (first ks)) (if (empty? ks) v (reduce (fn [m2 k2] (assoc-in m2 [k2] v)) {} ks)))]}))
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
        (m/deep-merge eco {:apps [(assoc (dsl/app app-name {}) (if (empty? ks) :pm2-clj/remove true (first ks)) dsl/remove)]}))
      (assoc-in eco (mapv keyword parts) dsl/remove))))

(defn- apply-profile [eco mode]
  (if (or (nil? mode) (= mode :default))
    (dissoc eco :profiles)
    (let [p (get-in eco [:profiles mode] {})]
      (-> (dissoc eco :profiles)
          (m/deep-merge p)
          (dissoc :profiles)))))

(defn- strip-dsl-keys [eco]
  (-> eco
      (dissoc :profiles)
      ;; strip any internal flags used only for merge/removal
      (update :apps (fn [xs] (vec (map #(dissoc % :pm2-clj/remove) xs))))))

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
    (-> eco3 strip-dsl-keys)))

(defn- write-temp-cjs! [cfg]
  (let [dir (u/mkdtemp! "pm2-clj-")
        out (u/join dir "ecosystem.config.cjs")
        json (js/JSON.stringify (clj->js cfg) nil 2)
        body (str "module.exports = " json ";\n")]
    (u/write-file! out body)
    out))

(defn- consume-flag [args flag]
  ;; returns [value new-args]
  (let [i (.indexOf (clj->js args) flag)]
    (if (neg? i)
      [nil args]
      (let [v (nth args (inc i) nil)
            new-args (-> (vec args)
                         (subvec 0 i)
                         (into (subvec (vec args) (+ i 2))))]
        [v new-args]))))

(defn- consume-multi-flag [args flag]
  ;; collects all occurrences: --set x --set y
  (loop [acc [] xs (vec args)]
    (let [i (.indexOf (clj->js xs) flag)]
      (if (neg? i)
        [acc xs]
        (let [v (nth xs (inc i) nil)
              xs2 (-> xs
                      (subvec 0 i)
                      (into (subvec xs (+ i 2))))]
          (recur (conj acc v) (vec xs2)))))))

(defn- keywordize-mode [s]
  (cond
    (nil? s) :default
    (str/blank? s) :default
    :else (keyword s)))

(defn- replace-first-dsl-file [args temp-path]
  ;; PM2 expects the config file in the same position the user provided it.
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
(println "  legacy: pm2-clj <pm2 args...> <ecosystem.pm2.edn> --mode dev")
(println "  legacy: pm2-clj render <ecosystem.pm2.edn> --mode prod")
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

        ;; pass-through path: translate DSL file if present, otherwise call pm2 directly
        (if-let [dsl-path (->> argv3 (filter dsl-file?) first)]
          (let [cfg (render-config dsl-path mode sets unsets)
                tmp (write-temp-cjs! cfg)
                pm2-args (-> argv3 (replace-first-dsl-file tmp))]
            (js/process.exit (pm2/run! pm2-args)))
          (js/process.exit (pm2/run! argv3)))))))
```

---

## `src/clobber/cli.cljs`

```clojure
(ns clobber.cli
  (:require ["child_process" :as cp]))

(defn- run! [args]
  (let [node (.-execPath js/process)
        ;; call the installed bin; during dev you can call dist directly if you want
        ;; but for now this keeps clobber as a thin delegator.
        res  (cp/spawnSync "pm2-clj" (clj->js args) #js {:stdio "inherit" :shell true})]
    (or (.-status res) 1)))

(defn main []
  (let [argv (vec (-> js/process .-argv (.slice 2)))]
    (when (empty? argv)
      (println "clobber: workflow CLI (stub)")
      (println "For now it delegates to pm2-clj.")
      (println "Usage:")
      (println "  clobber pm2 <pm2 args...>")
      (js/process.exit 1))

    (case (first argv)
      "pm2" (js/process.exit (run! (subvec argv 1)))
      ;; future: "up", "down", "logs", "status", etc.
      (do
        (println "Unknown clobber command:" (first argv))
        (println "Try: clobber pm2 <args...>")
        (js/process.exit 1)))))
```

---

# How you use it

### Build once

```bash
npm i
npm run build
```

### Start with a DSL file (pass-through)

```bash
pm2-clj start ecosystems/base.pm2.edn --mode dev
pm2-clj start ecosystems/base.pm2.edn --mode prod
```

### Apply quick overrides (without editing files)

```bash
pm2-clj start ecosystems/base.pm2.edn --mode prod \
  --set apps.api.instances=4 \
  --set apps.worker.instances=2
```

### Render the resulting PM2 config (debug)

```bash
pm2-clj render ecosystems/base.pm2.edn --mode prod
```

### Use clobber (currently delegated)

```bash
clobber pm2-clj start ecosystems/base.pm2.edn --mode dev
```

---

## Notes you’ll probably care about

* The DSL file is evaluated via **SCI**, so it’s “Clojure-like forms” without needing to recompile the wrapper.
* `include` is resolved **relative to the file doing the include**, not process cwd.
* The wrapper consumes `--mode/--set/--unset` and does **not** pass them to PM2.

If you want, the next step is to tighten the `--set apps.<name>...` behavior (right now it’s intentionally minimal) and add a richer override grammar (e.g. `--set env.NODE_ENV=production` applied across all apps, or per-profile inheritance).
