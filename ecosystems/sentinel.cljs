(ns sentinel
  (:require [clobber.macro]))

(clobber.macro/defapp "sentinel"
  {:script "./dist/sentinel.cjs"
   :cwd "./orgs/riatzukiza/promethean/services/sentinel"
   :env {:NODE_ENV (clobber.macro/env-var :NODE_ENV "production")
         :SENTINEL_CONFIG (clobber.macro/env-var :SENTINEL_CONFIG "./sentinel.edn")
         :SENTINEL_WATCHER_ROOT (clobber.macro/env-var :SENTINEL_WATCHER_ROOT ".")}})

(clobber.macro/ecosystem-output)
