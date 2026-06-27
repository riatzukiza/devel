(ns eta-mu.runtime.infra.boundary
  (:require [eta-mu.runtime.law.boundary :as boundary-law]
            [eta-mu.runtime.law.core :as law]))

(def implemented-boundaries
  [{:boundary :js
    :namespace "eta-mu.runtime.extern.js"
    :contract "JS value <-> CLJS data conversion"}
   {:boundary :time
    :namespace "eta-mu.runtime.extern.time"
    :contract "timestamps and ISO clock values"}
   {:boundary :json
    :namespace "eta-mu.runtime.extern.json"
    :contract "JSON string <-> CLJS data conversion"}
   {:boundary :http
    :namespace "eta-mu.runtime.extern.http"
    :contract "HTTP request map <-> opaque fetch init"}
   {:boundary :process
    :namespace "eta-mu.runtime.extern.process"
    :contract "argv/cwd/env snapshots as CLJS data"}])

(def planned-boundaries
  [{:boundary :fs
    :namespace "eta-mu.runtime.extern.fs"}
   {:boundary :path
    :namespace "eta-mu.runtime.extern.path"}
   {:boundary :process-exec
    :namespace "eta-mu.runtime.extern.process-exec"}
   {:boundary :git
    :namespace "eta-mu.runtime.extern.git"}
   {:boundary :opencode
    :namespace "eta-mu.runtime.extern.opencode"}
   {:boundary :pi-host
    :namespace "eta-mu.runtime.extern.pi-host"}
   {:boundary :provider-proxx
    :namespace "eta-mu.runtime.extern.provider-proxx"}])

(defn boundary-inventory
  []
  {:implemented implemented-boundaries
   :planned planned-boundaries})

(defn validate-result
  [result]
  (law/validate! boundary-law/normalized-result-schema result "boundary result"))
