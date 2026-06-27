(ns promptbench.taxonomy.labels
  "def-intent-label macro.

   Registers intent labels in the taxonomy registry with spec validation.
   Each label stores: :description, :polarity (:safe/:unsafe/:contested), :requires.

   Conditional requirements based on polarity:
   - :safe    — no :requires needed
   - :unsafe  — requires [:attack-family :harm-category]
   - :contested — requires [:rationale]"
  (:require [promptbench.taxonomy.registry :as registry]))

(defmacro def-intent-label
  "Define and register an intent label in the taxonomy.

   Required keys: :description (string), :polarity (:safe, :unsafe, :contested).
   Optional keys: :requires (keyword vector, conditional on polarity).

   The label name accepts either a keyword or a bare symbol:
     (def-intent-label :benign {...})   ;; keyword — used as-is
     (def-intent-label benign {...})    ;; bare symbol — converted to :benign

   Polarity constraints:
   - :safe    — no :requires needed
   - :unsafe  — must have :requires with exactly [:attack-family :harm-category] (no duplicates)
   - :contested — must have :requires with [:rationale]

   Throws on invalid spec, missing conditional requires, or duplicate.

   Usage:
     (def-intent-label :benign
       {:description \"Legitimate user request\"
        :polarity    :safe})

     (def-intent-label :adversarial
       {:description \"Adversarial request\"
        :polarity    :unsafe
        :requires    [:attack-family :harm-category]})"
  [label-name label-data]
  (let [kw-name (if (keyword? label-name)
                  label-name
                  (keyword (name label-name)))]
    `(registry/register-intent-label! ~kw-name ~label-data)))
