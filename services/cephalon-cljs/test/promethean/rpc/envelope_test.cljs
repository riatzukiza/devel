;; ============================================================================
;; Tests for promethean.rpc.envelope
;;
;; These tests verify the Redis RPC envelope schema, constructors,
;; and validation helpers.
;; ============================================================================

(ns promethean.rpc.envelope-test
  "Tests for promethean.rpc.envelope"
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.rpc.envelope :as env]))

;; ============================================================================
;; Test Fixtures / Helpers
;; ============================================================================

(def valid-uuid "550e8400-e29b-41d4-a716-446655440000")

(def sample-timestamp 1706899200000)

;; ============================================================================
;; Tests: UUID Validation
;; ============================================================================

(deftest uuid-string?-valid-uuid
  "Test: uuid-string? returns true for valid UUIDs"

  (testing "Valid UUID format is recognized"
    (is (true? (env/uuid-string? valid-uuid))
        "Standard UUID format should be valid")))

(deftest uuid-string?-invalid-uuid
  "Test: uuid-string? returns false for invalid UUIDs"

  (testing "Invalid UUID formats are rejected"
    (is (false? (env/uuid-string? "not-a-uuid"))
        "Random string should be invalid")
    (is (false? (env/uuid-string? "550e8400-e29b-41d4-a716"))
        "Truncated UUID should be invalid")
    (is (false? (env/uuid-string? ""))
        "Empty string should be invalid")
    (is (false? (env/uuid-string? nil))
        "Nil should be invalid")
    (is (false? (env/uuid-string? 12345))
        "Number should be invalid")))

;; ============================================================================
;; Tests: make-request constructor
;; ============================================================================

(deftest make-request-with-defaults
  "Test: make-request creates valid request with defaults"

  (let [req (env/make-request :memory/store {:content "test"})]
    (is (= 1 (:rpc/v req))
        "Version should be 1")
    (is (env/uuid-string? (:rpc/id req))
        "ID should be a valid UUID")
    (is (pos? (:rpc/ts req))
        "Timestamp should be positive")
    (is (= :req (:rpc/kind req))
        "Kind should be :req")
    (is (= :memory/store (:rpc/op req))
        "Operation should match")
    (is (= {:content "test"} (:rpc/payload req))
        "Payload should match")
    (is (nil? (:rpc/meta req))
        "Meta should be nil by default")))

(deftest make-request-with-options
  "Test: make-request accepts custom options"

  (let [req (env/make-request :session/list {}
                              {:id valid-uuid
                               :ts sample-timestamp
                               :meta {:source "test"}})]
    (is (= valid-uuid (:rpc/id req))
        "Custom ID should be used")
    (is (= sample-timestamp (:rpc/ts req))
        "Custom timestamp should be used")
    (is (= {:source "test"} (:rpc/meta req))
        "Custom meta should be used")))

;; ============================================================================
;; Tests: make-response-ok constructor
;; ============================================================================

(deftest make-response-ok-with-defaults
  "Test: make-response-ok creates valid response with defaults"

  (let [resp (env/make-response-ok valid-uuid {:success true})]
    (is (= 1 (:rpc/v resp))
        "Version should be 1")
    (is (= valid-uuid (:rpc/id resp))
        "ID should match request")
    (is (pos? (:rpc/ts resp))
        "Timestamp should be positive")
    (is (= :res (:rpc/kind resp))
        "Kind should be :res")
    (is (true? (:rpc/ok resp))
        "OK should be true")
    (is (= {:success true} (:rpc/result resp))
        "Result should match")))

(deftest make-response-ok-with-options
  "Test: make-response-ok accepts custom options"

  (let [resp (env/make-response-ok valid-uuid {:data "value"}
                                   {:ts sample-timestamp
                                    :meta {:cache true}})]
    (is (= sample-timestamp (:rpc/ts resp))
        "Custom timestamp should be used")
    (is (= {:cache true} (:rpc/meta resp))
        "Custom meta should be used")))

;; ============================================================================
;; Tests: make-response-error constructor
;; ============================================================================

(deftest make-response-error-with-defaults
  "Test: make-response-error creates valid error response"

  (let [resp (env/make-response-error valid-uuid :not-found "Memory not found")]
    (is (= 1 (:rpc/v resp))
        "Version should be 1")
    (is (= valid-uuid (:rpc/id resp))
        "ID should match request")
    (is (pos? (:rpc/ts resp))
        "Timestamp should be positive")
    (is (= :res (:rpc/kind resp))
        "Kind should be :res")
    (is (false? (:rpc/ok resp))
        "OK should be false")
    (is (= :not-found (get-in resp [:rpc/error :code]))
        "Error code should match")
    (is (= "Memory not found" (get-in resp [:rpc/error :message]))
        "Error message should match")
    (is (nil? (get-in resp [:rpc/error :data]))
        "Error data should be nil by default")))

(deftest make-response-error-with-data
  "Test: make-response-error includes error data when provided"

  (let [resp (env/make-response-error valid-uuid :validation-failed
                                      "Invalid input"
                                      {:data {:field :name :reason :required}})]
    (is (= :validation-failed (get-in resp [:rpc/error :code]))
        "Error code should match")
    (is (= {:field :name :reason :required} (get-in resp [:rpc/error :data]))
        "Error data should match")))

;; ============================================================================
;; Tests: valid-envelope? validation
;; ============================================================================

(deftest valid-envelope?-valid-request
  "Test: valid-envelope? returns true for valid request"

  (let [req (env/make-request :memory/store {:content "test"})]
    (is (true? (env/valid-envelope? req))
        "Valid request should pass validation")))

(deftest valid-envelope?-valid-ok-response
  "Test: valid-envelope? returns true for valid success response"

  (let [resp (env/make-response-ok valid-uuid {:success true})]
    (is (true? (env/valid-envelope? resp))
        "Valid success response should pass validation")))

(deftest valid-envelope?-valid-error-response
  "Test: valid-envelope? returns true for valid error response"

  (let [resp (env/make-response-error valid-uuid :not-found "Not found")]
    (is (true? (env/valid-envelope? resp))
        "Valid error response should pass validation")))

(deftest valid-envelope?-missing-rpc-id
  "Test: valid-envelope? returns false for missing :rpc/id"

  (let [invalid-req {:rpc/v 1
                     :rpc/ts sample-timestamp
                     :rpc/kind :req
                     :rpc/op :memory/store
                     :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid-req))
        "Missing :rpc/id should fail validation")))

(deftest valid-envelope?-invalid-rpc-kind
  "Test: valid-envelope? returns false for invalid :rpc/kind"

  (let [invalid-req {:rpc/v 1
                     :rpc/id valid-uuid
                     :rpc/ts sample-timestamp
                     :rpc/kind :invalid
                     :rpc/op :memory/store
                     :rpc/payload {}
                     :rpc/ok true
                     :rpc/result {}}]
    (is (false? (env/valid-envelope? invalid-req))
        "Invalid :rpc/kind should fail validation")))

(deftest valid-envelope?-missing-version
  "Test: valid-envelope? returns false for missing version"

  (let [invalid-req {:rpc/id valid-uuid
                     :rpc/ts sample-timestamp
                     :rpc/kind :req
                     :rpc/op :memory/store
                     :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid-req))
        "Missing version should fail validation")))

(deftest valid-envelope?-non-positive-timestamp
  "Test: valid-envelope? returns false for non-positive timestamp"

  (let [invalid-req {:rpc/v 1
                     :rpc/id valid-uuid
                     :rpc/ts 0
                     :rpc/kind :req
                     :rpc/op :memory/store
                     :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid-req))
        "Zero timestamp should fail validation")))

(deftest valid-envelope?-non-map-payload
  "Test: valid-envelope? returns false for non-map payload"

  (let [invalid-req {:rpc/v 1
                     :rpc/id valid-uuid
                     :rpc/ts sample-timestamp
                     :rpc/kind :req
                     :rpc/op :memory/store
                     :rpc/payload "not-a-map"}]
    (is (false? (env/valid-envelope? invalid-req))
        "String payload should fail validation")))

;; ============================================================================
;; Tests: request? predicate
;; ============================================================================

(deftest request?-valid-request
  "Test: request? returns true for valid request"

  (let [req (env/make-request :memory/store {:content "test"})]
    (is (true? (env/request? req))
        "Valid request should return true")))

(deftest request?-response-is-not-request
  "Test: request? returns false for response"

  (let [resp (env/make-response-ok valid-uuid {})]
    (is (false? (env/request? resp))
        "Response should return false")))

;; ============================================================================
;; Tests: response? predicate
;; ============================================================================

(deftest response?-valid-response
  "Test: response? returns true for valid response"

  (let [resp (env/make-response-ok valid-uuid {})]
    (is (true? (env/response? resp))
        "Valid response should return true")))

(deftest response?-request-is-not-response
  "Test: response? returns false for request"

  (let [req (env/make-request :memory/store {})]
    (is (false? (env/response? req))
        "Request should return false")))

;; ============================================================================
;; Tests: response-ok? predicate
;; ============================================================================

(deftest response-ok?-success-response
  "Test: response-ok? returns true for success response"

  (let [resp (env/make-response-ok valid-uuid {:data "value"})]
    (is (true? (env/response-ok? resp))
        "Success response should return true")))

(deftest response-ok?-error-response
  "Test: response-ok? returns false for error response"

  (let [resp (env/make-response-error valid-uuid :error "Failed")]
    (is (false? (env/response-ok? resp))
        "Error response should return false")))

;; ============================================================================
;; Tests: response-error? predicate
;; ============================================================================

(deftest response-error?-error-response
  "Test: response-error? returns true for error response"

  (let [resp (env/make-response-error valid-uuid :not-found "Not found")]
    (is (true? (env/response-error? resp))
        "Error response should return true")))

(deftest response-error?-success-response
  "Test: response-error? returns false for success response"

  (let [resp (env/make-response-ok valid-uuid {:success true})]
    (is (false? (env/response-error? resp))
        "Success response should return false")))

;; ============================================================================
;; Tests: Accessors
;; ============================================================================

(deftest envelope-id-returns-id
  "Test: envelope-id returns the ID from an envelope"

  (let [req (env/make-request :test {})
        resp (env/make-response-ok (env/envelope-id req) {})]
    (is (= (env/envelope-id req) (env/envelope-id resp))
        "Response ID should match request ID")))

(deftest envelope-operation-returns-op
  "Test: envelope-operation returns the operation"

  (let [req (env/make-request :memory/store {})]
    (is (= :memory/store (env/envelope-operation req))
        "Operation should match")))

(deftest envelope-payload-returns-payload
  "Test: envelope-payload returns the payload"

  (let [payload {:key "value"}
        req (env/make-request :test payload)]
    (is (= payload (env/envelope-payload req))
        "Payload should match")))

(deftest envelope-result-returns-result
  "Test: envelope-result returns the result from response"

  (let [result {:data "test"}
        resp (env/make-response-ok valid-uuid result)]
    (is (= result (env/envelope-result resp))
        "Result should match")))

(deftest envelope-error-returns-error
  "Test: envelope-error returns the error map"

  (let [error {:code :not-found :message "Not found"}
        resp (env/make-response-error valid-uuid :not-found "Not found")]
    (is (= error (select-keys (env/envelope-error resp) [:code :message]))
        "Error should match")))

(deftest envelope-error-code-returns-code
  "Test: envelope-error-code returns just the code"

  (let [resp (env/make-response-error valid-uuid :validation-failed "Invalid")]
    (is (= :validation-failed (env/envelope-error-code resp))
        "Error code should match")))

(deftest envelope-error-message-returns-message
  "Test: envelope-error-message returns just the message"

  (let [resp (env/make-response-error valid-uuid :error "Something went wrong")]
    (is (= "Something went wrong" (env/envelope-error-message resp))
        "Error message should match")))

;; ============================================================================
;; Tests: Error Detail Maps
;; ============================================================================

(deftest validate-envelope-returns-error-map
  "Test: validate-envelope returns detailed error map"

  (let [invalid {:rpc/v "not-an-int"
                 :rpc/id "not-a-uuid"
                 :rpc/ts -1
                 :rpc/kind :invalid
                 :rpc/op "not-a-keyword"
                 :rpc/payload 123
                 :rpc/ok "not-a-boolean"}
        errors (env/validate-envelope invalid)]
    (is (map? errors)
        "Should return a map")
    (is (contains? errors :rpc/v)
        "Should report version error")
    (is (contains? errors :rpc/id)
        "Should report ID error")
    (is (contains? errors :rpc/ts)
        "Should report timestamp error")
    (is (contains? errors :rpc/kind)
        "Should report kind error")
    (is (contains? errors :rpc/op)
        "Should report operation error")
    (is (contains? errors :rpc/payload)
        "Should report payload error")
    (is (contains? errors :rpc/ok)
        "Should report OK error")))

;; ============================================================================
;; Tests: Round-trip
;; ============================================================================

(deftest request-response-roundtrip
  "Test: Full request→response roundtrip maintains correlation"

  (let [request (env/make-request :memory/store {:id "memory-123"})
        request-id (env/envelope-id request)
        response (env/make-response-ok request-id {:stored true})]
    (is (= request-id (env/envelope-id response))
        "Response ID should match request ID")
    (is (env/response-ok? response)
        "Response should be successful")))

;; ============================================================================
;; Tests: Error Response with All Fields
;; ============================================================================

(deftest error-response-with-all-optional-fields
  "Test: Error response includes all optional fields"

  (let [resp (env/make-response-error
               valid-uuid
               :server-error
               "Internal error"
               {:ts sample-timestamp
                :meta {:retry true}
                :data {:reason "database" :query "SELECT * FROM fail"}})]
    (is (env/response-error? resp)
        "Should be recognized as error response")
    (is (= :server-error (env/envelope-error-code resp))
        "Error code should match")
    (is (= "Internal error" (env/envelope-error-message resp))
        "Error message should match")
    (is (= {:reason "database" :query "SELECT * FROM fail"}
           (get-in resp [:rpc/error :data]))
        "Error data should match")))

;; ============================================================================
;; Tests: Edge Cases
;; ============================================================================

(deftest empty-payload-is-valid
  "Test: Envelope with empty payload is valid"

  (let [req (env/make-request :ping {})]
    (is (env/valid-envelope? req)
        "Empty payload should be valid")))

(deftest complex-payload-is-valid
  "Test: Envelope with complex nested payload is valid"

  (let [complex-payload {:nested {:deep {:value 123}}
                         :list [1 2 3]
                         :keyword :test}
        req (env/make-request :complex/op complex-payload)]
    (is (env/valid-envelope? req)
        "Complex payload should be valid")))

(deftest meta-can-be-any-map
  "Test: Meta can contain arbitrary data"

  (let [meta {:source "test" :version 2 :nested {:data true}}
        req (env/make-request :test {} {:meta meta})]
    (is (= meta (:rpc/meta req))
        "Meta should preserve all data")
    (is (env/valid-envelope? req)
        "Envelope with complex meta should be valid")))

(deftest version-must-be-positive-integer
  "Test: Version must be positive integer"

  (let [invalid {:rpc/v 0
                 :rpc/id valid-uuid
                 :rpc/ts sample-timestamp
                 :rpc/kind :req
                 :rpc/op :test
                 :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid))
        "Version 0 should be invalid")))

;; ============================================================================
;; Tests: Error Code and Message Validation
;; ============================================================================

(deftest error-must-have-keyword-code
  "Test: Error response requires keyword code"

  (let [invalid {:rpc/v 1
                 :rpc/id valid-uuid
                 :rpc/ts sample-timestamp
                 :rpc/kind :res
                 :rpc/ok false
                 :rpc/error {:code "not-a-keyword" :message "Error"}
                 :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid))
        "String code should be invalid")))

(deftest error-must-have-string-message
  "Test: Error response requires string message"

  (let [invalid {:rpc/v 1
                 :rpc/id valid-uuid
                 :rpc/ts sample-timestamp
                 :rpc/kind :res
                 :rpc/ok false
                 :rpc/error {:code :error :message 123}
                 :rpc/payload {}}]
    (is (false? (env/valid-envelope? invalid))
        "Numeric message should be invalid")))
