(ns promptbench.control-plane.bench
  "Benchmark run discovery + host-native tmux-backed job control."
  (:require [clojure.edn :as edn]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.java.shell :as sh]
            [clojure.string :as str]
            [promptbench.eval.report :as report]
            [promptbench.eval.stats :as stats])
  (:import [java.time Instant]
           [java.time.format DateTimeFormatter]
           [java.io RandomAccessFile]))

(def ^:private default-models
  "glm-5,gpt-5.2,gpt-5.4,kimi-k2.5,factory/claude-opus-4-6")

(declare list-benchmark-runs run-metadata)

(defn- now-iso []
  (.format DateTimeFormatter/ISO_INSTANT (Instant/now)))

(defn benchmark-base-dir []
  "data/runs")

(defn- benchmark-run-dir [run-id]
  (str (benchmark-base-dir) "/" run-id))

(defn- ensure-dir! [path]
  (let [f (io/file path)]
    (.mkdirs f)
    path))

(defn- parse-long-safe [x]
  (cond
    (integer? x) (long x)
    (number? x) (long x)
    (string? x) (parse-long (str/trim x))
    :else nil))

(defn- normalize-string-vec [x]
  (cond
    (nil? x) nil
    (string? x) (->> (str/split x #",")
                     (map str/trim)
                     (remove str/blank?)
                     vec)
    (sequential? x) (->> x (map str) (map str/trim) (remove str/blank?) vec)
    :else [(str x)]))

(defn- file-exists? [path]
  (.exists (io/file path)))

(defn- parse-edn-file-safe [path]
  (when (file-exists? path)
    (try
      (edn/read-string (slurp path))
      (catch Exception _ nil))))

(defn- parse-kv-file [path]
  (when (file-exists? path)
    (->> (str/split-lines (slurp path))
         (map str/trim)
         (remove str/blank?)
         (keep (fn [line]
                 (when-let [[_ k v] (re-matches #"([^=]+)=(.*)" line)]
                   [(keyword k) v])))
         (into {}))))

(defn- parse-json-line-safe [line]
  (when (and (string? line) (not (str/blank? line)))
    (try
      (json/parse-string line true)
      (catch Exception _ nil))))

(defn- read-events-safe [path]
  (if-not (file-exists? path)
    {:events [] :parse_errors 0}
    (let [lines (str/split-lines (slurp path))]
      (reduce (fn [{:keys [events parse_errors]} line]
                (if-let [event (parse-json-line-safe line)]
                  {:events (conj events event) :parse_errors parse_errors}
                  {:events events :parse_errors (inc parse_errors)}))
              {:events [] :parse_errors 0}
              lines))))

(defn- tail-bytes [path max-bytes]
  (let [f (io/file path)]
    (when (.exists f)
      (with-open [raf (RandomAccessFile. f "r")]
        (let [len (.length raf)
              n (long (min (long max-bytes) len))
              start (- len n)
              buf (byte-array n)]
          (.seek raf start)
          (.readFully raf buf)
          (String. buf "UTF-8"))))))

(defn- log-tail [run-id]
  (or (tail-bytes (str (benchmark-run-dir run-id) "/launcher.log") 65536)
      (tail-bytes (str (benchmark-run-dir run-id) "/run.log") 65536)
      ""))

(defn- tmux-ok? []
  (zero? (:exit (sh/sh "bash" "-lc" "command -v tmux >/dev/null"))))

(defn- tmux-session-live? [session]
  (and (tmux-ok?)
       (string? session)
       (not (str/blank? session))
       (zero? (:exit (sh/sh "tmux" "has-session" "-t" session)))))

(defn- sanitize-session [s]
  (-> (or s "")
      (str/replace #"[^A-Za-z0-9_.-]" "-")
      (str/replace #"-+" "-")
      (str/replace #"^-|-$" "")))

(defn- derive-status [{:keys [metrics-present tmux-running launcher-log-present events-present]}]
  (cond
    tmux-running :running
    metrics-present :completed
    (or launcher-log-present events-present) :incomplete
    :else :created))

(defn- summarize-models [metrics]
  (when (seq metrics)
    (->> (report/summarize-by metrics [:target_model :placement_mode])
         (mapv (fn [row]
                 (let [harm (stats/cell-proportion-summary row :harmful-compliance)
                       benign (stats/cell-proportion-summary row :benign-failure)]
                   {:target_model (first (:group row))
                    :placement_mode (second (:group row))
                    :n_total (:n_total row)
                    :n_errors (:n_errors row)
                    :n_adversarial (:n_adversarial row)
                    :n_benign (:n_benign row)
                    :n_harmful_compliance (:n_harmful_compliance row)
                    :n_benign_failure (:n_benign_failure row)
                    :n_benign_task_success (:n_benign_task_success row)
                    :asr (:asr row)
                    :fpr (:fpr row)
                    :benign_task_success_rate (:benign_task_success_rate row)
                    :harm_ci_low (:ci_low harm)
                    :harm_ci_high (:ci_high harm)
                    :harm_powered (:adequately_powered? harm)
                    :benign_ci_low (:ci_low benign)
                    :benign_ci_high (:ci_high benign)
                    :benign_powered (:adequately_powered? benign)}))))))

(defn- judged-run-config? [cfg]
  (and (= "llm-rubric" (some-> (:harm_judge_policy cfg) str/lower-case))
       (= "llm-rubric" (some-> (:benign_task_judge_policy cfg) str/lower-case))))

(defn- event-dedupe-key [event]
  [(:policy_layer event)
   (:target_model event)
   (:case_id event)])

(defn- event-rank [event]
  [(if (some? (:error event)) 0 1)
   (if (some? (:response_hash event)) 1 0)
   (or (:ts event) "")])

(defn- prefer-event [current candidate]
  (if (pos? (compare (event-rank candidate) (event-rank current)))
    candidate
    current))

(defn- event-adversarial? [event]
  (= "adversarial" (some-> (:intent_label event) str/lower-case)))

(defn- event-benign? [event]
  (= "benign" (some-> (:intent_label event) str/lower-case)))

(defn- summarize-aggregate-cells [cells]
  (->> cells
       (mapv (fn [[k cell]]
               (let [adv (long (or (:n_adversarial cell) 0))
                     ben (long (or (:n_benign cell) 0))
                     hc (long (or (:n_harmful_compliance cell) 0))
                     bf (long (or (:n_benign_failure cell) 0))
                     bts (long (or (:n_benign_task_success cell) 0))
                     asr (when (pos? adv) (/ (double hc) (double adv)))
                     fpr (when (pos? ben) (/ (double bf) (double ben)))
                     tsr (when (pos? ben) (/ (double bts) (double ben)))
                     harm (stats/proportion-summary hc adv)
                     benign (stats/proportion-summary bf ben)]
                 {:policy_layer (:policy_layer k)
                  :target_model (:target_model k)
                  :placement_mode (:placement_mode k)
                  :n_total (:n_total cell)
                  :n_errors (:n_errors cell)
                  :n_adversarial adv
                  :n_benign ben
                  :n_harmful_compliance hc
                  :n_benign_failure bf
                  :n_benign_task_success bts
                  :asr asr
                  :fpr fpr
                  :benign_task_success_rate tsr
                  :harm_ci_low (:ci_low harm)
                  :harm_ci_high (:ci_high harm)
                  :harm_powered (:adequately_powered? harm)
                  :benign_ci_low (:ci_low benign)
                  :benign_ci_high (:ci_high benign)
                  :benign_powered (:adequately_powered? benign)})))
       (sort-by (juxt :policy_layer :target_model :placement_mode))))

(defn aggregate-benchmark-runs
  ([] (aggregate-benchmark-runs {}))
  ([{:keys [run_ids judged_only placement_mode target_models run_id_query]
     :or {judged_only true}}]
   (let [all-runs (list-benchmark-runs)
         run-id-set (when (seq run_ids) (set run_ids))
         target-model-set (some->> (normalize-string-vec target_models) set)
         run-id-query (some-> run_id_query str str/trim not-empty)
         candidate-runs (->> all-runs
                             (filter (fn [run]
                                       (and (:events_present run)
                                            (or (nil? run-id-query)
                                                (str/includes? (:id run) run-id-query))
                                            (or (nil? run-id-set)
                                                (contains? run-id-set (:id run)))))))
         selected-runs (if judged_only
                         (filter (fn [run]
                                   (judged-run-config? (:config (run-metadata (:id run)))))
                                 candidate-runs)
                         candidate-runs)
         {:keys [events-by-key raw-events parse-errors duplicates]} 
         (reduce (fn [{:keys [events-by-key raw-events parse-errors duplicates]} run]
                   (let [meta (run-metadata (:id run))
                         {:keys [events parse_errors]} (read-events-safe (:events_path meta))]
                     (reduce (fn [acc event]
                               (let [placement-ok? (or (nil? placement_mode)
                                                       (= placement_mode (:placement_mode event)))
                                     model-ok? (or (nil? target-model-set)
                                                   (contains? target-model-set (:target_model event)))
                                     raw-events' (inc (:raw-events acc))]
                                 (if-not (and placement-ok? model-ok?)
                                   (assoc acc :raw-events raw-events')
                                   (let [k (event-dedupe-key event)]
                                     (if-let [existing (get (:events-by-key acc) k)]
                                       {:events-by-key (assoc (:events-by-key acc) k (prefer-event existing event))
                                        :raw-events raw-events'
                                        :parse-errors (:parse-errors acc)
                                        :duplicates (inc (:duplicates acc))}
                                       {:events-by-key (assoc (:events-by-key acc) k event)
                                        :raw-events raw-events'
                                        :parse-errors (:parse-errors acc)
                                        :duplicates (:duplicates acc)})))))
                             {:events-by-key events-by-key
                              :raw-events raw-events
                              :parse-errors (+ parse-errors parse_errors)
                              :duplicates duplicates}
                             events)))
                 {:events-by-key {}
                  :raw-events 0
                  :parse-errors 0
                  :duplicates 0}
                 selected-runs)
         unique-events (vals events-by-key)
         aggregate-cells
         (reduce (fn [cells event]
                   (let [k {:policy_layer (:policy_layer event)
                            :target_model (:target_model event)
                            :placement_mode (:placement_mode event)}
                         adv? (event-adversarial? event)
                         ben? (event-benign? event)
                         harmful? (true? (get-in event [:judgments :harmful_compliance]))
                         benign-failure? (true? (get-in event [:judgments :benign_failure]))
                         benign-success? (true? (get-in event [:judgments :benign_task_success]))
                         err? (some? (:error event))
                         usage (:usage event)
                         total-tokens (:total_tokens usage)
                         latency (:latency_ms event)]
                     (update cells k
                             (fn [cell]
                               (let [cell (or cell {:n_total 0
                                                    :n_errors 0
                                                    :n_adversarial 0
                                                    :n_harmful_compliance 0
                                                    :n_benign 0
                                                    :n_benign_failure 0
                                                    :n_benign_task_success 0
                                                    :latency_ms_sum 0
                                                    :latency_ms_n 0
                                                    :tokens_sum 0
                                                    :tokens_n 0})]
                                 (-> cell
                                     (update :n_total inc)
                                     (update :n_errors + (if err? 1 0))
                                     (update :n_adversarial + (if adv? 1 0))
                                     (update :n_harmful_compliance + (if harmful? 1 0))
                                     (update :n_benign + (if ben? 1 0))
                                     (update :n_benign_failure + (if benign-failure? 1 0))
                                     (update :n_benign_task_success + (if benign-success? 1 0))
                                     (update :latency_ms_sum + (long (or latency 0)))
                                     (update :latency_ms_n + (if latency 1 0))
                                     (update :tokens_sum + (long (or total-tokens 0)))
                                     (update :tokens_n + (if total-tokens 1 0))))))))
                 {}
                 unique-events)
         summaries (summarize-aggregate-cells aggregate-cells)]
     {:judged_only judged_only
      :placement_mode placement_mode
      :target_models (when target-model-set (vec (sort target-model-set)))
      :run_id_query run-id-query
      :included_run_ids (mapv :id selected-runs)
      :included_runs (mapv #(select-keys % [:id :created_at :status :models :max_cases :placement_modes :tmux_running]) selected-runs)
      :included_run_count (count selected-runs)
      :raw_event_count raw-events
      :unique_event_count (count unique-events)
      :duplicate_event_count duplicates
      :parse_error_count parse-errors
      :model_summaries summaries})))

(defn- run-metadata [run-id]
  (let [dir (benchmark-run-dir run-id)
        cfg-path (str dir "/config.edn")
        metrics-path (str dir "/metrics.edn")
        events-path (str dir "/events.jsonl")
        launcher-path (str dir "/launcher.log")
        remote-session-path (str dir "/remote-session.txt")
        cfg (parse-edn-file-safe cfg-path)
        remote-session (parse-kv-file remote-session-path)
        tmux-session (:tmux_session remote-session)
        tmux-running (boolean (tmux-session-live? tmux-session))
        metrics-present (file-exists? metrics-path)
        launcher-log-present (file-exists? launcher-path)
        events-present (file-exists? events-path)]
    {:id run-id
     :dir dir
     :config_path cfg-path
     :metrics_path metrics-path
     :events_path events-path
     :launcher_log_path launcher-path
     :remote_session_path remote-session-path
     :config cfg
     :created_at (or (:started_at remote-session)
                     (some-> cfg :run_id str)
                     (some-> (io/file dir) .lastModified Instant/ofEpochMilli str))
     :models (vec (or (:models cfg) []))
     :max_cases (:max_cases cfg)
     :placement_modes (:placement_modes cfg)
     :tmux_session tmux-session
     :tmux_running tmux-running
     :metrics_present metrics-present
     :launcher_log_present launcher-log-present
     :events_present events-present
     :status (derive-status {:metrics-present metrics-present
                             :tmux-running tmux-running
                             :launcher-log-present launcher-log-present
                             :events-present events-present})}))

(defn list-benchmark-runs []
  (let [base (io/file (benchmark-base-dir))]
    (if-not (.exists base)
      []
      (->> (.listFiles base)
           (filter #(.isDirectory %))
           (map (fn [f]
                  (select-keys (run-metadata (.getName f))
                               [:id :created_at :models :max_cases :placement_modes
                                :tmux_session :tmux_running :metrics_present
                                :launcher_log_present :events_present :status])))
           (sort-by (juxt :created_at :id))
           reverse
           vec))))

(defn get-benchmark-run [run-id]
  (let [dir (io/file (benchmark-run-dir run-id))]
    (when (.exists dir)
      (let [meta (run-metadata run-id)
            metrics (parse-edn-file-safe (:metrics_path meta))]
        (merge meta
               {:metrics metrics
                :model_summaries (summarize-models metrics)
                :log_tail (log-tail run-id)})))))

(defn- sh-ok! [& argv]
  (let [{:keys [exit err out]} (apply sh/sh argv)]
    (when-not (zero? exit)
      (throw (ex-info (str "command failed: " (str/join " " argv))
                      {:argv argv :exit exit :err err :out out})))
    out))

(defn- benchmark-command [{:keys [run-id max-cases concurrency seed models placement-modes policies]}]
  (str "cd " (System/getProperty "user.dir")
       " && RUN_ID=" run-id
       " MAX_CASES=" max-cases
       " CONCURRENCY=" concurrency
       " SEED=" seed
       (when (seq models) (str " MODELS='" models "'"))
       (when (seq placement-modes) (str " PLACEMENT_MODES='" placement-modes "'"))
       (when (seq policies) (str " POLICIES='" policies "'"))
       " bash scripts/ussy_host_long_bench.sh"))

(defn start-benchmark-job! [payload]
  (let [run-id (or (:run_id payload)
                   (:run-id payload)
                   (str "ui-host-long-" (-> (now-iso)
                                             (str/replace #":" "")
                                             (str/replace #"[-TZ]" ""))))
        session (or (:tmux_session payload)
                    (:tmux-session payload)
                    (str "shib-ui-" (sanitize-session run-id)))
        max-cases (or (parse-long-safe (:max_cases payload))
                      (parse-long-safe (:max-cases payload))
                      600)
        concurrency (or (parse-long-safe (:concurrency payload)) 4)
        seed (or (parse-long-safe (:seed payload)) 1337)
        models (or (:models payload) default-models)
        placement-modes (or (:placement_modes payload) (:placement-modes payload) "direct-user")
        policies (or (:policies payload) "P0")
        run-dir (benchmark-run-dir run-id)
        remote-session-path (str run-dir "/remote-session.txt")
        cmd (benchmark-command {:run-id run-id
                                :max-cases max-cases
                                :concurrency concurrency
                                :seed seed
                                :models models
                                :placement-modes placement-modes
                                :policies policies})]
    (when (tmux-session-live? session)
      (throw (ex-info "tmux session already exists" {:session session :run-id run-id})))
    (ensure-dir! run-dir)
    (sh-ok! "tmux" "new-session" "-d" "-s" session "bash" "--noprofile" "--norc")
    (spit remote-session-path (str "tmux_session=" session "\n"
                                   "run_id=" run-id "\n"
                                   "started_at=" (now-iso) "\n"))
    (sh-ok! "tmux" "send-keys" "-t" session cmd "C-m")
    {:ok true
     :run_id run-id
     :tmux_session session
     :status :running
     :command cmd}))

(defn stop-benchmark-job! [run-id]
  (let [meta (run-metadata run-id)
        session (:tmux_session meta)]
    (when-not (seq session)
      (throw (ex-info "run has no tmux session metadata" {:run-id run-id})))
    (when (tmux-session-live? session)
      (sh-ok! "tmux" "kill-session" "-t" session))
    {:ok true
     :run_id run-id
     :tmux_session session
     :status :stopped}))
