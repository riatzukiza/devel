(ns sentinel
  (:require [clobber.macro]))

(clobber.macro/defapp "sentinel"
  {:script "./dist/sentinel.cjs"
   :cwd "/home/err/devel/orgs/riatzukiza/promethean/services/sentinel"
   :env {:NODE_ENV (clobber.macro/env-var :NODE_ENV "production")
         :SENTINEL_CONFIG (clobber.macro/env-var :SENTINEL_CONFIG "/home/err/devel/orgs/riatzukiza/promethean/services/sentinel/sentinel.edn")
         :SENTINEL_WATCHER_ROOT (clobber.macro/env-var :SENTINEL_WATCHER_ROOT "/home/err/devel/orgs/riatzukiza/promethean/services/sentinel")}})

(clobber.macro/ecosystem-output)
