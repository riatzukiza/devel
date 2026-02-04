;; pm2.ecosystem.config - Example PM2 ecosystem configuration
;;
;; This is a CLJS program that compiles to a real CommonJS module.
;; PM2 can require() this file directly!
;;
;; Usage:
;;   shadow-cljs release pm2-config   # Compiles to ecosystem.config.cjs
;;   pm2 start ecosystem.config.cjs   # PM2 loads and runs as config

(ns ^:once pm2.ecosystem.config
  (:require [pm2-clj.dsl :as dsl]
            [pm2-clj.merge :as m]))

;; Simple example - define apps and export
(def config
  {:apps
   [(dsl/app "test-app" {:script "node" :args ["-e" "console.log('hello')"]})]})

;; Export at require-time
(set! js/module.exports (clj->js config))
