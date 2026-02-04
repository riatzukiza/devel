(ns clobber.dsl
  "Clobber DSL - render and merge ecosystem configurations."
  (:require [clojure.string :as str]))

(defn render-ecosystem
  "Render ecosystem configuration to PM2-compatible format.

   Takes an ecosystem map (typically {:apps [...]}) and returns
   the PM2-compatible configuration for JSON serialization."
  [eco]
  (when-not (map? eco)
    (throw (ex-info "render-ecosystem expects a map" {:value eco})))
  ;; The ecosystem format is already PM2-compatible
  (dissoc eco :profiles))

(defn merge-apps
  "Merge apps from multiple ecosystem configurations.

   Apps are merged by name, with later configs overriding earlier ones."
  [& ecosystems]
  (reduce (fn [acc eco]
            (let [apps (:apps eco)]
              (if (seq apps)
                (update acc :apps (fn [existing]
                                    (let [existing-by-name (into {} (map (fn [a] [(:name a) a]) existing))]
                                      (vec (vals (merge existing-by-name (into {} (map (fn [a] [(:name a) a]) apps))))))))
                acc)))
          {:apps []}
          ecosystems))
