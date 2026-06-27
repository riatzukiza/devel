(ns vexx.ort
  (:require [clojure.string :as str]
            [vexx.cache :as cache]
            [vexx.jvm-gpu :as jvm-gpu]
            [vexx.native :as native]))

(defn- normalize-device
  [value]
  (let [device (-> (str value) str/trim str/upper-case)]
    (if (#{"AUTO" "CPU" "GPU" "NPU"} device) device "AUTO")))

(defn- matrix-dim
  [rows]
  (when (seq rows)
    (let [dim (count (first rows))]
      (when (and (pos? dim) (every? #(= dim (count %)) rows))
        dim))))

(defn- dot
  [left right]
  (loop [idx 0 total 0.0]
    (if (= idx (count left))
      total
      (recur (inc idx) (+ total (* (double (nth left idx)) (double (nth right idx))))))))

(defn- magnitude
  [input]
  (Math/sqrt (dot input input)))

(defn- cosine
  [left right]
  (if (or (empty? left) (not= (count left) (count right)))
    Double/NEGATIVE_INFINITY
    (let [left-mag (magnitude left)
          right-mag (magnitude right)]
      (if (or (zero? left-mag) (zero? right-mag))
        Double/NEGATIVE_INFINITY
        (/ (dot left right) (* left-mag right-mag))))))

(defn- local-cosine-matrix
  [config left right]
  (let [rows (count left)
        cols (count right)]
    {:rows rows
     :cols cols
     :matrix (vec (mapcat (fn [left-row]
                            (mapv (fn [right-row] (cosine left-row right-row)) right))
                          left))
     :model-path (:cosine-matrix-model-path config)
     :device "CPU"
     :provider "local-cpu"}))

(defn- attempt-order
  [config requested-device]
  (let [device (normalize-device (or requested-device (:default-device config)))]
    (if (= device "AUTO")
      (or (seq (:auto-order config)) ["GPU" "NPU" "CPU"])
      [device])))

(defn- resolved-device-for-cache
  [config requested-device]
  (or (first (attempt-order config requested-device)) "CPU"))

(defn- raw-cosine-matrix
  [config {:keys [left right device require-accel]}]
  (let [left (vec left)
        right (vec right)
        left-dim (matrix-dim left)
        right-dim (matrix-dim right)
        requested-device (normalize-device (or device (:default-device config)))
        require-accel? (boolean (if (some? require-accel) require-accel (:require-accel config)))]
    (when (or (nil? left-dim) (nil? right-dim) (not= left-dim right-dim))
      (throw (ex-info "invalid_cosine_payload" {:left-dim left-dim :right-dim right-dim})))
    (when (or (empty? left) (empty? right))
      (throw (ex-info "cosine_empty" {})))
    (loop [devices (seq (attempt-order config requested-device))
           attempts []]
      (if-not (seq devices)
        (throw (ex-info "cosine_unavailable" {:requested-device requested-device
                                               :attempts attempts}))
        (let [current-device (first devices)]
          (cond
            (= current-device "CPU")
            (if (and require-accel? (not= requested-device "CPU"))
              (recur (next devices)
                     (conj attempts {:device current-device :ok false :error "accel_required"}))
              (assoc (local-cosine-matrix config left right)
                     :attempts attempts
                     :degraded (not= requested-device "CPU")
                     :requestedDevice requested-device))

            :else
            (let [attempt-result (try
                                   {:ok true
                                    :value (assoc (case current-device
                                                    "GPU" (jvm-gpu/cosine-matrix config {:left left :right right})
                                                    "NPU" (native/cosine-matrix config {:left left :right right :device current-device})
                                                    (throw (ex-info "unsupported_accel_device" {:device current-device})))
                                                  :attempts attempts
                                                  :degraded false
                                                  :requestedDevice requested-device)}
                                   (catch Throwable error
                                     (let [details (ex-data error)
                                           detail-error (or (:error details)
                                                            (ex-message error)
                                                            (str error))]
                                       {:ok false
                                        :error detail-error
                                        :details details})))]
              (if (:ok attempt-result)
                (:value attempt-result)
                (recur (next devices)
                       (conj attempts {:device current-device
                                       :ok false
                                       :error (:error attempt-result)}))))))))))

(defn- assemble-cached-response
  [config requested-device matrix rows cols]
  {:rows rows
   :cols cols
   :matrix matrix
   :model-path (:cosine-matrix-model-path config)
   :device (resolved-device-for-cache config requested-device)
   :provider "pair-cache"
   :attempts []
   :degraded false
   :requestedDevice (normalize-device (or requested-device (:default-device config)))})

(defn- cached-single-left-matrix
  [config {:keys [left right device require-accel]}]
  (let [left-row (first left)
        cached-scores (mapv #(cache/get-pair config left-row %) right)
        missing-indexes (keep-indexed (fn [index score]
                                        (when (nil? score) index))
                                      cached-scores)]
    (if (empty? missing-indexes)
      (assemble-cached-response config device (mapv double cached-scores) 1 (count right))
      (let [missing-right (mapv #(nth right %) missing-indexes)
            {:keys [matrix] :as computed} (raw-cosine-matrix config {:left [left-row]
                                                                     :right missing-right
                                                                     :device device
                                                                     :require-accel require-accel})
            missing-map (zipmap missing-indexes (mapv double matrix))
            full-matrix (mapv (fn [index cached-score]
                                (if (some? cached-score)
                                  (double cached-score)
                                  (double (get missing-map index))))
                              (range (count right))
                              cached-scores)]
        (doseq [[index score] missing-map]
          (cache/put-pair! config left-row (nth right index) score))
        (assoc computed
               :rows 1
               :cols (count right)
               :matrix full-matrix)))))

(defn- cache-matrix!
  [config left right matrix]
  (doseq [row-index (range (count left))
          col-index (range (count right))]
    (cache/put-pair! config
                     (nth left row-index)
                     (nth right col-index)
                     (nth matrix (+ (* row-index (count right)) col-index)))))

(defn cosine-matrix
  [config {:keys [left right device require-accel]}]
  (let [left (vec left)
        right (vec right)
        left-dim (matrix-dim left)
        right-dim (matrix-dim right)]
    (when (or (nil? left-dim) (nil? right-dim) (not= left-dim right-dim))
      (throw (ex-info "invalid_cosine_payload" {:left-dim left-dim :right-dim right-dim})))
    (when (or (empty? left) (empty? right))
      (throw (ex-info "cosine_empty" {})))
    (let [result (if (= 1 (count left))
                   (cached-single-left-matrix config {:left left
                                                     :right right
                                                     :device device
                                                     :require-accel require-accel})
                   (raw-cosine-matrix config {:left left
                                              :right right
                                              :device device
                                              :require-accel require-accel}))]
      (cache-matrix! config left right (:matrix result))
      result)))

(defn cosine-topk
  [config {:keys [query candidates k device require-accel]}]
  (let [query (vec query)
        candidates (vec candidates)
        dim (count query)]
    (when (or (empty? query) (empty? candidates))
      (throw (ex-info "invalid_topk_payload" {})))
    (when-not (every? #(= dim (count (:embedding %))) candidates)
      (throw (ex-info "invalid_candidate_dimensions" {:expected-dim dim})))
    (let [{:keys [matrix] :as result} (cosine-matrix config {:left [query]
                                                             :right (mapv :embedding candidates)
                                                             :device device
                                                             :require-accel require-accel})
          limit (max 1 (int (or k 10)))
          matches (->> matrix
                       (map-indexed (fn [index score]
                                      {:id (or (:id (nth candidates index)) (str index))
                                       :rank index
                                       :score score}))
                       (filter #(Double/isFinite (double (:score %))))
                       (sort-by (fn [{:keys [score id]}] [(- score) (str id)]))
                       (take limit)
                       vec)]
      (-> result
          (dissoc :matrix :rows :cols)
          (assoc :matches matches
                 :inputCount (count candidates)
                 :pairCacheSize (cache/pair-cache-size config))))))
