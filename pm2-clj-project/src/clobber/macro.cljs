;; clobber.macro - ClojureScript macros for PM2 ecosystem configuration
;;
;; This namespace provides:
;; - defapp: Define a PM2 application
;; - defprofile: Define a named profile with app overrides
;; - ecosystem: Compose all defined apps into an ecosystem config
;; - ecosystem-output: Print ecosystem config as EDN to stdout

(ns clobber.macro
  (:require [clojure.string :as str]))

;; Registry for apps and profiles
(defonce app-registry (atom []))
(defonce profile-registry (atom {}))

(defn- reset-registries! []
  "Reset app and profile registries. Call before each ecosystem evaluation."
  (reset! app-registry [])
  (reset! profile-registry {}))

(defmacro defapp
  "Define a PM2 application.
   
   (defapp \"my-app\" {:script \"dist/index.js\" :instances 1})
   
   Args:
     name: String name of the app
     opts: Map of PM2 configuration options"
  [name opts]
  `(do
     ;; Ensure registry is reset before first defapp
     (when (empty? @app-registry)
       (reset! app-registry []))
     (swap! app-registry conj (assoc ~(if (map? opts) opts `~opts) :name ~name))))

(defmacro defprofile
  "Define a named profile with app overrides.
   
   (defprofile :dev
     (defapp \"dev-app\" {:env {:NODE_ENV \"development\"}}))
   
   The profile can override base apps or add new ones."
  [name & body]
  `(do
     ;; Ensure registry is fresh for profile
     (let [fresh-registry# (atom [])
           fresh-profile# (atom {})]
       (binding [*eval-fn* (fn [form#]
                             (case (first form#)
                               defapp (let [[_ app-name# app-opts#] form#]
                                       (swap! fresh-registry# conj (assoc app-opts# :name app-name#)))
                               nil))]
         ~@body)
       (swap! profile-registry assoc ~name {:apps @fresh-registry#}))))

(defn- evaluate-profile
  "Evaluate a profile and merge its apps into the main registry."
  [profile-kw]
  (let [profile-data (get @profile-registry profile-kw)]
    (when profile-data
      (doseq [app (:apps profile-data)]
        (swap! app-registry conj app)))))

(defn ecosystem
  "Compose all defined apps into an ecosystem configuration.
   
   (ecosystem) returns {:apps [...]} with all defapp definitions.
   
   Options:
     :profile - keyword, apply profile overrides"
  [& {:keys [profile] :or {profile nil}}]
  ;; If a profile is specified, merge it
  (when profile
    (evaluate-profile profile))
  {:apps (vec @app-registry)})

(defmacro ecosystem-output
  "Generate and print ecosystem configuration as EDN to stdout.
   
   Used by nbb subprocess execution to pass macro-expanded data
   back to pm2-clj/clobber.
   
   Usage:
     (clobber.macro/ecosystem-output)
     ;; or
     (clobber.macro/ecosystem-output {:profile :dev})
   
   Prints EDN to stdout for capture by parent process."
  [& opts]
  (let [merge-map (first opts)]
    `(let [eco# ~(if merge-map
                   `(ecosystem :profile ~(keyword (name merge-map)))
                   `(ecosystem))]
       (println (pr-str eco#)))))

;; Environment variable helper
(defmacro env-var
  "Get environment variable with fallback.
   
   (env-var :VAR_NAME :fallback)
   (env-var :VAR_NAME)  ; no fallback
   
   Expands to: (.-VAR_NAME js/process.env) or fallback"
  ([var-sym]
   `(get-in js/process.env [(name ~var-sym) ""]))
  ([var-sym fallback]
   `(or (get-in js/process.env [(name ~var-sym) ""]) ~fallback)))
