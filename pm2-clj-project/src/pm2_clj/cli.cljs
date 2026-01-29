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
            ks (mapv keyword (drop 2 parts))]
        (when-not (and app-name (not (str/blank? app-name)))
          (throw (ex-info "apps.<name>.<key> required for apps keypaths" {:key k})))
        (let [app-map (if (empty? ks)
                       {:value v}
                       {(first ks) v})
              app-override (merge {:name app-name} app-map)]
          (m/deep-merge eco {:apps [app-override]})))
      (assoc-in eco (mapv keyword parts) v))))

(defn- unset-in-eco [eco k]
  (let [parts (split-path k)]
    (when (empty? parts)
      (throw (ex-info "empty keypath" {:key k})))
    (if (= "apps" (first parts))
      (let [app-name (second parts)
            ks (mapv keyword (drop 2 parts))]
        (when-not (and app-name (not (str/blank? app-name)))
          (throw (ex-info "apps.<name>.<key> required for apps keypaths" {:key k})))
        (let [app-map (if (empty? ks)
                       {:pm2-clj/remove true}
                       {(first ks) dsl/remove})
              app-override (merge {:name app-name} app-map)]
          (m/deep-merge eco {:apps [app-override]})))
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
  (let [i (.indexOf (clj->js args) flag)]
    (if (neg? i)
      [nil args]
      (let [v (nth args (inc i) nil)
            new-args (into (subvec (vec args) 0 i) (subvec (vec args) (+ i 2)))]
        [v new-args]))))

(defn- consume-multi-flag [args flag]
  (loop [acc [] xs (vec args)]
    (let [i (.indexOf (clj->js xs) flag)]
      (if (neg? i)
        [acc xs]
        (let [v (nth xs (inc i) nil)
              xs2 (into (subvec xs 0 i) (subvec xs (+ i 2)))]
          (recur (conj acc v) (vec xs2)))))))

(defn- keywordize-mode [s]
  (cond
    (nil? s) :default
    (str/blank? s) :default
    :else (keyword s)))

(defn- replace-first-dsl-file [args temp-path]
  (let [matches (->> args
                       (map-indexed vector)
                       (filter (fn [[_ a]] (dsl-file? a))))
        idx (when-not (empty? matches) (-> (first matches) first))]
    (if (nil? idx)
      args
      (assoc (vec args) idx temp-path))))

(defn- cmd-render? [args]
  (= "render" (first args)))

(defn- main []
  (let [argv (vec (-> js/process .-argv (.slice 2)))]

    (when (empty? argv)
      (println "pm2-clj: pass-through PM2 wrapper + DSL translator")
      (println "Usage:")
      (println "  pm2-clj <pm2 args...> <ecosystem.pm2.clj> --mode dev")
      (println "  pm2-clj render <ecosystem.pm2.clj> --mode prod")
      (js/process.exit 1))

    (let [[mode-str argv1] (consume-flag argv "--mode")
          mode (keywordize-mode mode-str)
          [sets argv2] (consume-multi-flag argv1 "--set")
          [unsets argv3] (consume-multi-flag argv2 "--unset")]

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
