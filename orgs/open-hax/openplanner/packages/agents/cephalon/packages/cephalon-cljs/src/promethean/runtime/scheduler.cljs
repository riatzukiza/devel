(ns promethean.runtime.scheduler
  "Temporal scheduling for circuit ticks with jitter and backoff."
  (:require
    [promethean.debug.log :as log]))

;; ============================================================================
;; Jitter Calculation
;; ============================================================================

(defn stable-hash-32 [s]
  (reduce (fn [hash c]
            (let [h (bit-xor hash (int c))
                  h (bit-and (* h 16777619) 0xFFFFFFFF)]
              h))
          2166136261
          s))

(defn compute-jitter-ms [seed max-jitter-ms]
  (if (<= max-jitter-ms 0)
    0
    (mod (stable-hash-32 seed) (inc max-jitter-ms))))

(defn resolve-initial-delay-ms [{:keys [bot-id session-id interval-ms max-jitter-ms]}]
  (let [interval-ms (max 1 interval-ms)
        bounded-jitter (min max-jitter-ms (max 0 (- interval-ms 1000)))]
    (+ interval-ms (compute-jitter-ms (str bot-id ":" session-id) bounded-jitter))))

;; ============================================================================
;; Scheduler State
;; ============================================================================

(defn make-scheduler []
  {:schedules (atom {})
   :stats (atom {:scheduled 0 :fired 0 :cancelled 0 :errors 0})})

(defn- now-ms [] (.now js/Date))

;; ============================================================================
;; Scheduling
;; ============================================================================

(defn schedule-circuit!
  "Schedule a circuit tick after delay-ms."
  [scheduler circuit-id callback delay-ms interval-ms]
  (let [schedules (:schedules scheduler)
        schedule-id (str "circuit:" circuit-id ":tick")
        armed-at (now-ms)
        due-at (+ armed-at delay-ms)]
    ;; Cancel existing schedule if any
    (when-let [existing (get @schedules schedule-id)]
      (js/clearTimeout (:timeout existing)))
    ;; Schedule new tick
    (let [timeout (js/setTimeout
                    (fn []
                      (try
                        (callback circuit-id)
                        (catch js/Error err
                          (log/error "Circuit tick failed"
                                     {:circuit circuit-id :error (str err)})
                          (swap! (:stats scheduler) update :errors inc)))
                      (swap! (:stats scheduler) update :fired inc))
                    delay-ms)]
      (swap! schedules assoc schedule-id
             {:schedule-id schedule-id
              :circuit-id circuit-id
              :timeout timeout
              :armed-at armed-at
              :due-at due-at
              :interval-ms interval-ms
              :callback callback})
      (swap! (:stats scheduler) update :scheduled inc)
      {:schedule-id schedule-id
       :due-at due-at
       :interval-ms interval-ms})))

(defn cancel-circuit!
  "Cancel a scheduled circuit tick."
  [scheduler circuit-id]
  (let [schedules (:schedules scheduler)
        schedule-id (str "circuit:" circuit-id ":tick")]
    (when-let [existing (get @schedules schedule-id)]
      (js/clearTimeout (:timeout existing))
      (swap! schedules dissoc schedule-id)
      (swap! (:stats scheduler) update :cancelled inc)
      true)))

(defn reschedule-circuit!
  "Reschedule a circuit with backoff on error."
  [scheduler circuit-id callback interval-ms error-count]
  (let [backoff-factor (min 4 (js/Math.pow 2 error-count))
        jitter (compute-jitter-ms (str circuit-id ":" (now-ms)) 5000)
        delay-ms (+ interval-ms (* jitter backoff-factor))]
    (schedule-circuit! scheduler circuit-id callback delay-ms interval-ms)))

(defn get-next-due
  "Get the next circuit due for tick."
  [scheduler]
  (let [schedules @(:schedules scheduler)
        now (now-ms)]
    (->> (vals schedules)
         (filter #(> (:due-at %) now))
         (sort-by :due-at)
         first)))

(defn stats
  "Get scheduler statistics."
  [scheduler]
  @(:stats scheduler))
