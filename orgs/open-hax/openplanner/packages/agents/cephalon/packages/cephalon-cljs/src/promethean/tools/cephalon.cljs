(ns promethean.tools.cephalon
  (:require [promethean.tools.registry :as registry]
            [promethean.tools.discord :as discord]
            [promethean.tools.self :as self]))

(defn register-cephalon-tools
  [reg]
  (registry/register-tools
    reg
    [discord/discord-update-status-text
     discord/discord-update-profile
     self/self-set-desire
     self/self-set-mood
     self/self-add-aspiration
     self/self-add-goal
     self/self-add-interest
     self/self-remove-aspiration
     self/self-remove-goal
     self/self-remove-interest]))
