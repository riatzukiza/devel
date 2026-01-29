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