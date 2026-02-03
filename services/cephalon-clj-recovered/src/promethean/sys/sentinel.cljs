(ns promethean.sys.sentinel
  (:require
    [promethean.ecs.world :as world]
    [promethean.contracts.markdown-frontmatter :as fm]))

(defn bootstrap-docs-notes-sentinel [w]
  (let [eid (str (random-uuid))]
    (world/add-entity
      w eid
      {:sentinel/name "notes-frontmatter"
       :sentinel/state :idle
       :sentinel/retries {:attempt 0 :max 5}
       :sentinel/input nil
       :sentinel/awaiting nil
       :sentinel/error nil})))

(defn- enqueue-effect [w eff]
  (update w :effects conj eff))

(defn- find-awaiting [events etype awaiting-id]
  (first
    (filter
      (fn [evt]
        (and (= (:event/type evt) etype)
             (= (get-in evt [:event/payload :effect-id]) awaiting-id)))
      events)))

(defn- retry-or-fail [w sentinel-eid reason]
  (let [{:keys [attempt max]} (get-in (world/get-entity w sentinel-eid) [:sentinel/retries])]
    (if (< attempt max)
      (-> w
          (world/update-entity sentinel-eid
                               (fn [s]
                                 (-> s
                                     (update-in [:sentinel/retries :attempt] inc)
                                     (assoc :sentinel/state :retry
                                            :sentinel/error reason
                                            :sentinel/awaiting nil)))))
      (world/update-entity w sentinel-eid assoc
                           :sentinel/state :failed
                           :sentinel/error reason
                           :sentinel/awaiting nil))))

(defn- llm-prompt [md attempt]
  (str
    "You are a contract agent. Add YAML frontmatter with keys:\n"
    "- title: string\n"
    "- slug: string (lowercase, dash separated)\n"
    "- description: string\n"
    "- tags: list of strings\n\n"
    "Return the full updated markdown file.\n\n"
    (when (pos? attempt)
      (str "NOTE: You previously failed validation. Ensure frontmatter matches requirements exactly.\n\n"))
    "INPUT:\n"
    md))

(defn- start-read [w sentinel-eid path]
  (let [effect-id (str (random-uuid))]
    (-> w
        (world/update-entity sentinel-eid assoc
                             :sentinel/state :reading
                             :sentinel/input {:path path}
                             :sentinel/awaiting effect-id
                             :sentinel/error nil)
        (enqueue-effect {:effect/type :fs/read
                         :effect/id effect-id
                         :path path
                         :meta {:sentinel sentinel-eid}}))))

(defn- start-llm [w sentinel-eid md]
  (let [effect-id (str (random-uuid))
        model (get-in w [:env :config :models :sentinel] "qwen3-vl-2b")
        attempt (get-in (world/get-entity w sentinel-eid) [:sentinel/retries :attempt] 0)]
    (-> w
        (world/update-entity sentinel-eid assoc :sentinel/state :llm :sentinel/awaiting effect-id)
        (enqueue-effect {:effect/type :llm/chat
                         :effect/id effect-id
                         :model model
                         :messages [{:role "system" :content "Return only the updated markdown file. No commentary."}
                                    {:role "user" :content (llm-prompt md attempt)}]
                         :temperature 0
                         :meta {:sentinel sentinel-eid}}))))

(defn- start-write [w sentinel-eid path md]
  (let [effect-id (str (random-uuid))]
    (-> w
        (world/update-entity sentinel-eid assoc :sentinel/state :writing :sentinel/awaiting effect-id)
        (enqueue-effect {:effect/type :fs/write
                         :effect/id effect-id
                         :path path
                         :content md
                         :meta {:sentinel sentinel-eid}}))))

(defn sys-sentinel [w]
  (let [sentinels (world/entities-with w [:sentinel/name :sentinel/state])
        events (:events/in w)]
    (reduce
      (fn [w seid]
        (let [s (world/get-entity w seid)
              st (:sentinel/state s)
              awaiting (:sentinel/awaiting s)]
          (cond
            (= st :idle)
            (if-let [evt (first (filter #(#{:fs.file/created :fs.file/modified} (:event/type %)) events))]
              (start-read w seid (get-in evt [:event/payload :path]))
              w)

            (= st :reading)
            (cond
              (find-awaiting events :fs/read.error awaiting)
              (retry-or-fail w seid "fs/read failed")

              (let [evt (find-awaiting events :fs/read.result awaiting)]
                (when evt
                  (let [md (get-in evt [:event/payload :result])]
                    (start-llm (world/update-entity w seid assoc :sentinel/awaiting nil) seid md))))

              :else w)

            (= st :llm)
            (cond
              (find-awaiting events :llm/chat.error awaiting)
              (retry-or-fail w seid "llm/chat failed")

              (let [evt (find-awaiting events :llm/chat.result awaiting)]
                (when evt
                  (let [resp (get-in evt [:event/payload :result])
                        content (get-in resp [:choices 0 :message :content] "")
                        path (get-in s [:sentinel/input :path])]
                    (if (fm/valid-frontmatter? content)
                      (start-write (world/update-entity w seid assoc :sentinel/awaiting nil) seid path content)
                      (retry-or-fail w seid "frontmatter validation failed"))))

              :else w)

            (= st :writing)
            (cond
              (find-awaiting events :fs/write.error awaiting)
              (retry-or-fail w seid "fs/write failed")

              (find-awaiting events :fs/write.result awaiting)
              (world/update-entity w seid assoc :sentinel/state :done :sentinel/awaiting nil)

              :else w)

            (= st :retry)
            (let [path (get-in s [:sentinel/input :path])]
              (start-read (world/update-entity w seid assoc :sentinel/state :idle) seid path))

            :else w)))
      w
      sentinels)))
