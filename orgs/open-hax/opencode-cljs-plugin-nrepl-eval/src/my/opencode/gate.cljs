(ns my.opencode.gate
  (:require [my.opencode.state :as state]
            [my.opencode.perm :as perm]))

(defn require!
  "Require permission for an action. Throws to stop execution if not allowed."
  [ctx {:keys [kind tool detail message]}]
  (let [store (state/get ctx "permStore")
        k     (perm/key-for {:kind kind :tool tool :detail detail})]
    (when-not store
      (throw (js/Error. "permStore missing (include permission-store fragment)")))
    (cond
      (perm/allowed? store k)
      nil

      (perm/denied? store k)
      (throw (js/Error. (str "Permission denied: " (or message detail))))

      :else
      (throw (js/Error.
              (str "Permission required: " (or message detail)
                   "\nPermission key: " k))))))
