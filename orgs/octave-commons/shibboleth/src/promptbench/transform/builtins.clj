(ns promptbench.transform.builtins
  "Built-in transform registrations.

   The pipeline engine expects transforms like :mt and :homoglyph to be
   registered in the transform registry before Stage 4-6 execute.

   Tests often register definition-only transforms; this namespace wires the
   production implementations onto those definitions without requiring callers
   to manage registry state." 
  (:require [promptbench.transform.registry :as registry]
            [promptbench.transform.mt :as mt]
            [promptbench.transform.codemix :as codemix]
            [promptbench.transform.homoglyph :as homoglyph]
            [promptbench.transform.exhaustion :as exhaustion]))

(defn- ensure-transform!
  "Ensure a transform exists and has an :impl.

   If the transform is missing, registers it with full metadata.
   If it exists but has no :impl, attaches the provided impl.
   If it exists and already has an :impl, leaves it unchanged." 
  [transform-kw transform-data impl-fn]
  (if-let [existing (registry/get-transform transform-kw)]
    (do
      (when-not (:impl existing)
        (registry/set-transform-impl! transform-kw impl-fn))
      (registry/get-transform transform-kw))
    (registry/register-transform! transform-kw (assoc transform-data :impl impl-fn))))

(defn register-all!
  "Register all built-in transforms. Idempotent." 
  []
  (ensure-transform! :mt
                     {:description "Machine translation via open-hax proxy"
                      :type :linguistic
                      :deterministic false
                      :reversible :approximate
                      :params-spec {:target-lang {:type :keyword :required true}
                                   :engine {:type :keyword :required false}
                                   :proxy-url {:type :string :required false}}
                      :provenance [:engine :target-lang :seed]}
                     mt/apply-mt)

  (ensure-transform! :code-mix
                     {:description "Code mixing via seed-deterministic substitution"
                      :type :linguistic
                      :deterministic true
                      :reversible :approximate
                      :params-spec {:mix-rate {:type :double :required false}
                                   :strategy {:type :keyword :required false}
                                   :l2 {:type :keyword :required false}}
                      :provenance [:mix-rate :strategy :l2 :seed]}
                     codemix/apply-codemix)

  (ensure-transform! :homoglyph
                     {:description "Homoglyph substitution using NFKC-reversible fullwidth Latin"
                      :type :obfuscation
                      :deterministic true
                      :reversible true
                      :params-spec {:rate {:type :double :required false}}
                      :provenance [:rate :substitution-count :seed]}
                     homoglyph/apply-homoglyph)

  (ensure-transform! :exhaustion
                     {:description "Token exhaustion (padding)"
                      :type :resource-attack
                      :deterministic true
                      :reversible :approximate
                      :params-spec {:position {:type :keyword :required false}
                                   :repetition-length {:type :long :required false}
                                   :pattern {:type :string :required false}}
                      :provenance [:position :repetition-length :pattern :seed]}
                     exhaustion/apply-exhaustion)

  true)
