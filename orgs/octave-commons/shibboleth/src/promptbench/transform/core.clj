(ns promptbench.transform.core
  "Transform execution engine, composition, and variant records.

   Provides:
   - def-transform macro for declaring transform definitions
   - execute-transform for running a single transform
   - execute-chain for composing transforms in sequence
   - def-transform-chain macro for declaring reusable named chains
   - execute-named-chain for running registered chains
   - make-variant-record for creating provenance-tracked variant records"
  (:require [promptbench.transform.registry :as registry]
            [promptbench.util.crypto :as crypto]
            [clojure.string :as str]))

;; ============================================================
;; def-transform macro (definition registration)
;; ============================================================

(defmacro def-transform
  "Define and register a transform in the registry.

   Required keys: :description (string), :type (from #{:linguistic :obfuscation :resource-attack}),
                  :deterministic (boolean), :reversible (boolean or :approximate),
                  :params-spec (map), :provenance (keyword vector).
   Optional keys: :impl (function).

   :impl is optional at definition time — transforms can be registered as definition-only
   and have their implementation provided later.

   Throws on invalid spec or duplicate.

   Usage:
     (def-transform mt
       {:description   \"Machine translation to target language\"
        :type          :linguistic
        :deterministic false
        :reversible    :approximate
        :params-spec   {:target-lang {:type :keyword :required true}}
        :provenance    [:engine :target-lang :model-version :timestamp]
        :impl          (fn [{:keys [text config seed]}] ...)})"
  [transform-name transform-data]
  (let [kw-name (keyword (name transform-name))]
    `(registry/register-transform! ~kw-name ~transform-data)))

;; ============================================================
;; Transform Execution
;; ============================================================

(defn execute-transform
  "Execute a registered transform on the given text.

   Arguments:
   - transform-name — keyword name of the registered transform
   - text           — input text string
   - config         — configuration map for the transform
   - seed           — integer seed for reproducibility

   Returns {:text ... :metadata ...} with the transform's output.
   Throws if the transform is not registered or has no :impl."
  [transform-name text config seed]
  (let [t (registry/get-transform transform-name)]
    (when-not t
      (throw (ex-info (str "Unknown transform: " transform-name)
                      {:transform transform-name})))
    (when-not (:impl t)
      (throw (ex-info (str "Transform " transform-name " has no implementation")
                      {:transform transform-name})))
    (let [impl (:impl t)
          result (impl {:text text :config config :seed seed})]
      result)))

;; ============================================================
;; Transform Chain Composition
;; ============================================================

(defn execute-chain
  "Execute a chain of transforms in sequence, accumulating metadata.

   Arguments:
   - text  — input text string
   - steps — vector of {:transform <keyword> :config <map>}
   - seed  — integer seed for reproducibility

   Returns {:text ... :metadata [...]} where metadata is an ordered vector
   of per-step metadata maps, each annotated with :transform key.

   Chains are order-sensitive: A->B produces different results than B->A."
  [text steps seed]
  (loop [current-text text
         remaining steps
         metadata-acc []]
    (if (empty? remaining)
      {:text current-text
       :metadata metadata-acc}
      (let [step (first remaining)
            transform-name (:transform step)
            config (:config step)
            result (execute-transform transform-name current-text config seed)
            step-metadata (assoc (:metadata result) :transform transform-name)]
        (recur (:text result)
               (rest remaining)
               (conj metadata-acc step-metadata))))))

;; ============================================================
;; def-transform-chain macro
;; ============================================================

(defmacro def-transform-chain
  "Define and register a reusable named chain.

   Validates that all step transform references are registered at definition time.

   Usage:
     (def-transform-chain ja-codemix-obfuscated
       {:description \"Japanese MT → code-mix → homoglyph\"
        :steps [{:transform :mt :config {:target-lang :ja}}
                {:transform :code-mix :config {:l2 :en :mix-rate 0.25}}
                {:transform :homoglyph :config {:rate 0.1}}]})"
  [chain-name chain-data]
  (let [kw-name (keyword (name chain-name))]
    `(registry/register-chain! ~kw-name ~chain-data)))

;; ============================================================
;; Named Chain Execution
;; ============================================================

(defn execute-named-chain
  "Execute a registered named chain on the given text.

   Arguments:
   - chain-name — keyword name of the registered chain
   - text       — input text string
   - seed       — integer seed for reproducibility

   Returns {:text ... :metadata [...]}."
  [chain-name text seed]
  (let [chain (registry/get-chain chain-name)]
    (when-not chain
      (throw (ex-info (str "Unknown chain: " chain-name)
                      {:chain chain-name})))
    (execute-chain text (:steps chain) seed)))

;; ============================================================
;; Variant Record Generation
;; ============================================================

(defn make-variant-record
  "Create a variant record with full provenance.

   Arguments:
   - source          — source prompt map with :source-id, :text, :split
   - variant-type    — keyword for the transform type (e.g., :mt, :code-mix)
   - transform-chain — vector of {:transform ... :config ...} steps
   - seed            — integer seed used
   - text            — the transformed text
   - metadata        — accumulated metadata (vector of maps)

   Returns a variant record map with all required fields:
   :variant-id, :source-id, :text, :variant-type, :transform-chain,
   :transform-seed, :metadata, :split."
  [source variant-type transform-chain seed text metadata]
  {:variant-id      (crypto/sha256-id (str (:source-id source) "|" (name variant-type) "|" seed "|" text))
   :source-id       (:source-id source)
   :text            text
   :variant-type    variant-type
   :transform-chain (mapv (fn [step]
                            {:transform (:transform step)
                             :config    (or (:config step) {})})
                          transform-chain)
   :transform-seed  seed
   :metadata        metadata
   :split           (:split source)})
