(ns vexx.api.routes
  (:require [vexx.cache :as cache]
            [vexx.config :as config]
            [vexx.ort :as ort]
            [vexx.slab :as slab]))

(defn- request-body
  [request]
  (let [body (or (:body-params request) (:body request))]
    (if (map? body) body {})))

(defn- body-value
  [body key]
  (or (get body key)
      (get body (name key))))

(defn- unauthorized-response
  []
  {:status 401
   :body {:ok false :error "unauthorized"}})

(defn- authorized?
  [request cfg]
  (let [expected (:api-key cfg)]
    (or (nil? expected)
        (= (get-in request [:headers "authorization"]) (str "Bearer " expected)))))

(defn- ok-response
  [payload]
  {:status 200
   :body (assoc payload :ok true :service "vexx")})

(defn- error-status
  [error-code]
  (case error-code
    "invalid_cosine_payload" 400
    "invalid_topk_payload" 400
    "invalid_candidate_dimensions" 400
    "cosine_empty" 400
    503))

(defn- error-response
  [error]
  (let [message (or (ex-message error) "vexx_error")
        data (ex-data error)]
    {:status (error-status message)
     :body {:ok false
            :service "vexx"
            :error message
            :details data}}))

(defn health-handler
  [_request]
  (let [cfg (config/config)]
    (ok-response {:defaultDevice (:default-device cfg)
                  :autoOrder (:auto-order cfg)
                  :requireAccel (:require-accel cfg)
                  :pairCacheSize (cache/pair-cache-size cfg)
                  :modelPath (:cosine-matrix-model-path cfg)})))

(defn cosine-matrix-handler
  [request]
  (let [cfg (config/config)]
    (if-not (authorized? request cfg)
      (unauthorized-response)
      (try
        (let [body (request-body request)
              result (ort/cosine-matrix cfg {:left (vec (body-value body :left))
                                             :right (vec (body-value body :right))
                                             :device (body-value body :device)
                                             :require-accel (body-value body :requireAccel)})]
          (ok-response result))
        (catch Throwable error
          (error-response error))))))

(defn cosine-topk-handler
  [request]
  (let [cfg (config/config)]
    (if-not (authorized? request cfg)
      (unauthorized-response)
      (try
        (let [body (request-body request)
              candidates (->> (vec (body-value body :candidates))
                              (mapv (fn [candidate]
                                      {:id (or (body-value candidate :id) (body-value candidate :_id))
                                       :embedding (vec (body-value candidate :embedding))})))
              result (ort/cosine-topk cfg {:query (vec (body-value body :query))
                                           :candidates candidates
                                           :k (or (body-value body :k) 10)
                                           :device (body-value body :device)
                                           :require-accel (body-value body :requireAccel)})]
          (ok-response result))
        (catch Throwable error
          (error-response error))))))

(defn slab-register-handler
  [request]
  (let [cfg (config/config)]
    (if-not (authorized? request cfg)
      (unauthorized-response)
      (try
        (let [body (request-body request)
              slab-path (body-value body :path)
              dims (body-value body :dims)]
          (when-not (and slab-path dims)
            (throw (ex-info "invalid_slab_register_payload" {:path slab-path :dims dims})))
          (let [result (slab/register (str slab-path) (int dims))]
            (ok-response result)))
        (catch Throwable error
          (error-response error))))))

(defn slab-list-handler
  [_request]
  {:status 200
   :body {:ok true
          :service "vexx"
          :slabs (slab/list-slabs)}})

(defn slab-get-handler
  [request]
  (let [slab-id (get-in request [:path-params :slab-id])]
    (if-let [s (slab/get-slab slab-id)]
      {:status 200
       :body {:ok true
              :service "vexx"
              :slab-id slab-id
              :path (:path s)
              :dims (aget ^ints (:dims s) 0)
              :row-count (:row-count s)
              :file-size (:file-size s)}}
      {:status 404
       :body {:ok false :error "slab_not_found" :slab-id slab-id}})))

(defn cosine-topk-by-slab-handler
  [request]
  (let [cfg (config/config)]
    (if-not (authorized? request cfg)
      (unauthorized-response)
      (try
        (let [body (request-body request)
              slab-id (body-value body :slabId)
              query-offset (long (body-value body :queryOffset))
              candidate-offsets (mapv long (vec (body-value body :candidateOffsets)))
              k (or (body-value body :k) 10)
              device (body-value body :device)]
          (when-not (and slab-id query-offset candidate-offsets)
            (throw (ex-info "invalid_topk_by_slab_payload" {:slab-id slab-id
                                                            :query-offset query-offset
                                                            :candidate-offsets candidate-offsets})))
          (let [result (slab/cosine-topk-by-slab cfg {:slab-id (str slab-id)
                                                       :query-offset query-offset
                                                       :candidate-offsets candidate-offsets
                                                       :k k
                                                       :device device})]
            (ok-response result)))
        (catch Throwable error
          (error-response error))))))

(def routes
  [["/v1"
    ["/health" {:get health-handler}]
    ["/cosine/matrix" {:post cosine-matrix-handler}]
    ["/cosine/topk" {:post cosine-topk-handler}]]
   ["/v2"
    ["/slabs/register" {:post slab-register-handler}]
    ["/slabs/list" {:get slab-list-handler}]
    ["/slabs/info/:slab-id" {:get slab-get-handler}]
    ["/cosine/topk-by-slab" {:post cosine-topk-by-slab-handler}]]])
