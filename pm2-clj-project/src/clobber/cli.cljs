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