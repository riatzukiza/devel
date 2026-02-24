;; ==========================================================================
;; E2E tests for TS bridge activation from CLJS runtime
;; ==========================================================================

(ns promethean.e2e.ts-bridge-test
  (:require [cljs.test :refer-macros [deftest is testing async]]
            [promethean.main :as main]
            [promethean.bridge.cephalon-ts :as bridge]))

(deftest start-ts-bridge-disabled-does-nothing
  (testing "When :start-ts-bridge is false, no TS app is created"
    (let [create-count (atom 0)
          start-count (atom 0)
          config {:runtime {:start-ts-bridge false
                            :tick-ms 250}
                  :discord {:bot-token "test-token"}}]
      (with-redefs [bridge/create-cephalon-app!
                    (fn [_]
                      (swap! create-count inc)
                      (js/Promise.resolve #js {}))
                    bridge/start-cephalon!
                    (fn [_]
                      (swap! start-count inc))]
        (main/start-ts-bridge! config)
        (is (= 0 @create-count))
        (is (= 0 @start-count))))))

(deftest start-ts-bridge-enabled-starts-app
  (async done
    (testing "When :start-ts-bridge is true, create/start are called with options"
      (let [create-count (atom 0)
            start-count (atom 0)
            captured (atom nil)
            config {:runtime {:start-ts-bridge true
                              :tick-ms 123}
                    :discord {:bot-token "test-token"}}]
        (with-redefs [bridge/create-cephalon-app!
                      (fn [opts]
                        (reset! captured opts)
                        (swap! create-count inc)
                        (js/Promise.resolve #js {}))
                      bridge/start-cephalon!
                      (fn [_]
                        (swap! start-count inc))]
          (-> (main/start-ts-bridge! config)
              (.then (fn [_]
                       (is (= 1 @create-count))
                       (is (= 1 @start-count))
                       (is (= "test-token" (.-discordToken @captured)))
                       (is (= true (.-enableProactiveLoop @captured)))
                       (is (= 123 (.-tickIntervalMs @captured)))))
              (.catch (fn [err]
                        (is false (str "Unexpected error: " err))))
              (.finally (fn [] (done)))))))))
