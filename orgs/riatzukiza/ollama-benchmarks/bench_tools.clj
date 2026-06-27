#!/usr/bin/env bb
(ns bench-tools
  (:require
    [promethean.ollama.client :as ollama]
    [ollama :as ollama-common]
    [cheshire.core :as json]
    [babashka.fs :as fs]
    [bench-logger :as logger]))

;; ---- Tool calling specific benchmarking ----

(defn run-one-tool-call
  [endpoint model prompt tools session-id run-number]
  (let [request-id (logger/log-request-start model prompt :tools tools)
        t0 (ollama/now-ms)
        resp (ollama/chat! {:host endpoint
                           :model model
                           :messages [{:role "user" :content prompt}]
                           :tools tools})
        t1 (ollama/now-ms)
        dur-ms (- t1 t0)
        result (if (:error resp)
                 {:model model
                  :prompt prompt
                  :ok false
                  :status (:status resp)
                  :duration_ms dur-ms}
                 (let [eval-count (:eval_count resp)
                       eval-dur-ns (:eval_duration resp)
                       eval-dur-s (when eval-dur-ns (/ eval-dur-ns 1e9))
                       tps (when (and eval-count eval-dur-s)
                             (/ eval-count eval-dur-s))
                       tool-calls (get-in resp [:message :tool_calls])
                       num-tools (count (or tool-calls []))
                       tools-used (> num-tools 0)]
                   {:model model
                    :prompt prompt
                    :ok true
                    :duration_ms dur-ms
                    :total_duration_ns (:total_duration resp)
                    :load_duration_ns (:load_duration resp)
                    :prompt_eval_count (:prompt_eval_count resp)
                    :prompt_eval_duration_ns (:prompt_eval_duration resp)
                    :eval_count eval-count
                    :eval_duration_ns eval-dur-ns
                    :tps tps
                    :tool_calls tool-calls
                    :num_tool_calls num-tools
                    :tools_used tools-used}))]
    (logger/log-request-end request-id model prompt result)
    (logger/stream-request-result session-id model prompt run-number result)
    result))

(defn bench-tool-combo
  [{:keys [endpoint n model prompt tools session-id]}]
  (logger/log-summary model prompt {:runs_total n :benchmark-type "tool-calling"})
  (let [run-numbers (range n)
        runs (mapv #(run-one-tool-call endpoint model prompt tools session-id %) run-numbers)
        ok-runs (filter :ok runs)
        tools-used-runs (filter :tools_used ok-runs)
        tps-values (keep :tps ok-runs)
        dur-values (map :duration_ms ok-runs)
        tool-call-values (map :num_tool_calls ok-runs)
        summary {:runs_total n
                :runs_ok (count ok-runs)
                :runs_with_tools (count tools-used-runs)
                :tool_success_rate (/ (count tools-used-runs) (double (count ok-runs)))
                :mean_tps (ollama-common/mean tps-values)
                :mean_duration_ms (ollama-common/mean dur-values)
                :mean_tool_calls (ollama-common/mean tool-call-values)}
        result {:model model
                :prompt prompt
                :runs runs
                :summary summary}]
    (logger/stream-summary session-id model prompt summary)
    (logger/log-summary model prompt summary {:benchmark-type "tool-calling"})
    result))

(defn bench-all-tools
  [{:keys [endpoint models prompts n tools session-id]}]
  (for [m models
        p prompts]
    (bench-tool-combo {:endpoint endpoint
                      :n n
                      :model m
                      :prompt p
                      :tools tools
                      :session-id session-id})))

;; ---- Tool calling specific markdown report ----

(defn md-tools-table [results]
  (let [header "| Model | Prompt | Runs | OK | Tool Calls | Success Rate | Mean TPS | Mean Duration (ms) |\n|---|---|---|---|---|---|---|---|\n"
        rows   (for [{:keys [model prompt summary]} results
                     :let [{:keys [runs_total runs_ok runs_with_tools tool_success_rate mean_tps mean_duration_ms mean_tool_calls]} summary]]
                 (format "| `%s` | %s | %d | %d | %.1f | %.1f%% | %.2f | %.1f |\n"
                         model
                         (clojure.string/replace prompt #"\n" " ")
                         runs_total
                         runs_ok
                         (or mean_tool_calls 0.0)
                         (* tool_success_rate 100)
                         (or mean_tps 0.0)
                         (or mean_duration_ms 0.0)))]
    (str "# Ollama Tool Calling Benchmark\n\n"
         header
         (apply str rows)
         "\n## Tool Call Details\n\n"
         "This benchmark evaluates each model's ability to understand and use provided tools when prompted.\n\n"
         "**Metrics:**\n"
         "- **Tool Calls**: Average number of tool calls per response\n"
         "- **Success Rate**: Percentage of successful runs that used tools appropriately\n"
         "- **TPS**: Tokens per second generation speed\n"
         "- **Duration**: Total response time including tool processing\n\n")))

;; ---- Entry point ----

(defn -main [& args]
  (let [{:keys [config out-dir n tools session-id resume]} (ollama-common/parse-args args)
        cfg (ollama-common/read-edn-file config)
        {:keys [endpoint models prompts]} cfg
        tools-def (when tools (-> tools ollama-common/read-edn-file :tools))
        session-id (or session-id (logger/generate-session-id))
        _ (fs/create-dirs out-dir)
        session-metadata (logger/create-session-metadata "tool-calling" 
                                                 (assoc cfg :n n :tools tools-def)
                                                 out-dir
                                                 session-id)
        _ (logger/save-session-metadata session-metadata out-dir)
        _ (logger/log-benchmark-start "tool-calling" (assoc cfg :n n :session-id session-id :resume resume))
        start-time (System/currentTimeMillis)
        results (vec (bench-all-tools {:endpoint endpoint
                                     :models models
                                     :prompts prompts
                                     :n n
                                     :tools tools-def
                                     :session-id session-id}))
        end-time (System/currentTimeMillis)
        total-runs (* (count models) (count prompts) n)
        _ (logger/log-benchmark-end "tool-calling" total-runs (- end-time start-time))
        updated-metadata (-> session-metadata
                            (assoc :session/end-time end-time)
                            (assoc :session/total-runs total-runs)
                            (assoc :session/results results)
                            (logger/update-session-metadata out-dir))
        out-base (fs/path out-dir (str "ollama-tools-bench-" session-id))
        edn-file (str out-base ".edn")
        json-file (str out-base ".json")
        md-file (str out-base ".md")]
    (spit edn-file (pr-str results))
    (spit json-file (json/generate-string results {:pretty true}))
    (spit md-file (md-tools-table results))
    (println "Session:" session-id)
    (println "Wrote:" edn-file json-file md-file)
    (println "Metadata: " (str out-dir "/session-" session-id "-metadata.json"))))

(when (= *file* (System/getProperty "babashka.file"))
  (apply -main *command-line-args*))
