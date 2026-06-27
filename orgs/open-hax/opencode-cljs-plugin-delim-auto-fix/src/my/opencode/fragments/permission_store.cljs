(ns my.opencode.fragments.permission-store
  (:require [my.opencode.perm :as perm]
            [my.opencode.state :as state]))

(defn fragment []
  {:init
   (fn [ctx]
     (state/set! ctx "permStore" (perm/make-store))
     nil)

   :hooks
   {"permission.replied"
    (fn [ctx payload]
      ;; reply shapes can vary; we accept:
      ;; - payload.reply.key / payload.reply.allow
      ;; - payload.key / payload.allow
      (let [reply (or (.-reply payload) payload)
            k     (or (.-key reply) (.-id reply))
            allow (.-allow reply)]
        (when (and k (or (= true allow) (= false allow)))
          (when-let [store (state/get ctx "permStore")]
            (perm/remember! store k allow)))))}})
