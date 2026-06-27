(ns user
  "REPL convenience functions for cephalon development."
  (:require [promethean.main]))

(defn go
  "Start the cephalon bot."
  []
  (promethean.main/-main))
