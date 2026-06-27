(ns eta-mu.extensions.bootstrap
  "Bootstrap extension - verifies the CLJS compile/load path works."
  (:require-macros [eta-mu.core :as em]))

(em/defextension bootstrap
  :name "bootstrap"
  :description "No-op verification extension for the eta-mu build pipeline."

  (em/on "session_start"
    :handler (fn [event ctx]
               nil)))
