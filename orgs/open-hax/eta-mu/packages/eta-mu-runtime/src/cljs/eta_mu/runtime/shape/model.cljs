(ns eta-mu.runtime.shape.model)

(defn- maybe-keyword
  [value]
  (cond
    (keyword? value) value
    (string? value) (keyword value)
    :else value))

(defn cost-from-external
  [cost]
  {:input (:input cost)
   :output (:output cost)
   :cache-read (or (:cacheRead cost) (:cache-read cost))
   :cache-write (or (:cacheWrite cost) (:cache-write cost))})

(defn cost->external
  [cost]
  {:input (:input cost)
   :output (:output cost)
   :cacheRead (:cache-read cost)
   :cacheWrite (:cache-write cost)})

(defn model-from-external
  [model]
  (cond-> {:id (:id model)
           :name (:name model)
           :api (:api model)
           :provider (:provider model)
           :base-url (or (:baseUrl model) (:base-url model))
           :reasoning (:reasoning model)
           :input (mapv maybe-keyword (:input model))
           :cost (cost-from-external (:cost model))
           :context-window (or (:contextWindow model) (:context-window model))
           :max-tokens (or (:maxTokens model) (:max-tokens model))}
    (:headers model) (assoc :headers (:headers model))
    (:compat model) (assoc :compat (:compat model))))

(defn model->external
  [model]
  (cond-> {:id (:id model)
           :name (:name model)
           :api (:api model)
           :provider (:provider model)
           :baseUrl (:base-url model)
           :reasoning (:reasoning model)
           :input (mapv name (:input model))
           :cost (cost->external (:cost model))
           :contextWindow (:context-window model)
           :maxTokens (:max-tokens model)}
    (:headers model) (assoc :headers (:headers model))
    (:compat model) (assoc :compat (:compat model))))

(defn requirements-from-external
  [requirements]
  (cond-> {}
    (:inputs requirements) (assoc :inputs (mapv maybe-keyword (:inputs requirements)))
    (contains? requirements :reasoningRequired)
    (assoc :reasoning-required (:reasoningRequired requirements))
    (contains? requirements :reasoning-required)
    (assoc :reasoning-required (:reasoning-required requirements))
    (or (:minContextWindow requirements) (:min-context-window requirements))
    (assoc :min-context-window (or (:minContextWindow requirements)
                                   (:min-context-window requirements)))))
