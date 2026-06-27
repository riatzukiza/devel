(ns promethean.contracts.event-envelope-test
  (:require [clojure.test :as t]
            [promethean.contracts.event-envelope :as env]))

(def sample-id "550e8400-e29b-41d4-a716-446655440000")
(def sample-call-id "9d1ee247-8136-4ca2-9f37-db6eeff360f2")
(def sample-ts 1706899200000)

(t/deftest clj-internal-event->boundary-envelope
  (let [envelope (env/to-boundary-envelope
                   {:event/id sample-id
                    :event/ts sample-ts
                    :event/type :discord/message-created
                    :event/session-id "main"
                    :event/source {:kind :discord}
                    :event/payload {:discord/content "quack"}}
                   {:cephalon-id "duck" :runtime-id "jvm-runtime-1"})]
    (t/is (= 1 (:schemaVersion envelope)))
    (t/is (= "discord.message.created" (:type envelope)))
    (t/is (= "main" (:sessionId envelope)))
    (t/is (= "cephalon-clj" (get-in envelope [:source :package])))))

(t/deftest clj-boundary-envelope->internal-event
  (let [evt (env/from-boundary-envelope
              {:schemaVersion 1
               :id sample-id
               :type "tool.result"
               :timestamp sample-ts
               :sessionId "main"
               :payload {:toolName "web.fetch"
                         :callId sample-call-id
                         :result {:ok true}}
               :source {:package "cephalon-ts" :surface "tool"}})]
    (t/is (= :tool/result (:event/type evt)))
    (t/is (= sample-id (:event/id evt)))
    (t/is (= "main" (:event/session-id evt)))
    (t/is (= sample-call-id (get-in evt [:event/payload :callId])))))

(t/deftest clj-normalize-boundary-envelope-defaults-schema
  (let [envelope (env/normalize-boundary-envelope
                   {:id sample-id
                    :type "system.tick"
                    :timestamp sample-ts
                    :payload {:scheduleId "cephalon:main:tick"
                              :tickNumber 5}})]
    (t/is (true? (env/boundary-envelope? envelope)))
    (t/is (= 1 (:schemaVersion envelope)))
    (t/is (= "cephalon:main:tick" (get-in envelope [:trace :scheduleId])))))