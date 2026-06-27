(ns eta-mu.extensions.contract-runtime
  "Real contract runtime for Pi.

  Provides:
  - session context bridge
  - contract discovery from CONTRACT.edn files
  - pure-CLJS fulfillment-score evaluation for the existing contract subset
  - contract_fulfillment tool
  - lightweight UI command/status surface

  This keeps both the runtime and the evaluator legible inside ClojureScript
  instead of hiding a second evaluator inside an embedded string."
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            [cljs.reader :as reader]
            [cljs.pprint :refer [pprint]]
            [goog.object :as gobj]
            ["node:fs" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]))

(def HOME (.homedir os))
(def PI-AGENT-DIR (path/join HOME ".ημ" "agent"))
(def ETA-MU-STATE-ROOT (path/join HOME ".ημ" "state"))
(def LEGACY-STATE-ROOT (path/join PI-AGENT-DIR "state"))
(def SETTINGS-FILE (path/join PI-AGENT-DIR "settings.json"))
(def PRIMARY-SKILL-ROOT (path/join PI-AGENT-DIR "skills"))
(defn resolve-state-dir [name]
  (let [eta-mu-dir (path/join ETA-MU-STATE-ROOT name)
        legacy-dir (path/join LEGACY-STATE-ROOT name)]
    (if (.existsSync fs eta-mu-dir)
      eta-mu-dir
      (if (.existsSync fs legacy-dir)
        legacy-dir
        eta-mu-dir))))
(def STATE-DIR (resolve-state-dir "cljs-contract-runtime"))
(def SCORES-FILE (path/join STATE-DIR "fulfillment-scores.jsonl"))
(def STATUS-KEY "cljs-contract-runtime")
(def GLOBAL-KEY "__eta_mu_cljs_contract_runtime__")
(def COMMON-SKILL-ROOTS
  [PRIMARY-SKILL-ROOT
   (path/join HOME ".codex" "skills")
   (path/join HOME ".codex" "vendor_imports" "skills" "skills" ".curated")
   (path/join HOME ".claude" "skills")])

(def builtin-env
  {'+ +
   '- -
   '* *
   '/ /
   '= =
   '< <
   '> >
   '<= <=
   '>= >=
   'min min
   'max max
   'inc inc
   'dec dec
   'count count
   'get get
   'map map
   'reduce reduce
   'filter filter
   'first first
   'rest rest
   'conj conj
   'vec vec
   'seq seq
   'not not
   'empty? empty?
   'pos? pos?
   'neg? neg?
   'nil? nil?})

(declare eval-expr)

(defn eval-seq [env forms]
  (reduce (fn [_ form] (eval-expr env form)) nil forms))

(defn eval-map-literal [env m]
  (into {}
        (map (fn [[k v]] [k (eval-expr env v)]) m)))

(defn eval-fn-form [env [_ params & body]]
  (fn [& args]
    (let [call-env (merge env (zipmap params args))]
      (eval-seq call-env body))))

(defn eval-let-form [env [_ bindings & body]]
  (let [pairs (partition 2 bindings)
        next-env (reduce (fn [acc [sym expr]]
                           (assoc acc sym (eval-expr acc expr)))
                         env
                         pairs)]
    (eval-seq next-env body)))

(defn eval-call-form [env expr]
  (let [f (eval-expr env (first expr))
        args (map #(eval-expr env %) (rest expr))]
    (apply f args)))

(defn eval-expr [env expr]
  (cond
    (symbol? expr)
    (if (contains? env expr)
      (get env expr)
      (throw (js/Error. (str "Unknown symbol in contract runtime: " expr))))

    (list? expr)
    (let [op (first expr)]
      (cond
        (= op 'fn) (eval-fn-form env expr)
        (= op 'let) (eval-let-form env expr)
        (= op 'if) (let [[_ test then else] expr]
                     (if (eval-expr env test)
                       (eval-expr env then)
                       (eval-expr env else)))
        (= op 'do) (eval-seq env (rest expr))
        :else (eval-call-form env expr)))

    (vector? expr) (mapv #(eval-expr env %) expr)
    (map? expr) (eval-map-literal env expr)
    :else expr))

(defn strip-comment-lines [text]
  (->> (str/split (or text "") #"\r?\n")
       (remove #(str/starts-with? (str/trim %) ";;"))
       (str/join "\n")))

;; CLJS analyzer warns on forward refs unless declared before first use.
(declare safe-read-text)

(defn read-contract-forms [file]
  (reader/read-string (str "[" (strip-comment-lines (safe-read-text file)) "]")))

(defn clause-map [clauses]
  (reduce (fn [m clause]
            (if (and (seq? clause) (symbol? (first clause)))
              (assoc m (first clause) (rest clause))
              m))
          {}
          clauses))

(defn extract-contract [file]
  (let [forms (read-contract-forms file)
        sc (first (filter #(and (seq? %) (= 'skill-contract (first %))) forms))]
    (when-not sc
      (throw (js/Error. (str "no skill-contract form in " file))))
    (let [m (clause-map (rest sc))]
      {:name (or (first (get m 'name)) file)
       :fulfillment (first (get m 'fulfillment-score))
       :contract file})))

(defn file-exists? [p]
  (.existsSync fs p))

(defn ensure-dir! [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn now-iso []
  (.toISOString (js/Date.)))

(defn ctx-cwd [ctx]
  (gobj/get ctx "cwd"))

(defn has-ui? [ctx]
  (boolean (gobj/get ctx "hasUI")))

(defn ctx-ui [ctx]
  (gobj/get ctx "ui"))

(defn session-file [ctx]
  (try
    (when-let [sm (gobj/get ctx "sessionManager")]
      (when-let [f (gobj/get sm "getSessionFile")]
        (.call f sm)))
    (catch :default _ nil)))

(defn current-model [ctx]
  (str (or (gobj/getValueByKeys ctx "model" "provider") "unknown")
       "/"
       (or (gobj/getValueByKeys ctx "model" "id") "unknown")))

(defn expand-tilde [p]
  (if (and (string? p) (str/starts-with? p "~/"))
    (path/join HOME (subs p 2))
    p))

(defn normalize-path [p]
  (when (and p (not (str/blank? p)))
    (path/resolve p)))

(defn safe-read-text [p]
  (try
    (.readFileSync fs p "utf8")
    (catch :default _ nil)))

(defn parse-json [s]
  (js->clj (js/JSON.parse s) :keywordize-keys false))

(defn safe-read-json [p]
  (try
    (when-let [text (safe-read-text p)]
      (parse-json text))
    (catch :default _ nil)))

(defn append-jsonl! [file value]
  (ensure-dir! (path/dirname file))
  (.appendFileSync fs file (str (js/JSON.stringify (clj->js value)) "\n") "utf8"))

(defn parse-jsonl [p]
  (if-not (file-exists? p)
    []
    (->> (str/split (or (safe-read-text p) "") #"\r?\n")
         (remove str/blank?)
         (map (fn [line]
                (try
                  (parse-json line)
                  (catch :default _ nil))))
         (remove nil?)
         vec)))

(defn same-path? [a b]
  (let [a* (normalize-path a)
        b* (normalize-path b)]
    (and a* b* (= a* b*))))

(defn row-matches-context? [row ctx]
  (let [ctx-cwd (ctx-cwd ctx)
        ctx-session (session-file ctx)
        row-session (get row "sessionFile")
        row-cwd (get row "cwd")]
    (or (and ctx-session row-session (= ctx-session row-session))
        (and ctx-cwd row-cwd (same-path? ctx-cwd row-cwd)))))

(defn parse-receipt-line [line]
  (reduce
    (fn [m chunk]
      (let [idx (.indexOf chunk "=")]
        (if (neg? idx)
          m
          (assoc m
                 (subs chunk 0 idx)
                 (subs chunk (inc idx))))))
    {}
    (str/split line #" \| ")))

(defn read-receipts-for-cwd [cwd]
  (let [receipt-file (path/join cwd "receipts.log")]
    (if-not (file-exists? receipt-file)
      []
      (->> (str/split (or (safe-read-text receipt-file) "") #"\r?\n")
           (remove str/blank?)
           (map parse-receipt-line)
           vec))))

(defn get-session-context [ctx]
  (let [ctx-session (session-file ctx)
        ctx-cwd (ctx-cwd ctx)
        reflections (->> (parse-jsonl (path/join (resolve-state-dir "session-mycology") "turn-reflections.jsonl"))
                         (filter #(row-matches-context? % ctx))
                         vec)
        spores (->> (parse-jsonl (path/join (resolve-state-dir "session-mycology") "skill-spores.jsonl"))
                    (filter #(row-matches-context? % ctx))
                    vec)
        skill-events (->> (parse-jsonl (path/join (resolve-state-dir "skill-graph-aco") "skill-call-events.jsonl"))
                          (filter #(row-matches-context? % ctx))
                          vec)
        receipt-events (->> (parse-jsonl (path/join (resolve-state-dir "receipt-river") "events.jsonl"))
                            (filter #(row-matches-context? % ctx))
                            vec)
        receipts (if ctx-cwd (read-receipts-for-cwd ctx-cwd) [])]
    {"ts" (now-iso)
     "cwd" ctx-cwd
     "sessionFile" ctx-session
     "model" (current-model ctx)
     "reflections" reflections
     "spores" spores
     "skillEvents" skill-events
     "receiptEvents" receipt-events
     "receipts" receipts}))

(defn dirents [dir]
  (js/Array.from (.readdirSync fs dir #js {:withFileTypes true})))

(defn discover-contract-files-in-root [root]
  (letfn [(walk [dir depth]
            (if (> depth 4)
              []
              (mapcat (fn [entry]
                        (let [full (path/join dir (.-name entry))]
                          (cond
                            (.isDirectory entry) (walk full (inc depth))
                            (and (.isFile entry) (= "CONTRACT.edn" (.-name entry))) [full]
                            :else [])))
                      (dirents dir))))]
    (if (file-exists? root)
      (walk root 0)
      [])))

(defn configured-skill-roots []
  (let [settings (safe-read-json SETTINGS-FILE)
        configured (if (and settings (array? (get settings "skills")))
                     (->> (js/Array.from (get settings "skills"))
                          (map expand-tilde)
                          vec)
                     [])]
    (->> (concat COMMON-SKILL-ROOTS configured)
         (remove nil?)
         (remove str/blank?)
         distinct
         vec)))

(defn discover-contract-files []
  (->> (configured-skill-roots)
       (mapcat discover-contract-files-in-root)
       distinct
       sort
       vec))

(defn contract-name-from-path [p]
  (path/basename (path/dirname p)))

(defn get-state []
  (let [g (.-globalThis js/globalThis)]
    (if (aget g GLOBAL-KEY)
      (aget g GLOBAL-KEY)
      (let [fresh #js {:lastAudit nil
                       :contractCount 0
                       :lastError nil}]
        (aset g GLOBAL-KEY fresh)
        fresh))))

(defn set-status! [ctx state]
  (when (has-ui? ctx)
    (.setStatus (ctx-ui ctx)
                STATUS-KEY
                (str "contracts:" (aget state "contractCount")
                     (when-let [audit (aget state "lastAudit")]
                       (str " p~"
                            (let [scored (filter number? (map #(get % "p") audit))]
                              (if (seq scored)
                                (.toFixed (/ (reduce + scored) (count scored)) 2)
                                "n/a"))))))))

(defn make-result
  ([text] (make-result text nil))
  ([text details]
   (clj->js {:content [{:type "text" :text text}]
             :details details})))

(defn evaluate-contract [session file]
  (try
    (let [{:keys [name fulfillment contract]} (extract-contract file)]
      (if (nil? fulfillment)
        {"name" name
         "contract" contract
         "ok" true
         "p" nil
         "note" "no fulfillment-score"}
        (let [f (eval-expr (assoc builtin-env 'session session) fulfillment)
              result (f session)]
          {"name" name
           "contract" contract
           "ok" true
           "p" (:p result)
           "result" result})))
    (catch :default e
      {"name" (contract-name-from-path file)
       "contract" file
       "ok" false
       "error" (.-message e)})))

(defn evaluate-contracts [session contract-files]
  (mapv #(evaluate-contract session %) contract-files))

(defn score-row [ctx row]
  {"ts" (now-iso)
   "cwd" (ctx-cwd ctx)
   "sessionFile" (session-file ctx)
   "model" (current-model ctx)
   "name" (get row "name")
   "contract" (get row "contract")
   "ok" (get row "ok")
   "p" (get row "p")
   "note" (or (get row "note") (get row "error"))
   "result" (get row "result")})

(defn persist-scores! [ctx rows]
  (doseq [row rows]
    (append-jsonl! SCORES-FILE (score-row ctx row))))

(defn audit-contracts! [ctx]
  (let [files (discover-contract-files)
        session (js->clj (clj->js (get-session-context ctx)) :keywordize-keys true)
        rows (evaluate-contracts session files)
        state (get-state)]
    (aset state "contractCount" (count files))
    (aset state "lastAudit" (clj->js rows))
    (aset state "lastError" nil)
    (persist-scores! ctx rows)
    (set-status! ctx state)
    rows))

(defn summarize-row [row]
  (let [name (or (get row "name") (contract-name-from-path (get row "contract")))
        p (get row "p")
        note (or (get row "note") (get row "error"))]
    (cond
      (number? p) (str name "\tp=" (.toFixed p 2))
      note (str name "\t" note)
      :else name)))

(defn list-contracts! [ctx]
  (let [files (discover-contract-files)
        state (get-state)]
    (aset state "contractCount" (count files))
    (set-status! ctx state)
    (mapv (fn [file] {"name" (contract-name-from-path file)
                      "contract" file})
          files)))

(defn check-contract! [ctx name]
  (let [rows (audit-contracts! ctx)
        matches (filter #(= name (or (get % "name") (contract-name-from-path (get % "contract")))) rows)]
    (if (seq matches)
      (first matches)
      {"name" name
       "ok" false
       "error" "not found"})))

(defn command-status-lines [state]
  (let [audit (js->clj (aget state "lastAudit") :keywordize-keys false)]
    (vec
      (concat
        [(str "contract-count: " (aget state "contractCount"))
         (str "last-error: " (or (aget state "lastError") "none"))]
        (when (seq audit)
          (concat
            ["recent audit:"]
            (map summarize-row (take 12 audit))))))))

(em/defextension contract-runtime
  :name "contract-runtime"
  :description "Operational contract runtime: session context bridge + fulfillment-score evaluation + audit tool."

  (em/command "contracts"
    :description "Inspect the contract runtime (/contracts status|list|audit|check <name>)"
    :handler (fn [args ctx]
               (let [state (get-state)
                     tokens (if (str/blank? args) [] (str/split (str/trim args) #"\s+"))
                     cmd (or (first tokens) "status")
                     arg (second tokens)]
                 (try
                   (cond
                     (= cmd "status")
                     (when (has-ui? ctx)
                       (.setWidget (ctx-ui ctx) STATUS-KEY (clj->js (command-status-lines state))))

                     (= cmd "list")
                     (let [rows (list-contracts! ctx)]
                       (when (has-ui? ctx)
                         (.setWidget (ctx-ui ctx) STATUS-KEY (clj->js (map (fn [row] (str (get row "name") "\t" (get row "contract"))) rows)))))

                     (= cmd "audit")
                     (let [rows (audit-contracts! ctx)]
                       (when (has-ui? ctx)
                         (.setWidget (ctx-ui ctx) STATUS-KEY (clj->js (map summarize-row rows)))))

                     (= cmd "check")
                     (if-not arg
                       (when (has-ui? ctx)
                         (.notify (ctx-ui ctx) "Usage: /contracts check <name>" "warn"))
                       (let [row (check-contract! ctx arg)]
                         (when (has-ui? ctx)
                           (.setWidget (ctx-ui ctx) STATUS-KEY (clj->js [(with-out-str (pprint row))])))))

                     :else
                     (when (has-ui? ctx)
                       (.notify (ctx-ui ctx) "Unknown /contracts command. Use: status|list|audit|check <name>" "warn")))
                   (catch :default e
                     (aset state "lastError" (.-message e))
                     (set-status! ctx state)
                     (when (has-ui? ctx)
                       (.notify (ctx-ui ctx) (str "contracts error: " (.-message e)) "warn")))))))

  (em/tool "contract_fulfillment"
    :label "Contract Fulfillment"
    :description "Evaluate skill CONTRACT.edn fulfillment-score forms against live session context."
    :parameters {:action {:type "string"
                          :enum ["check" "audit" "list"]
                          :description "check: one contract, audit: all loaded contracts, list: list discovered contracts"}
                 :name {:type "string"
                        :description "Contract/skill name for action=check"
                        :optional true}}
    :execute (fn [_tcid params _signal _onUpdate ctx]
               (let [action (or (aget params "action") "list")
                     state (get-state)]
                 (try
                   (cond
                     (= action "list")
                     (let [rows (list-contracts! ctx)
                           text (str/join "\n" (map (fn [row] (get row "name")) rows))]
                       (make-result text {"count" (count rows)
                                          "contracts" rows}))

                     (= action "audit")
                     (let [rows (audit-contracts! ctx)
                           text (str/join "\n" (map summarize-row rows))]
                       (make-result text {"count" (count rows)
                                          "results" rows}))

                     (= action "check")
                     (if-not (aget params "name")
                       (make-result "name parameter required for action=check" {"ok" false})
                       (let [row (check-contract! ctx (aget params "name"))
                             text (with-out-str (pprint row))]
                         (make-result text row)))

                     :else
                     (make-result (str "Unknown action: " action) {"ok" false}))
                   (catch :default e
                     (aset state "lastError" (.-message e))
                     (set-status! ctx state)
                     (make-result (str "contract runtime error: " (.-message e)) {"ok" false
                                                                                    "error" (.-message e)}))))))

  (em/on "session_start"
    :handler (fn [event ctx]
               (ensure-dir! STATE-DIR)
               (let [state (get-state)]
                 (aset state "contractCount" (count (discover-contract-files)))
                 (aset state "lastError" nil)
                 (set-status! ctx state)
                 nil)))

  (em/on "session_switch"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (aset state "contractCount" (count (discover-contract-files)))
                 (set-status! ctx state)
                 nil)))

  (em/on "session_shutdown"
    :handler (fn [event ctx]
               (when (has-ui? ctx)
                 (.setStatus (ctx-ui ctx) STATUS-KEY js/undefined)))))
