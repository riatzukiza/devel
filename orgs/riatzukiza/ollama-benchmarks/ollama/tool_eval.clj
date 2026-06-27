(ns ollama.tool-eval
  (:require
   [babashka.cli :as cli]
   [babashka.fs :as fs]
   [clojure.edn :as edn]
   [clojure.string :as str]
   [babashka.curl :as curl]
   [cheshire.core :as json]))

;; ---- Tool implementations ----

(defn calculate-age [birth-year & {:keys [current-year]}]
  (let [cy (or current-year (.getValue (java.time.Year/now)))]
    (- cy birth-year)))

(defn get-weather [location & {:keys [units]}]
  ;; Mock weather data for benchmarking
  (let [temps {"Tokyo" 22 "New York" 18 "London" 15 "Paris" 17}
        temp (get temps location 20)
        unit (or units "celsius")
        result (if (= unit "fahrenheit")
                 (+ 32 (* temp 9/5))
                 temp)]
    {:location location
     :temperature result
     :units unit
     :condition "clear"}))

(defn create-file [filename content & {:keys [path]}]
  (let [full-path (if path (fs/path path filename) (fs/path filename))]
    (fs/create-dirs (fs/parent full-path))
    (spit full-path content)
    {:filename filename
     :path (str full-path)
     :size (count content)
     :created true}))

(defn send-email [to subject body & {:keys [priority]}]
  ;; Mock email implementation for benchmarking
  (let [email-id (str "email-" (java.util.UUID/randomUUID))
        result {:id email-id
                :to to
                :subject subject
                :body body
                :priority (or priority "normal")
                :sent true}]
    (println (str "Mock email sent: " result))
    result))

(defn query-database [table & {:keys [columns where limit]}]
  ;; Mock database query for benchmarking
  (let [mock-data {"users" [{:id 1 :name "Alice" :active true}
                            {:id 2 :name "Bob" :active false}
                            {:id 3 :name "Charlie" :active true}]
                   "products" [{:id 1 :name "Laptop" :price 999}
                               {:id 2 :name "Mouse" :price 29}
                               {:id 3 :name "Keyboard" :price 79}]}
        table-data (get mock-data table [])
        filtered-data (if where
                        (filter :active table-data)
                        table-data)
        selected-columns (or columns (keys (first table-data)))
        limited-data (take (or limit (count filtered-data)) filtered-data)]
    {:table table
     :columns selected-columns
     :results (map #(select-keys % selected-columns) limited-data)
     :count (count limited-data)}))

(defn generate-code [language description & {:keys [framework]}]
  (let [code-snippets {"python" {:fibonacci
                                 "(def fibonacci\n  (fn [n]\n    (if (<= n 1)\n      n\n      (+ (fibonacci (- n 1)) (fibonacci (- n 2))))))"
                                 :hello "print('Hello, World!')"}
                       "javascript" {:fibonacci
                                     "function fibonacci(n) {\n  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);\n}"
                                     :hello "console.log('Hello, World!');"}
                       "java" {:fibonacci
                               "public int fibonacci(int n) {\n    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);\n}"
                               :hello "System.out.println(\"Hello, World!\");"}}
        lang-snippets (get code-snippets language {})
        code (or (get lang-snippets (keyword description))
                 (get lang-snippets :hello)
                 (str "// " description " in " language))]
    {:language language
     :description description
     :framework framework
     :code code
     :generated true}))

(defn analyze-sentiment [text & {:keys [language]}]
  (let [positive-words #{"good" "great" "excellent" "love" "amazing" "wonderful" "fantastic"}
        negative-words #{"bad" "terrible" "hate" "awful" "horrible" "worst" "disgusting"}
        words (map str/lower-case (str/split text #"\s+"))
        pos-count (count (filter positive-words words))
        neg-count (count (filter negative-words words))]
    {:text text
     :language (or language "en")
     :sentiment (cond
                  (> pos-count neg-count) "positive"
                  (> neg-count pos-count) "negative"
                  :else "neutral")
     :positive_words pos-count
     :negative_words neg-count
     :confidence (max pos-count neg-count)}))

(defn convert-currency [amount from-currency to-currency & {:keys [date]}]
  ;; Mock currency conversion for benchmarking
  (let [mock-rates {"USD" {"EUR" 0.85 "GBP" 0.73 "JPY" 110}
                    "EUR" {"USD" 1.18 "GBP" 0.86 "JPY" 129}
                    "GBP" {"USD" 1.37 "EUR" 1.16 "JPY" 150}}]
    (if (= from-currency to-currency)
      {:amount amount
       :from_currency from-currency
       :to_currency to-currency
       :result amount
       :rate 1.0}
      (let [rate (get-in mock-rates [from-currency to-currency])
            result (if rate (* amount rate) nil)]
        {:amount amount
         :from_currency from-currency
         :to_currency to-currency
         :result result
         :rate rate
         :date date}))))

;; ---- Tool execution dispatcher ----

(def tool-registry {"calculate_age" calculate-age
                    "get_weather" get-weather
                    "create_file" create-file
                    "send_email" send-email
                    "query_database" query-database
                    "generate_code" generate-code
                    "analyze_sentiment" analyze-sentiment
                    "convert_currency" convert-currency})

(defn execute-tool-call [tool-call]
  (let [tool-name (get-in tool-call [:function :name])
        tool-args (get-in tool-call [:function :arguments])
        tool-fn (get tool-registry tool-name)]
    (if tool-fn
      (try
        (let [result (apply tool-fn (mapcat seq tool-args))]
          {:tool_name tool-name
           :arguments tool-args
           :result result
           :success true})
        (catch Exception e
          {:tool_name tool-name
           :arguments tool-args
           :error (.getMessage e)
           :success false}))
      {:tool_name tool-name
       :arguments tool-args
       :error "Tool not found"
       :success false})))

;; ---- Enhanced Ollama API with tool execution ----

(defn ollama-chat-with-tools
  [{:keys [endpoint model prompt tools]}]
  (let [url (str (or endpoint "http://localhost:11434") "/api/chat")
        body {:model model
              :messages [{:role "user" :content prompt}]
              :stream false}
        body-with-tools (if tools
                          (assoc body :tools tools)
                          body)
        {:keys [status body]} (curl/post url {:body (json/generate-string body-with-tools)
                                              :headers {"content-type" "application/json"}
                                              :throw false})]
    (if (= 200 status)
      (let [response (json/parse-string body keyword)
            tool-calls (get-in response [:message :tool_calls])]
        (if tool-calls
          (let [tool-results (mapv execute-tool-call tool-calls)
                follow-up-prompt (str prompt "\n\nTool results:\n"
                                      (json/generate-string tool-results {:pretty true}))
                follow-up-body {:model model
                                :messages [{:role "user" :content prompt}
                                           {:role "assistant" :content (:content (:message response))}
                                           {:role "user" :content follow-up-prompt}]
                                :stream false}]
            ;; Second call to get final response with tool results
            (let [{:keys [status body]} (curl/post url {:body (json/generate-string follow-up-body)
                                                        :headers {"content-type" "application/json"}
                                                        :throw false})]
              (if (= 200 status)
                (let [final-response (json/parse-string body keyword)]
                  (assoc final-response
                         :tool_execution tool-results
                         :original_response response))
                {:error true :status status :body body})))
          response))
      {:error true :status status :body body})))

;; ---- Utility functions ----

(defn now-ms []
  (System/currentTimeMillis))

(defn mean [xs]
  (when (seq xs)
    (/ (reduce + xs) (double (count xs)))))

;; ---- File operations ----

(defn read-edn-file [f]
  (edn/read-string (slurp f)))

(defn ensure-dir! [d]
  (fs/create-dirs d)
  d)

(defn write-edn! [f data]
  (spit f (pr-str data)))

(defn write-json! [f data]
  (spit f (json/generate-string data {:pretty true})))

(defn write-md! [f s]
  (spit f s))

;; ---- CLI parsing ----

(def cli-spec
  {:config  {:coerce :string :desc "EDN config file with models/prompts"}
   :out-dir {:coerce :string :desc "Output directory for reports"}
   :n       {:coerce :long   :desc "Number of runs per (model,prompt) combo"}
   :tools   {:coerce :string :desc "EDN file with tool definitions and implementations"}})

(defn parse-args [args]
  (let [parsed (cli/parse-opts args {:spec cli-spec})
        opts parsed]
    (when-not (:config opts)
      (println "Missing --config <file>")
      (System/exit 1))
    (when-not (:out-dir opts)
      (println "Missing --out-dir <dir>")
      (System/exit 1))
    (when-not (:tools opts)
      (println "Missing --tools <file>")
      (System/exit 1))
    (update opts :n #(or % 3))))

;; ---- Report generation ----

(defn md-tool-eval-table [results]
  (let [header "| Model | Prompt | Runs | OK | Tools Called | Exec Success | Mean TPS | Mean Duration (ms) |\n|---|---|---|---|---|---|---|---|\n"
        rows   (for [{:keys [model prompt summary]} results
                     :let [{:keys [runs_total runs_ok mean_tool_calls tool_exec_success_rate mean_tps mean_duration_ms]} summary]]
                 (format "| `%s` | %s | %d | %d | %.1f | %.1f%% | %.2f | %.1f |\n"
                         model
                         (str/replace prompt #"\n" " ")
                         runs_total
                         runs_ok
                         (or mean_tool_calls 0.0)
                         (* tool_exec_success_rate 100)
                         (or mean_tps 0.0)
                         (or mean_duration_ms 0.0)))]
    (str "# Ollama Tool Evaluation Benchmark\n\n"
         header
         (apply str rows)
         "\n## Tool Execution Details\n\n"
         "This benchmark evaluates each model's ability to not only call tools but also execute them correctly.\n\n"
         "**Metrics:**\n"
         "- **Tools Called**: Average number of tools invoked per response\n"
         "- **Exec Success**: Percentage of tool executions that completed successfully\n"
         "- **TPS**: Tokens per second generation speed\n"
         "- **Duration**: Total response time including tool execution\n\n")))
