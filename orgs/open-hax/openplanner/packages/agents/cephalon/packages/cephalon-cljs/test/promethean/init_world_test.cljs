(ns promethean.init-world-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.main :as main]
            [promethean.ecs.world :as world]))

(deftest init-world-seeds-cephalon-and-janitor
  (testing "init-world creates cephalon and janitor session"
    (let [env {:config {} :clients {} :adapters {}}
          w (main/init-world env)
          entities (:entities w)
          ceph-eid (first (keep (fn [[eid entity]]
                                  (when (= "Duck" (:cephalon/name entity))
                                    eid))
                                (:entities w)))
          ceph (world/get-entity w ceph-eid)]
      (is (some? ceph) "Cephalon entity should exist")
      (is (= "Duck" (:cephalon/name ceph)) "Cephalon name should be Duck")
      (is (seq (:cephalon/sessions ceph)) "Cephalon should reference sessions")
      (let [session-id (first (:cephalon/sessions ceph))
            session (world/get-entity w session-id)]
        (is (some? session) "Session entity should exist")
        (is (= "janitor" (:session/name session)) "Session should be named janitor")
        (is (= :idle (:session/status session)) "Session should start idle")
        (is (= 4 (count (get-in session [:session/subscriptions :filters])))
            "Janitor should have four channel filters")
        (is (= entities (:entities w)) "World should retain entities map")))))
