(ns promethean.memory.mongodb-store
  "MongoDB-backed memory store for persistent CLJS runtime."
  (:require
    [promethean.debug.log :as log]
    [promethean.memory.model :as mm]
    ["mongodb" :refer [MongoClient]]))

;; ============================================================================
;; Configuration
;; ============================================================================

(defn config-from-env []
  {:uri (or (.-MONGODB_URI js/process.env)
            (.-CEPHALON_MONGODB_URI js/process.env)
            "mongodb://localhost:27017")
   :database (or (.-CEPHALON_MONGODB_DB js/process.env)
                 (.-MONGODB_DB js/process.env)
                 "cephalon")
   :collection (or (.-CEPHALON_MONGODB_COLLECTION js/process.env)
                   "memories")})

;; ============================================================================
;; Memory -> MongoDB Document
;; ============================================================================

(defn memory->doc [mem]
  {:_id (:memory/id mem)
   :memory_id (:memory/id mem)
   :memory_ts (:memory/ts mem)
   :memory_cephalon_id (:memory/cephalon-id mem)
   :memory_session_id (:memory/session-id mem)
   :memory_kind (name (:memory/kind mem))
   :memory_role (name (:memory/role mem))
   :memory_text (or (get-in mem [:memory/content :text]) "")
   :memory_tags (vec (:memory/tags mem))
   :memory_meta (:memory/meta mem)
   :memory_dedupe_key (:memory/dedupe-key mem)
   :memory_nexus_keys (vec (:memory/nexus-keys mem))
   :memory_retrieval (:memory/retrieval mem)
   :memory_usage (:memory/usage mem)
   :memory_lifecycle (:memory/lifecycle mem)
   :memory_schema_version (:memory/schema-version mem)})

(defn doc->memory [doc]
  (when doc
    {:memory/id (:_id doc)
     :memory/ts (:memory_ts doc)
     :memory/cephalon-id (:memory_cephalon_id doc)
     :memory/session-id (:memory_session_id doc)
     :memory/kind (keyword (:memory_kind doc))
     :memory/role (keyword (:memory_role doc))
     :memory/content {:text (:memory_text doc)}
     :memory/tags (set (:memory_tags doc))
     :memory/meta (:memory_meta doc)
     :memory/dedupe-key (:memory_dedupe_key doc)
     :memory/nexus-keys (set (:memory_nexus_keys doc))
     :memory/retrieval (:memory_retrieval doc)
     :memory/usage (:memory_usage doc)
     :memory/lifecycle (:memory_lifecycle doc)
     :memory/schema-version (:memory_schema_version doc)}))

;; ============================================================================
;; MongoDB Store
;; ============================================================================

(defrecord MongoDBMemoryStore [config client db collection stats-atom])

(defn make-mongodb-store
  "Create a MongoDB memory store."
  ([]
   (make-mongodb-store (config-from-env)))
  ([config]
   (map->MongoDBMemoryStore
     {:config config
      :client nil
      :db nil
      :collection nil
      :stats-atom (atom {:put 0 :get 0 :find 0 :errors 0})})))

(defn- get-collection [store]
  (:collection store))

(defn initialize
  "Connect to MongoDB and ensure indexes."
  [store]
  (let [{:keys [uri database collection]} (:config store)
        client-atom (atom nil)]
    (-> (MongoClient. uri)
        (.connect)
        (.then
          (fn [client]
            (reset! client-atom client)
            (let [db (.db client database)
                  coll (.collection db collection)]
              ;; Create indexes
              (-> (.createIndex coll (clj->js {:memory_cephalon_id 1 :memory_session_id 1 :memory_ts -1}))
                  (.then
                    (fn []
                      (.createIndex coll (clj->js {:memory_tags 1})))
                    (fn []
                      (.createIndex coll (clj->js {:memory_id 1} #js {:unique true}))))
                  (.then
                    (fn []
                      (log/info "MongoDB memory store initialized"
                                {:database database :collection collection})
                      (assoc store :client client :db db :collection coll)))
                  (.catch
                    (fn [err]
                      (log/error "Failed to create indexes" {:error (str err)})
                      (assoc store :client client :db db :collection coll))))))
          (fn [err]
            (log/error "Failed to connect to MongoDB" {:error (str err) :uri uri})
            (swap! (:stats-atom store) update :errors inc)
            store)))))

(defn close
  "Close MongoDB connection."
  [store]
  (when-let [client (:client store)]
    (.close client))
  (assoc store :client nil :db nil :collection nil))

(defn put-memory!
  "Store a memory record."
  [store mem]
  (if-let [coll (get-collection store)]
    (let [doc (memory->doc mem)]
      (-> (.replaceOne coll
                       (clj->js {:_id (:memory/id mem)})
                       (clj->js doc)
                       (clj->js {:upsert true}))
          (.then
            (fn [_]
              (swap! (:stats-atom store) update :put inc)
              mem))
          (.catch
            (fn [err]
              (log/error "Failed to store memory" {:error (str err) :id (:memory/id mem)})
              (swap! (:stats-atom store) update :errors inc)
              nil))))
    (js/Promise.reject (js/Error. "MongoDB not initialized"))))

(defn get-memory
  "Get a memory by ID."
  [store memory-id]
  (if-let [coll (get-collection store)]
    (-> (.findOne coll (clj->js {:_id memory-id}))
        (.then
          (fn [doc]
            (swap! (:stats-atom store) update :get inc)
            (doc->memory (js->clj doc :keywordize-keys true))))
        (.catch
          (fn [err]
            (log/error "Failed to get memory" {:error (str err) :id memory-id})
            (swap! (:stats-atom store) update :errors inc)
            nil)))
    (js/Promise.reject (js/Error. "MongoDB not initialized"))))

(defn find-recent
  "Get recent memories for a session."
  [store session-id limit]
  (if-let [coll (get-collection store)]
    (-> (.find coll (clj->js {:memory_session_id session-id
                              :memory_lifecycle.deleted {:_$ne true}}))
        (.sort (clj->js {:memory_ts -1}))
        (.limit limit)
        (.toArray)
        (.then
          (fn [docs]
            (swap! (:stats-atom store) update :find inc)
            (mapv doc->memory (js->clj docs :keywordize-keys true))))
        (.catch
          (fn [err]
            (log/error "Failed to find recent memories" {:error (str err) :session-id session-id})
            (swap! (:stats-atom store) update :errors inc)
            [])))
    (js/Promise.reject (js/Error. "MongoDB not initialized"))))

(defn find-by-tags
  "Find memories matching tags."
  [store tags limit]
  (if-let [coll (get-collection store)]
    (-> (.find coll (clj->js {:memory_tags {:$all (vec tags)}
                              :memory_lifecycle.deleted {:_$ne true}}))
        (.sort (clj->js {:memory_ts -1}))
        (.limit limit)
        (.toArray)
        (.then
          (fn [docs]
            (swap! (:stats-atom store) update :find inc)
            (mapv doc->memory (js->clj docs :keywordize-keys true))))
        (.catch
          (fn [err]
            (log/error "Failed to find memories by tags" {:error (str err) :tags tags})
            (swap! (:stats-atom store) update :errors inc)
            [])))
    (js/Promise.reject (js/Error. "MongoDB not initialized"))))

(defn delete-memory!
  "Soft-delete a memory by ID."
  [store memory-id]
  (if-let [coll (get-collection store)]
    (-> (.updateOne coll
                    (clj->js {:_id memory-id})
                    (clj->js {:$set {:memory_lifecycle.deleted true
                                     :memory_lifecycle.deleted_at (.now js/Date)}}))
        (.then
          (fn [_]
            (log/info "Memory soft-deleted" {:id memory-id})
            true))
        (.catch
          (fn [err]
            (log/error "Failed to delete memory" {:error (str err) :id memory-id})
            false)))
    (js/Promise.reject (js/Error. "MongoDB not initialized"))))

(defn stats
  "Get store statistics."
  [store]
  @(:stats-atom store))
