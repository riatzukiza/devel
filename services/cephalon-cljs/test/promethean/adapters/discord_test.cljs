(ns promethean.adapters.discord-test
  (:require [cljs.test :refer-macros [deftest is testing async]]
            [promethean.adapters.discord :as discord]))

(deftest start-discord-emits-ready-event
  (let [handlers (atom {})
        client (js-obj)
        _ (set! (.-on client)
                (fn [evt handler]
                  (swap! handlers assoc evt handler)
                  client))
        _ (set! (.-login client) (fn [_token] (js/Promise.resolve true)))
        ready? (atom false)
        world* (atom {:events-out []})]
    (discord/start-discord! {:client client :token "token" :ready? ready?} world*)
    ((get @handlers "ready"))
    (is (true? @ready?))
    (is (= :discord/client.ready (get-in @world* [:events-out 0 :event/type])))))

(deftest send-message-rejects-when-not-ready
  (async done
    (let [client (js-obj)
          ready? (atom false)]
      (-> (discord/send-message! {:client client :ready? ready?} "chan" "hi")
          (.then (fn [_] (is false "expected rejection"))
                 (fn [err]
                   (is (= "discord client not ready" (.-message err)))
                   (done)))))))

(deftest send-message-when-ready
  (async done
    (let [channel (js-obj)
          _ (set! (.-send channel) (fn [_content] (js/Promise.resolve true)))
          channels (js-obj)
          _ (set! (.-fetch channels) (fn [_channel-id] (js/Promise.resolve channel)))
          client (js-obj)
          _ (set! (.-channels client) channels)
          ready? (atom true)]
      (-> (discord/send-message! {:client client :ready? ready?} "chan" "hi")
          (.then (fn [_]
                   (is true)
                   (done)))))))
