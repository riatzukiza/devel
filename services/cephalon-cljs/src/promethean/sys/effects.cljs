(ns promethean.sys.effects
  (:require
    [promethean.llm.openai :as llm.openai]
    [promethean.adapters.fs :as fs]
    [promethean.adapters.discord :as discord]))

(defn now-ms [] (.now js/Date))

(defn- effect->evt-type [etype suffix]
  (let [ns (or (namespace etype) "effect")
        nm (name etype)]
    (keyword ns (str nm "." suffix))))

(defn- make-event [{:keys [type source payload]}]
  {:event/id (str (random-uuid))
   :event/ts (now-ms)
   :event/type type
   :event/source source
   :event/payload payload})

(defn- append-event! [world* evt]
  (swap! world* update :events-out conj evt))

(defn- update-pending! [world* effect-id f & args]
  (apply swap! world* update-in [:effects/pending effect-id] f args))

(defn- bump-stat! [world* k]
  (swap! world* update-in [:effects/stats k] (fnil inc 0)))

(defn- promise-timeout [p timeout-ms]
  (if (and timeout-ms (pos? timeout-ms))
    (js/Promise.race
      #js [p
           (js/Promise.
             (fn [_resolve reject]
               (js/setTimeout
                 (fn [] (reject (js/Error. (str "effect timeout after " timeout-ms "ms"))))
                 timeout-ms)))])
    p))

(defn- run-effect-promise! [env effect]
  (let [etype (:effect/type effect)]
    (case etype
      :fs/read
      (fs/read-file! (get-in env [:adapters :fs]) (:path effect))

      :fs/write
      (fs/write-file! (get-in env [:adapters :fs]) (:path effect) (:content effect))

      :llm/chat
      (let [client (get-in env [:clients :openai])]
        (llm.openai/chat! client (select-keys effect
                                              [:model :messages :tools :tool-choice :temperature :max-tokens])))

      :llm/embed
      (let [client (get-in env [:clients :openai])]
        (llm.openai/embed! client (select-keys effect [:model :input])))

      :discord/send
      (discord/send-message! (get-in env [:adapters :discord])
                             (:channel-id effect)
                             (:content effect))

      (js/Promise.reject (js/Error. (str "unknown effect type: " (pr-str etype)))))))

(defn- start-effect! [env world* effect]
  (let [cfg (get-in env [:config :runtime :effects] {})
        timeout-ms (get cfg :timeout-ms 60000)
        effect-id (:effect/id effect)
        etype (:effect/type effect)
        started-ts (now-ms)]

    (update-pending! world* effect-id
                     (fn [m]
                       (-> m
                           (assoc :status :running
                                  :started-ts started-ts)
                           (update :effect merge effect))))

    (bump-stat! world* :started)

    (-> (run-effect-promise! env effect)
        (promise-timeout timeout-ms)
        (.then
          (fn [res]
            (let [evt (make-event
                        {:type (effect->evt-type etype "result")
                         :source {:kind :effects :effect-id effect-id}
                         :payload {:effect-id effect-id
                                   :effect effect
                                   :result (js->clj res :keywordize-keys true)}})]
              (update-pending! world* effect-id assoc :status :done :done-ts (now-ms))
              (bump-stat! world* :done)
              (append-event! world* evt)
              nil)))
        (.catch
          (fn [err]
            (let [evt (make-event
                        {:type (effect->evt-type etype "error")
                         :source {:kind :effects :effect-id effect-id}
                         :payload {:effect-id effect-id
                                   :effect effect
                                   :error (str err)}})]
              (update-pending! world* effect-id assoc :status :failed :done-ts (now-ms) :error (str err))
              (bump-stat! world* :failed)
              (append-event! world* evt)
              nil))))))

(defn- inflight-count [pending]
  (reduce (fn [n [_ v]] (if (= :running (:status v)) (inc n) n))
          0
          pending))

(defn- queued-entries [pending]
  (->> pending
       (keep (fn [[id v]] (when (= :queued (:status v)) [id v])))
       (sort-by (fn [[id v]] [(get v :enqueued-ts 0) id]))))

(defn- prune-completed [pending retain]
  (let [retain (or retain 500)
        completed (->> pending
                       (filter (fn [[_id v]] (#{:done :failed} (:status v))))
                       (sort-by (fn [[_id v]] (:done-ts v)) >))
        keep-ids (into #{} (map first) (take retain completed))]
    (reduce (fn [m [id v]]
              (if (or (#{:running :queued} (:status v))
                      (contains? keep-ids id))
                (assoc m id v)
                m))
            {}
            pending)))

(defn- enqueue-pending [w effects]
  (reduce
    (fn [w eff]
      (let [eid (:effect/id eff)]
        (if (get-in w [:effects/pending eid])
          w
          (assoc-in w [:effects/pending eid]
                    {:effect (assoc eff :effect/enqueued-ts (now-ms))
                     :status :queued
                     :enqueued-ts (now-ms)}))))
    w
    effects))

(defn sys-effects-flush [w]
  (let [env (:env w)
        world* (get-in env [:runtime :world*])
        cfg (get-in env [:config :runtime :effects] {})
        max-inflight (get cfg :max-inflight 8)
        retain (get cfg :retain-completed 600)

        w1 (enqueue-pending w (:effects w))
        pending1 (:effects/pending w1)

        pending2 (prune-completed pending1 retain)
        w2 (assoc w1 :effects/pending pending2)

        inflight (inflight-count pending2)
        capacity (max 0 (- max-inflight inflight))
        to-start (take capacity (queued-entries pending2))

        w3 (reduce
             (fn [w [id v]]
               (assoc-in w [:effects/pending id]
                         (assoc v :status :running :started-ts (now-ms))))
             w2
             to-start)]

    (when (and world* (seq to-start))
      (doseq [[_id v] to-start]
        (start-effect! env world* (:effect v))))

    w3))
