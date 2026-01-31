(ns clobber.cli
  (:require ["child_process" :as cp]
            ["fs" :as fs]
            [clojure.string :as str]
            [clobber.dsl :refer [render-ecosystem merge-apps]]))

(defn- run-pm2! [args]
  (let [res (cp/spawnSync "pm2-clj" (clj->js args) #js {:stdio "inherit" :shell true})]
    (or (.-status res) 1)))

(defn- render-file [file-path]
  "Read a clobber DSL file, evaluate it, and return the rendered ecosystem."
  (let [file-content (.readFileSync fs file-path "utf8")
        ;; Read and evaluate the forms in the file
        forms (clojure.reader/read-string file-content)
        ;; Evaluate all forms - defapp creates vars, ecosystem returns the config
        result (eval forms)]
    ;; Render to PM2-compatible format
    (render-ecosystem result)))

(defn- print-usage []
  (println "clobber: macro-based PM2 configuration")
  (println "")
  (println "Commands:")
  (println "  clobber render <file.clj>  Render a clobber DSL file to JSON")
  (println "  clobber pm2 <args...>      Delegate to pm2-clj")
  (println "")
  (println "Examples:")
  (println "  clobber render ecosystem.clj | pm2 start -")
  (println "  clobber pm2 list"))

(defn main []
  (let [argv (vec (-> js/process .-argv (.slice 2)))]
    (when (empty? argv)
      (print-usage)
      (js/process.exit 1))

    (case (first argv)
      "render"
      (if-let [file-path (second argv)]
        (try
          (let [result (render-file file-path)]
            (println (js/JSON.stringify (clj->js result) nil 2)))
          (catch :default e
            (println "Error rendering file:" (.-message e))
            (js/process.exit 1)))
        (do
          (println "Error: render requires a file path")
          (js/process.exit 1)))

      "pm2"
      (js/process.exit (run-pm2! (subvec argv 1)))

      (do
        (println "Unknown clobber command:" (first argv))
        (print-usage)
        (js/process.exit 1)))))