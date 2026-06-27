(ns bench-logger
  "Logging utilities for benchmark requests with start/end times and stats."
  (:require [clojure.string :as str]
            [cheshire.core :as json]))

(defn log-request-start
  "Log the start of a benchmark request."
  [model prompt & {:keys [request-id run-number tools]}]
  (let [timestamp (System/currentTimeMillis)
        req-id (or request-id (str (java.util.UUID/randomUUID)))
        tool-info (when tools (str " (tools: " (count tools) ")"))
        run-info (when run-number (str " run #" run-number))
        clean-prompt (str/replace prompt #"\s+" " ")
        prompt-preview (if (> (count clean-prompt) 60) 
                        (str (subs clean-prompt 0 60) "...")
                        clean-prompt)]
    (println (str "[" timestamp "] START: " model " - " 
                 prompt-preview 
                 (or tool-info "") (or run-info "")))
    req-id))

(defn log-request-end
  "Log the end of a benchmark request with stats."
  [request-id model prompt result & {:keys [run-number]}]
  (let [timestamp (System/currentTimeMillis)
        duration-ms (:duration_ms result)
        ok (:ok result)
        status (if ok "✓" "✗")
        run-info (when run-number (str " run #" run-number))
        base-stats (str status " " duration-ms "ms")
        stats (cond
                (and (:tps result) (:eval_count result) (:num_tool_calls result) (:tool_exec_success_rate result))
                (str base-stats " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result)
                     " tools:" (:num_tool_calls result)
                     " tool-success:" (format "%.1f%%" (* 100 (:tool_exec_success_rate result))))
                (and (:tps result) (:eval_count result) (:num_tool_calls result))
                (str base-stats " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result)
                     " tools:" (:num_tool_calls result))
                (and (:tps result) (:eval_count result))
                (str base-stats " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result))
                (:tps result)
                (str base-stats " TPS:" (format "%.2f" (:tps result)))
                :else base-stats)]
    (let [clean-prompt (str/replace prompt #"\s+" " ")
        prompt-preview (if (> (count clean-prompt) 60) 
                        (str (subs clean-prompt 0 60) "...")
                        clean-prompt)]
    (println (str "[" timestamp "] END:   " model " - " 
                 prompt-preview 
                 (or run-info "") " " stats)))))

(defn log-summary
  "Log benchmark summary statistics."
  [model prompt summary & {:keys [benchmark-type]}]
  (let [timestamp (System/currentTimeMillis)
        bmark-type (or benchmark-type "benchmark")
        {:keys [runs_total runs_ok mean_tps mean_duration_ms 
                runs_with_tools tool_success_rate mean_tool_calls
                tool_exec_success_rate]} summary]
    (let [clean-prompt (str/replace prompt #"\s+" " ")
        prompt-preview (if (> (count clean-prompt) 60) 
                        (str (subs clean-prompt 0 60) "...")
                        clean-prompt)]
    (println (str "[" timestamp "] SUMMARY: " model " " bmark-type " - " 
                 runs_total "/" runs_ok " runs OK"
                 (when mean_tps (str " avg TPS:" (format "%.2f" mean_tps)))
                 (when mean_duration_ms (str " avg duration:" (format "%.0f" mean_duration_ms) "ms"))
                 (when runs_with_tools (str " " runs_with_tools " with tools"))
                 (when tool_success_rate (str " success:" (format "%.1f%%" (* 100 tool_success_rate))))
                 (when mean_tool_calls (str " avg tools:" (format "%.1f" mean_tool_calls)))
                 (when tool_exec_success_rate (str " tool-exec:" (format "%.1f%%" (* 100 tool_exec_success_rate))))
                 " - " prompt-preview)))))

(defn log-benchmark-start
  "Log the start of an entire benchmark suite."
  [benchmark-type config]
  (let [timestamp (System/currentTimeMillis)]
    (println (str "[" timestamp "] BENCHMARK START: " benchmark-type 
                 " - " (:models config) " models, " 
                 (count (:prompts config)) " prompts, " 
                 (:n config) " runs each"))))

(defn log-benchmark-end
  "Log the completion of an entire benchmark suite."
  [benchmark-type total-runs total-time-ms]
  (let [timestamp (System/currentTimeMillis)]
    (println (str "[" timestamp "] BENCHMARK END: " benchmark-type 
                 " - " total-runs " runs completed in " 
                 total-time-ms "ms (" 
                 (format "%.2f" (/ total-runs (/ total-time-ms 1000.0)))
                 " runs/sec)"))))

;; ---- Session management ----

(defn generate-session-id []
  (str "session-" (System/currentTimeMillis) "-" (subs (str (java.util.UUID/randomUUID)) 0 8)))

(defn create-session-metadata
  "Create session metadata for tracking benchmark runs."
  [benchmark-type config out-dir session-id]
  {:session/id session-id
   :session/benchmark-type benchmark-type
   :session/start-time (System/currentTimeMillis)
   :session/config config
   :session/output-directory out-dir
   :session/total-runs 0
   :session/completed-runs 0
   :session/results {}})

(defn save-session-metadata
  "Save session metadata to file."
  [metadata out-dir]
  (let [session-file (str out-dir "/session-" (:session/id metadata) "-metadata.json")]
    (spit session-file (json/generate-string metadata {:pretty true}))
    session-file))

(defn load-session-metadata
  "Load existing session metadata from file."
  [out-dir session-id]
  (let [session-file (str out-dir "/session-" session-id "-metadata.json")]
    (when (.exists (java.io.File. session-file))
      (json/parse-string (slurp session-file) keyword))))

(defn update-session-metadata
  "Update session metadata with new results and save."
  [metadata out-dir]
  (let [updated-metadata (assoc metadata 
                                :session/last-updated (System/currentTimeMillis))]
    (save-session-metadata updated-metadata out-dir)
    updated-metadata))

;; ---- Streaming result output ----

(defn stream-request-result
  "Stream individual request result immediately."
  [session-id model prompt run-number result]
  (let [timestamp (System/currentTimeMillis)
        status (if (:ok result) "✓" "✗")
        duration-ms (:duration_ms result)
        clean-prompt (str/replace prompt #"\s+" " ")
        prompt-preview (if (> (count clean-prompt) 60) 
                        (str (subs clean-prompt 0 60) "...")
                        clean-prompt)
        stats (cond
                (and (:tps result) (:eval_count result) (:num_tool_calls result) (:tool_exec_success_rate result))
                (str " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result)
                     " tools:" (:num_tool_calls result)
                     " tool-success:" (format "%.1f%%" (* 100 (:tool_exec_success_rate result))))
                (and (:tps result) (:eval_count result) (:num_tool_calls result))
                (str " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result)
                     " tools:" (:num_tool_calls result))
                (and (:tps result) (:eval_count result))
                (str " TPS:" (format "%.2f" (:tps result)) 
                     " tokens:" (:eval_count result))
                (:tps result)
                (str " TPS:" (format "%.2f" (:tps result)))
                :else "")]
    (println (str "[" timestamp "] RESULT: " session-id " | " model " | run #" run-number " | " status " " duration-ms "ms" stats " | " prompt-preview))
    result))

(defn stream-summary
  "Stream summary for a model/prompt combination."
  [session-id model prompt summary]
  (let [timestamp (System/currentTimeMillis)
        clean-prompt (str/replace prompt #"\s+" " ")
        prompt-preview (if (> (count clean-prompt) 60) 
                        (str (subs clean-prompt 0 60) "...")
                        clean-prompt)]
    (println (str "[" timestamp "] SUMMARY: " session-id " | " model " | " 
                 (:runs_total summary) "/" (:runs_ok summary) " runs OK"
                 (when (:mean_tps summary) (str " avg TPS:" (format "%.2f" (:mean_tps summary))))
                 (when (:mean_duration_ms summary) (str " avg duration:" (format "%.0f" (:mean_duration_ms summary)) "ms"))
                 (when (:runs_with_tools summary) (str " " (:runs_with_tools summary) " with tools"))
                 (when (:tool_success_rate summary) (str " success:" (format "%.1f%%" (* 100 (:tool_success_rate summary)))))
                 (when (:mean_tool_calls summary) (str " avg tools:" (format "%.1f" (:mean_tool_calls summary))))
                 (when (:tool_exec_success_rate summary) (str " tool-exec:" (format "%.1f%%" (* 100 (:tool_exec_success_rate summary)))))
                 " | " prompt-preview))))

;; ---- Cumulative result tracking ----

(defn add-result-to-session
  "Add a single result to session metadata and return updated metadata."
  [metadata model prompt run-number result]
  (let [session-id (:session/id metadata)
        results-key (str model "|" prompt)
        current-results (get-in metadata [:session/results results-key] [])
        updated-results (assoc (vec current-results) run-number result)]
    (-> metadata
        (assoc-in [:session/results results-key] updated-results)
        (update :session/completed-runs inc)
        (update :session/total-runs inc))))

(defn get-session-results
  "Get all results from session metadata, organized by model/prompt."
  [metadata]
  (for [[[model prompt] runs] (:session/results metadata)]
    {:model model
     :prompt prompt
     :runs runs
     :summary (let [ok-runs (filter :ok runs)
                   tps-values (keep :tps ok-runs)
                   dur-values (map :duration_ms ok-runs)
                   tools-used-runs (filter :tools_used ok-runs)
                   tool-call-values (map :num_tool_calls ok-runs)
                   tool-success-values (map :tool_exec_success_rate ok-runs)]
               {:runs_total (count runs)
                :runs_ok (count ok-runs)
                :runs_with_tools (count tools-used-runs)
                :tool_success_rate (when (pos? (count ok-runs))
                                     (/ (count tools-used-runs) (double (count ok-runs))))
                :mean_tps (when (seq tps-values) (/ (reduce + tps-values) (double (count tps-values))))
                :mean_duration_ms (when (seq dur-values) (/ (reduce + dur-values) (count dur-values)))
                :mean_tool_calls (when (seq tool-call-values) (/ (reduce + tool-call-values) (count tool-call-values)))
                :tool_exec_success_rate (when (seq tool-success-values) (/ (reduce + tool-success-values) (count tool-success-values)))})}))

(defn get-missing-runs
  "Determine which runs are missing to complete the full set."
  [metadata target-runs]
  (for [[[model prompt] runs] (:session/results metadata)
        :when (< (count runs) target-runs)
        run-number (range (count runs) target-runs)]
    {:model model :prompt prompt :run-number run-number}))