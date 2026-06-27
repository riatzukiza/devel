(ns promethean.sys.route
  (:require [promethean.ecs.world :as world]))

(defn- matches-filter? [evt flt]
  (and (= (:event/type evt) (:event/type flt))
       (or (nil? (:discord/channel-id flt))
           (= (get-in evt [:event/source :channel-id])
              (:discord/channel-id flt)))))

(defn- session-wants? [session evt]
  (let [subs (:session/subscriptions session)
        filters (get-in subs [:filters] [])]
    (some #(matches-filter? evt %) filters)))

(defn sys-route-events->sessions [w]
  (let [session-eids (world/entities-with w [:session/name :session/subscriptions :session/queue])
        events (:events-in w)]
    (reduce
      (fn [w eid]
        (let [s (world/get-entity w eid)
              wanted (filter #(session-wants? s %) events)]
          (if (seq wanted)
            (world/update-entity w eid update :session/queue into (vec wanted))
            w)))
      w
      session-eids)))
