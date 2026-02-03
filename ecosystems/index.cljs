(ns index
  (:require [clobber.macro]
            [ecosystem]
            [cephalon]))

;; The ecosystem and cephalon namespaces load and register all apps via defapp
;; when they're required. No need to call anything - the side effects happen
;; during namespace loading.

;; Export ecosystem to module.exports for PM2
;; This is the critical line that makes compiled CLJS usable by PM2
(set! (.-exports js/module)
      (clj->js (clobber.macro/ecosystem)))

(defn -main
  "Entry point for shadow-cljs node-script target.
   Does nothing since export already runs at require-time."
  [& _]
  nil)
