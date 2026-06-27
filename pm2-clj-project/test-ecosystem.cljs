(ns test-ecosystem
  (:require [clobber.macro]))

(clobber.macro/defapp "test-app" {:script "node" :args ["-e" "console.log('hello')"]})
(clobber.macro/ecosystem-output)
