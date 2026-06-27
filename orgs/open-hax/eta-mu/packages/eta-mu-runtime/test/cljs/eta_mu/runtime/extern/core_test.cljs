(ns eta-mu.runtime.extern.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.extern.http :as http]
            [eta-mu.runtime.extern.js :as extern-js]
            [eta-mu.runtime.extern.json :as json]
            [eta-mu.runtime.extern.process :as process]
            [eta-mu.runtime.extern.time :as time]
            [eta-mu.runtime.infra.boundary :as boundary]))

(deftest js-boundary-roundtrip-test
  (testing "JS extern converts values at a named boundary"
    (let [value (extern-js/value->clj #js {:alpha 1 :nested #js {:beta true}})
          encoded (extern-js/clj->value {:items [1 2]})]
      (is (= {:alpha 1 :nested {:beta true}} value))
      (is (= [1 2] (extern-js/value->clj (.-items encoded)))))))

(deftest time-boundary-test
  (testing "time extern validates timestamps before domain code receives them"
    (is (= 1780099200000 (time/timestamp-ms "2026-05-30T00:00:00.000Z")))
    (is (number? (time/now-ms)))
    (is (thrown? js/Error (time/timestamp-ms "not-a-date")))))

(deftest json-boundary-test
  (testing "json extern returns normalized parse results"
    (let [encoded (json/stringify {:ok true :items [1 2]})
          parsed (json/parse encoded)
          invalid (json/parse "{not json")]
      (is (:ok parsed))
      (is (= {:ok true :items [1 2]} (:value parsed)))
      (is (false? (:ok invalid)))
      (is (= :json (:boundary invalid))))))

(deftest http-boundary-test
  (testing "http extern builds an opaque fetch init from a CLJS request map"
    (let [init (http/request->fetch-init {:url "https://example.test/api"
                                          :method :post
                                          :headers {"authorization" "Bearer token"}
                                          :json {:query "eta"}})
          decoded (extern-js/value->clj init)]
      (is (= "POST" (:method decoded)))
      (is (= "application/json" (get-in decoded [:headers :content-type])))
      (is (= "Bearer token" (get-in decoded [:headers :authorization])))
      (is (= {:query "eta"} (:value (json/parse (:body decoded))))))))

(deftest process-boundary-test
  (testing "process extern exposes argv/cwd/env as validated CLJS data"
    (let [snapshot (process/snapshot)]
      (is (vector? (:argv snapshot)))
      (is (string? (:cwd snapshot)))
      (is (map? (:env snapshot))))))

(deftest boundary-inventory-test
  (testing "infra boundary inventory separates implemented from planned adapters"
    (let [{:keys [implemented planned]} (boundary/boundary-inventory)]
      (is (some #(= :js (:boundary %)) implemented))
      (is (some #(= :http (:boundary %)) implemented))
      (is (some #(= :git (:boundary %)) planned))
      (is (boundary/validate-result (extern-js/success :json {:a 1}))))))
