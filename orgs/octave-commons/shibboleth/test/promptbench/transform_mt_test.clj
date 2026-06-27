(ns promptbench.transform-mt-test
  "Tests for MT transform proxy integration.

   Fulfills: VAL-XFORM-005 (MT proxy integration).

   Tests written FIRST per TDD methodology.

   NOTE:
   Historically these tests were written as live integration tests against the
   local proxy at 127.0.0.1:8789.

   For determinism and to avoid coupling the test suite to an external running
   service, we now stub `clj-http.client/post` and assert on the request shape
   (temperature=0, seed present, etc.) while returning a fake translation.
   This still validates the contract of the MT transform." 
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.string :as str]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [promptbench.transform.core :as core]
            [promptbench.transform.registry :as registry]
            [promptbench.transform.mt :as mt]))

;; ============================================================
;; Fixture: Reset registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (registry/reset!)
    (f)))

;; Test model — use one that's reliably available through the proxy.
(def ^:private test-model "glm-5")

;; ============================================================
;; Test stub: fake proxy
;; ============================================================

(defonce ^:private last-request* (atom nil))

(defn- fake-translation
  [target-lang text]
  (str "[" (name target-lang) "] " (or text "")))

(defn- with-fake-proxy
  "Execute f with clj-http POST calls stubbed to a deterministic fake.

   Records the last request body in `last-request*`." 
  [f]
  (reset! last-request* nil)
  (with-redefs
    [mt/get-auth-token (fn [] "test-token")
     http/post
     (fn [url {:keys [body] :as opts}]
       (let [req (json/parse-string (str body) true)
             target-lang
             ;; derive from system prompt text; we only need it for deterministic output
             (let [sys (get-in req [:messages 0 :content] "")]
               (cond
                 (str/includes? sys "Spanish") :es
                 (str/includes? sys "French") :fr
                 (str/includes? sys "German") :de
                 (str/includes? sys "Japanese") :ja
                 :else :xx))
             in-text (get-in req [:messages 1 :content] "")
             out-text (fake-translation target-lang in-text)
             resp-body (json/generate-string
                         {:id "fake"
                          :model (:model req)
                          :choices [{:index 0
                                     :message {:role "assistant" :content out-text}
                                     :finish_reason "stop"}]})]
         (reset! last-request* {:url url :opts (dissoc opts :body) :request req})
         ;; Simulate the real proxy response shape expected by translate-via-proxy
         {:status 200 :body resp-body :headers {}}))]
    (f)))

;; ============================================================
;; Helper: Register MT transform
;; ============================================================

(defn- register-mt-transform! []
  (registry/register-transform!
    :mt
    {:description   "Machine translation to target language"
     :type          :linguistic
     :deterministic false
     :reversible    :approximate
     :params-spec   {:target-lang {:type :keyword :required true}
                     :engine {:type :keyword :default :glm-5}}
     :provenance    [:engine :target-lang :model-version :timestamp]
     :impl          mt/apply-mt}))

;; ============================================================
;; VAL-XFORM-005: MT proxy integration
;; ============================================================

(deftest mt-output-validity-test
  (testing "MT produces non-empty text different from input with canonical shape"
    (with-fake-proxy
      (fn []
        (register-mt-transform!)
        (let [result (core/execute-transform
                       :mt
                       "How do I hack a computer system?"
                       {:target-lang :es :engine (keyword test-model) :throttle-ms 0 :retry-max 0}
                       42)]
          (is (map? result) "Result should be a map")
          (is (string? (:text result)) "Result should have :text string")
          (is (map? (:metadata result)) "Result should have :metadata map")
          (is (not (str/blank? (:text result))) "Text should be non-empty")
          (is (not= "How do I hack a computer system?" (:text result))
              "Text should differ from input"))))))

(deftest mt-sends-temperature-zero-and-seed-test
  (testing "MT sends temperature=0 and seed to proxy for reproducibility"
    ;; MT implementation always sends temperature=0 and seed in the request body.
    ;; We verify this by checking the translation succeeds (correct request format)
    ;; and the result contains the seed in metadata.
    (with-fake-proxy
      (fn []
        (register-mt-transform!)
        (let [result (mt/apply-mt {:text "Test prompt"
                                   :config {:target-lang :fr
                                            :engine (keyword test-model)
                                            :throttle-ms 0
                                            :retry-max 0}
                                   :seed 1337})]
          (is (map? result))
          (is (some? (:text result)))
          (is (= 1337 (get-in result [:metadata :seed]))
              "Seed should be recorded in metadata")
          (is (= 0 (get-in @last-request* [:request :temperature]))
              "temperature must be 0")
          (is (= 1337 (get-in @last-request* [:request :seed]))
              "seed must be present"))))))

(deftest mt-deterministic-false-documented-test
  (testing "MT is documented as :deterministic false"
    (register-mt-transform!)
    (let [t (registry/get-transform :mt)]
      (is (= false (:deterministic t))
          "MT should be documented as non-deterministic"))))

(deftest mt-tier1-languages-test
  (testing "Tier-1 languages produce valid translations"
    (with-fake-proxy
      (fn []
        (register-mt-transform!)
        (doseq [lang [:es :fr :de]]
          (let [result (core/execute-transform
                         :mt
                         "Hello, how are you?"
                         {:target-lang lang :engine (keyword test-model) :throttle-ms 0 :retry-max 0}
                         42)]
            (is (not (str/blank? (:text result)))
                (str "Translation to " (name lang) " should produce non-empty text"))
            (is (not= "Hello, how are you?" (:text result))
                (str "Translation to " (name lang) " should differ from input"))))))))

(deftest mt-metadata-contains-provenance-test
  (testing "MT metadata contains provenance fields"
    (with-fake-proxy
      (fn []
        (register-mt-transform!)
        (let [result (core/execute-transform
                       :mt "Test prompt" {:target-lang :ja :engine (keyword test-model) :throttle-ms 0 :retry-max 0} 42)]
          (is (contains? (:metadata result) :target-lang))
          (is (= :ja (get-in result [:metadata :target-lang]))))))))

(deftest mt-proxy-error-handling-test
  (testing "Proxy unavailability produces domain-specific error"
    ;; Use a bad port to simulate unavailability.
    ;; We stub the HTTP client to throw, and set retry-max=0 to fail fast.
    (with-redefs
      [mt/get-auth-token (fn [] "test-token")
       http/post (fn [_url _opts]
                   (throw (ex-info "connection refused" {:type :io})))]
      (register-mt-transform!)
      (is (thrown? clojure.lang.ExceptionInfo
            (mt/apply-mt {:text "Test"
                          :config {:target-lang :es
                                   :proxy-url "http://127.0.0.1:19999/v1/chat/completions"
                                   :retry-max 0
                                   :throttle-ms 0}
                          :seed 42}))))))
