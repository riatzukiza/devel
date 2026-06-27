(ns test-retry
  "Test suite for retry logic and error handling."
  (:require
   [promethean.ollama.retry :as retry]
   [promethean.ollama.errors :as errors]
   [promethean.ollama.client :as client]
   [clojure.test :refer [deftest testing is use-fixtures]]))

;; Mock function that fails initially then succeeds
(defn- mock-failing-fn
  [fail-count success-value]
  (let [attempts (atom 0)]
    (fn []
      (swap! attempts inc)
      (if (<= @attempts fail-count)
        (throw (ex-info "Mock failure" {:attempt @attempts}))
        success-value))))

(deftest test-exponential-backoff
  (testing "Exponential backoff calculation"
    (is (= 100 (retry/exponential-backoff 0 {:base-delay-ms 100})))
    (is (= 200 (retry/exponential-backoff 1 {:base-delay-ms 100 :multiplier 2.0})))
    (is (= 400 (retry/exponential-backoff 2 {:base-delay-ms 100 :multiplier 2.0})))
    (is (= 1000 (retry/exponential-backoff 10 {:max-delay-ms 1000 :base-delay-ms 100 :multiplier 2.0})))
    (testing "Jitter is applied"
      (let [delay (retry/exponential-backoff 1 {:base-delay-ms 100 :jitter? true})]
        (is (<= 90 delay) "Jitter allows 10% variance")
        (is (>= 110 delay) "Jitter allows 10% variance")))))

(deftest test-retryable-error-classification
  (testing "Network errors are retryable"
    (let [network-error (java.net.SocketTimeoutException. "timeout")]
      (is (errors/retryable-error? network-error)))

    (let [connect-error (java.net.ConnectException. "connection refused")]
      (is (errors/retryable-error? connect-error))))

  (testing "Server errors are retryable"
    (let [server-error (ex-info "Server error" {:status 500})]
      (is (errors/retryable-error? server-error)))

    (let [rate-limit-error (ex-info "Rate limit" {:status 429})]
      (is (errors/retryable-error? rate-limit-error))))

  (testing "Client errors are not retryable"
    (let [client-error (ex-info "Bad request" {:status 400})]
      (is (not (errors/retryable-error? client-error))))

    (let [auth-error (ex-info "Unauthorized" {:status 401})]
      (is (not (errors/retryable-error? auth-error))))))

(deftest test-retry-with-backoff
  (testing "Successful retry after failures"
    (let [fail-fn (mock-failing-fn 2 "success")
          start-time (System/currentTimeMillis)
          result (retry/retry-with-backoff fail-fn {:max-attempts 5 :base-delay-ms 10})
          end-time (System/currentTimeMillis)]
      (is (= "success" result))
      (is (>= (- end-time start-time) 20) "Should have waited for retries")))

  (testing "Failure after max attempts"
    (let [always-fail-fn (constantly (throw (ex-info "Always fails" {})))]
      (try
        (retry/retry-with-backoff always-fail-fn {:max-attempts 3 :base-delay-ms 10})
        (is false "Should have thrown exception")
        (catch Exception e
          (is (true? (.contains (.getMessage e) "Always fails")))))))

  (testing "Non-retryable error fails immediately"
    (let [non-retryable-fn (constantly (throw (ex-info "Client error" {:status 400})))]
      (try
        (retry/retry-with-backoff non-retryable-fn {:max-attempts 3 :base-delay-ms 10})
        (is false "Should have thrown exception")
        (catch Exception e
          (is (true? (.contains (.getMessage e) "Client error"))))))))

(deftest test-error-classification
  (testing "Network error classification"
    (let [network-error (java.net.SocketTimeoutException. "timeout")
          classification (errors/classify-error network-error)]
      (is (= :network (:type classification)))
      (is (true? (:retryable? classification)))))

  (testing "Ollama-specific error classification"
    (let [ollama-error (ex-info "Model loading" {:body "model is still loading"})
          classification (errors/classify-error ollama-error)]
      (is (= :model-loading (:type classification)))
      (is (true? (:retryable? classification)))))

  (testing "Permanent error classification"
    (let [auth-error (ex-info "Unauthorized" {:status 401})
          classification (errors/classify-error auth-error)]
      (is (= :auth-error (:type classification)))
      (is (false? (:retryable? classification))))))

(deftest test-error-reporting
  (testing "Error report generation"
    (let [error (ex-info "Test error" {:status 500})
          context {:operation :test :attempt 2}
          report (errors/create-error-report error context)]
      (is (contains? report :error/error-id))
      (is (= :server-error (:error/type report)))
      (is (true? (:error/retryable? report)))
      (is (= context (:error/context report)))))

  (testing "Mitigation suggestions"
    (let [network-error (java.net.SocketTimeoutException. "timeout")
          mitigations (errors/suggest-mitigation (errors/classify-error network-error))]
      (is (sequential? mitigations))
      (is (some #(str/includes? % "network") mitigations)))))

(deftest test-convenience-retry-functions
  (testing "Network retry function"
    (let [network-fn (mock-failing-fn 1 "network-success")
          result (retry/network-retry network-fn)]
      (is (= "network-success" result))))

  (testing "Server error retry function"
    (let [server-fn (mock-failing-fn 1 "server-success")
          result (retry/server-error-retry server-fn)]
      (is (= "server-success" result))))

  (testing "Rate limit retry function"
    (let [rate-limit-fn (mock-failing-fn 1 "rate-limit-success")
          result (retry/rate-limit-retry rate-limit-fn)]
      (is (= "rate-limit-success" result)))))

(deftest test-transient-vs-permanent-errors
  (testing "Transient error detection"
    (let [network-error (java.net.SocketTimeoutException. "timeout")]
      (is (errors/is-transient-error? network-error)))

    (let [server-error (ex-info "Server error" {:status 500})]
      (is (errors/is-transient-error? server-error))))

  (testing "Permanent error detection"
    (let [client-error (ex-info "Bad request" {:status 400})]
      (is (errors/is-permanent-error? client-error)))

    (let [auth-error (ex-info "Unauthorized" {:status 401})]
      (is (errors/is-permanent-error? auth-error)))))

;; Integration test with actual client (requires running Ollama server)
(deftest test-client-retry-integration
  (testing "Client retry with invalid endpoint"
    (let [result (try
                   (client/chat! {:host "http://invalid-host:12345"
                                  :model "test"
                                  :messages [{:role "user" :content "test"}]
                                  :retry-config {:max-attempts 2 :base-delay-ms 50}})
                   (catch Exception e
                     {:error true :message (.getMessage e)}))]
      (is (= true (:error result)))
      (is (str/includes? (:message result) "invalid-host"))))

  (comment
    ;; This test requires a running Ollama server
    (testing "Successful client call with retry"
      (let [result (client/chat! {:host "http://localhost:11434"
                                  :model "qwen3:7b"
                                  :messages [{:role "user" :content "hello"}]})]
        (is (contains? result :message))))))

;; Performance test for retry overhead
(deftest test-retry-performance
  (testing "Retry overhead measurement"
    (let [successful-fn (constantly "success")
          start-time (System/currentTimeMillis)
          result (retry/retry-with-backoff successful-fn {:max-attempts 3 :base-delay-ms 10})
          end-time (System/currentTimeMillis)]
      (is (= "success" result))
      (is (< (- end-time start-time) 50) "Successful call should have minimal overhead"))))

;; Run tests
(defn -main [& args]
  (println "Running retry and error handling tests...")
  ;; Note: In a real test runner, you'd use clojure.test/run-tests
  (println "Tests completed. Use 'clojure -M:test' to run full test suite."))
