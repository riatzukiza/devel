(ns promethean.sys.cephalon-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.ecs.world :as world]
            [promethean.sys.cephalon :as cephalon]
            [promethean.memory.store :as ms]
            [promethean.eidolon.nexus-index :as ni]))

(defn- prepare-world []
  (-> (world/empty-world)
      (assoc :env {:stores {:mem (ms/make-store)
                            :nexus (ni/make-index)}})
      (cephalon/bootstrap-duck)))

(deftest sys-cephalon-idle-enqueues-llm
  (let [w0 (prepare-world)
        seid (first (world/entities-with w0 :session/name))
        evt {:event/type :fs.file/created
             :event/payload {:path "/tmp/note"}}
        w1 (world/update-entity w0 seid assoc :session/queue [evt])
        w2 (cephalon/sys-cephalon w1)
        s2 (world/get-entity w2 seid)
        eff (first (:effects w2))]
    (is (= :blocked (:session/status s2)))
    (is (= :llm/chat (:effect/type eff)))
    (is (= seid (get-in eff [:meta :session])))))

(deftest sys-cephalon-blocked-sends-report
  (let [w0 (prepare-world)
        seid (first (world/entities-with w0 :session/name))
        awaiting "eff-1"
        w1 (world/update-entity w0 seid assoc :session/status :blocked :session/awaiting awaiting)
        evt {:event/type :llm/chat.result
             :event/payload {:effect-id awaiting
                             :result {:choices [{:message {:content "ok"}}]}}}
        w2 (assoc w1 :events-in [evt])
        w3 (cephalon/sys-cephalon w2)
        s3 (world/get-entity w3 seid)
        eff (first (:effects w3))]
    (is (= :idle (:session/status s3)))
    (is (= :discord/send (:effect/type eff)))))
