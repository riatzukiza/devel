(ns promethean.contracts.event-envelope-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.contracts.event-envelope :as env]))

(def sample-id "550e8400-e29b-41d4-a716-446655440000")
(def sample-call-id "9d1ee247-8136-4ca2-9f37-db6eeff360f2")
(def sample-ts 1706899200000)

(deftest cljs-internal-event->boundary-envelope
  (testing "Known CLJS event types map to canonical boundary strings"
    (let [envelope (env/to-boundary-envelope
                     {:event/id sample-id
                      :event/ts sample-ts
                      :event/type :discord.message/new
                      :event/session-id "c3-symbolic"
                      :event/source {:kind :discord}
                      :event/payload {:channel-id "343299242963763200"
                                      :content "quack"}}
                     {:cephalon-id "duck" :runtime-id "cljs-runtime-1"})]
      (is (= 1 (:schemaVersion envelope)))
      (is (= "discord.message.created" (:type envelope)))
      (is (= "c3-symbolic" (:sessionId envelope)))
      (is (= "duck" (:cephalonId envelope)))
      (is (= "cephalon-cljs" (get-in envelope [:source :package])))
      (is (= "discord" (get-in envelope [:source :surface]))))))

(deftest cljs-boundary-envelope->internal-event
  (testing "Canonical tool.result envelopes map back into CLJS event shape"
    (let [evt (env/from-boundary-envelope
                {:schemaVersion 1
                 :id sample-id
                 :type "tool.result"
                 :timestamp sample-ts
                 :sessionId "c3-symbolic"
                 :payload {:toolName "web.fetch"
                           :callId sample-call-id
                           :result {:ok true}}
                 :source {:package "cephalon-ts" :surface "tool"}})]
      (is (= :tool/result (:event/type evt)))
      (is (= sample-id (:event/id evt)))
      (is (= "c3-symbolic" (:event/session-id evt)))
      (is (= sample-call-id (get-in evt [:event/payload :callId]))))))

(deftest cljs-normalize-boundary-envelope-defaults-schema
  (testing "Legacy envelopes without schemaVersion are normalized"
    (let [envelope (env/normalize-boundary-envelope
                     {:id sample-id
                      :type "system.tick"
                      :timestamp sample-ts
                      :payload {:scheduleId "cephalon:c3-symbolic:tick"
                                :tickNumber 3}})]
      (is (true? (env/boundary-envelope? envelope)))
      (is (= 1 (:schemaVersion envelope)))
      (is (= "cephalon:c3-symbolic:tick" (get-in envelope [:trace :scheduleId]))))))