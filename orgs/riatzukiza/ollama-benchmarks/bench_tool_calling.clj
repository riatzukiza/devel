(ns bench-tool-calling
  "Tool-calling benchmark runner for Ollama.

  Usage idea (bb or clj):
    - Provide --tools path/to/tools.clj
    - Optionally provide --cases path/to/cases.edn
    - Otherwise, uses tools' :bench/cases if present, or auto-generates direct-call cases."
  (:require
    [babashka.cli :as cli]
    [babashka.fs :as fs]
    [cheshire.core :as json]
    [clojure.edn :as edn]
    [clojure.java.io :as io]
    [clojure.string :as str]
    [promethean.ollama.client :as ollama]
    [promethean.ollama.bench-tools :as tools])
   (:import
     (java.time Instant Duration)))

;; -------------------------
;; Case format (EDN)
;; -------------------------
;; {:id "case-1"
;;  :prompt "What is the temperature in New York?"
;;  :expect {:tool "get_temperature"
;;           :arguments {:city "New York"}}}
;;
;; If :expect missing, we still validate that any tool calls were valid + executable.

(defn- now-ms [] (System/currentTimeMillis))

(defn- read-edn-file [path]
  (with-open [r (io/reader path)]
    (edn/read {:eof nil} r)))

(defn- write-edn-file! [path data]
  (io/make-parents path)
  (spit path (pr-str data)))

(defn- write-json-file! [path data]
  (io/make-parents path)
  (spit path (json/generate-string data {:pretty true})))

(defn- duration-ms [t0 t1]
  (long (- t1 t0)))

(defn- normalize-case [c]
  (cond-> c
    (nil? (:id c)) (assoc :id (str "case-" (hash c)))))

(defn- tool-provided-cases []
  (->> (tools/tools)
       (mapcat (fn [t]
                 (for [c (:bench/cases t)]
                   (-> c
                       (assoc :tool (:name t))
                       (update :expect #(or % {}))
                       (update :expect assoc :tool (:name t))))))
       (map normalize-case)
       vec))

(defn- schema-sample-value [prop-name prop-schema]
  (let [t (get prop-schema "type")
        enum (get prop-schema "enum")]
    (cond
      (seq enum) (first enum)

      (= t "string")
      (case prop-name
        ("city") "New York"
        ("country") "USA"
        ("state") "AZ"
        ("query" "q" "search") "clojure tool calling"
        ("name") "example"
        "example")

      (= t "integer") 1
      (= t "number") 1.0
      (= t "boolean") true
      (= t "array") []
      (= t "object") {}
      :else "example")))

(defn- sample-args-for-tool [tool]
  (let [schema (:parameters tool)
        required (vec (get schema "required" []))
        props (get schema "properties" {})
        make-one (fn [k]
                   (let [k* (name k)
                         s (get props k* {"type" "string"})]
                     [(keyword k*) (schema-sample-value k* s)]))]
    (into {} (map make-one required))))

(defn- autogen-direct-call-cases []
  ;; This creates explicit "call tool X with args Y" cases to test the
  ;; model's tool-call formatting and argument passing.
  (->> (tools/tools)
       (map (fn [t]
              (let [args (sample-args-for-tool t)]
                {:id (str "autogen/" (:name t))
                 :prompt (str
                           "Call tool \"" (:name t) "\" with exactly these arguments:\n"
                           (pr-str args)
                           "\n\nDo not answer directly. Use a tool call.")
                 :expect {:tool (:name t)
                          :arguments args}})))
       vec))

(defn- load-tools-file! [tools-file]
  (when-not (.exists (io/file tools-file))
    (throw (ex-info "tools.clj does not exist" {:tools-file tools-file})))
  (tools/clear-tools!)
  (load-file tools-file)
  (let [n (count (tools/tools))]
    (when (zero? n)
      (throw (ex-info "Loaded tools.clj but no tools were registered. Did you use promethean.ollama.bench-tools/def-tool ?"
                      {:tools-file tools-file})))
    n))

(defn- build-cases [{:keys [cases-file]}]
  (cond
    (some? cases-file)
    (->> (read-edn-file cases-file)
         (map normalize-case)
         vec)

    :else
    (let [provided (tool-provided-cases)]
      (if (seq provided)
        provided
        (autogen-direct-call-cases)))))

(defn- assistant->tool-calls [assistant-message]
  ;; Ollama: {:role "assistant" :content "..." :tool_calls [...]}
  (or (:tool_calls assistant-message) []))

(defn- extract-call [tool-call]
  ;; Ollama tool call object:
  ;; {:type "function" :function {:name "...", :arguments {...}, :index 0}}
  (let [f (:function tool-call)]
    {:name (:name f)
     :arguments (:arguments f)
     :raw tool-call}))

(defn- call->tool-message [{:keys [name result]}]
  ;; Ollama tool result message format:
  ;; {:role "tool" :tool_name "get_temperature" :content "22°C"}
  {:role "tool"
   :tool_name name
   :content (cond
              (string? result) result
              :else (pr-str result))})

(defn- run-agent-loop!
  "Runs an agent loop until the model stops returning tool_calls or max-steps is hit.

  Returns:
  {:messages [...]
   :steps [...]
   :final-assistant {...} }"
  [{:keys [host model think options max-steps tools-schemas initial-messages timeout-ms]}]
  (loop [messages (vec initial-messages)
         steps []
         i 0]
    (let [resp (ollama/chat! {:host host
                              :model model
                              :messages messages
                              :tools tools-schemas
                              :think think
                              :options options
                              :timeout-ms timeout-ms})
          assistant (:message resp)
          messages' (conj messages assistant)
          tool-calls (mapv extract-call (assistant->tool-calls assistant))]
      (if (or (empty? tool-calls) (>= i (dec (long max-steps))))
        {:messages messages'
         :steps steps
         :final-assistant assistant
         :raw-last-response resp}
        (let [tool-results
              (mapv (fn [c]
                      (let [valid (tools/validate-tool-call c)
                            invoked (when (:ok valid)
                                      (tools/invoke-tool! (:name c) (:arguments c)))]
                        (assoc c
                               :valid valid
                               :invoked invoked)))
                    tool-calls)
              tool-messages
              (mapv (fn [{:keys [name invoked]}]
                      (call->tool-message {:name name
                                           :result (if (:ok invoked)
                                                     (:value invoked)
                                                     invoked)}))
                    tool-results)
              messages'' (into messages' tool-messages)
              step {:i i
                    :assistant assistant
                    :tool_calls tool-results
                    :tool_messages tool-messages
                    :raw resp}]
          (recur messages'' (conj steps step) (inc i)))))))

(defn- match-expectation?
  "Checks (very strictly) whether the first tool call matches expected :tool and :arguments.
  Returns {:ok true} or {:ok false ...}"
  [tool-calls {:keys [tool arguments]}]
  (let [first-call (first tool-calls)]
    (cond
      (nil? first-call)
      {:ok false :error :no-tool-call}

      (not= tool (:name first-call))
      {:ok false :error :wrong-tool
       :details {:expected tool :got (:name first-call)}}

      (and (some? arguments)
           (not= arguments (or (:arguments first-call) {})))
      {:ok false :error :wrong-arguments
       :details {:expected arguments :got (:arguments first-call)}}

      :else
      {:ok true})))

(defn- score-case [{:keys [expect]} tool-calls]
  (let [validity (mapv (fn [c] (:ok (tools/validate-tool-call c)))
                        tool-calls)
        all-valid? (every? true? validity)
        invoked-ok? (every? true? (map (fn [c] (-> c :invoked :ok true?)) tool-calls))
        expected? (some? expect)
        match (when expected?
                (match-expectation? tool-calls expect))]
    {:tool_calls_count (count tool-calls)
     :all_tool_calls_valid all-valid?
     :all_tool_calls_invoked invoked-ok?
     :expected_match (when expected? (:ok match))
     :expected_error (when expected? (dissoc match :ok))}))

(defn run!
  "Run tool calling benchmark.

  opts:
  - :host        (default ollama/default-host)
  - :model       (required)
  - :tools-file  (required path to tools.clj)
  - :cases-file  (optional path to cases.edn)
  - :max-steps   (default 4)
  - :think       (optional bool)
  :options     (optional map passed to Ollama: {:temperature 0.2 :seed 123 ...})
  - :timeout-ms  (default 5 minutes)
  - :out         (optional output json path)

  Returns full results map."
  [{:keys [host model tools-file cases-file max-steps think options timeout-ms out]
    :or {host ollama/default-host
         max-steps 4
         timeout-ms 300000}}]
  (when (or (nil? model) (str/blank? (str model)))
    (throw (ex-info "Missing :model" {})))
  (when (or (nil? tools-file) (str/blank? (str tools-file)))
    (throw (ex-info "Missing :tools-file" {})))

  (let [_tool-count (load-tools-file! tools-file)
        tools-schemas (tools/tools->ollama-schemas)
        cases (build-cases {:cases-file cases-file})
        started (now-ms)
        results
        (mapv
          (fn [c]
            (let [c (normalize-case c)
                  t0 (now-ms)
                  loop-result
                  (run-agent-loop!
                    {:host host
                     :model model
                     :think think
                     :options options
                     :max-steps max-steps
                     :tools-schemas tools-schemas
                     :timeout-ms timeout-ms
                     :initial-messages [{:role "user" :content (:prompt c)}]})
                  t1 (now-ms)
                  last-assistant (:final-assistant loop-result)
                  tool-calls (->> (:steps loop-result)
                                  (mapcat :tool_calls)
                                  (mapv (fn [tc]
                                          ;; keep a lean view of each tool call in output
                                          {:name (:name tc)
                                           :arguments (:arguments tc)
                                           :valid (:valid tc)
                                           :invoked (:invoked tc)})))
                  score (score-case c tool-calls)]
              {:id (:id c)
               :prompt (:prompt c)
               :expect (:expect c)
               :duration_ms (duration-ms t0 t1)
               :final_assistant {:content (:content last-assistant)
                                 :tool_calls (assistant->tool-calls last-assistant)}
               :tool_calls tool-calls
               :score score}))
          cases)
        finished (now-ms)

        summary
        (let [n (count results)
              valid (count (filter #(true? (get-in % [:score :all_tool_calls_valid])) results))
              invoked (count (filter #(true? (get-in % [:score :all_tool_calls_invoked])) results))
              matched (count (filter #(true? (get-in % [:score :expected_match])) results))
              avg (if (pos? n)
                    (long (/ (reduce + (map :duration_ms results)) n))
                    0)]
          {:total_cases n
           :all_calls_valid valid
           :all_calls_invoked invoked
           :expected_matched matched
           :avg_case_duration_ms avg})

        out-map
        {:benchmark "tool-calling"
         :model model
         :host host
         :tools_file tools-file
         :cases_file cases-file
         :max_steps max-steps
         :think think
         :options options
         :started_ms started
         :finished_ms finished
         :summary summary
         :results results}]

    (when (some? out)
      (write-json-file! out out-map))
    out-map))

;; ---- CLI entrypoint ----

(defn md-tool-calling-table [results]
  (let [header "| Model | Cases | Valid | Invoked | Matched | Avg Duration (ms) |\n|---|---|---|---|---|---|\n"
        rows (for [{:keys [model summary]} results
                  :let [{:keys [total_cases all_calls_valid all_calls_invoked expected_matched avg_case_duration_ms]} summary]]
             (format "| `%s` | %d | %d | %d | %d | %d |\n"
                     model
                     total_cases
                     all_calls_valid
                     all_calls_invoked
                     expected_matched
                     avg_case_duration_ms))]
    (str "# Ollama Tool Calling Benchmark\n\n"
         header
         (apply str rows)
         "\n## Tool Calling Metrics\n\n"
         "**Metrics:**\n"
         "- **Valid**: Tool calls with correct structure and required arguments\n"
         "- **Invoked**: Tool calls that executed successfully\n"
         "- **Matched**: Tool calls that matched expected tool + arguments\n"
         "- **Avg Duration**: Average time per test case\n\n")))

;; CLI parsing
(def cli-spec
  {:tools    {:coerce :string :desc "EDN file with tool definitions (def-tool format)"}
   :cases    {:coerce :string :desc "EDN file with test cases (optional)"}
   :model    {:coerce :string :desc "Ollama model to benchmark"}
   :host     {:coerce :string :desc "Ollama server URL"}
   :out-dir  {:coerce :string :desc "Output directory for reports"}
   :max-steps {:coerce :long   :desc "Maximum agent loop steps per case (default: 4)"}
   :think    {:coerce :bool   :desc "Enable think mode for compatible models"}
   :options  {:coerce :string :desc "EDN string of model options (e.g., {:temperature 0.2})"}
   :n        {:coerce :long   :desc "Number of runs per case (default: 1)"}})

(defn -main [& args]
  (let [parsed (cli/parse-opts args {:spec cli-spec})
        opts parsed]
    (when-not (:model opts)
      (println "Missing --model <model>")
      (System/exit 1))
    (when-not (:tools opts)
      (println "Missing --tools <file>")
      (System/exit 1))
    (let [{:keys [model tools cases host out-dir max-steps think options n]} (update opts :n #(or % 1))
          model-options (when options (edn/read-string options))
          out-path (when out-dir (fs/path out-dir "tool-calling-bench"))
          _ (when out-dir (fs/create-dirs out-dir))
          results (mapv (fn [_] (run! {:host (or host ollama/default-host)
                                        :model model
                                        :tools-file tools
                                        :cases-file cases
                                        :max-steps (or max-steps 4)
                                        :think think
                                        :options model-options
                                        :timeout-ms 300000
                                        :out (when out-path (str out-path ".json"))}))
                       (range n))
          summary {:model model
                  :total_runs n
                  :results results}]
      
      (when out-dir
        (let [edn-file (str out-path ".edn")
              json-file (str out-path ".json")
              md-file (str out-path ".md")]
          (spit edn-file (pr-str summary))
          (spit json-file (json/generate-string summary {:pretty true}))
          (spit md-file (md-tool-calling-table [{:model model :summary (:summary (first results))}]))
          (println "Wrote:" edn-file json-file md-file)))
      
      (println "Summary:" (json/generate-string (:summary (first results)) {:pretty true})))))

(when (= *file* (System/getProperty "babashka.file"))
  (apply -main *command-line-args*))
