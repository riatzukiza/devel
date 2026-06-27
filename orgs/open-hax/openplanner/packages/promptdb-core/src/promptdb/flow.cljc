(ns promptdb.flow
  "Documents the canonical epistemic inference loop.

   obs (event arrives)
     → actor-fact (this principal is permitted to process it)
       → contract (inference-rule: if obs matches pattern → claim C)
         → inference (claim C, p=0.9, src=event-id+actor-id)
           → action  (world-effect)
             → attestation (actor says they did X)
               → judgment (did C actually hold?)
                 → new obs (world changed)

   Contract kind → epistemic role mapping:
     :trigger     promotes obs → eligible for contract matching
     :policy      side-condition on inference (must hold for rule to fire)
     :tool-call   capability grant: which attestation types actor may emit
     :agent       the inference rule itself: obs+fact → inference+attestation
     :fulfillment issues judgment on an inference
     :role        asserts the actor-fact into the store"
  (:require [promptdb.core :as core]))

(def contract-kind->epistemic-role
  {:trigger     :obs-promotion
   :policy      :inference-precondition
   :tool-call   :attestation-capability-grant
   :agent       :inference-rule
   :fulfillment :judgment-emitter
   :role        :fact-asserter})

(defn step-label [kind]
  (get contract-kind->epistemic-role kind
       :unknown))
