#!/usr/bin/env bb
(ns bench-ollama
  (:require
    [promethean.ollama.client :as ollama]
    [ollama :as ollama-common]
    [cheshire.core :as json]
    [clojure.java.io :as io]
    [bench-logger :as logger]))



;; ---- Regular benchmarking (no tools) ----

(defn run-one
  [endpoint model prompt session-id run-number]
  (let [request-id (logger/log-request-start model prompt)
        t0 (ollama/now-ms)
        resp (ollama/chat! {:host endpoint
                           :model model
                           :messages [{:role "user" :content prompt}]})
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
                             (/ eval-count eval-dur-s))]
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
                    :tps tps}))]
(logger/log-request-end request-id model prompt result)
    (logger/stream-request-result session-id model prompt run-number result)
    result))

(defn bench-combo
  [{:keys [endpoint n model prompt session-id]}]
  (logger/log-summary model prompt {:runs_total n :benchmark-type "basic"})
  (let [run-numbers (range n)
        runs (mapv #(run-one endpoint model prompt session-id %) run-numbers)
        ok-runs (filter :ok runs)
        tps-values (keep :tps ok-runs)
        dur-values (map :duration_ms ok-runs)
        summary {:runs_total n
                :runs_ok (count ok-runs)
                :mean_tps (ollama-common/mean tps-values)
                :mean_duration_ms (ollama-common/mean dur-values)}
        result {:model model
                :prompt prompt
                :runs runs
                :summary summary}]
    ;; Update session metadata with completed combo results
    (when-let [metadata (logger/load-session-metadata "reports" session-id)]
      (let [session-results (get metadata :session/results {})
            results-key (str model "|" prompt)
            updated-session-results (assoc session-results results-key result)
            updated-metadata (-> metadata
                              (assoc :session/results updated-session-results)
                              (update :session/completed-runs + n)
                              (assoc :session/last-updated (System/currentTimeMillis)))]
        (logger/save-session-metadata updated-metadata "reports")))
    (logger/stream-summary session-id model prompt summary)
    (logger/log-summary model prompt summary {:benchmark-type "basic"})
    result))

(defn bench-all
  [{:keys [endpoint models prompts n session-id resume]}]
  (for [m models
        p prompts]
    (bench-combo {:endpoint endpoint
                  :n n
                  :model m
                  :prompt p
                  :session-id session-id})))

(defn bench-all-cumulative
  "Handle cumulative benchmark runs with session management."
  [{:keys [endpoint models prompts n session-id resume out-dir]}]
  (let [existing-metadata (logger/load-session-metadata out-dir session-id)
        metadata (or existing-metadata
                    (logger/create-session-metadata "basic" 
                                                 {:endpoint endpoint :models models :prompts prompts :n n}
                                                 out-dir
                                                 session-id))
        _ (logger/save-session-metadata metadata out-dir)]
    (let [existing-results (when existing-metadata 
                            (:session/results existing-metadata))
          new-results (vec (bench-all {:endpoint endpoint
                                     :models models
                                     :prompts prompts
                                     :n n
                                     :session-id session-id}))
          all-results (concat existing-results new-results)
          total-completed (+ (:session/completed-runs metadata 0) 
                          (* (count models) (count prompts) n))]
      (println (if existing-metadata 
                 (str "Resuming session " session-id " with " (:session/completed-runs existing-metadata) " completed runs, adding " (* (count models) (count prompts) n) " more")
                 (str "Starting new session " session-id)))
      (-> metadata
          (assoc :session/results (vec all-results))
          (assoc :session/completed-runs total-completed)
          (logger/update-session-metadata out-dir))
      (vec all-results))))

;; ---- Entry point ----

(defn -main [& args]
  (let [{:keys [config out-dir n session-id resume]} (ollama-common/parse-args args)
        cfg (ollama-common/read-edn-file config)
        {:keys [endpoint models prompts]} cfg
        session-id (or session-id (logger/generate-session-id))
        _ (.mkdirs (java.io.File. out-dir))
        _ (logger/log-benchmark-start "basic" (assoc cfg :n n :session-id session-id :resume resume))
        start-time (System/currentTimeMillis)
        results (bench-all-cumulative {:endpoint endpoint
                                     :models models
                                     :prompts prompts
                                     :n n
                                     :session-id session-id
                                     :resume resume
                                     :out-dir out-dir})
        end-time (System/currentTimeMillis)
        total-runs (* (count models) (count prompts) n)
        _ (logger/log-benchmark-end "basic" total-runs (- end-time start-time))
        session-metadata (logger/load-session-metadata out-dir session-id)
        out-base-str (str "ollama-bench-" session-id)
        out-base-file (java.io.File. out-dir out-base-str)
        edn-file (str out-dir "/" out-base-str ".edn")
        json-file (str out-dir "/" out-base-str ".json")
        md-file (str out-dir "/" out-base-str ".md")]
    (spit edn-file (pr-str results))
    (spit json-file (json/generate-string results {:pretty true}))
    (spit md-file (ollama-common/md-table results))
    (println "Session:" session-id)
    (println "Wrote:" edn-file json-file md-file)
    (when session-metadata
      (println "Metadata: " (str out-dir "/session-" session-id "-metadata.json")))))

(when (= *file* (System/getProperty "babashka.file"))
  (apply -main *command-line-args*))
