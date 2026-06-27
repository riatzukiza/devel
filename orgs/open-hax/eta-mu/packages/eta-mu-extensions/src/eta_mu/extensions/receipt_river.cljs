(ns eta-mu.extensions.receipt-river
  "Append-only per-repo receipts.edn ledger for multi-step work.

  Migrated from: ~/.ημ/agent/extensions/receipt-river.ts"
  (:require-macros [eta-mu.core :as em])
  (:require ["os" :as os]
            ["fs" :as fs]
            ["path" :as path]
            [clojure.string :as str]
            [eta-mu.extensions.prompt-section :as prompt-section]
            [eta-mu.extensions.receipt-river.edn :as rr-edn]
            [eta-mu.extensions.receipt-river.repo :as rr-repo]))

(def ^:const HOME (.homedir os))
(def ^:const ETA-MU-STATE-ROOT (path/join HOME ".ημ" "state"))
(def ^:const LEGACY-STATE-ROOT (str HOME "/.ημ/agent/state"))
(defn resolve-state-dir [name]
  (let [eta-mu-dir (path/join ETA-MU-STATE-ROOT name)
        legacy-dir (path/join LEGACY-STATE-ROOT name)]
    (if (.existsSync fs eta-mu-dir)
      eta-mu-dir
      (if (.existsSync fs legacy-dir)
        legacy-dir
        eta-mu-dir))))
(def ^:const STATE-DIR (resolve-state-dir "receipt-river"))
(def ^:const EVENTS-FILE (path/join STATE-DIR "events.jsonl"))
(def ^:const STATUS-KEY "receipt-river")
(def ^:const GLOBAL-KEY "__pi_receipt_river_state__")
(def ^:const PROMPT-SECTION-START "<!-- eta-mu:receipt-river:start -->")
(def ^:const PROMPT-SECTION-END "<!-- eta-mu:receipt-river:end -->")
(def ^:const PI-VERSION "0.63.1")
(def ^:const RECEIPT-FILE-NAME "receipts.edn")
(def ^:const ACTIVATION-THRESHOLD 1)

(def ^:const OPTIONAL-KEYS
  #js ["note" "tests" "decisions" "drift"])

(def ^:const KNOWN-KINDS
  #js [":push-truth" ":artifact-hash" ":test-run" ":build" ":decision"
       ":drift" ":catalog" ":observation" ":field-impact" ":truth"
       ":refutation" ":adjudication"])

(def ^:const SUBSTANTIVE-TOOLS
  #js ["edit" "write" "apply_patch"])

(def ^:const PATH-PARAM-KEYS
  #js ["path" "file" "dest" "destination" "target" "filename" "filepath"])

(defn now-iso []
  (.toISOString (js/Date.)))

(defn ensure-dir [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn clamp-int [value fallback min max]
  (let [n (js/Number value)]
    (if (js/Number.isFinite n)
      (js/Math.max min (js/Math.min max (js/Math.trunc n)))
      fallback)))

(defn clean-field
  ([value] (clean-field value "none"))
  ([value fallback]
   (let [s (-> (str (or value ""))
               (.replace #"\r?\n+" " ")
               (.replace #"\s+" " ")
               (.trim))]
     (if (pos? (.-length s)) s fallback))))

(defn normalize-kind [value fallback]
  (let [raw (clean-field value fallback)
        kind (if (.startsWith raw ":") raw (str ":" raw))]
    (if (not (neg? (.indexOf KNOWN-KINDS kind)))
      kind
      (throw (js/Error. (str "Unknown receipt kind: " kind))))))

(defn read-lines [file-path]
  (if-not (.existsSync fs file-path)
    #js []
    (-> (.readFileSync fs file-path "utf8")
        (.split #"\r?\n")
        (.filter (fn [x] x)))))

(defn tail-lines [file-path lines]
  (let [all (read-lines file-path)]
    (.slice all (- (.-length all) lines))))

(defn line->event [line]
  (rr-edn/parse-edn-event line))

(defn validate-edn-event [line line-number]
  (let [event (line->event line)
        errors #js []]
    (when-not event
      (.push errors "invalid EDN event"))
    (when event
      (doseq [k [:ts :kind :repo :origin :owner :dod :pi :host :manifest :refs]]
        (when-not (get event k)
          (.push errors (str "missing required key: " (name k)))))
      (when-let [kind (:kind event)]
        (when (neg? (.indexOf KNOWN-KINDS (str kind)))
          (.push errors (str "unknown kind: " kind))))
      (when-let [ts (:ts event)]
        (when (js/Number.isNaN (js/Date.parse ts))
          (.push errors (str "invalid ts: " ts)))))
    #js {:ok (zero? (.-length errors))
         :lineNumber line-number
         :event event
         :errors errors
         :line line}))

(defn validate-receipt-file [file-path lines]
  (if-not (.existsSync fs file-path)
    #js {:ok false
         :file file-path
         :count 0
         :failures #js [#js {:lineNumber 0
                             :errors #js ["file does not exist"]}]}
    (let [rows (js/Array.from (.map (tail-lines file-path lines) validate-edn-event))
          failures (js/Array.from (.filter rows (fn [row] (not (aget row "ok")))))]
      #js {:ok (zero? (.-length failures))
           :file file-path
           :count (.-length rows)
           :failures failures
           :last (or (.at rows -1) nil)})))

(defn model-label [ctx]
  (let [model (aget ctx "model")
        provider (or (and model (aget model "provider")) "unknown")
        id (or (and model (aget model "id")) "unknown")]
    (str provider "/" id)))

(defn summarize-last-line [file-path]
  (let [last (.at (tail-lines file-path 1) 0)]
    (if last (clean-field last "") "none")))

(defn repo-receipt-file [repo-root]
  (when repo-root
    (path/join repo-root RECEIPT-FILE-NAME)))

(defn dirname-safe [p]
  (let [d (path/dirname p)]
    (when (and d (not= d p)) d)))

(defn find-git-root [start-path]
  (rr-repo/find-git-root #(path/join %1 %2) dirname-safe #(.existsSync fs %) start-path))

(defn param-path [args]
  (some (fn [k]
          (let [v (or (aget args k)
                      (aget args (keyword k)))]
            (when (and v (not (str/blank? (str v)))) (str v))))
        (js/Array.from PATH-PARAM-KEYS)))

(defn repo-root-from-path [cwd maybe-path]
  (when maybe-path
    (let [resolved (cond
                     (.startsWith maybe-path "~/") (str HOME "/" (.slice maybe-path 2))
                     (path/isAbsolute maybe-path) maybe-path
                     :else (path/join cwd maybe-path))]
      (or (find-git-root resolved)
          (find-git-root cwd)))))

(defn active-ledger-repos [state]
  (js->clj (or (aget state "activeLedgerRepos") #js []) :keywordize-keys false))

(defn receipts-this-turn [state]
  (js->clj (or (aget state "turnReceiptRepos") #js []) :keywordize-keys false))

(defn touched-repo-counts [state]
  (js->clj (or (aget state "turnTouchedRepos") #js {}) :keywordize-keys false))

(defn add-active-ledger-repo! [state repo-root]
  (let [curr (active-ledger-repos state)]
    (when-not (contains? (set curr) repo-root)
      (aset state "activeLedgerRepos" (clj->js (conj curr repo-root))))))

(defn add-receipt-repo! [state repo-root]
  (let [curr (receipts-this-turn state)]
    (when-not (contains? (set curr) repo-root)
      (aset state "turnReceiptRepos" (clj->js (conj curr repo-root))))))

(defn set-touched-repo-counts! [state m]
  (aset state "turnTouchedRepos" (clj->js m)))

(defn get-state []
  (if-let [existing (aget js/globalThis GLOBAL-KEY)]
    existing
    (let [fresh #js {:enabled true
                     :currentTurn 0
                     :turnToolNames #js []
                     :turnHadSubstantiveWork false
                     :turnHadReceipt false
                     :turnTouchedRepos #js {}
                     :turnReceiptRepos #js []
                     :activeLedgerRepos #js []
                     :pendingReminder false
                     :lastReceiptPath nil
                     :lastReceiptLine nil
                     :lastValidation nil}]
      (aset js/globalThis GLOBAL-KEY fresh)
      fresh)))

(defn format-status [state]
  (let [mode (if (aget state "enabled") "rr:on" "rr:off")
        pending (if (aget state "pendingReminder") " pending" "")
        repos (count (active-ledger-repos state))
        last (when-let [line (aget state "lastReceiptLine")]
               (str " last=" (.slice line 0 72)))]
    (str mode pending " repos=" repos (or last ""))))

(defn set-status [ctx state]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        set-status-fn (and ui (aget ui "setStatus"))]
    (when set-status-fn
      (.call set-status-fn ui STATUS-KEY (if state (format-status state) "")))))

(defn make-result [text details]
  #js {:content #js [#js {:type "text" :text text}]
       :details details})

(defn log-event [ctx state action extra]
  (ensure-dir (path/dirname EVENTS-FILE))
  (.appendFileSync fs EVENTS-FILE
                   (str (js/JSON.stringify
                         (js/Object.assign #js {:ts (now-iso)
                                                :turn (aget state "currentTurn")
                                                :cwd (aget ctx "cwd")
                                                :sessionFile (let [sm (aget ctx "sessionManager")
                                                                   get-session-file-fn (and sm (aget sm "getSessionFile"))]
                                                               (when get-session-file-fn
                                                                 (.call get-session-file-fn sm)))
                                                :model (model-label ctx)
                                                :action action}
                                          extra))
                        "\n")
                   "utf8"))

(defn build-memory-message [repo-root]
  (let [file-path (repo-receipt-file repo-root)]
    (when (.existsSync fs file-path)
      (let [lines (tail-lines file-path 3)]
        (when (pos? (.-length lines))
          (str "[RECEIPT RIVER MEMORY]\nRecent receipts in repo " repo-root ":\n"
               (.join (.map lines (fn [line] (str "- " line))) "\n")
               "\nTail receipts before major decisions; never edit past lines."))))))

(defn prune-context-messages [messages enabled]
  (let [kept-one (volatile! false)]
    (-> (js/Array.from messages)
        (.reverse)
        (.filter (fn [message]
                   (if (not= (aget message "customType") "receipt-river-context")
                     true
                     (if (not enabled)
                       false
                       (if @kept-one
                         false
                         (do (vreset! kept-one true) true))))))
        (.reverse))))

(defn inject-ledger-prompt
  ([system-prompt repos pending-reminder?]
   (inject-ledger-prompt system-prompt repos pending-reminder? nil))
  ([system-prompt repos pending-reminder? memory-messages]
  (let [reminder (when pending-reminder?
                   "Previous turn ended with missing repo receipts. Compensate early in this turn if the work continues.")
        repo-blocks (->> repos
                         (map (fn [repo-root]
                                (str "[RECEIPT LEDGER ACTIVE]\nRepo: " repo-root
                                     "\n- Maintain append-only receipts.edn in this repo root."
                                     "\n- If you touch this repo substantively during the turn, ensure a receipt_river call records it in this repo."
                                     "\n- The implicit fulfillment contract fails if a touched repo ends the turn without a receipt."
                                     "\n- Never edit past events. Never log secrets.")))
                         (str/join "\n\n"))
        body (->> [repo-blocks memory-messages reminder]
                  (filter #(and (string? %) (not (str/blank? %))))
                  (str/join "\n\n"))]
    (prompt-section/upsert-section system-prompt
                                   PROMPT-SECTION-START
                                   PROMPT-SECTION-END
                                   body))))

(defn maybe-activate-ledger! [state repo-root]
  (when repo-root
    (let [counts (touched-repo-counts state)
          call-count (get counts repo-root 0)]
      (when (rr-repo/should-activate? {:call-count call-count
                                       :threshold ACTIVATION-THRESHOLD
                                       :active? (contains? (set (active-ledger-repos state)) repo-root)})
        (add-active-ledger-repo! state repo-root)))))

(defn mark-tool-usage [state tool-name args ctx]
  (.push (aget state "turnToolNames") tool-name)
  (let [cwd (aget ctx "cwd")
        ;; Primary attribution: path-like param on the tool call.
        repo-root-from-args (repo-root-from-path cwd (param-path args))
        ;; Fallback attribution: if the tool call is clearly substantive but doesn't
        ;; carry a structured path param (common for apply_patch + many bash calls),
        ;; attribute it to the git root of the current working directory.
        cwd-repo-root (find-git-root cwd)
        ;; Treat any bash as meaningful work for activation purposes.
        ;; (Rationale: many real workflows live in bash, and parsing commands
        ;; reliably across shells/aliases is brittle.)
        bash-substantive? (= tool-name "bash")
        repo-root (or repo-root-from-args
                      (when (or bash-substantive?
                                (not (neg? (.indexOf SUBSTANTIVE-TOOLS tool-name))))
                        cwd-repo-root))]
    (when repo-root
      (let [counts (touched-repo-counts state)
            next-counts (update counts repo-root (fnil inc 0))]
        (set-touched-repo-counts! state next-counts)
        (maybe-activate-ledger! state repo-root)))
    (cond
      (= tool-name "receipt_river")
      (do (aset state "turnHadReceipt" true)
          (aset state "pendingReminder" false)
          (when repo-root
            (add-receipt-repo! state repo-root)))

      (not (neg? (.indexOf SUBSTANTIVE-TOOLS tool-name)))
      (aset state "turnHadSubstantiveWork" true)

      bash-substantive?
      (aset state "turnHadSubstantiveWork" true)

      :else nil)))

(defn ui-notify [ctx message level]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        notify-fn (and ui (aget ui "notify"))]
    (when notify-fn
      (.call notify-fn ui message level))))

(defn ui-set-widget [ctx key value]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        set-widget-fn (and ui (aget ui "setWidget"))]
    (when set-widget-fn
      (.call set-widget-fn ui key value))))

(defn build-record [params repo-root fallback-kind]
  (let [record {:ts (clean-field (aget params "ts") (now-iso))
                :kind (keyword (.slice (normalize-kind (aget params "kind") fallback-kind) 1))
                :repo repo-root
                :origin (clean-field (aget params "origin") "pi")
                :owner (clean-field (aget params "owner") "receipt-river")
                :dod (clean-field (aget params "dod") (or (aget params "owner") "receipt-river"))
                :pi (clean-field (aget params "pi") PI-VERSION)
                :host (clean-field (aget params "host") "local")
                :manifest (clean-field (aget params "manifest") "none")
                :refs (clean-field (aget params "refs") "none")}
        record (reduce (fn [acc k]
                         (let [value (clean-field (aget params k) "")]
                           (if (str/blank? value) acc (assoc acc (keyword k) value))))
                       record
                       (js->clj OPTIONAL-KEYS))]
    record))

(defn handle-receipt-river-command [args ctx]
  (let [state (get-state)
        tokens (-> (str (or args ""))
                   (.trim)
                   (.split #"\s+")
                   (.filter (fn [x] x)))
        cmd (.toLowerCase (or (.at tokens 0) "status"))
        repo-root (or (some identity (reverse (active-ledger-repos state)))
                      (find-git-root (aget ctx "cwd"))
                      (aget ctx "cwd"))
        file-path (repo-receipt-file repo-root)]
    (cond
      (= cmd "on")
      (do (aset state "enabled" true)
          (set-status ctx state)
          (ui-notify ctx "Receipt River enabled" "info"))

      (= cmd "off")
      (do (aset state "enabled" false)
          (set-status ctx state)
          (ui-notify ctx "Receipt River disabled" "info"))

      (= cmd "tail")
      (let [lines (clamp-int (.at tokens 1) 20 1 200)
            tail (tail-lines file-path lines)]
        (ui-set-widget ctx STATUS-KEY
                       (if (pos? (.-length tail)) tail #js ["- no receipts yet"])))

      (= cmd "validate")
      (let [lines (clamp-int (.at tokens 1) 200 1 2000)
            result (validate-receipt-file file-path lines)]
        (aset state "lastValidation" result)
        (set-status ctx state)
        (ui-set-widget ctx STATUS-KEY
                       (if (aget result "ok")
                         #js [(str "receipts ok: " (aget result "count") " event"
                                   (when (not= (aget result "count") 1) "s"))
                              (str "file: " file-path)]
                         (.concat
                          #js [(str "receipts invalid: " (.-length (aget result "failures")) " failure"
                                    (when (not= (.-length (aget result "failures")) 1) "s"))
                               (str "file: " file-path)]
                          (.map (.slice (aget result "failures") 0 10)
                                (fn [row]
                                  (str "- line " (aget row "lineNumber") ": "
                                       (.join (aget row "errors") "; "))))))))

      :else
      (ui-set-widget ctx STATUS-KEY
                     #js [(str "receipt-river: " (if (aget state "enabled") "enabled" "disabled"))
                          (str "repo: " repo-root)
                          (str "file: " file-path)
                          (str "exists: " (if (.existsSync fs file-path) "yes" "no"))
                          (str "last: " (if (.existsSync fs file-path)
                                           (summarize-last-line file-path)
                                           "none"))]))))

(defn execute-receipt-river-tool [_toolCallId params _signal _onUpdate ctx]
  (let [state (get-state)
        repo-root (or (repo-root-from-path (aget ctx "cwd") (aget params "path"))
                      (some identity (reverse (active-ledger-repos state)))
                      (find-git-root (aget ctx "cwd"))
                      (aget ctx "cwd"))
        file-path (repo-receipt-file repo-root)]
    (ensure-dir (path/dirname file-path))
    (cond
      (= (aget params "action") "status")
      (let [exists (.existsSync fs file-path)
            lines (if exists (read-lines file-path) #js [])
            result #js {:ok true
                        :exists exists
                        :repo repo-root
                        :file file-path
                        :count (.-length lines)
                        :last (.at lines -1)}]
        (log-event ctx state "status" result)
        (make-result (if exists
                       (str "receipts: " (.-length lines) " event"
                            (when (not= (.-length lines) 1) "s")
                            "\nrepo: " repo-root
                            "\nlast: " (.at lines -1))
                       (str "receipts missing: " file-path))
                     result))

      (= (aget params "action") "tail")
      (let [lines (clamp-int (aget params "lines") 20 1 2000)
            tail (tail-lines file-path lines)]
        (log-event ctx state "tail" #js {:repo repo-root
                                         :file file-path
                                         :lines lines
                                         :returned (.-length tail)})
        (make-result (if (pos? (.-length tail))
                       (.join tail "\n")
                       "- no receipts yet")
                     #js {:ok true
                          :repo repo-root
                          :file file-path
                          :requested lines
                          :returned (.-length tail)
                          :tail tail}))

      (= (aget params "action") "validate")
      (let [lines (clamp-int (aget params "lines") 200 1 2000)
            result (validate-receipt-file file-path lines)]
        (aset state "lastValidation" result)
        (log-event ctx state "validate" #js {:repo repo-root
                                              :file file-path
                                              :ok (aget result "ok")
                                              :count (aget result "count")
                                              :failures (.-length (aget result "failures"))})
        (set-status ctx state)
        (make-result (if (aget result "ok")
                       (str "receipts valid: " (aget result "count") " event"
                            (when (not= (aget result "count") 1) "s"))
                       (.join (.map (.slice (aget result "failures") 0 20)
                                    (fn [row]
                                      (str "line " (aget row "lineNumber") ": "
                                           (.join (aget row "errors") "; "))))
                              "\n"))
                     result))

      :else
      (let [fallback-kind ":observation"
            record (build-record params repo-root fallback-kind)
            line (rr-edn/edn-event record)]
        (.appendFileSync fs file-path (str line "\n") "utf8")
        (aset state "turnHadReceipt" true)
        (aset state "pendingReminder" false)
        (aset state "lastReceiptPath" file-path)
        (aset state "lastReceiptLine" line)
        (add-receipt-repo! state repo-root)
        (add-active-ledger-repo! state repo-root)
        (set-status ctx state)
        (log-event ctx state (aget params "action")
                   #js {:repo repo-root
                        :file file-path
                        :kind (name (:kind record))
                        :line line})
        (make-result (str (if (= (aget params "action") "bootstrap")
                            "Bootstrapped"
                            "Appended")
                          " receipt at " file-path
                          "\n" line)
                     #js {:ok true
                          :repo repo-root
                          :file file-path
                          :record (clj->js record)
                          :line line})))))

(em/defextension receipt-river
  :name "receipt-river"
  :description "Append-only per-repo receipts.edn ledger for multi-step work."

  (em/command "receipt-river"
    :description "Show, toggle, tail, or validate Receipt River state"
    :handler handle-receipt-river-command)

  (em/tool "receipt_river"
    :label "Receipt River"
    :description "Maintain an append-only per-repo receipts.edn ledger: bootstrap, tail, append, validate, and inspect receipt state."
    :parameters {:action {:type "string"
                          :enum ["status" "bootstrap" "append" "tail" "validate"]
                          :description "Receipt River action: status, bootstrap, append, tail, or validate."}
                 :path {:type "string" :description "Any file path inside the target repo; defaults to current repo" :optional true}
                 :kind {:type "string" :description "Receipt kind, e.g. :observation, :decision, :test-run, :build" :optional true}
                 :lines {:type "integer" :description "How many trailing lines to return or validate" :min 1 :max 2000 :optional true}
                 :origin {:type "string" :description "Receipt origin; default pi" :optional true}
                 :owner {:type "string" :description "Owner/protocol responsible for the receipt" :optional true}
                 :dod {:type "string" :description "Definition-of-done label" :optional true}
                 :pi {:type "string" :description "Pi version label" :optional true}
                 :host {:type "string" :description "Host label" :optional true}
                 :manifest {:type "string" :description "Manifest ref" :optional true}
                 :refs {:type "string" :description "Comma-separated refs such as paths, SHAs, report files" :optional true}
                 :note {:type "string" :description "Short note; never include secrets" :optional true}
                 :tests {:type "string" :description "Test summary for :test-run receipts" :optional true}
                 :decisions {:type "string" :description "Decision summary for :decision receipts" :optional true}
                 :drift {:type "string" :description "Drift summary for :drift receipts" :optional true}}
    :execute execute-receipt-river-tool)

  (em/on "session_start"
    :handler (fn [_event ctx]
               (let [state (get-state)]
                 (aset state "currentTurn" 0)
                 (aset state "turnToolNames" #js [])
                 (aset state "turnHadSubstantiveWork" false)
                 (aset state "turnHadReceipt" false)
                 (aset state "turnTouchedRepos" #js {})
                 (aset state "turnReceiptRepos" #js [])
                 (aset state "activeLedgerRepos" #js [])
                 (aset state "pendingReminder" false)
                 (aset state "lastReceiptPath" nil)
                 (aset state "lastReceiptLine" nil)
                 (aset state "lastValidation" nil)
                 (set-status ctx state))))

  (em/on "session_switch"
    :handler (fn [_event ctx]
               (let [state (get-state)]
                 (aset state "currentTurn" 0)
                 (aset state "turnToolNames" #js [])
                 (aset state "turnHadSubstantiveWork" false)
                 (aset state "turnHadReceipt" false)
                 (aset state "turnTouchedRepos" #js {})
                 (aset state "turnReceiptRepos" #js [])
                 (aset state "activeLedgerRepos" #js [])
                 (set-status ctx state))))

  (em/on "turn_start"
    :handler (fn [event ctx]
               (let [state (get-state)
                     turn-index (aget event "turnIndex")
                     cwd (aget ctx "cwd")
                     cwd-repo-root (find-git-root cwd)]
                 (aset state "currentTurn"
                       (if (number? turn-index)
                         turn-index
                         (inc (aget state "currentTurn"))))
                 (aset state "turnToolNames" #js [])
                 (aset state "turnHadSubstantiveWork" false)
                 (aset state "turnHadReceipt" false)
                 (aset state "turnTouchedRepos" #js {})
                 (aset state "turnReceiptRepos" #js [])
                 ;; Always treat the cwd git root as an active ledger repo when enabled.
                 ;; This makes the reminder/injection available even for "observation-only"
                 ;; turns that don't include path-bearing tool calls.
                 (when (and (aget state "enabled") cwd-repo-root)
                   (add-active-ledger-repo! state cwd-repo-root))
                 (set-status ctx state))))

  (em/on "message_end"
    :handler (fn [event ctx]
               (let [msg (aget event "message")]
                 (when (and msg (= (aget msg "role") "assistant"))
                   (let [state (get-state)
                         blocks (if (js/Array.isArray (aget msg "content"))
                                  (aget msg "content")
                                  #js [])]
                     (.forEach blocks
                               (fn [block]
                                 (when (= (aget block "type") "toolCall")
                                   (mark-tool-usage state
                                                    (str (or (aget block "name") ""))
                                                    (or (aget block "arguments") #js {})
                                                    ctx))))
                     (set-status ctx state))))))

  (em/on "agent_end"
    :handler (fn [_event ctx]
               (let [state (get-state)]
                 (when (aget state "enabled")
                   (let [violations (rr-repo/contract-violations
                                      (touched-repo-counts state)
                                      (set (receipts-this-turn state)))]
                     (when (seq violations)
                       (aset state "pendingReminder" true)
                       (ui-notify ctx
                                  (str "receipt-river: missing receipt for touched repo"
                                       (when (> (count violations) 1) "s")
                                       " — "
                                       (str/join ", " violations))
                                  "warn"))
                     (when (and (aget state "turnHadSubstantiveWork")
                                (not (aget state "turnHadReceipt"))
                                (empty? violations))
                       (aset state "pendingReminder" true)
                       (ui-notify ctx
                                  "receipt-river: substantive turn ended without a receipt_river call"
                                  "warn"))))
                 (set-status ctx state))))

  (em/on "context"
    :handler (fn [event]
               (let [state (get-state)]
                 #js {:messages (prune-context-messages (aget event "messages")
                                                        (aget state "enabled"))})))

  (em/on "before_agent_start"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (when (aget state "enabled")
                   (let [repos (active-ledger-repos state)
                         memory-messages (->> repos
                                              (map build-memory-message)
                                              (filter some?)
                                              (str/join "\n\n"))
                         system-prompt (inject-ledger-prompt (aget event "systemPrompt")
                                                             repos
                                                             (aget state "pendingReminder")
                                                             memory-messages)]
                     ;; Keep recall in the idempotent system-prompt section instead of
                     ;; adding hidden context messages every turn. Long sessions retain
                     ;; message history, so injected messages can accumulate into
                     ;; multi-GB branches even when later context hooks prune prompts.
                     #js {:systemPrompt system-prompt})))))

  (em/on "session_shutdown"
    :handler (fn [_event ctx]
               (set-status ctx js/undefined))))
