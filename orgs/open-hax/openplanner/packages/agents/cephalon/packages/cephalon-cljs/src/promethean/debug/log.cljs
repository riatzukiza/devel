(ns promethean.debug.log
  "Logging utilities for Cephalon")

(defn debug
  [& args]
  (apply js/console.log (clj->js (cons "[DEBUG]" args))))

(defn info
  [& args]
  (apply js/console.log (clj->js (cons "[INFO]" args))))

(defn warn
  [& args]
  (apply js/console.warn (clj->js (cons "[WARN]" args))))

(defn error
  [& args]
  (apply js/console.error (clj->js (cons "[ERROR]" args))))
