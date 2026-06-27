(ns promptdb.core
  "Epistemic kernel primitives for openplanner.
   Every other system (contracts, actors, events, receipts) emits these.
   Layer map:
     :己  self (asserting principal)
     :汝  user
     :彼  others
     :世  world
     :主  current focus"
  (:require [malli.core :as m]))

;; ---------------------------------------------------------------------------
;; Confidence interval
;; ---------------------------------------------------------------------------

(def Confidence
  [:and :double [:>= 0.0] [:<= 1.0]])

;; ---------------------------------------------------------------------------
;; Epistemic context roles
;; ---------------------------------------------------------------------------

(def CtxRole
  [:enum :己 :汝 :彼 :世 :主])

;; ---------------------------------------------------------------------------
;; Primitive schemas
;; ---------------------------------------------------------------------------

(def Fact
  "A principal asserts a proposition is true.
   LayerKind: actor"
  [:map
   [:ctx    CtxRole]
   [:claim  :any]
   [:src    :any]          ;; provenance: event-id, actor-id, URL, …
   [:p      Confidence]
   [:time   inst?]])

(def Obs
  "Something was sensed / observed (not yet validated).
   LayerKind: event"
  [:map
   [:ctx    CtxRole]
   [:about  :any]          ;; what was sensed
   [:signal :any]          ;; raw signal shape
   [:p      Confidence]])

(def Inference
  "A derived proposition produced by applying a contract to evidence.
   LayerKind: contract-execution"
  [:map
   [:from   [:vector [:or Fact Obs]]]
   [:rule   :keyword]      ;; contract-id that fired
   [:actor  :keyword]      ;; who executed the contract
   [:claim  :any]
   [:p      Confidence]])

(def Attestation
  "The actor's signature that they did what they said.
   LayerKind: receipt"
  [:map
   [:actor    :keyword]
   [:did      :any]
   [:run-id   uuid?]
   [:causedby {:optional true} uuid?]
   [:p        Confidence]])

(def Judgment
  "The world's verdict on whether an inference/attestation held.
   LayerKind: fulfillment"
  [:map
   [:of      uuid?]
   [:verdict [:enum :held :failed :partial]]
   [:auditor :keyword]
   [:p       Confidence]])

;; ---------------------------------------------------------------------------
;; Registry
;; ---------------------------------------------------------------------------

(def registry
  {:promptdb/fact        Fact
   :promptdb/obs         Obs
   :promptdb/inference   Inference
   :promptdb/attestation Attestation
   :promptdb/judgment    Judgment})

(defn validate! [kind value]
  (let [schema (get registry kind)]
    (when-not schema
      (throw (ex-info "Unknown epistemic kind" {:kind kind})))
    (when-not (m/validate schema value)
      (throw (ex-info "Epistemic validation failed"
                      {:kind    kind
                       :errors  (m/explain schema value)
                       :value   value})))
    value))
