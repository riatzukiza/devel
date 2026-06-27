(ns promptbench.taxonomy.categories
  "def-harm-category macro.

   Registers harm categories in the taxonomy registry with spec validation.
   Each category stores: :description, :parent (optional), :children (keyword collection).
   Root categories (no parent) are allowed."
  (:require [promptbench.taxonomy.registry :as registry]))

(defmacro def-harm-category
  "Define and register a harm category in the taxonomy.

   Required keys: :description (string).
   Optional keys: :parent (keyword), :children (keyword collection).

   The category name accepts either a keyword or a bare symbol:
     (def-harm-category :jailbreak {...})   ;; keyword — used as-is
     (def-harm-category jailbreak {...})    ;; bare symbol — converted to :jailbreak

   Root categories (no :parent) are allowed.
   Throws on invalid spec or duplicate.

   Usage:
     (def-harm-category :jailbreak
       {:description \"Attempts to bypass safety training\"
        :parent      :adversarial
        :children    [:identity-manipulation :instruction-injection]})"
  [cat-name cat-data]
  (let [kw-name (if (keyword? cat-name)
                  cat-name
                  (keyword (name cat-name)))]
    `(registry/register-category! ~kw-name ~cat-data)))
