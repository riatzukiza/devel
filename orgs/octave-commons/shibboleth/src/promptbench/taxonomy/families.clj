(ns promptbench.taxonomy.families
  "def-attack-family macro.

   Registers attack families in the taxonomy registry with spec validation.
   Each family stores: :description, :category, :severity, :parent, :tags (as set),
   :signatures (vector of maps), :transforms (affinity map), :gen-hints."
  (:require [promptbench.taxonomy.registry :as registry]))

(defmacro def-attack-family
  "Define and register an attack family in the taxonomy.

   Required keys: :description (string), :category (keyword).
   Optional keys: :severity, :parent, :tags, :signatures, :transforms, :gen-hints.

   Tags are coerced to a set, signatures to a vector. Throws on invalid spec or duplicate.

   The family-name argument accepts either a bare symbol or a keyword:
     (def-attack-family persona-injection {...})   ;; bare symbol — converted to :persona-injection
     (def-attack-family :persona-injection {...})   ;; keyword — used as-is

   Usage:
     (def-attack-family persona-injection
       {:description \"Injects a fictional persona...\"
        :category    :jailbreak
        :severity    :high
        :tags        #{:persona :system-prompt-spoofing}
        :signatures  [{:pattern :nested-system-prompt :description \"...\"}]
        :transforms  {:mt {:affinity :high :note \"...\"}}})"
  [family-name family-data]
  (let [kw-name (if (keyword? family-name)
                  family-name
                  (keyword (name family-name)))]
    `(registry/register-family! ~kw-name ~family-data)))
