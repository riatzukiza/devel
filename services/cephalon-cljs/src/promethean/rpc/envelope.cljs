;; ============================================================================
;; Redis RPC Envelope Schema
;;
;; Schema-only validation helpers for Redis RPC request/response envelopes.
;; No transport IO - pure schema validation and construction.
;; ============================================================================

(ns promethean.rpc.envelope
  "Redis RPC envelope schema and validation helpers")

;; ============================================================================
;; Constants
;; ============================================================================

(def ^:const +rpc-version+ 1)

(def ^:const +valid-kinds+ #{:req :res})

;; ============================================================================
;; UUID Validation
;; ============================================================================

(defn uuid-string?
  "Check if value is a valid UUID string"
  [v]
  (and (string? v)
       (boolean (re-matches #"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" v))))

(defn generate-uuid
  "Generate a random UUID string"
  []
  (str (random-uuid)))

;; ============================================================================
;; Envelope Field Validation
;; ============================================================================

(defn- validate-version
  [v]
  (when-not (and (int? v) (pos? v))
    {:rpc/v "must be positive integer"}))

(defn- validate-id
  [v]
  (when-not (uuid-string? v)
    {:rpc/id "must be UUID string"}))

(defn- validate-timestamp
  [v]
  (when-not (and (int? v) (pos? v))
    {:rpc/ts "must be positive integer (milliseconds)"}))

(defn- validate-kind
  [v]
  (when-not (contains? +valid-kinds+ v)
    {:rpc/kind (str "must be one of " +valid-kinds+)}))

(defn- validate-operation
  [v]
  (when-not (keyword? v)
    {:rpc/op "must be keyword"}))

(defn- validate-payload
  [v]
  (when-not (map? v)
    {:rpc/payload "must be map"}))

(defn- validate-meta
  [v]
  (when-not (or (nil? v) (map? v))
    {:rpc/meta "must be map or nil"}))

(defn- validate-ok
  [v]
  (when-not (boolean? v)
    {:rpc/ok "must be boolean"}))

(defn- validate-result
  [_v]
  ;; result can be any value
  nil)

(defn- validate-error
  [v]
  (when-not (and (map? v)
                 (keyword? (:code v))
                 (string? (:message v)))
    {:rpc/error {:code "must be keyword"
                 :message "must be string"
                 :data "optional"}}))

;; ============================================================================
;; Core Validation
;; ============================================================================

(declare validate-envelope)

(defn valid-envelope?
  "Validate an envelope and return true if valid, false otherwise.
   For debugging, use validate-envelope to get error details."
  ([envelope]
   (valid-envelope? envelope nil))
  ([envelope kind]
   (empty? (validate-envelope envelope (or kind (:rpc/kind envelope))))))

(defn validate-envelope
  "Validate an envelope and return a map of errors.
   Empty map means valid.
   Optional kind hint (:req or :res) for more specific validation."
  ([envelope]
   (validate-envelope envelope nil))
  ([envelope kind]
   (let [errors (merge {}
                        (validate-version (:rpc/v envelope))
                        (validate-id (:rpc/id envelope))
                        (validate-timestamp (:rpc/ts envelope))
                        (validate-kind (:rpc/kind envelope))
                        (when (or (= :req kind) (contains? envelope :rpc/op))
                          (validate-operation (:rpc/op envelope)))
                        (when (or (= :req kind) (contains? envelope :rpc/payload))
                          (validate-payload (:rpc/payload envelope)))
                        (validate-meta (:rpc/meta envelope))
                        (when (or (= :res kind) (contains? envelope :rpc/ok))
                          (validate-ok (:rpc/ok envelope))))]
     (if (= :res kind)
       (merge errors
              (if (:rpc/ok envelope)
                (validate-result (:rpc/result envelope))
                (validate-error (:rpc/error envelope))))
       errors))))

;; ============================================================================
;; Request Validation
;; ============================================================================

(defn request?
  "Check if envelope is a valid request"
  [envelope]
  (and (= :req (:rpc/kind envelope))
       (valid-envelope? envelope :req)))

(defn validate-request
  "Validate a request envelope and return errors map"
  [envelope]
  (merge
    (when-not (= :req (:rpc/kind envelope))
      {:rpc/kind "must be :req for requests"})
    (validate-envelope envelope :req)))

;; ============================================================================
;; Response Validation
;; ============================================================================

(defn response?
  "Check if envelope is a valid response"
  [envelope]
  (and (= :res (:rpc/kind envelope))
       (valid-envelope? envelope :res)))

(defn response-ok?
  "Check if envelope is a valid successful response"
  [envelope]
  (and (response? envelope)
       (true? (:rpc/ok envelope))
       (contains? envelope :rpc/result)))

(defn response-error?
  "Check if envelope is a valid error response"
  [envelope]
  (and (response? envelope)
       (false? (:rpc/ok envelope))
       (map? (:rpc/error envelope))))

(defn validate-response
  "Validate a response envelope and return errors map"
  [envelope]
  (merge
    (when-not (= :res (:rpc/kind envelope))
      {:rpc/kind "must be :res for responses"})
    (validate-envelope envelope :res)))

;; ============================================================================
;; Constructors
;; ============================================================================

(defn make-request
  "Create a request envelope

   Parameters:
   - op: operation keyword (e.g., :memory/store, :memory/query)
   - payload: map with request data
   - opts: optional map with :id, :ts, :meta

   Example:
   (make-request :memory/store {:memory-id \"...\" :content \"...\"})
   (make-request :session/list {})"
  ([op payload]
   (make-request op payload {}))
  ([op payload {:keys [id ts meta]
                :or {id (generate-uuid)
                     ts (.now js/Date)
                     meta nil}}]
   {:rpc/v +rpc-version+
    :rpc/id id
    :rpc/ts ts
    :rpc/kind :req
    :rpc/op op
    :rpc/payload payload
    :rpc/meta meta}))

(defn make-response-ok
  "Create a successful response envelope

   Parameters:
   - request-id: the UUID from the request we're responding to
   - result: the result value
   - opts: optional map with :ts, :meta

   Example:
   (make-response-ok \"550e8400-...\" {:success true})"
  ([request-id result]
   (make-response-ok request-id result {}))
  ([request-id result {:keys [ts meta]
                       :or {ts (.now js/Date)
                            meta nil}}]
   {:rpc/v +rpc-version+
    :rpc/id request-id
    :rpc/ts ts
    :rpc/kind :res
    :rpc/ok true
     :rpc/payload {}
    :rpc/result result
    :rpc/meta meta}))

(defn make-response-error
  "Create an error response envelope

   Parameters:
   - request-id: the UUID from the request we're responding to
   - code: error code keyword (e.g., :not-found, :validation-failed)
   - message: human-readable error message
   - opts: optional map with :ts, :meta, :data

   Example:
   (make-response-error \"550e8400-...\" :not-found \"Memory not found\")"
  ([request-id code message]
   (make-response-error request-id code message {}))
  ([request-id code message {:keys [ts meta data]
                             :or {ts (.now js/Date)
                                  meta nil
                                  data nil}}]
   {:rpc/v +rpc-version+
    :rpc/id request-id
    :rpc/ts ts
    :rpc/kind :res
    :rpc/ok false
     :rpc/payload {}
    :rpc/error {:code code
                :message message
                :data data}
    :rpc/meta meta}))

;; ============================================================================
;; Accessors
;; ============================================================================

(defn envelope-id
  "Get the request/response ID from an envelope"
  [envelope]
  (:rpc/id envelope))

(defn envelope-operation
  "Get the operation from an envelope"
  [envelope]
  (:rpc/op envelope))

(defn envelope-payload
  "Get the payload from an envelope"
  [envelope]
  (:rpc/payload envelope))

(defn envelope-result
  "Get the result from a response envelope"
  [envelope]
  (:rpc/result envelope))

(defn envelope-error
  "Get the error from a response envelope"
  [envelope]
  (:rpc/error envelope))

(defn envelope-error-code
  "Get the error code from a response envelope"
  [envelope]
  (when-let [err (envelope-error envelope)]
    (:code err)))

(defn envelope-error-message
  "Get the error message from a response envelope"
  [envelope]
  (when-let [err (envelope-error envelope)]
    (:message err)))
