;; clobber.macro - ClojureScript macros/functions for PM2 ecosystem configuration
;;
;; NOTE: We use regular functions instead of macros because nbb interprets
;; CLJS without compile-time macro expansion. Functions work because they're
;; evaluated at runtime.
;;
;; This namespace provides:
;; - defapp: Define a PM2 application
;; - defprofile: Define a named profile with app overrides
;; - ecosystem: Compose all defined apps into an ecosystem config
;; - ecosystem-output: Print ecosystem config as EDN to stdout

(ns clobber.macro
  (:require [clojure.string :as str]))

;; Registry for apps and profiles - using atoms for mutable state
(defonce app-registry (atom []))
(defonce profile-registry (atom {}))

;; Dynamic var for eval function (used by defprofile)
(def ^:dynamic *eval-fn* nil)

(defn- reset-registries! []
  "Reset app and profile registries. Call before each ecosystem evaluation."
  (reset! app-registry [])
  (reset! profile-registry {}))

(defn defapp
  "Define a PM2 application.
   
   (defapp \"my-app\" {:script \"dist/index.js\" :instances 1})
   
   Args:
     name: String name of the app
     opts: Map of PM2 configuration options"
  [name opts]
  ;; Ensure registry is reset before first defapp
  (when (empty? @app-registry)
    (reset! app-registry []))
  (swap! app-registry conj (assoc opts :name name)))

(defn defprofile
  "Define a named profile with app overrides.
   
   (defprofile :dev
     (defapp \"dev-app\" {:env {:NODE_ENV \"development\"}}))
   
   The profile can override base apps or add new ones."
  [name & body]
  ;; Ensure registry is fresh for profile
  (let [fresh-registry (atom [])
        fresh-profile (atom {})]
    (binding [*eval-fn* (fn [form]
                          (case (first form)
                            defapp (let [[_ app-name app-opts] form]
                                     (swap! fresh-registry conj (assoc app-opts :name app-name)))
                            nil))]
      (doseq [form body]
        (when *eval-fn*
          (*eval-fn* form))))
    (swap! profile-registry assoc name {:apps @fresh-registry})))

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

(defn ecosystem-output
  "Generate and print ecosystem configuration as EDN to stdout.
   
   Used by nbb subprocess execution to pass macro-expanded data
   back to pm2-clj/clobber.
   
   Usage:
     (clobber.macro/ecosystem-output)
     ;; or
     (clobber.macro/ecosystem-output :dev)
   
   Prints EDN to stdout for capture by parent process."
  [& [profile-kw]]
  (let [eco (if profile-kw
              (ecosystem :profile (keyword (name profile-kw)))
              (ecosystem))]
    (println (pr-str eco))))

;; Environment variable helper
(defn env-var
  "Get environment variable with fallback.
   
   (env-var :VAR_NAME :fallback)
   (env-var :VAR_NAME)  ; no fallback
   
   Returns the env var value or fallback."
  ([var-sym]
   (get-in js/process.env [(name var-sym) ""]))
  ([var-sym fallback]
   (or (get-in js/process.env [(name var-sym) ""]) fallback)))
