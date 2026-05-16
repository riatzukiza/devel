(ns voxx.queue
  "TTS processing queue with concurrency limiting."
  (:import [java.util.concurrent Semaphore TimeUnit]))

(defrecord TtsQueue [semaphore max-concurrent max-pending timeout-seconds state])

(defn create-tts-queue
  "Create a TTS processing queue with the given limits."
  [{:keys [max-concurrent max-pending timeout-seconds]
    :or {max-concurrent 1 max-pending 32 timeout-seconds 120.0}}]
  (let [mc (max 1 max-concurrent)
        mp (max 0 max-pending)]
    (->TtsQueue
     (Semaphore. mc)
     mc
     mp
     (max 0.1 timeout-seconds)
     (atom {:active 0 :waiting 0}))))

(defn- check-capacity!
  "Check if the queue has capacity. Throws if full."
  [queue]
  (let [{:keys [active waiting]} @(:state queue)]
    (when (and (>= active (:max-concurrent queue))
               (>= waiting (:max-pending queue)))
      (throw (ex-info (format "TTS queue is full: active=%d, waiting=%d, max_concurrent=%d, max_pending=%d"
                              active waiting (:max-concurrent queue) (:max-pending queue))
                      {:type :tts-queue-full
                       :active active
                       :waiting waiting
                       :max-concurrent (:max-concurrent queue)
                       :max-pending (:max-pending queue)})))))

(defn acquire-slot!
  "Acquire a slot in the TTS queue.
   Returns the wait time in seconds. Throws TtsQueueFull on timeout."
  [queue]
  (check-capacity! queue)
  (swap! (:state queue) update :waiting inc)
  (let [start (System/nanoTime)]
    (try
      (let [acquired (.tryAcquire ^Semaphore (:semaphore queue)
                                  (long (* (:timeout-seconds queue) 1000))
                                  TimeUnit/MILLISECONDS)]
        (swap! (:state queue) update :waiting dec)
        (if acquired
          (do (swap! (:state queue) update :active inc)
              (/ (- (System/nanoTime) start) 1e9))
          (throw (ex-info (format "Timed out waiting for TTS queue after %.1fs" (:timeout-seconds queue))
                          {:type :tts-queue-full
                           :timeout-seconds (:timeout-seconds queue)}))))
      (catch Exception e
        (swap! (:state queue) update :waiting dec)
        (throw e)))))

(defn release-slot!
  "Release a slot in the TTS queue."
  [queue]
  (swap! (:state queue) update :active dec)
  (.release ^Semaphore (:semaphore queue)))

(defmacro with-tts-slot
  "Execute body with a TTS queue slot acquired.
   Binds wait-seconds to the given symbol."
  [queue wait-sym & body]
  `(let [~wait-sym (acquire-slot! ~queue)]
     (try
       ~@body
       (finally
         (release-slot! ~queue)))))

(defn queue-payload
  "Get the current queue state as a map."
  [queue]
  (let [{:keys [active waiting]} @(:state queue)]
    {:active         active
     :waiting        waiting
     :max_concurrent (:max-concurrent queue)
     :max_pending    (:max-pending queue)
     :timeout_seconds (:timeout-seconds queue)}))
