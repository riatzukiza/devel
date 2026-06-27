(ns eta-mu.runtime.shape.surface)

(def command->internal
  {:version :version
   "version" :version})

(def command->external
  {:version "version"})

(defn command-input-from-external
  [input]
  {:command (get command->internal (:command input))
   :value (:value input)})

(defn command-result->external
  [result]
  {:command (get command->external (:command result))
   :stdout (:stdout result)
   :exitCode (:exit-code result)})
