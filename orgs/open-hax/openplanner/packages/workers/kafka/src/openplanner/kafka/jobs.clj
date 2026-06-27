(ns openplanner.kafka.jobs
  "Clojure Kafka workers for OpenPlanner.

  Worker jobs belong here by default. The TypeScript API may publish accepted
  events, but replay/projection/audit/embedding consumers should be written in
  Clojure unless there is a concrete reason not to."
  (:gen-class)
  (:require
   [cheshire.core :as json]
   [clojure.string :as str])
  (:import
   (com.mongodb.client MongoClients MongoCollection MongoDatabase)
   (java.time Duration Instant)
   (java.util ArrayList Date Properties UUID)
   (org.apache.kafka.clients.consumer ConsumerConfig KafkaConsumer OffsetAndMetadata)
   (org.apache.kafka.common TopicPartition)
   (org.apache.kafka.common.serialization StringDeserializer)
   (com.mongodb.client.model BulkWriteOptions UpdateOneModel UpdateOptions)
   (org.bson Document)))

(defn env
  ([k] (System/getenv k))
  ([k default] (or (System/getenv k) default)))

(defn parse-bool
  [raw default]
  (if (nil? raw)
    default
    (case (str/lower-case (str/trim (str raw)))
      ("1" "true" "yes" "on") true
      ("0" "false" "no" "off") false
      default)))

(defn parse-long*
  [raw default]
  (try
    (let [value (Long/parseLong (str raw))]
      (if (neg? value) default value))
    (catch Throwable _ default)))

(defn split-csv
  [value]
  (->> (str/split (or value "") #",")
       (map str/trim)
       (remove str/blank?)
       vec))

(defn now-iso []
  (.toString (Instant/now)))

(defn log!
  ([level msg] (log! level msg {}))
  ([level msg payload]
   (println (json/generate-string (merge {:level (name level)
                                          :ts (now-iso)
                                          :msg msg}
                                         payload)))
   (flush)))

(defn warn!
  [msg payload]
  (binding [*out* *err*]
    (log! :warn msg payload)))

(defn config []
  {:enabled (parse-bool (env "OPENPLANNER_KAFKA_ENABLED") false)
   :brokers (or (not-empty (split-csv (env "OPENPLANNER_KAFKA_BROKERS"))) ["redpanda:9092"])
   :topic (env "OPENPLANNER_KAFKA_EVENTS_RAW_TOPIC" "openplanner.events.raw")
   :audit-group-id (env "OPENPLANNER_KAFKA_AUDIT_GROUP_ID" "openplanner-event-audit-consumer")
   :audit-client-id (env "OPENPLANNER_KAFKA_AUDIT_CLIENT_ID" "openplanner-event-audit-consumer-clj")
   :replay-group-id (env "OPENPLANNER_KAFKA_REPLAY_GROUP_ID" (str "openplanner-event-replay-" (UUID/randomUUID)))
   :replay-client-id (env "OPENPLANNER_KAFKA_REPLAY_CLIENT_ID" "openplanner-event-replay-worker-clj")
   :replay-dry-run (parse-bool (env "OPENPLANNER_KAFKA_REPLAY_DRY_RUN") true)
   :replay-start-offset (env "OPENPLANNER_KAFKA_REPLAY_START_OFFSET" "earliest")
   :replay-end-offset (env "OPENPLANNER_KAFKA_REPLAY_END_OFFSET" "latest")
   :replay-max-messages (parse-long* (env "OPENPLANNER_KAFKA_REPLAY_MAX_MESSAGES") 1000)
   :replay-log-every (max 1 (parse-long* (env "OPENPLANNER_KAFKA_REPLAY_LOG_EVERY") 100))
   :graph-edges-backfill-limit (parse-long* (env "OPENPLANNER_GRAPH_EDGES_BACKFILL_LIMIT") 0)
   :graph-edges-backfill-batch-size (max 1 (parse-long* (env "OPENPLANNER_GRAPH_EDGES_BACKFILL_BATCH_SIZE") 1000))
   :graph-edges-backfill-log-every (max 1 (parse-long* (env "OPENPLANNER_GRAPH_EDGES_BACKFILL_LOG_EVERY") 1000))
   :mongo-uri (env "MONGODB_URI" "mongodb://localhost:27017")
   :mongo-db (env "MONGODB_DB" "openplanner")
   :mongo-events (env "MONGODB_EVENTS_COLLECTION" "events")
   :mongo-graph-edges (env "MONGODB_GRAPH_EDGES_COLLECTION" "graph_edges")})

(defn consumer-props
  [{:keys [brokers]} group-id client-id]
  (doto (Properties.)
    (.put ConsumerConfig/BOOTSTRAP_SERVERS_CONFIG (str/join "," brokers))
    (.put ConsumerConfig/GROUP_ID_CONFIG group-id)
    (.put ConsumerConfig/CLIENT_ID_CONFIG client-id)
    (.put ConsumerConfig/KEY_DESERIALIZER_CLASS_CONFIG (.getName StringDeserializer))
    (.put ConsumerConfig/VALUE_DESERIALIZER_CLASS_CONFIG (.getName StringDeserializer))
    (.put ConsumerConfig/AUTO_OFFSET_RESET_CONFIG "earliest")
    (.put ConsumerConfig/ENABLE_AUTO_COMMIT_CONFIG "false")
    (.put ConsumerConfig/PARTITION_ASSIGNMENT_STRATEGY_CONFIG "org.apache.kafka.clients.consumer.RangeAssignor")
    (.put ConsumerConfig/MAX_POLL_RECORDS_CONFIG "500")))

(defn make-consumer
  [cfg group-id client-id]
  (KafkaConsumer. (consumer-props cfg group-id client-id)))

(defn parse-json
  [s]
  (when-not (str/blank? s)
    (json/parse-string s keyword)))

(defn extract-event
  [payload]
  (cond
    (nil? payload) nil
    (:event payload) (:event payload)
    (= "openplanner.event.v1" (:schema payload)) payload
    :else nil))

(defn validate-event!
  [event]
  (when-not (= "openplanner.event.v1" (:schema event))
    (throw (ex-info "event.schema must be openplanner.event.v1" {:event event})))
  (doseq [k [:id :ts :source :kind]]
    (when (str/blank? (str (get event k)))
      (throw (ex-info (str (name k) " required") {:event-id (:id event) :field k})))))

(defn bson-value
  [value]
  (cond
    (nil? value) nil
    (instance? Date value) value
    (map? value) (let [doc (Document.)]
                   (doseq [[k v] value]
                     (.append doc (name k) (bson-value v)))
                   doc)
    (sequential? value) (let [xs (ArrayList.)]
                          (doseq [v value]
                            (.add xs (bson-value v)))
                          xs)
    (keyword? value) (name value)
    :else value))

(defn parse-date
  [value]
  (try
    (Date/from (Instant/parse (str value)))
    (catch Throwable _
      (Date.))))

(defn norm
  [value]
  (when-not (nil? value)
    (str value)))

(defn event->mongo-map
  [event]
  (let [source-ref (:source_ref event)
        meta (:meta event)]
    {:id (:id event)
     :ts (parse-date (:ts event))
     :source (:source event)
     :kind (:kind event)
     :project (norm (:project source-ref))
     :session (norm (:session source-ref))
     :message (norm (:message source-ref))
     :role (norm (:role meta))
     :author (norm (:author meta))
     :model (norm (:model meta))
     :tags (:tags meta)
     :text (norm (or (:text event) ""))
     :attachments (:attachments event)
     :extra (:extra event)
     :schema_version (:schema_version event)
     :migration_state (:migration_state event)}))

(defn document
  [m]
  (let [doc (Document.)]
    (doseq [[k v] m]
      (when-not (nil? v)
        (.append doc (name k) (bson-value v))))
    doc))

(defn upsert-event!
  [^MongoCollection events event]
  (let [now (Date.)
        row (event->mongo-map event)
        set-doc (doto (document row)
                  (.append "updatedAt" now))
        insert-doc (doto (Document.)
                     (.append "createdAt" now))]
    (.updateOne events
                (doto (Document.) (.append "_id" (:id event)))
                (doto (Document.)
                  (.append "$set" set-doc)
                  (.append "$setOnInsert" insert-doc))
                (doto (UpdateOptions.) (.upsert true)))))

(defn open-mongo
  [{:keys [mongo-uri mongo-db mongo-events mongo-graph-edges]}]
  (let [client (MongoClients/create mongo-uri)
        db (.getDatabase client mongo-db)
        events (.getCollection ^MongoDatabase db mongo-events)
        graph-edges (.getCollection ^MongoDatabase db mongo-graph-edges)]
    {:client client :db db :events events :graph-edges graph-edges}))

(defn close-mongo!
  [{:keys [client]}]
  (when client (.close client)))

(defn nonblank-string
  [value]
  (let [s (when-not (nil? value) (str/trim (str value)))]
    (when-not (str/blank? s) s)))

(defn doc-get
  [^Document doc k]
  (when doc (.get doc k)))

(defn event-extra-doc
  [^Document event]
  (let [extra (doc-get event "extra")]
    (when (instance? Document extra) extra)))

(defn graph-edge-row
  [^Document event]
  (let [extra (event-extra-doc event)
        source-node-id (nonblank-string (doc-get extra "source_node_id"))
        target-node-id (nonblank-string (doc-get extra "target_node_id"))
        edge-kind (or (nonblank-string (doc-get extra "edge_type"))
                      (nonblank-string (doc-get extra "edge_kind")))]
    (when (and source-node-id target-node-id edge-kind (not= source-node-id target-node-id))
      {:source-node-id source-node-id
       :target-node-id target-node-id
       :edge-kind edge-kind
       :layer (nonblank-string (doc-get extra "layer"))
       :project (nonblank-string (doc-get event "project"))
       :source (nonblank-string (doc-get event "source"))
       :data extra
       :updated-at (let [ts (doc-get event "ts")]
                     (if (instance? Date ts) ts (Date.)))})))

(defn graph-edge-upsert-model
  [{:keys [source-node-id target-node-id edge-kind layer project source data updated-at]}]
  (let [now (Date.)
        edge-id (str source-node-id "||" target-node-id "||" edge-kind)
        set-doc (doto (Document.)
                  (.append "source_node_id" source-node-id)
                  (.append "target_node_id" target-node-id)
                  (.append "edge_kind" edge-kind)
                  (.append "layer" layer)
                  (.append "project" project)
                  (.append "source" source)
                  (.append "data" data)
                  (.append "updated_at" updated-at)
                  (.append "updatedAt" now))
        insert-doc (doto (Document.)
                     (.append "createdAt" now))]
    (UpdateOneModel.
     (doto (Document.) (.append "_id" edge-id))
     (doto (Document.)
       (.append "$set" set-doc)
       (.append "$setOnInsert" insert-doc))
     (doto (UpdateOptions.) (.upsert true)))))

(defn flush-graph-edge-rows!
  [^MongoCollection graph-edges rows]
  (if (seq rows)
    (let [ops (ArrayList.)]
      (doseq [row rows]
        (.add ops (graph-edge-upsert-model row)))
      (.bulkWrite graph-edges ops (doto (BulkWriteOptions.) (.ordered false)))
      (count rows))
    0))

(defn run-graph-edges-backfill!
  [{:keys [graph-edges-backfill-limit graph-edges-backfill-batch-size graph-edges-backfill-log-every mongo-db mongo-events mongo-graph-edges] :as cfg}]
  (let [mongo (open-mongo cfg)]
    (try
      (let [events (:events mongo)
            graph-edges (:graph-edges mongo)
            total (.countDocuments ^MongoCollection events (doto (Document.) (.append "kind" "graph.edge")))
            limit (long graph-edges-backfill-limit)
            effective-total (if (pos? limit) (min total limit) total)
            cursor (-> events
                       (.find (doto (Document.) (.append "kind" "graph.edge")))
                       (.projection (doto (Document.)
                                      (.append "_id" 1)
                                      (.append "ts" 1)
                                      (.append "project" 1)
                                      (.append "source" 1)
                                      (.append "extra" 1)))
                       (.sort (doto (Document.) (.append "_id" 1)))
                       (.batchSize (int graph-edges-backfill-batch-size)))]
        (log! :info "clojure graph edges backfill started"
              {:mongo-db mongo-db
               :events-collection mongo-events
               :graph-edges-collection mongo-graph-edges
               :total total
               :effective-total effective-total
               :limit limit
               :batch-size graph-edges-backfill-batch-size})
        (loop [iter (.iterator cursor)
               completed 0
               stored 0
               failed 0
               buffer []]
          (if (and (.hasNext iter)
                   (or (not (pos? limit)) (< completed limit)))
            (let [event (.next iter)
                  row (graph-edge-row event)
                  completed* (inc completed)
                  failed* (if row failed (inc failed))
                  buffer* (if row (conj buffer row) buffer)
                  flush? (>= (count buffer*) graph-edges-backfill-batch-size)
                  stored* (if flush?
                            (+ stored (flush-graph-edge-rows! graph-edges buffer*))
                            stored)
                  buffer** (if flush? [] buffer*)]
              (when (or (zero? (mod completed* graph-edges-backfill-log-every))
                        (= completed* effective-total))
                (log! :info "clojure graph edges backfill progress"
                      {:completed completed*
                       :stored stored*
                       :failed failed*
                       :total total
                       :effective-total effective-total}))
              (recur iter completed* stored* failed* buffer**))
            (let [stored* (+ stored (flush-graph-edge-rows! graph-edges buffer))]
              (log! :info "clojure graph edges backfill complete"
                    {:completed completed
                     :stored stored*
                     :failed failed
                     :total total
                     :effective-total effective-total})))))
      (finally
        (close-mongo! mongo)))))

(defn run-audit!
  [{:keys [enabled topic audit-group-id audit-client-id] :as cfg}]
  (if-not enabled
    (log! :info "kafka audit consumer disabled" {:topic topic :group-id audit-group-id})
    (with-open [consumer (make-consumer cfg audit-group-id audit-client-id)]
      (.subscribe consumer [topic])
      (log! :info "clojure kafka audit consumer connected"
            {:brokers (:brokers cfg) :topic topic :group-id audit-group-id})
      (let [running (atom true)
            consumed (atom 0)
            last-log-ms (atom 0)]
        (.addShutdownHook (Runtime/getRuntime)
                          (Thread. #(reset! running false)))
        (while @running
          (let [records (.poll consumer (Duration/ofMillis 1000))]
            (doseq [record records]
              (let [payload (parse-json (.value record))
                    event (extract-event payload)
                    n (swap! consumed inc)
                    now-ms (System/currentTimeMillis)]
                (when (or (= n 1) (> (- now-ms @last-log-ms) 30000))
                  (reset! last-log-ms now-ms)
                  (log! :info "clojure kafka raw event audit heartbeat"
                        {:topic (.topic record)
                         :partition (.partition record)
                         :offset (.offset record)
                         :consumed n
                         :event-id (:id event)
                         :event-kind (:kind event)
                         :event-source (:source event)}))))
            (when (pos? (.count records))
              (.commitAsync consumer))))))))

(defn topic-partitions
  [consumer topic]
  (->> (.partitionsFor consumer topic)
       (map #(TopicPartition. topic (.partition %)))
       vec))

(defn resolve-start-offset
  [raw low high]
  (case (str/lower-case (str/trim (or raw "earliest")))
    ("" "earliest" "low" "beginning") low
    ("latest" "high" "end") high
    (let [n (parse-long* raw low)]
      (min high (max low n)))))

(defn resolve-end-offset
  [raw start high]
  (case (str/lower-case (str/trim (or raw "latest")))
    ("" "latest" "high" "end") high
    (let [n (parse-long* raw high)]
      (min high (max start n)))))

(defn offset-plans
  [consumer topic start-raw end-raw]
  (let [parts (topic-partitions consumer topic)
        lows (.beginningOffsets consumer parts)
        highs (.endOffsets consumer parts)]
    (->> parts
         (map (fn [tp]
                (let [low (long (.get lows tp))
                      high (long (.get highs tp))
                      start (resolve-start-offset start-raw low high)
                      end (resolve-end-offset end-raw start high)]
                  {:tp tp :partition (.partition tp) :low low :high high :start start :end end})))
         (filter #(< (:start %) (:end %)))
         vec)))

(defn seek-plans!
  [consumer plans]
  (.assign consumer (mapv :tp plans))
  (doseq [{:keys [tp start]} plans]
    (.seek consumer tp start)))

(defn commit-offset!
  [consumer record]
  (let [tp (TopicPartition. (.topic record) (.partition record))
        next-offset (inc (.offset record))]
    (.commitSync consumer {tp (OffsetAndMetadata. next-offset)})))

(defn run-replay!
  [{:keys [enabled topic replay-group-id replay-client-id replay-start-offset replay-end-offset replay-max-messages replay-log-every replay-dry-run] :as cfg}]
  (if-not enabled
    (log! :info "kafka replay worker disabled" {:topic topic :group-id replay-group-id})
    (with-open [consumer (make-consumer cfg replay-group-id replay-client-id)]
      (let [plans (offset-plans consumer topic replay-start-offset replay-end-offset)
            plan-by-partition (into {} (map (juxt :partition identity) plans))
            done (atom #{})
            processed (atom 0)
            upserted (atom 0)
            invalid (atom 0)
            skipped (atom 0)
            mongo (when-not replay-dry-run (open-mongo cfg))]
        (try
          (log! :info "clojure kafka replay plan"
                {:brokers (:brokers cfg)
                 :topic topic
                 :group-id replay-group-id
                 :dry-run replay-dry-run
                 :max-messages replay-max-messages
                 :partitions (mapv #(select-keys % [:partition :low :high :start :end]) plans)})
          (if (or (empty? plans) (zero? replay-max-messages))
            (log! :info "clojure kafka replay nothing to do" {:topic topic})
            (do
              (seek-plans! consumer plans)
              (while (and (< @processed replay-max-messages)
                          (< (count @done) (count plans)))
                (let [records (.poll consumer (Duration/ofMillis 1000))]
                  (doseq [record records]
                    (when (< @processed replay-max-messages)
                      (let [plan (get plan-by-partition (.partition record))
                            offset (.offset record)]
                        (cond
                          (nil? plan)
                          (swap! skipped inc)

                          (< offset (:start plan))
                          (do (swap! skipped inc)
                              (commit-offset! consumer record))

                          (>= offset (:end plan))
                          (swap! done conj (.partition record))

                          :else
                          (try
                            (let [event (-> record .value parse-json extract-event)]
                              (validate-event! event)
                              (when-not replay-dry-run
                                (upsert-event! (:events mongo) event)
                                (swap! upserted inc))
                              (let [n (swap! processed inc)]
                                (when (or (= n 1) (zero? (mod n replay-log-every)))
                                  (log! :info "clojure kafka replay progress"
                                        {:topic topic
                                         :partition (.partition record)
                                         :offset offset
                                         :processed n
                                         :upserted @upserted
                                         :dry-run replay-dry-run
                                         :event-id (:id event)
                                         :event-kind (:kind event)})))
                              (commit-offset! consumer record)
                              (when (>= (inc offset) (:end plan))
                                (swap! done conj (.partition record))))
                            (catch Throwable t
                              (swap! invalid inc)
                              (warn! "clojure kafka replay skipped invalid event"
                                     {:topic topic
                                      :partition (.partition record)
                                      :offset offset
                                      :error (.getMessage t)})
                              (commit-offset! consumer record)))))))))))
          (log! :info "clojure kafka replay complete"
                {:topic topic
                 :dry-run replay-dry-run
                 :processed @processed
                 :upserted @upserted
                 :invalid @invalid
                 :skipped @skipped})
          (finally
            (when mongo (close-mongo! mongo))))))))

(defn run-check!
  [cfg]
  (log! :info "clojure kafka worker config ok"
        (-> cfg
            (select-keys [:enabled :brokers :topic :replay-dry-run :replay-start-offset :replay-end-offset :replay-max-messages])
            (assoc :mongo-db (:mongo-db cfg)
                   :mongo-events (:mongo-events cfg)
                   :mongo-graph-edges (:mongo-graph-edges cfg)))))

(defn -main
  [& args]
  (let [mode (or (first args) "audit")
        cfg (config)]
    (case mode
      "audit" (run-audit! cfg)
      "replay" (run-replay! cfg)
      "graph-edges-backfill" (run-graph-edges-backfill! cfg)
      "check" (run-check! cfg)
      (do
        (binding [*out* *err*]
          (println "usage: clj -M -m openplanner.kafka.jobs [audit|replay|graph-edges-backfill|check]"))
        (System/exit 2)))
    (shutdown-agents)))
