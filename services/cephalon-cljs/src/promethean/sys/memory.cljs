(ns promethean.sys.memory
  (:require
    [promethean.debug.log :as log]
    [promethean.openplanner.client :as openplanner]
    [promethean.memory.model :as mm]
    [promethean.memory.dedupe :as dedupe]
    [promethean.memory.tags :as tags]
    [promethean.eidolon.nexus-keys :as nk]
    [promethean.memory.store :as ms]))

(defn- emit [w evt]
  (update w :events-out conj evt))

(defn- make-created-event [mem]
  {:event/id (str (random-uuid))
   :event/ts (.now js/Date)
   :event/type :memory/created
   :event/source {:kind :memory}
   :event/payload {:memory mem}})

(defn- iso-ts [ms]
  (.toISOString (js/Date. ms)))

(defn- memory->openplanner-event [mem]
  (let [meta (:memory/meta mem)
        source-ref (cond-> {:session (or (:memory/session-id mem)
                                         (:session/id meta)
                                         "unknown")}
                     (:memory/event-id mem) (assoc :message (:memory/event-id mem))
                     (:discord/message-id meta) (assoc :message (:discord/message-id meta)))]
    {:schema "openplanner.event.v1"
     :id (:memory/id mem)
     :ts (iso-ts (:memory/ts mem))
     :source "cephalon-cljs"
     :kind "memory.created"
     :source_ref source-ref
     :text (:memory/text mem)
     :meta {:memory_kind (name (:memory/kind mem))
            :role (name (:memory/role mem))}
     :extra {:memory_id (:memory/id mem)
             :memory_ts (:memory/ts mem)
             :memory_meta meta
             :memory_tags (:memory/tags mem)
             :memory_nexus_keys (:memory/nexus-keys mem)}}))

(def openplanner-post-events! openplanner/post-events!)

(defn- emit-openplanner-memory-created! [w mem]
  (let [cfg (merge (openplanner/config-from-env)
                   (get-in w [:env :config :openplanner]))
        event (memory->openplanner-event mem)]
    (when (seq (:api-key cfg))
      (try
        (-> (openplanner-post-events! cfg [event])
            (.catch
              (fn [err]
                (log/error "OpenPlanner memory ingestion failed"
                           {:error (str err)
                            :memory-id (:memory/id mem)
                            :openplanner-url (:url cfg)})
                nil)))
        (catch js/Error err
          (log/error "OpenPlanner memory ingestion threw synchronously"
                     {:error (str err)
                      :memory-id (:memory/id mem)
                      :openplanner-url (:url cfg)}))))))

(defn- event->memory [evt]
  (let [t (:event/type evt)]
    (case t
      :discord.message/new
      (let [p (:event/payload evt)
            src (:event/source evt)
            content (or (:content p) "")
            mem (mm/base-memory
                  {:kind :discord
                   :role :user
                   :ts (:event/ts evt)
                   :text content
                   :meta {:discord/channel-id (:channel-id src)
                          :discord/author-id (:author-id src)
                          :discord/message-id (:message-id src)
                          :discord/author-bot (:author-bot p)}})]
        mem)

      :fs.file/created
      (mm/base-memory {:kind :fs :role :tool :ts (:event/ts evt)
                       :text (str "file created: " (get-in evt [:event/payload :path]))
                       :meta {:fs/path (get-in evt [:event/payload :path])}})

      :fs.file/modified
      (mm/base-memory {:kind :fs :role :tool :ts (:event/ts evt)
                       :text (str "file modified: " (get-in evt [:event/payload :path]))
                       :meta {:fs/path (get-in evt [:event/payload :path])}})

      nil)))

(defn sys-memory-ingest [w]
  (let [store (get-in w [:env :stores :mem])
        events (:events-in w)]
    (reduce
      (fn [w evt]
        (if-let [mem0 (event->memory evt)]
          (let [dkey (dedupe/dedupe-key evt)
                tgs (tags/tags-for-event evt)
                mem1 (-> mem0
                         (assoc :memory/dedupe-key dkey)
                         (assoc :memory/tags tgs))
                mem2 (assoc mem1 :memory/nexus-keys (nk/keys-for-memory mem1))]
            (ms/put-memory! store mem2)
            (emit-openplanner-memory-created! w mem2)
            ;; Emit created event regardless; downstream can choose to ignore deduped via store stats
            (emit w (make-created-event mem2)))
          w))
      w
      events)))
