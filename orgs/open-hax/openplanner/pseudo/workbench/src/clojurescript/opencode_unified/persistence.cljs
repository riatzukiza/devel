(ns opencode-unified.persistence
  (:require [cljs.reader :as reader]))

(def prefix "opencode.workbench.")

(defn- local-storage []
  (when (exists? js/window)
    (some-> js/window (aget "localStorage"))))

(defn save-state! [key value]
  (try
    (when-let [storage (local-storage)]
      (.setItem storage (str prefix key) (pr-str value)))
    (catch js/Error e
      (js/console.error "Failed to save state:" key e))))

(defn load-state [key default-value]
  (try
    (if-let [stored (when-let [storage (local-storage)]
                      (.getItem storage (str prefix key)))]
      (reader/read-string stored)
      default-value)
    (catch js/Error e
      (js/console.error "Failed to load state:" key e)
      default-value)))
