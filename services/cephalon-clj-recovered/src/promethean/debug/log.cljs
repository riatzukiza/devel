(ns promethean.debug.log)

(defn info [msg data]
  (.log js/console (str "[INFO] " msg) (clj->js data)))

(defn warn [msg data]
  (.warn js/console (str "[WARN] " msg) (clj->js data)))

(defn error [msg data]
  (.error js/console (str "[ERROR] " msg) (clj->js data)))
