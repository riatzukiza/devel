(ns promethean.sys.cephalon
  (:require
    [clojure.string :as str]
    [promethean.ecs.world :as world]
    [promethean.memory.store :as ms]
    [promethean.eidolon.nexus-index :as ni]))

(defn bootstrap-duck [w]
  (let [ceph-eid (str (random-uuid))
        sess-eid (str (random-uuid))]
    (-> w
        (world/add-entity ceph-eid
                          {:cephalon/name "Duck"
                           :cephalon/policy {:model "qwen3-vl-2b"
                                             :max-tokens 768
                                             :report-channel-id "450688080542695436"
                                             :related-k 10}
                           :cephalon/shared-state {}
                           :cephalon/sessions #{sess-eid}})
        (world/add-entity sess-eid
                          {:session/name "janitor"
                           :session/cephalon ceph-eid
                           :session/circuit :c1-survival
                           :session/focus "mvp janitor"
                           :session/subscriptions
                           {:hard-locked true
                            :filters [{:event/type :discord.message/new :discord/channel-id "343299242963763200"}
                                      {:event/type :discord.message/new :discord/channel-id "450688080542695436"}
                                      {:event/type :discord.message/new :discord/channel-id "343179912196128792"}
                                      {:event/type :discord.message/new :discord/channel-id "367156652140658699"}]}
                           :session/queue []
                           :session/recent []
                           :session/persistent []
                           :session/status :idle
                           :session/awaiting nil
                           :session/budgets {:llm-per-tick 1}}))))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- take-queue [s n]
  (let [q (:session/queue s)]
    [(vec (take n q)) (vec (drop n q))]))

(defn- find-awaiting [events etype awaiting-id]
  (first
    (filter
      (fn [evt]
        (and (= (:event/type evt) etype)
             (= (get-in evt [:event/payload :effect-id]) awaiting-id)))
      events)))

(defn- event->recent-line [evt]
  (case (:event/type evt)
    :discord.message/new
    (let [p (:event/payload evt)]
      (str "discord[" (get-in evt [:event/source :channel-id]) "] "
           (when (true? (:author-bot p)) "[bot] ")
           (subs (or (:content p) "") 0 (min 300 (count (or (:content p) ""))))))
    :fs.file/created  (str "file created: " (get-in evt [:event/payload :path]))
    :fs.file/modified (str "file modified: " (get-in evt [:event/payload :path]))
    (str "event: " (pr-str (:event/type evt)))))

(defn- memory->msg [mem]
  {:role "system"
   :content (str "related-memory:\n"
                 "tags: " (pr-str (:memory/tags mem)) "\n"
                 (:memory/text mem))})

(defn- build-messages [{:keys [ceph recent-lines related-mems persistent-lines]}]
  (let [sys (str "You are " (:cephalon/name ceph) ". You are always running.\n"
                 "You are cleaning bot spam and duplicates. Keep output short and operational.\n")
        recent (str "Recent events:\n"
                    (str/join "\n" (map #(str "- " %) recent-lines)))
        persistent (when (seq persistent-lines)
                     (str "\nPersistent:\n" (str/join "\n" (map #(str "- " %) persistent-lines))))
        user (str recent persistent "\n\nReturn:\n"
                  "1) one-line status\n"
                  "2) spam families/duplicates (bullets)\n"
                  "3) recommended action (one bullet)")]
    (vec (concat
           [{:role "system" :content sys}]
           (map memory->msg related-mems)
           [{:role "user" :content user}]))))

(defn- pick-related [w query-text k]
  (let [mem-store (get-in w [:env :stores :mem])
        nexus (get-in w [:env :stores :nexus])
        ;; nexus seed keys from heuristic tags (MVP)
        q (str/lower-case (or query-text ""))
        seed-keys (cond-> []
                    (str/includes? q "error") (conj "tag:ops/error")
                    (str/includes? q "timeout") (conj "tag:ops/timeout")
                    (str/includes? q "discord") (conj "tag:topic/discord")
                    (str/includes? q "spam") (conj "tag:ops/spam"))
        neighbor-scores (ni/neighbors nexus seed-keys)
        neighbor-ids (->> neighbor-scores
                          (sort-by val >)
                          (map key)
                          (take (or k 10)))
        mems (keep #(ms/get-memory mem-store %) neighbor-ids)]
    (doseq [m mems] (ms/inc-usage! mem-store (:memory/id m)))
    mems))

(defn sys-cephalon [w]
  (let [session-eids (world/entities-with w [:session/name :session/status :session/queue])
        events (:events-in w)]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              status (:session/status s)
              awaiting (:session/awaiting s)
              ceph (world/get-entity w (:session/cephalon s))
              {:keys [llm-per-tick]} (:session/budgets s)]
          (cond
            (and (= status :idle) (pos? llm-per-tick) (seq (:session/queue s)))
            (let [[taken remaining] (take-queue s 8)
                  recent-lines (map event->recent-line taken)
                  query-text (str/join "\n" recent-lines)
                  related-k (get-in ceph [:cephalon/policy :related-k] 10)
                  related-mems (pick-related w query-text related-k)
                  model (get-in ceph [:cephalon/policy :model])
                  max-tokens (get-in ceph [:cephalon/policy :max-tokens])
                  effect-id (str (random-uuid))
                  messages (build-messages {:ceph ceph
                                           :recent-lines recent-lines
                                           :related-mems related-mems
                                           :persistent-lines []})]
              (-> w
                  (world/update-entity seid assoc
                                       :session/queue remaining
                                       :session/recent (vec (take-last 48 (concat (:session/recent s) recent-lines)))
                                       :session/status :blocked
                                       :session/awaiting effect-id)
                  (enqueue-effect {:effect/type :llm/chat
                                   :effect/id effect-id
                                   :model model
                                   :messages messages
                                   :temperature 0
                                   :max-tokens max-tokens
                                   :meta {:session seid}})))

            (= status :blocked)
            (cond
              (find-awaiting events :llm/chat.error awaiting)
              (world/update-entity w seid assoc :session/status :idle :session/awaiting nil)

              :else
              (if-let [evt (find-awaiting events :llm/chat.result awaiting)]
                (let [resp (get-in evt [:event/payload :result])
                      content (get-in resp [:choices 0 :message :content] "")
                      report-chan (get-in ceph [:cephalon/policy :report-channel-id])
                      send-id (str (random-uuid))]
                  (-> w
                      (world/update-entity seid assoc :session/status :idle :session/awaiting nil :session/last-llm evt)
                      (enqueue-effect {:effect/type :discord/send
                                       :effect/id send-id
                                       :channel-id report-chan
                                       :content (str "**janitor report**\n" content)
                                       :meta {:session seid}})))
                w))

            :else w)))
      w
      session-eids)))
