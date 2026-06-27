(ns promethean.tools.memory
  "Memory tools for CLJS runtime."
  (:require-macros [promethean.tools.def-tool :refer [def-tool]]))

(def-tool memory-lookup
  {:description "Query memories for relevant context."
   :inputSchema {:type "object"
                 :properties {:query {:type "string"
                                      :description "Search query"}
                             :limit {:type "integer"
                                     :description "Max results"
                                     :default 10}}
                 :required ["query"]}}
  (fn [ctx args]
    (let [deps (:deps ctx)
          query (get args "query")
          limit (or (get args "limit") 10)
          memory-store (:memory-store deps)]
      (if memory-store
        ;; TODO: Implement actual similarity search
        ;; For now, return recent memories filtered by query keywords
        (-> (if (fn? (.-findRecent memory-store))
              (.findRecent memory-store (:session-id ctx) (* limit 2))
              (js/Promise.resolve []))
            (.then
              (fn [memories]
                (let [filtered (take limit memories)]
                  {:result {:memories (mapv (fn [m]
                                              {:id (:memory/id m)
                                               :text (get-in m [:memory/content :text])
                                               :ts (:memory/ts m)
                                               :tags (:memory/tags m)})
                                            filtered)
                            :count (count filtered)
                            :query query}}))))
        (js/Promise.resolve {:error "Memory store not available"})))))

(def-tool memory-pin
  {:description "Pin an important memory for persistent context."
   :inputSchema {:type "object"
                 :properties {:memory_id {:type "string"
                                          :description "ID of memory to pin"}
                             :reason {:type "string"
                                      :description "Why this memory is important"}}
                 :required ["memory_id"]}}
  (fn [ctx args]
    (let [deps (:deps ctx)
          memory-id (get args "memory_id")
          reason (get args "reason")
          memory-store (:memory-store deps)]
      (if memory-store
        ;; Update memory retrieval status
        (-> (if (fn? (.-getMemory memory-store))
              (.getMemory memory-store memory-id)
              (js/Promise.resolve nil))
            (.then
              (fn [mem]
                (if mem
                  ;; TODO: Update memory retrieval.pinned = true
                  {:result {:pinned true
                            :memory_id memory-id
                            :reason reason}}
                  {:error (str "Memory not found: " memory-id)}))))
        (js/Promise.resolve {:error "Memory store not available"})))))

(def-tool memory-recent
  {:description "Get recent memories from the current session."
   :inputSchema {:type "object"
                 :properties {:limit {:type "integer"
                                      :description "Max results"
                                      :default 20}}
                 :required []}}
  (fn [ctx args]
    (let [deps (:deps ctx)
          limit (or (get args "limit") 20)
          memory-store (:memory-store deps)]
      (if memory-store
        (-> (if (fn? (.-findRecent memory-store))
              (.findRecent memory-store (:session-id ctx) limit)
              (js/Promise.resolve []))
            (.then
              (fn [memories]
                {:result {:memories (mapv (fn [m]
                                            {:id (:memory/id m)
                                             :text (get-in m [:memory/content :text])
                                             :ts (:memory/ts m)
                                             :kind (:memory/kind m)})
                                          memories)
                          :count (count memories)}})))
        (js/Promise.resolve {:error "Memory store not available"})))))
