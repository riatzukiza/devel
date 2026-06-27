(ns promethean.eidolon.embed
  (:require [clojure.string :as str]))

(defn circuit-label [c]
  (case c
    :c1-survival "Circuit 1: Survival (health, uptime, safety)"
    :c2-social "Circuit 2: Social/Permission (relationships, access)"
    :c3-language "Circuit 3: Language/Modeling (concepts, reasoning)"
    :c4-alignment "Circuit 4: Alignment (ethics, norms, constraints)"
    (str "Circuit: " (name c))))

(defn core-embedding-prompt [{:keys [agent-name circuit persistent recent latest tags]}]
  (str
    "You are generating a deterministic embedding input.\n"
    "Persistently\n" (or persistent "") "\n"
    "Recently\n" (or recent "") "\n"
    "As it relates to " agent-name ":\n" (or latest "") "\n"
    "categories:\n"
    (str/join "\n" (map #(str "- " %) (or tags [])))
    "\n\n"
    (circuit-label circuit)
    "\n"))

(defn memory->embedding-input [{:keys [agent-name circuit persistent-snippet recent-snippet]} mem]
  (let [txt (:memory/text mem)
        tags (:memory/tags mem)]
    (core-embedding-prompt
      {:agent-name agent-name
       :circuit circuit
       :persistent persistent-snippet
       :recent recent-snippet
       :latest txt
       :tags tags})))
