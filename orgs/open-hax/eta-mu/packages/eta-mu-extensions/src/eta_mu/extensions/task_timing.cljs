(ns eta-mu.extensions.task-timing
  "Task timing extension - shows live inference vs tool wait split.

  Tracks agent loop timing and displays:
  - Total wall time
  - Approximate inference time (total - tool wait)
  - Tool wait time (time waiting for tool execution)

  Migrated from: ~/.ημ/agent/extensions/task-timing.ts"
  (:require-macros [eta-mu.core :as em]))

(def GLOBAL-KEY "__pi_task_timing_state__")
(def STATUS-KEY "task-timing")

(defn get-state []
  (let [g js/globalThis]
    (if (aget g GLOBAL-KEY)
      (aget g GLOBAL-KEY)
      (let [fresh #js {:enabled true
                       :running false
                       :agentStartMs 0
                       :toolActiveCount 0
                       :toolWaitTotalMs 0}]
        (aset g GLOBAL-KEY fresh)
        fresh))))

(defn clear-interval-safe [state]
  (when-let [interval (aget state "interval")]
    (js/clearInterval interval)
    (aset state "interval" nil)))

(defn- ui-handle [ctx]
  (when (and ctx (aget ctx "hasUI"))
    (aget ctx "ui")))

(defn- ui-set-status! [ctx value]
  (when-let [ui (ui-handle ctx)]
    (when-let [set-status (aget ui "setStatus")]
      (.call ^js set-status ui STATUS-KEY value))))

(defn- ui-notify! [ctx message level]
  (when-let [ui (ui-handle ctx)]
    (when-let [notify (aget ui "notify")]
      (.call ^js notify ui message level))))

(defn fmt-ms [ms]
  (let [ms (if (and (number? ms) (>= ms 0)) ms 0)]
    (cond
      (< ms 1000) (str (js/Math.round ms) "ms")
      (< (/ ms 1000) 60) (str (.toFixed (/ ms 1000) 1) "s")
      :else (let [m (js/Math.floor (/ ms 60000))
                  rs (js/Math.floor (mod (/ ms 1000) 60))]
              (str m "m" (.padStart (str rs) 2 "0") "s")))))

(defn pct [n d]
  (if (<= d 0) 0
    (max 0 (min 1 (/ n d)))))

(defn compute-stats [state now-ms]
  (let [total-ms (- now-ms (aget state "agentStartMs"))
        tool-wait-ms (+ (aget state "toolWaitTotalMs")
                        (if (and (> (aget state "toolActiveCount") 0)
                                 (some? (aget state "toolSegmentStartMs")))
                          (- now-ms (aget state "toolSegmentStartMs"))
                          0))
        inference-ms (- total-ms tool-wait-ms)
        tool-p (pct tool-wait-ms total-ms)
        inf-p (- 1 tool-p)]
    #js {:totalMs total-ms
         :toolWaitMs tool-wait-ms
         :inferenceMs inference-ms
         :toolP tool-p
         :infP inf-p}))

(defn render-status [state now-ms]
  (let [stats (compute-stats state now-ms)
        inf-pct (js/Math.round (* (aget stats "infP") 100))
        tool-pct (js/Math.round (* (aget stats "toolP") 100))]
    (str "t=" (fmt-ms (aget stats "totalMs"))
         " | inference=" (fmt-ms (aget stats "inferenceMs")) " (" inf-pct "%)"
         " | tools=" (fmt-ms (aget stats "toolWaitMs")) " (" tool-pct "%)")))

(defn refresh-ui [state]
  (when (and (aget state "enabled")
             (aget state "running"))
    (when-let [ctx (aget state "ctx")]
      (ui-set-status! ctx (render-status state (js/performance.now))))))

(defn stop-and-finalize-ui [state]
  (when-let [ctx (aget state "ctx")]
    (if (not (aget state "enabled"))
      (ui-set-status! ctx js/undefined)
      (when (aget state "running")
        (ui-set-status! ctx (render-status state (js/performance.now)))))))

(defn start-ticker [state]
  (clear-interval-safe state)
  (aset state "interval" (js/setInterval #(refresh-ui state) 250)))

(defn end-tool-segment-if-needed [state now-ms]
  (when (and (zero? (aget state "toolActiveCount"))
             (some? (aget state "toolSegmentStartMs")))
    (aset state "toolWaitTotalMs"
          (+ (aget state "toolWaitTotalMs")
             (- now-ms (aget state "toolSegmentStartMs"))))
    (aset state "toolSegmentStartMs" nil)))

(em/defextension task-timing
  :name "task-timing"
  :description "Toggle live task timing (runtime + inference vs tool wait split)"

  (em/command "timing"
    :description "Toggle live task timing (runtime + inference vs tool wait split)"
    :handler (fn [args ctx]
               (let [state (get-state)]
                 (aset state "enabled" (not (aget state "enabled")))
                 (if (not (aget state "enabled"))
                   (do
                     (clear-interval-safe state)
                     (ui-set-status! ctx js/undefined)
                     (ui-notify! ctx "Task timing: disabled" "info"))
                   (do
                     (ui-notify! ctx "Task timing: enabled" "info")
                     (when (aget state "running")
                       (aset state "ctx" ctx)
                       (start-ticker state)
                       (refresh-ui state)))))))

  (em/on "agent_start"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (clear-interval-safe state)
                 (aset state "ctx" ctx)
                 (aset state "running" true)
                 (aset state "agentStartMs" (js/performance.now))
                 (aset state "toolActiveCount" 0)
                 (aset state "toolSegmentStartMs" nil)
                 (aset state "toolWaitTotalMs" 0)
                 (if (not (aget state "enabled"))
                   (ui-set-status! ctx js/undefined)
                   (do
                     (ui-set-status! ctx (render-status state (js/performance.now)))
                     (start-ticker state))))))

  (em/on "tool_execution_start"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (when (aget state "running")
                   (let [now (js/performance.now)]
                     (when (zero? (aget state "toolActiveCount"))
                       (aset state "toolSegmentStartMs" now))
                     (aset state "toolActiveCount" (inc (aget state "toolActiveCount")))
                     (aset state "ctx" ctx)
                     (refresh-ui state))))))

  (em/on "tool_execution_end"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (when (aget state "running")
                   (let [now (js/performance.now)]
                     (aset state "toolActiveCount" (max 0 (dec (aget state "toolActiveCount"))))
                     (end-tool-segment-if-needed state now)
                     (aset state "ctx" ctx)
                     (refresh-ui state))))))

  (em/on "agent_end"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (when (aget state "running")
                   (let [now (js/performance.now)]
                     (when (and (> (aget state "toolActiveCount") 0)
                                (some? (aget state "toolSegmentStartMs")))
                       (aset state "toolWaitTotalMs"
                             (+ (aget state "toolWaitTotalMs")
                                (- now (aget state "toolSegmentStartMs"))))
                       (aset state "toolSegmentStartMs" nil)
                       (aset state "toolActiveCount" 0))
                     (clear-interval-safe state)
                     (aset state "ctx" ctx)
                     (stop-and-finalize-ui state)
                     (aset state "running" false))))))

  (em/on "session_shutdown"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (clear-interval-safe state)
                 (aset state "running" false)
                 (aset state "toolActiveCount" 0)
                 (aset state "toolSegmentStartMs" nil)
                 (aset state "toolWaitTotalMs" 0)
                 (ui-set-status! ctx js/undefined)))))
