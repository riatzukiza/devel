(ns opencode.ui.config-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [opencode.ui.config :as config]))

(use-fixtures :each
  (fn [f]
    (let [orig-env js/process.env]
      (set! (.-env js/process) (js-obj))
      (f)
      (set! (.-env js/process) orig-env))))

(deftest api-base-prefers-env
  (set! (.. js/process -env -OPENHAX_API_BASE) "https://example.test/api")
  (is (= "https://example.test/api" (config/api-base))))

(deftest ws-url-prefers-env
  (set! (.. js/process -env -OPENHAX_WS_URL) "wss://example.test/events")
  (is (= "wss://example.test/events" (config/ws-url))))

(deftest defaults-when-no-env
  (is (= "http://localhost:8787/api" (config/api-base)))
  (is (= "ws://localhost:8787/events" (config/ws-url)))
  (is (= 500 (config/ws-reconnect-ms))))
