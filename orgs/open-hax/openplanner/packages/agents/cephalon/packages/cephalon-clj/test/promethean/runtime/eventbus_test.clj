(ns promethean.runtime.eventbus-test
  (:require [clojure.core.async :as a]
            [clojure.test :as t]
            [promethean.runtime.eventbus :as bus]))

(def sample-id "550e8400-e29b-41d4-a716-446655440000")
(def sample-call-id "9d1ee247-8136-4ca2-9f37-db6eeff360f2")
(def sample-ts 1706899200000)

(defn- await!!
  [ch]
  (let [[value port] (a/alts!! [ch (a/timeout 250)])]
    (when-not (= port ch)
      (throw (ex-info "Timed out waiting for core.async value" {})))
    value))

(t/deftest emit-boundary!-converts-envelope-into-internal-event
  (let [runtime-bus (-> (bus/make-bus 8) bus/start-dispatcher!)
        {:keys [ch]} (bus/subscribe! runtime-bus #(= (:event/type %) :tool/result))]
    (bus/emit-boundary! runtime-bus
                        {:schemaVersion 1
                         :id sample-id
                         :type "tool.result"
                         :timestamp sample-ts
                         :sessionId "main"
                         :payload {:toolName "web.fetch"
                                   :callId sample-call-id
                                   :result {:ok true}}
                         :source {:package "cephalon-ts"
                                  :surface "tool"}})
    (let [event (await!! ch)]
      (t/is (= :tool/result (:event/type event)))
      (t/is (= "main" (:event/session-id event)))
      (t/is (= sample-call-id (get-in event [:event/payload :callId]))))))

(t/deftest subscribe-boundary!-converts-internal-events-into-canonical-envelopes
  (let [runtime-bus (-> (bus/make-bus 8) bus/start-dispatcher!)
        {:keys [ch]} (bus/subscribe-boundary! runtime-bus #(= (:type %) "tool.result"))]
    (bus/emit! runtime-bus
               {:event/id sample-id
                :event/ts sample-ts
                :event/type :tool/result
                :event/session-id "main"
                :event/source {:kind :tool}
                :event/payload {:toolName "web.fetch"
                                :callId sample-call-id
                                :result {:ok true}}})
    (let [envelope (await!! ch)]
      (t/is (= 1 (:schemaVersion envelope)))
      (t/is (= "tool.result" (:type envelope)))
      (t/is (= "main" (:sessionId envelope)))
      (t/is (= "cephalon-clj" (get-in envelope [:source :package])))
      (t/is (= sample-call-id (get-in envelope [:trace :callId]))))))

(t/deftest subscribe-boundary!-can-filter-on-canonical-envelope-shape
  (let [runtime-bus (-> (bus/make-bus 8) bus/start-dispatcher!)
        {:keys [ch]} (bus/subscribe-boundary! runtime-bus #(= (:type %) "system.tick"))]
    (bus/emit! runtime-bus
               {:event/id sample-id
                :event/ts sample-ts
                :event/type :tool/result
                :event/session-id "main"
                :event/payload {:toolName "web.fetch"
                                :callId sample-call-id
                                :result {:ok true}}})
    (let [[value port] (a/alts!! [ch (a/timeout 100)])]
      (t/is (nil? value))
      (t/is (not= port ch) "Filtered boundary subscription should not receive unmatched envelope"))))