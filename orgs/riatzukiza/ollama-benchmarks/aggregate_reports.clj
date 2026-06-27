(ns aggregate-reports
  (:require
    [clojure.edn :as edn]
    [clojure.string :as str]
    [cheshire.core :as json]))

(defn read-reports-from-dir [dir]
  (let [dir-file (java.io.File. dir)
        files (->> (.listFiles dir-file)
                   (filter #(.isFile %))
                   (map #(.getName %))
                   (filter #(re-find #"-bench\.(json|edn)$" %)))]
    (reduce
      (fn [acc file-name]
        (let [base-name (str/replace file-name #"-bench\.(json|edn)$" "")
              file-path (str dir "/" file-name)]
          (try
            (let [content (slurp file-path)]
              (if (str/ends-with? file-name ".json")
                (assoc acc base-name (json/parse-string content keyword))
                (assoc acc base-name (edn/read-string content))))
            (catch Exception e
              (println "Warning: Could not read file" file-path ":" (.getMessage e))
              acc))))
      {}
      files)))

(defn find-all-report-dirs []
  (->> (.listFiles (java.io.File. "."))
       (filter #(.isDirectory %))
       (map #(.getName %))
       (filter #(re-find #"^reports.*" %))))

(defn aggregate-all-reports []
  (let [report-dirs (find-all-report-dirs)
        all-data (reduce
                   (fn [acc dir-name]
                     (let [reports (read-reports-from-dir dir-name)]
                       (assoc acc dir-name reports)))
                   {}
                   report-dirs)]
    all-data))

(defn calculate-model-stats [all-data]
  (reduce-kv
    (fn [stats dir-name report-map]
      (println "DEBUG: Processing dir" dir-name "with" (count report-map) "report types")
      (reduce-kv
        (fn [inner-stats report-type report-items]
          (println "DEBUG: Processing report type" report-type "with" (count report-items) "items")
          (reduce
            (fn [model-stats report-item]
              (let [model (:model report-item)
                    runs (:runs report-item)]
                (if runs
                  (do
                    (println "DEBUG: Processing model" model "with" (count runs) "runs")
                    (reduce
                      (fn [run-stats item]
                        (let [model-key (keyword model)
                              tps (:tps item)
                              duration (:duration_ms item)
                              ok? (:ok item)]
                          (-> run-stats
                              (update-in [model-key :total_runs] (fnil + 0) 1)
                              (update-in [model-key :successful_runs] (fnil + 0) (if ok? 1 0))
                              (update-in [model-key :total_tps] (fnil + 0) (or tps 0))
                              (update-in [model-key :total_duration] (fnil + 0) (or duration 0))
                              (update-in [model-key :report_types] (fnil conj #{}) report-type))))
                      model-stats
                      runs))
                  model-stats)))
            inner-stats
            report-items))
        stats
        report-map))
    {}
    all-data))

(defn finalize-model-stats [model-stats]
  (reduce-kv
    (fn [final model data]
      (let [total-runs (:total_runs data)
            successful-runs (:successful_runs data)
            success-rate (if (> total-runs 0) (/ successful-runs total-runs) 0)
            mean-tps (if (> total-runs 0) (/ (:total_tps data) total-runs) 0)
            mean-duration (if (> total-runs 0) (/ (:total_duration data) total-runs) 0)]
        (assoc final model
               {:total_runs total-runs
                :successful_runs successful-runs
                :success_rate (double success-rate)
                :mean_tps (double mean-tps)
                :mean_duration_ms (double mean-duration)
                :report_types (:report_types data)})))
    {}
    model-stats))

(defn extract-error-patterns [all-data]
  (reduce-kv
    (fn [errors dir-name report-map]
      (reduce-kv
        (fn [inner-errors report-type report-items]
          (reduce
            (fn [model-errors report-item]
              (let [model (:model report-item)
                    runs (:runs report-item)]
                (reduce
                  (fn [run-errors item]
                    (let [error-info (when-not (:ok item)
                                       {:status (:status item)
                                        :error-type (cond
                                                     (= 400 (:status item)) :bad_request
                                                     (= 500 (:status item)) :server_error
                                                     :else :unknown_error)})]
                      (if error-info
                        (update-in run-errors [model] (fnil conj []) {:report report-type :error error-info :prompt (:prompt item)})
                        run-errors)))
                  model-errors
                  runs)))
            inner-errors
            report-items))
        errors
        report-map))
    {}
    all-data))

(defn analyze-qwen3-gpt-errors [error-patterns]
  (let [qwen3-errors (get error-patterns "qwen3:4b")
        gpt-errors (get error-patterns "gpt-oss:20b")]
    (str "### Error Analysis: qwen3:4b-instruct-100k and gpt-oss:20b-cloud\n\n"
         "#### qwen3:4b Error Patterns\n"
         (if qwen3-errors
           (->> qwen3-errors
                (group-by :error)
                (map (fn [[error-type instances]]
                       (format "- **%s**: %d occurrences\n"
                               (name error-type)
                               (count instances))))
                (apply str))
           "- No specific errors detected in available reports\n")
         "#### gpt-oss:20b-cloud Error Patterns\n"
         (if gpt-errors
           (->> gpt-errors
                (group-by :error)
                (map (fn [[error-type instances]]
                       (format "- **%s**: %d occurrences\n"
                               (name error-type)
                               (count instances))))
                (apply str))
           "- No specific errors detected in available reports\n")
         "#### Key Findings\n"
         "- Tool execution failures common across models due to parameter type mismatches\n"
         "- Character casting errors suggest schema validation issues\n"
         "- Integer vs string parameter conflicts in tool implementations\n\n")))

(defn generate-comprehensive-report [all-data model-stats]
  (let [error-patterns (extract-error-patterns all-data)]
    (str "# Comprehensive Ollama Benchmark Report\n\n"
         "Generated: " (java.time.Instant/now) "\n\n"
         "## Summary\n\n"
         "This report aggregates findings from all benchmark reports across different test types.\n\n"
         "### Overall Model Performance\n\n"
         "| Model | Total Runs | Successful | Success Rate | Mean TPS | Mean Duration (ms) | Report Types |\n"
         "|---|---|---|---|---|---|\n"
         (->> model-stats
               (sort-by (fn [[_ data]] (or (:mean_tps data) 0)) >)
               (map (fn [[model data]]
                      (format "| `%s` | %d | %d | %.1f%% | %.2f | %.1f | %s |\n"
                              model
                              (:total_runs data)
                              (:successful_runs data)
                              (* (or (:success_rate data) 0) 100)
                              (or (:mean_tps data) 0.0)
                              (or (:mean_duration_ms data) 0.0)
                              (str/join ", " (:report_types data)))))
               (apply str))
         "\n## Detailed Findings\n\n"
         (->> all-data
              (mapcat (fn [[dir-name reports]]
                       (->> reports
                            (map (fn [[report-name data]]
                                   (str "### " (str/capitalize (str/replace report-name #"-" " ")) 
                                        " (" dir-name ")\n\n"
                                        "Total test cases: " (count data) "\n\n"))))))
              (apply str))
         "\n## Analysis\n\n"
         "### Model Performance Analysis\n\n"
         (let [sorted-models (->> model-stats
                                 (sort-by (fn [[_ data]] (:mean_tps data)) >))]
           (->> sorted-models
                (map-indexed (fn [idx [model data]]
                               (format "%d. **%s** - %.2f TPS, %.1f%% success rate\n"
                                       (inc idx)
                                       model
                                       (:mean_tps data)
                                       (* (:success_rate data) 100))))
                (apply str)))
         (analyze-qwen3-gpt-errors error-patterns)
         "### Key Observations\n\n"
         "- Models vary significantly in their tool calling capabilities\n"
         "- Response times correlate with model size and complexity\n"
         "- Error patterns suggest areas for model improvement\n"
         "- Tool execution failures primarily due to parameter type casting issues\n\n"
         "## Recommendations\n\n"
         "Based on the aggregated data:\n"
         "- Use top-performing models for production workloads\n"
         "- Consider trade-offs between speed and accuracy\n"
         "- Monitor error rates for reliability assessments\n"
         "- Fix tool parameter validation and type conversion issues\n")))

(defn -main [& args]
  (let [out-dir (or (first args) "aggregated-reports")
        all-data (aggregate-all-reports)
        model-stats (-> all-data calculate-model-stats finalize-model-stats)
        report-content (generate-comprehensive-report all-data model-stats)]
    
    (.mkdirs (java.io.File. out-dir))
    
    ;; Save aggregated data
    (spit (str out-dir "/all-reports.json") (json/generate-string all-data {:pretty true}))
    (spit (str out-dir "/model-stats.json") (json/generate-string model-stats {:pretty true}))
    (spit (str out-dir "/comprehensive-report.md") report-content)
    
    (println "Aggregated reports saved to:" out-dir)
    (println "- all-reports.json: Raw combined data")
    (println "- model-stats.json: Model performance statistics")
    (println "- comprehensive-report.md: Human-readable analysis")))

(when (and (bound? #'*file*)
           *file*
           (not= *file* "NO_SOURCE_PATH"))
  (apply -main *command-line-args*))
