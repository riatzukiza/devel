(ns promethean.sys.route-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.ecs.world :as world]
            [promethean.sys.route :as route]))

(deftest test-route-events->sessions
  (testing "routing events to session queues"
    (let [world (-> (world/empty-world)
                    (world/add-entity :session-1
                                      {:session/name "session-1"
                                       :session/subscriptions {:filters [{:event/type :test/event
                                                                          :discord/channel-id "123"}]}
                                       :session/queue []})
                    (world/add-entity :session-2
                                      {:session/name "session-2"
                                       :session/subscriptions {:filters [{:event/type :test/event}]}
                                       :session/queue []})
                    (assoc :events-in [{:event/type :test/event
                                        :event/source {:channel-id "123"}
                                        :data "match-both"}
                                       {:event/type :test/event
                                        :event/source {:channel-id "456"}
                                        :data "match-only-session-2"}
                                       {:event/type :other/event
                                        :data "match-none"}]))
          updated-world (route/sys-route-events->sessions world)
          s1 (world/get-entity updated-world :session-1)
          s2 (world/get-entity updated-world :session-2)]
      
      (is (= 1 (count (:session/queue s1))) "Session 1 should have 1 event")
      (is (= "match-both" (:data (first (:session/queue s1)))))
      
      (is (= 2 (count (:session/queue s2))) "Session 2 should have 2 events")
      (is (= "match-both" (:data (first (:session/queue s2)))))
      (is (= "match-only-session-2" (:data (second (:session/queue s2))))))))
