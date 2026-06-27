(ns eta-mu.extensions.opmf-contract-gate
  "Output contract gate enforcement with auto-repair.
   Pure CLJS implementation - no TypeScript dependencies."
  (:require-macros [eta-mu.core :as em])
  (:require [cljs.reader :as reader]
            [clojure.string :as str]
            [goog.object :as gobj]
            [eta-mu.contracts.core :as contracts]
            ["markdown-it" :as MarkdownIt]
            ["node:fs" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]))

(def HOME (.homedir os))
(def ETA-MU-STATE-ROOT (path/join HOME ".ημ" "state"))
(def LEGACY-STATE-ROOT (path/join HOME ".ημ" "agent" "state"))

(defn resolve-state-dir [name]
  (let [eta-mu-dir (path/join ETA-MU-STATE-ROOT name)
        legacy-dir (path/join LEGACY-STATE-ROOT name)]
    (if (.existsSync fs eta-mu-dir)
      eta-mu-dir
      (if (.existsSync fs legacy-dir)
        legacy-dir
        eta-mu-dir))))

(def STATE-DIR (resolve-state-dir "output-contract-gate"))
(def RUNS-DIR (path/join STATE-DIR "runs"))
(def VALIDATIONS-FILE (path/join STATE-DIR "validations.jsonl"))
(def CONFIG-FILE (path/join STATE-DIR "config.json"))
(def STATUS-KEY "output-gate")
(def GLOBAL-KEY "__eta_mu_output_contract_gate_state__")
(def REPAIR-SENTINEL "[[eta-mu-opmf-contract-gate repair ")
(def CONTRACT-MARKER "## Active Output Contract")
(def KNOXX-BACKEND-PATH (path/join HOME "devel" "orgs" "open-hax" "openplanner" "packages" "agents" "knoxx" "backend"))
(def KNOXX-CONTRACTS-PATH (path/join HOME "devel" "orgs" "open-hax" "openplanner" "packages" "agents" "knoxx" "contracts"))

(defn knoxx-backend-path []
  (or (gobj/get js/process.env "ETA_MU_KNOXX_BACKEND_PATH")
      KNOXX-BACKEND-PATH))

(defn knoxx-contracts-path []
  (or (gobj/get js/process.env "ETA_MU_KNOXX_CONTRACTS_PATH")
      KNOXX-CONTRACTS-PATH))
(def RUNTIME-CONTRACT-ID "eta-mu.opmf-contract-gate")
(def RUNTIME-CONTRACT-FILE "opmf_contract_gate.edn")
(def MAX-AUTO-REPAIR-SEMANTIC-COUNT 25)
(def MAX-FULL-VALIDATION-CHARS 120000)
(def MAX-FULL-VALIDATION-LINES 5000)
(def MAX-FULL-VALIDATION-LIST-LINES 500)
(def MAX-FULL-VALIDATION-LIST-INDENT 24)
(def MAX-HEADER-SKELETON-LINES 1000)
(def MAX-HEADER-SKELETON-CHARS 64000)

(defonce ^:private header-markdown-parser
  ;; Keep the emergency/large-output path on the same CommonMark parser family
  ;; as eta-mu.contracts.core, but parse only a heading/fence skeleton so giant
  ;; nested lists cannot explode token count or memory at turn end.
  (js/Reflect.construct (or (aget MarkdownIt "default") MarkdownIt)
                        #js ["commonmark" #js {:html false :maxNesting 16}]))

(def DEFAULT-CONTRACT
  (or (gobj/get js/process.env "PI_OUTPUT_CONTRACT_FILE")
      (path/join HOME
                 "devel"
                 "specs"
                 "drafts"
                 "contract-enforced-agent-output-pipeline.example.edn")))

(defn- truthy? [value]
  (or (true? value)
      (= value "true")
      (= value "1")
      (= value "yes")
      (= value "on")))

(defn- falsey? [value]
  (or (false? value)
      (= value "false")
      (= value "0")
      (= value "no")
      (= value "off")))

(defn- parse-bool [value fallback]
  (cond
    (truthy? value) true
    (falsey? value) false
    :else fallback))

(defn- keyword-name [value]
  (cond
    (keyword? value) (name value)
    (symbol? value) (name value)
    (string? value) value
    (some? value) (str value)
    :else nil))

(defn- path-inside? [parent child]
  (let [parent* (path/resolve parent)
        child* (path/resolve child)
        rel (.relative path parent* child*)]
    (or (= "" rel)
        (and (not (.startsWith rel ".."))
             (not (.isAbsolute path rel))))))

(defn knoxx-backend-cwd? [cwd]
  (path-inside? (knoxx-backend-path) (or cwd (.cwd js/process))))

(defn- parent-dirs [start]
  (loop [cur (path/resolve start)
         acc []]
    (let [parent (path/dirname cur)
          acc* (conj acc cur)]
      (if (= parent cur)
        acc*
        (recur parent acc*)))))

(defn runtime-contract-candidates [cwd]
  (let [dirs (parent-dirs (or cwd (.cwd js/process)))]
    (->> (concat
          (mapcat (fn [dir]
                    [(path/join dir "contracts" "runtime_features" RUNTIME-CONTRACT-FILE)
                     (path/join dir "runtime_features" RUNTIME-CONTRACT-FILE)
                     (path/join dir "CONTRACT.edn")])
                  dirs)
          (when (knoxx-backend-cwd? cwd)
            [(path/join (knoxx-contracts-path) "runtime_features" RUNTIME-CONTRACT-FILE)]))
         distinct
         vec)))

(defn- opmf-runtime-contract? [m]
  (let [feature (or (keyword-name (:runtime/feature m))
                    (keyword-name (:eta-mu/extension m))
                    (keyword-name (:extension/name m))
                    (keyword-name (:contract/id m)))]
    (and (map? m)
         (or (= :runtime-feature (:contract/kind m))
             (= "runtime-feature" (keyword-name (:contract/kind m)))
             (= RUNTIME-CONTRACT-ID (:contract/id m)))
         (#{"opmf-contract-gate" "eta-mu.opmf-contract-gate"} feature))))

(defn- extract-runtime-contract [form]
  (cond
    (opmf-runtime-contract? form) form
    (sequential? form) (some extract-runtime-contract form)
    :else nil))

(defn read-runtime-contract [cwd]
  (some (fn [candidate]
          (when (.existsSync fs candidate)
            (try
              (when-let [contract (extract-runtime-contract
                                   (reader/read-string (.readFileSync fs candidate "utf8")))]
                (assoc contract :runtime/source candidate))
              (catch :default _ nil))))
        (runtime-contract-candidates cwd)))

(defn- runtime-contract-default-enabled [contract fallback]
  (if contract
    (parse-bool (:runtime/default-enabled contract)
                fallback)
    fallback))

(defn- runtime-contract-forced-enabled [contract]
  (when contract
    (let [value (or (:runtime/enabled contract) (:enabled contract))]
      (when (or (truthy? value) (falsey? value))
        (parse-bool value true)))))

(defn- runtime-contract-config [contract]
  (let [config (:runtime/config contract)]
    (if (map? config) config {})))

(defn- default-enabled-for-cwd [cwd]
  (not (knoxx-backend-cwd? cwd)))

(defn- env-enabled-override []
  (let [value (gobj/get js/process.env "ETA_MU_OPMF_CONTRACT_GATE_ENABLED")]
    (when (or (truthy? value) (falsey? value))
      (parse-bool value true))))

(defn- js-read-config-file []
  (when (.existsSync fs CONFIG-FILE)
    (try
      (.parse js/JSON (.readFileSync fs CONFIG-FILE "utf8"))
      (catch :default _ nil))))

(defn- config-bool [parsed key fallback]
  (if (and parsed (not (nil? (aget parsed key))))
    (parse-bool (aget parsed key) fallback)
    fallback))

(defn- config-value [parsed key fallback]
  (if (and parsed (not (nil? (aget parsed key))))
    (aget parsed key)
    fallback))

(defn- runtime-config-bool [runtime-config key fallback]
  (if (contains? runtime-config key)
    (parse-bool (get runtime-config key) fallback)
    fallback))

(defn- runtime-config-value [runtime-config key fallback]
  (if (contains? runtime-config key)
    (get runtime-config key)
    fallback))

(defn ensure-dir [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn append-jsonl [file-path value]
  (ensure-dir (.dirname path file-path))
  (.appendFileSync fs file-path (str (.stringify js/JSON (clj->js value)) "\n") "utf8"))

(defn looks-like-agent-error? [text]
  "Returns true if the text appears to be an error message from the
   upstream provider or runtime rather than a real agent response."
  (and (string? text)
       (or (str/blank? text)
           (re-find #"^(Error|ERR)\s*:" text)
           (re-find #"^\d{3}\s" text)
           (re-find #"(?i)rate.?limit|quota.?exhaust|no upstream account|outstanding balance" text))))

(defn write-config [config]
  (ensure-dir STATE-DIR)
  (.writeFileSync fs CONFIG-FILE (str (.stringify js/JSON config nil 2) "\n") "utf8"))

(defn gate-enabled? [state]
  (true? (aget (aget state "config") "enabled")))

(defn gate-auto-repair-enabled? [state]
  (true? (aget (aget state "config") "autoRepair")))

(defn clear-pending-repair! [state]
  (aset state "pendingRepair" nil))

(defn extract-text [content]
  (cond
    (string? content) content
    (array? content)
    (->> (js/Array.from content)
         (filter #(and (some? %) (= "text" (aget % "type")) (string? (aget % "text"))))
         (map #(aget % "text"))
         (str/join ""))
    :else ""))

(defn extract-messages [ctx]
  (->> (.call (aget (aget ctx "sessionManager") "getBranch") (aget ctx "sessionManager"))
       (js/Array.from)
       (filter #(and (= "message" (aget % "type")) (aget % "message")))
       (map #(aget % "message"))))

(defn last-message-by-role-in-array [messages role]
  (loop [idx (dec (.-length messages))]
    (when (>= idx 0)
      (let [message (aget messages idx)]
        (if (= role (aget message "role"))
          message
          (recur (dec idx)))))))

(defn messages-source [ctx messages]
  (cond
    (array? messages) messages
    (some? messages) (clj->js messages)
    :else (clj->js (extract-messages ctx))))

(defn last-message-by-role
  ([ctx role]
   (last-message-by-role ctx role nil))
  ([ctx role messages]
   (last-message-by-role-in-array (messages-source ctx messages) role)))

(defn read-config
  ([]
   (read-config (.cwd js/process)))
  ([cwd]
   (let [parsed (js-read-config-file)
         env-override (env-enabled-override)
         ;; An explicit env false is the emergency hard-off path: do not even
         ;; parse runtime-feature contracts while the gate is disabled this way.
         runtime-contract (when-not (= false env-override)
                            (read-runtime-contract cwd))
         runtime-config (runtime-contract-config runtime-contract)
         built-in-enabled (default-enabled-for-cwd cwd)
         contract-default-enabled (runtime-contract-default-enabled runtime-contract built-in-enabled)
         local-enabled (config-bool parsed "enabled" contract-default-enabled)
         contract-forced-enabled (runtime-contract-forced-enabled runtime-contract)
         enabled (cond
                   (some? env-override) env-override
                   (some? contract-forced-enabled) contract-forced-enabled
                   :else local-enabled)
         auto-repair (config-bool parsed
                                  "autoRepair"
                                  (runtime-config-bool runtime-config :autoRepair true))
         contract-path (config-value parsed
                                     "contractPath"
                                     (runtime-config-value runtime-config :contractPath DEFAULT-CONTRACT))
         contract-path* (if (and (string? contract-path) (not (str/blank? contract-path)))
                          contract-path
                          DEFAULT-CONTRACT)]
     #js {:enabled enabled
          :autoRepair auto-repair
          :contractPath contract-path*
          :enableGptReview (config-bool parsed
                                       "enableGptReview"
                                       (runtime-config-bool runtime-config :enableGptReview false))
          :gptReviewModel (config-value parsed
                                        "gptReviewModel"
                                        (runtime-config-value runtime-config :gptReviewModel "gpt-5.4"))
          :gptReviewBaseUrl (config-value parsed
                                          "gptReviewBaseUrl"
                                          (runtime-config-value runtime-config :gptReviewBaseUrl nil))
          :gptReviewApiKey (config-value parsed
                                         "gptReviewApiKey"
                                         (runtime-config-value runtime-config :gptReviewApiKey nil))
          :maxSessionTurns (config-value parsed
                                         "maxSessionTurns"
                                         (runtime-config-value runtime-config :maxSessionTurns 10))
          :configSource (cond
                          (some? env-override) "env+local+contract"
                          runtime-contract "local+contract"
                          parsed "local"
                          (knoxx-backend-cwd? cwd) "built-in:knoxx-backend"
                          :else "built-in:cli")
          :runtimeContractPath (:runtime/source runtime-contract)})))

(defn get-state []
  (let [g js/globalThis]
    (if-let [state (aget g GLOBAL-KEY)]
      state
      (let [fresh #js {:config (read-config)
                       :contractCache nil
                       :lastResult nil
                       :contractError nil
                       :pendingRepair nil
                       :repairCounts #js {}
                       :sessionRepairCount 0}]
        (aset g GLOBAL-KEY fresh)
        fresh))))

(defn load-contract [state]
  (let [contract-path (.resolve path (aget (aget state "config") "contractPath"))]
    (if-not (.existsSync fs contract-path)
      (js/Promise.reject (js/Error. (str "contract file not found: " contract-path)))
      (let [stat (.statSync fs contract-path)
            cache (aget state "contractCache")]
        (if (and cache
                 (= contract-path (aget cache "path"))
                 (= (aget stat "mtimeMs") (aget cache "mtimeMs")))
          (js/Promise.resolve cache)
          (let [source (.readFileSync fs contract-path "utf8")
                contract (contracts/compile-contract source)
                fresh #js {:path contract-path
                           :mtimeMs (aget stat "mtimeMs")
                           :source source
                           :contract contract}]
            (aset state "contractCache" fresh)
            (js/Promise.resolve fresh)))))))

(defn parse-repair-attempt [text]
  (when (and (string? text)
             (or (.startsWith text REPAIR-SENTINEL)
                 (.startsWith text "[[output-contract-gate repair ")
                 (.startsWith text "[[eta-mu-opmf-output-contract-gate repair ")))
    (let [match (re-find #"^\[\[(?:eta-mu-opmf-contract-gate|output-contract-gate|eta-mu-opmf-output-contract-gate) repair (\d+)/(\d+)\]\]" text)]
      (when match
        {:attempt (js/parseInt (nth match 1))
         :max (js/parseInt (nth match 2))}))))

(defn build-repair-turn-message [repair-prompt attempt max-retries original-user-prompt]
  (str "[[eta-mu-opmf-contract-gate repair " attempt "/" max-retries "]]\n"
       "Your work is not complete — the output contract was not satisfied.\n"
       "Continue your work, ensuring the response uses `## Section` level-2 markdown headers (not bold or emphasis).\n"
       "For counted sections, prefer explicit markdown list items because the deterministic checker counts list items reliably.\n"
       (when-not (str/blank? original-user-prompt)
         (str "\nOriginal task: " original-user-prompt "\n"))
       "\nContract violations to fix:\n"
       repair-prompt "\n\n"
       "Return the full corrected Markdown response with `## Signal`, `## Evidence`, `## Frames`, `## Countermoves`, `## Next` as level-2 headers."))

(defn build-prompt-append [contract]
  (let [headings (->> (:sections contract)
                      (map :heading)
                      (str/join ", "))
        next-rule (first (filter #(= "rule/next-exactly-one-action" (:id %)) (:rules contract)))
        frames-rule (first (filter #(= "rule/frames-cardinality" (:id %)) (:rules contract)))]
    (->> [(str "## Active Output Contract")
          (str "- Return Markdown with these exact level-2 headings in order: " headings)
          "- Use `## Heading` level-2 markdown headers for each section. Do NOT use bold (`**Heading**`), emphasis, or deeper headings (`###`, `####`) in place of section headers."
          (when (some? (:exactly next-rule))
            (str "- Next must contain exactly " (:exactly next-rule) " concrete next action."))
          (when (and (some? (:min frames-rule)) (some? (:max frames-rule)))
            (str "- Frames must contain " (:min frames-rule) "-" (:max frames-rule) " plausible interpretations."))
          "- If your response fails the structure gate, you will be asked to continue your work until it passes."]
         (filter some?)
         (str/join "\n"))))

(defn inject-contract-prompt [system-prompt contract]
  (if (and (string? system-prompt)
           (not= -1 (.indexOf system-prompt CONTRACT-MARKER)))
    system-prompt
    (str system-prompt "\n\n" (build-prompt-append contract))))

(defn format-status [state]
  (if-let [err (aget state "contractError")]
    "gate:error"
    (let [mode (if (aget (aget state "config") "enabled") "on" "off")
          repair (if (aget (aget state "config") "autoRepair") "repair:on" "repair:off")
          last-result (aget state "lastResult")
          suffix (if last-result
                   (str " last:" (if (aget last-result "ok") "pass" "fail") "/" (or (aget last-result "failureCount") 0))
                   "")]
      (str "gate:" mode " " repair suffix))))

(defn set-status [ctx state]
  (when (aget ctx "hasUI")
    (.call (aget (aget ctx "ui") "setStatus")
           (aget ctx "ui")
           STATUS-KEY
           (format-status state))))

(defn notify [ctx message level]
  (when (aget ctx "hasUI")
    (.call (aget (aget ctx "ui") "notify")
           (aget ctx "ui")
           message
           level)))

(defn safe-notify [ctx message level]
  (try
    (notify ctx message level)
    (catch :default _ nil)))

(defn sender-for [pi ctx]
  ;; Do not cache pi/sender across session replacement or extension reload.
  ;; eta-mu marks old extension/session contexts stale; holding one in state can
  ;; turn a normal auto-repair into a noisy stale-context warning after reload.
  (or (aget ctx "pi")
      (when (aget pi "sendUserMessage") pi)))

(defn- text-fingerprint [text]
  (let [s (or text "")]
    (loop [idx 0
           hash 2166136261]
      (if (< idx (.-length s))
        (recur (inc idx)
               (js/Math.imul (bit-xor hash (.charCodeAt s idx)) 16777619))
        (str (.-length s) ":" hash)))))

(defn- assistant-repair-key [assistant]
  (when assistant
    (let [id (or (aget assistant "id") "unknown")
          text (extract-text (aget assistant "content"))]
      (str id ":" (text-fingerprint text)))))

(defn- repair-count [state repair-key]
  (or (when repair-key
        (aget (or (aget state "repairCounts") #js {}) repair-key))
      0))

(defn- set-repair-count! [state repair-key count]
  (when repair-key
    (let [counts (or (aget state "repairCounts") #js {})]
      (aset state "repairCounts" counts)
      (aset counts repair-key count))))

(defn- inc-session-repair-count! [state]
  (let [next-count (inc (or (aget state "sessionRepairCount") 0))]
    (aset state "sessionRepairCount" next-count)
    next-count))

(defn- result-failures [result]
  (let [report (aget result "report")
        failures (or (:failures report)
                     (when report (aget report "failures"))
                     [])]
    (if (array? failures)
      (js/Array.from failures)
      failures)))

(defn- failure-actual-count [failure]
  (let [actual (or (:actual failure)
                   (when failure (aget failure "actual")))]
    (or (:count actual)
        (when actual (aget actual "count")))))

(defn- excessive-semantic-count? [result]
  (boolean
   (some (fn [failure]
           (when-let [actual-count (failure-actual-count failure)]
             (> actual-count MAX-AUTO-REPAIR-SEMANTIC-COUNT)))
         (result-failures result))))

(defn counted-section-rule [contract heading]
  (when-let [section (get (:sections-by-heading contract) heading)]
    (first (filter #(= (:section-id %) (:id section)) (:rules contract)))))

(defn- counted-section-failure [contract heading actual-count]
  (let [section (get (:sections-by-heading contract) heading)
        rule (counted-section-rule contract heading)
        expected (cond
                   (:exactly rule) {:exactly (:exactly rule)}
                   (or (:min rule) (:max rule)) {:min (:min rule) :max (:max rule)}
                   :else {})]
    {:rule-id (or (:id rule) "rule/count-preflight")
     :section-id (:id section)
     :heading heading
     :expected expected
     :actual {:count actual-count}
     :message (str "Section `" heading "` has more than " MAX-AUTO-REPAIR-SEMANTIC-COUNT
                   " counted list item(s); preflight skipped full validation to avoid blocking the turn end")}))

(defn- gate-h2-heading [line]
  (when-let [match (re-matches #"^ {0,3}##(?:[ \t]+|$)(.*?)(?:[ \t]+#+[ \t]*)?$" line)]
    (let [heading (str/trim (second match))]
      (when-not (str/blank? heading)
        heading))))

(defn- gate-fence-line? [line]
  (boolean (re-matches #"^ {0,3}(```+|~~~+).*$" line)))

(defn- counted-list-line? [line]
  ;; Count both CommonMark ordered lists (`1. item`) and the common shorthand
  ;; (`1) item`) that agents often produce.
  (boolean (re-find #"^\s*(?:[-*+]\s+|\d+(?:[.)])\s+)" line)))

(defn- atx-heading-candidate-line? [line]
  ;; Candidate filter only. The actual h2 decision is made by markdown-it after
  ;; skeletonization so we do not accidentally accept bold/prose faux headers.
  (boolean (re-find #"^ {0,3}#{1,6}(?:[ \t]+|$)" line)))

(defn- list-line-indent [line]
  (when (counted-list-line? line)
    (let [match (re-find #"^(\s*)" line)]
      (.-length (or (second match) "")))))

(defn- skeleton-line [line]
  (if (> (.-length line) 512)
    (subs line 0 512)
    line))

(defn- markdown-complexity-scan
  "Single bounded pass over markdown. Builds a tiny CommonMark skeleton made of
   only fence lines and ATX heading candidates; all list/prose payload is
   discarded before parser invocation."
  [markdown]
  (let [text (or markdown "")
        length (.-length text)
        skeleton (array)]
    (loop [start 0
           line-count 0
           list-lines 0
           max-list-indent 0
           skeleton-lines 0
           skeleton-chars 0
           skeleton-truncated? false]
      (if (> start length)
        {:char-count length
         :line-count line-count
         :list-lines list-lines
         :max-list-indent max-list-indent
         :skeleton (str/join "\n" (js/Array.from skeleton))
         :skeleton-truncated? skeleton-truncated?}
        (let [newline-index (.indexOf text "\n" start)
              end (if (= -1 newline-index) length newline-index)
              raw-line (subs text start end)
              line (if (and (pos? (.-length raw-line))
                            (= "\r" (.charAt raw-line (dec (.-length raw-line)))))
                     (subs raw-line 0 (dec (.-length raw-line)))
                     raw-line)
              next-start (if (= -1 newline-index) (inc length) (inc newline-index))
              indent (or (list-line-indent line) 0)
              include-in-skeleton? (or (gate-fence-line? line)
                                       (atx-heading-candidate-line? line))
              skel-line (when include-in-skeleton? (skeleton-line line))
              next-skeleton-lines (if skel-line (inc skeleton-lines) skeleton-lines)
              next-skeleton-chars (if skel-line
                                    (+ skeleton-chars (.-length skel-line) 1)
                                    skeleton-chars)
              can-append-skeleton? (and skel-line
                                        (<= next-skeleton-lines MAX-HEADER-SKELETON-LINES)
                                        (<= next-skeleton-chars MAX-HEADER-SKELETON-CHARS))]
          (when can-append-skeleton?
            (.push skeleton skel-line))
          (recur next-start
                 (inc line-count)
                 (if (counted-list-line? line) (inc list-lines) list-lines)
                 (max max-list-indent indent)
                 (if skel-line next-skeleton-lines skeleton-lines)
                 (if skel-line next-skeleton-chars skeleton-chars)
                 (or skeleton-truncated?
                     (and skel-line (not can-append-skeleton?)))))))))

(defn- needs-header-only-validation? [{:keys [char-count line-count list-lines max-list-indent]}]
  (or (> char-count MAX-FULL-VALIDATION-CHARS)
      (> line-count MAX-FULL-VALIDATION-LINES)
      (> list-lines MAX-FULL-VALIDATION-LIST-LINES)
      (> max-list-indent MAX-FULL-VALIDATION-LIST-INDENT)))

(defn- header-token-type [token]
  (aget token "type"))

(defn- header-token-tag [token]
  (aget token "tag"))

(defn- header-h2-token? [token]
  (and (= "heading_open" (header-token-type token))
       (= "h2" (header-token-tag token))))

(defn- header-inline-content [tokens idx]
  (let [token (aget tokens (inc idx))]
    (when (= "inline" (header-token-type token))
      (some-> (aget token "content") str/trim not-empty))))

(defn- skeleton-h2-headings [skeleton]
  (let [tokens (js/Array.from (.parse header-markdown-parser skeleton #js {}))]
    (->> (range (.-length tokens))
         (keep (fn [idx]
                 (let [token (aget tokens idx)]
                   (when (header-h2-token? token)
                     (header-inline-content tokens idx)))))
         vec)))

(defn- header-only-failure [contract {:keys [rule-id section-id heading expected actual message]}]
  (merge {:rule-id (or rule-id "unknown")
          :message (or message (str "Violation of " rule-id))}
         (when section-id {:section-id section-id})
         (when heading {:heading heading})
         (when expected {:expected expected})
         (when actual {:actual actual})))

(defn- header-required-failures [contract headings]
  (into []
        (comp
         (filter :required)
         (filter (fn [section-def]
                   (not (some #(= (:heading section-def) %) headings))))
         (map (fn [section-def]
                (header-only-failure contract
                                     {:rule-id "rule/required-section"
                                      :section-id (:id section-def)
                                      :heading (:heading section-def)
                                      :message (str "Missing required section `" (:heading section-def) "`")}))))
        (:sections contract)))

(defn- header-order-failures [contract headings]
  (let [expected-headings (map :heading (:sections contract))]
    (if (= headings (take (count headings) expected-headings))
      []
      [(header-only-failure contract
                            {:rule-id "rule/section-order"
                             :expected {:headings expected-headings}
                             :actual {:headings headings}
                             :message "Section order mismatch"})])))

(defn- header-only-repair-prompt [failures]
  (when (seq failures)
    (str/join "\n\n"
              (map (fn [failure]
                     (str (:message failure)
                          "\nLarge/complex markdown response: semantic list counting was skipped to protect the runtime; preserve the answer but fix the required `##` headings."))
                   failures))))

(defn header-only-validation
  "Validate only the required h2 headings for a response that is too large or
   structurally complex for full semantic counting. Uses markdown-it on a bounded
   heading/fence skeleton, not regex heading extraction."
  ([contract markdown]
   (header-only-validation contract markdown (markdown-complexity-scan markdown)))
  ([contract _markdown scan]
   (let [headings (if (:skeleton-truncated? scan)
                    []
                    (skeleton-h2-headings (:skeleton scan)))
         truncation-failures (when (:skeleton-truncated? scan)
                               [(header-only-failure contract
                                                    {:rule-id "rule/header-skeleton-budget"
                                                     :expected {:max-lines MAX-HEADER-SKELETON-LINES
                                                                :max-chars MAX-HEADER-SKELETON-CHARS}
                                                     :actual {:line-count (:line-count scan)
                                                              :char-count (:char-count scan)}
                                                     :message "Too many markdown heading/fence candidates for bounded header validation"})])
         failures (vec (concat truncation-failures
                               (when-not (:skeleton-truncated? scan)
                                 (header-required-failures contract headings))
                               (when-not (:skeleton-truncated? scan)
                                 (header-order-failures contract headings))))]
     {:ok (empty? failures)
      :preflight true
      :header-only true
      :scan scan
      :headings headings
      :repair-prompt (header-only-repair-prompt failures)
      :report {:contract (:name contract)
               :version (:version contract)
               :stage "header-only"
               :ok (empty? failures)
               :failures failures}})))

(defn preflight-large-or-complex-response [contract markdown]
  (let [scan (markdown-complexity-scan markdown)]
    (when (needs-header-only-validation? scan)
      (header-only-validation contract markdown scan))))

(defn preflight-huge-counted-section
  "Fast, bounded scan for pathological counted sections before full validation.
   This runs before repair prompt compilation/artifact writes, so a giant final
   `## Next` list cannot block agent_end long enough to look like a crash.
   It intentionally scans by string index instead of `split-lines` so it does
   not allocate the whole response as a line vector before it can bail out."
  [contract markdown]
  (let [counted-headings (->> (:rules contract)
                              (filter #(or (:exactly %) (:min %) (:max %)))
                              (map (fn [rule]
                                     (:heading (get (:sections-by-id contract) (:section-id rule)))))
                              (remove nil?)
                              set)
        length (.-length markdown)]
    (loop [start 0
           in-code? false
           current-heading nil
           item-count 0]
      (when (<= start length)
        (let [newline-index (.indexOf markdown "\n" start)
              end (if (= -1 newline-index) length newline-index)
              raw-line (subs markdown start end)
              line (if (and (pos? (.-length raw-line))
                            (= "\r" (.charAt raw-line (dec (.-length raw-line)))))
                     (subs raw-line 0 (dec (.-length raw-line)))
                     raw-line)
              next-start (if (= -1 newline-index) (inc length) (inc newline-index))
              next-code? (if (gate-fence-line? line) (not in-code?) in-code?)
              heading (when-not in-code? (gate-h2-heading line))
              next-heading (or heading current-heading)
              reset-count? (some? heading)
              countable? (and (not next-code?)
                              (contains? counted-headings next-heading)
                              (counted-list-line? line))
              next-count (cond
                           reset-count? 0
                           countable? (inc item-count)
                           :else item-count)]
          (if (> next-count MAX-AUTO-REPAIR-SEMANTIC-COUNT)
            {:ok false
             :preflight true
             :report {:contract (:name contract)
                      :version (:version contract)
                      :stage "preflight"
                      :ok false
                      :failures [(counted-section-failure contract next-heading next-count)]}}
            (when (< next-start (inc length))
              (recur next-start next-code? next-heading next-count))))))))

(defn write-run-artifacts
  "Write validation artifacts to disk."
  [opts]
  (let [artifacts-root (aget opts "artifactsRoot")
        contract-path (aget opts "contractPath")
        response-path (aget opts "responsePath")
        contract-source (aget opts "contractSource")
        response-markdown (aget opts "responseMarkdown")
        report (aget opts "report")
        repair-prompt (aget opts "repairPrompt")
        exit-code (aget opts "exitCode")
        ts (.toISOString (js/Date.))
        rand-str (.toString (js/Math.random))
        run-id (str ts "_" (subs rand-str 2 (min 8 (.-length rand-str))))
        run-dir (path/join artifacts-root run-id)]
    (ensure-dir run-dir)
    (.writeFileSync fs (path/join run-dir "contract.edn") contract-source "utf8")
    (.writeFileSync fs (path/join run-dir "response.md") response-markdown "utf8")
    (.writeFileSync fs (path/join run-dir "report.json") (.stringify js/JSON (clj->js report) nil 2) "utf8")
    (when repair-prompt
      (.writeFileSync fs (path/join run-dir "repair.txt") repair-prompt "utf8"))
    (.writeFileSync fs (path/join run-dir "meta.json")
                    (.stringify js/JSON #js {:ts ts
                                              :contractPath contract-path
                                              :responsePath response-path
                                              :exitCode exit-code} nil 2)
                    "utf8")
    #js {:dir run-dir :runId run-id}))

(defn- validation-result-from-preflight! [state cached assistant user contract preflight]
  (let [report (:report preflight)
        ok? (boolean (:ok preflight))
        repair-info (parse-repair-attempt (extract-text (when user (aget user "content"))))
        summary #js {:ts (.toISOString (js/Date.))
                     :ok ok?
                     :failureCount (count (:failures report))
                     :assistantMessageId (aget assistant "id")
                     :userMessageId (when user (aget user "id"))
                     :repairAttempt (or (:attempt repair-info) 0)
                     :bundleDir nil
                     :preflight true
                     :headerOnly (boolean (:header-only preflight))
                     :contract #js {:name (:name contract)
                                    :version (:version contract)
                                    :path (aget cached "path")}}]
    (append-jsonl VALIDATIONS-FILE (js->clj summary :keywordize-keys true))
    (aset state "lastResult" summary)
    (aset state "contractError" nil)
    #js {:ok ok?
         :report report
         :repairPrompt (:repair-prompt preflight)
         :repairInfo (clj->js repair-info)
         :assistant assistant
         :user user
         :contract contract
         :preflight true
         :headerOnly (boolean (:header-only preflight))}))

(defn- validation-result-from-full-check! [ctx state cached assistant user contract assistant-text]
  (let [validation (contracts/validate-markdown-response contract assistant-text)
        report (contracts/to-failure-report contract validation)
        repair-prompt (when-not (:ok validation)
                        (contracts/compile-repair-prompt contract validation))
        bundle (write-run-artifacts
                #js {:artifactsRoot RUNS-DIR
                     :contractPath (aget cached "path")
                     :responsePath (str "session:"
                                        (or (when-let [sm (aget ctx "sessionManager")]
                                              (let [getter (aget sm "getSessionFile")]
                                                (when getter
                                                  (.call getter sm))))
                                            "ephemeral")
                                        ":assistant:"
                                        (or (aget assistant "id") "unknown"))
                     :contractSource (aget cached "source")
                     :responseMarkdown assistant-text
                     :report report
                     :repairPrompt repair-prompt
                     :exitCode (if (:ok validation) 0 1)})
        repair-info (parse-repair-attempt (extract-text (when user (aget user "content"))))
        summary #js {:ts (.toISOString (js/Date.))
                     :ok (:ok validation)
                     :failureCount (count (:failures validation))
                     :assistantMessageId (aget assistant "id")
                     :userMessageId (when user (aget user "id"))
                     :repairAttempt (or (:attempt repair-info) 0)
                     :bundleDir (aget bundle "dir")
                     :contract #js {:name (:name contract)
                                    :version (:version contract)
                                    :path (aget cached "path")}}]
    (append-jsonl VALIDATIONS-FILE (js->clj summary :keywordize-keys true))
    (aset state "lastResult" summary)
    (aset state "contractError" nil)
    #js {:ok (:ok validation)
         :report report
         :repairPrompt repair-prompt
         :repairInfo (clj->js repair-info)
         :assistant assistant
         :user user
         :contract contract
         :bundle bundle}))

(defn validate-latest-assistant
  ([ctx state]
   (validate-latest-assistant ctx state nil))
  ([ctx state messages]
   (.then (load-contract state)
          (fn [cached]
            (let [assistant (last-message-by-role ctx "assistant" messages)
                  user (last-message-by-role ctx "user" messages)]
              (if-not assistant
                (js/Promise.resolve #js {:ok true :skip true :reason "no assistant message — agent likely ended with error"})
                (let [assistant-text (extract-text (aget assistant "content"))]
                  (cond
                    (str/blank? assistant-text)
                    (js/Promise.resolve #js {:ok true :skip true :reason "assistant message has no text content"})

                    (looks-like-agent-error? assistant-text)
                    (js/Promise.resolve #js {:ok true :skip true :reason "assistant message is an error, not a real response"})

                    :else
                    (let [contract (aget cached "contract")]
                      (if-let [preflight (or (preflight-large-or-complex-response contract assistant-text)
                                             (preflight-huge-counted-section contract assistant-text))]
                        (validation-result-from-preflight!
                         state cached assistant user contract preflight)
                        (validation-result-from-full-check!
                         ctx state cached assistant user contract assistant-text)))))))))))

(defn extract-original-user-prompt
  ([ctx]
   (extract-original-user-prompt ctx nil))
  ([ctx messages]
  (try
    (let [messages (js/Array.from (messages-source ctx messages))
          user-msgs (filter #(= "user" (aget % "role")) messages)]
      (reduce (fn [_ msg]
                (let [text (extract-text (aget msg "content"))]
                  (when (and (not (str/blank? text))
                             (not (.startsWith text REPAIR-SENTINEL))
                             (not (.includes text "eta-mu-opmf-contract-gate repair")))
                    (reduced (subs text 0 (min 500 (.-length text)))))))
              nil
              (reverse user-msgs)))
    (catch :default _ nil))))

(defn stale-context-message? [message]
  (and message
       (or (.includes message "ctx is stale")
           (.includes message "stale after session replacement")
           (.includes message "Do not use a captured pi or command ctx"))))

(defn notify-repair-queue-error [ctx error]
  (let [message (or (aget error "message") (str error))]
    (safe-notify ctx
                 (if (stale-context-message? message)
                   "eta-mu-opmf-contract-gate skipped auto-repair because the session was replaced or extensions reloaded"
                   (str "eta-mu-opmf-contract-gate repair queue failed: " message))
                 "warn")))

(defn handle-direct-repair-error [_pi ctx _state _msg _next-attempt _max-retries _retry-index error]
  (let [message (or (aget error "message") (str error))]
    (safe-notify ctx
                 (if (stale-context-message? message)
                   "eta-mu-opmf-contract-gate skipped auto-repair because the session was replaced or extensions reloaded"
                   (str "eta-mu-opmf-contract-gate direct repair injection failed: " message))
                 "warn")))

(defn send-direct-repair! [pi ctx state msg next-attempt max-retries retry-index]
  ;; Pi now emits agent_idle from the core runtime only after agent_end handling
  ;; has drained and Agent.waitForIdle has resolved. That makes extension-origin
  ;; repair turns safe to submit directly here; do not create a second timer-based
  ;; idle detector in the extension.
  (let [sender (sender-for pi ctx)]
    (if sender
      (try
        (let [send-result (.call (aget sender "sendUserMessage") sender msg)]
          (if (and send-result (aget send-result "then"))
            (-> send-result
                (.then (fn [_]
                         (safe-notify ctx
                                      (str "eta-mu-opmf-contract-gate injected repair " next-attempt "/" max-retries)
                                      "warn")))
                (.catch (fn [error]
                          (handle-direct-repair-error pi ctx state msg next-attempt max-retries retry-index error))))
            (safe-notify ctx
                         (str "eta-mu-opmf-contract-gate injected repair " next-attempt "/" max-retries)
                         "warn")))
        (catch :default error
          (handle-direct-repair-error pi ctx state msg next-attempt max-retries retry-index error)))
      (safe-notify ctx "eta-mu-opmf-contract-gate repair sender unavailable" "warn"))))

(defn handle-validation-result [pi ctx state result messages]
  (set-status ctx state)
  (cond
    (aget result "skip")
    (notify ctx
            (str "output-contract-gate: skipped — "
                 (or (aget result "reason") "agent error or no response"))
            "info")

    (aget result "ok")
    (when-let [attempt (:attempt (js->clj (aget result "repairInfo") :keywordize-keys true))]
      (notify ctx
              (str "eta-mu-opmf-contract-gate repaired output in " attempt " attempt" (when (not= attempt 1) "s"))
              "success"))

    :else
    (let [repair-info (js->clj (aget result "repairInfo") :keywordize-keys true)
          parsed-attempt (or (:attempt repair-info) 0)
          max-retries (or (some-> result (aget "contract") :repair-max-retries) 0)
          assistant-msg (aget result "assistant")
          repair-key (assistant-repair-key assistant-msg)
          stored-attempt (repair-count state repair-key)
          current-attempt (max parsed-attempt stored-attempt)
          session-repairs (or (aget state "sessionRepairCount") 0)
          session-repair-limit (or (aget (aget state "config") "maxSessionTurns") 10)
          pending (aget state "pendingRepair")]
      (cond
        (nil? assistant-msg)
        (notify ctx "eta-mu-opmf-contract-gate: skipping repair (no complete assistant message — likely user-initiated stop)" "info")

        (and pending (= repair-key (aget pending "key")))
        (safe-notify ctx
                     "eta-mu-opmf-contract-gate repair already queued for this assistant message"
                     "warn")

        (not (aget (aget state "config") "autoRepair"))
        (notify ctx
                (str "eta-mu-opmf-contract-gate failed ("
                     (count (or (some-> result (aget "report") :failures) []))
                     " structural violations)")
                "warn")

        (excessive-semantic-count? result)
        (notify ctx
                (str "eta-mu-opmf-contract-gate failed with a very large counted section (>"
                     MAX-AUTO-REPAIR-SEMANTIC-COUNT
                     " items); full validation/auto-repair skipped to avoid blocking turn end")
                "warn")

        (nil? (aget result "repairPrompt"))
        (notify ctx "eta-mu-opmf-contract-gate failed and no repair prompt was available" "warn")

        (>= session-repairs session-repair-limit)
        (notify ctx
                (str "eta-mu-opmf-contract-gate auto-repair budget exhausted ("
                     session-repairs "/" session-repair-limit
                     "); leaving failed output in place")
                "warn")

        (< current-attempt max-retries)
        (let [next-attempt (inc current-attempt)
              original-prompt (extract-original-user-prompt ctx messages)
              msg (build-repair-turn-message (aget result "repairPrompt") next-attempt max-retries original-prompt)]
          (set-repair-count! state repair-key next-attempt)
          (inc-session-repair-count! state)
          (aset state "pendingRepair" #js {:message msg
                                           :attempt next-attempt
                                           :max max-retries
                                           :key repair-key})
          (safe-notify ctx
                       (str "eta-mu-opmf-contract-gate queued repair " next-attempt "/" max-retries)
                       "warn"))

        :else
        (notify ctx
                (str "eta-mu-opmf-contract-gate failed ("
                     (count (or (some-> result (aget "report") :failures) []))
                     " structural violations)")
                "warn")))))

(defn handle-agent-end-error [ctx state error]
  (aset state "contractError" (or (aget error "message") (str error)))
  (set-status ctx state)
  (notify ctx
          (str "output-contract-gate error: " (aget state "contractError"))
          "warn"))

(defn handle-agent-end [pi ctx event]
  (let [state (get-state)]
    (if-not (gate-enabled? state)
      (do
        (clear-pending-repair! state)
        (aset state "contractError" nil)
        (set-status ctx state))
      (-> (validate-latest-assistant ctx state (aget event "messages"))
          (.then (fn [result]
                   (handle-validation-result pi ctx state result (aget event "messages"))))
          (.catch (fn [error]
                    (handle-agent-end-error ctx state error)))))))

(defn handle-agent-idle [pi ctx _event]
  ;; Core Pi emits agent_idle only after the AgentSession event queue drains and
  ;; Agent.waitForIdle resolves, so this handler can submit the queued repair
  ;; directly without maintaining a second timer-based idle detector here.
  (let [state (get-state)
        pending (aget state "pendingRepair")]
    (when pending
      (clear-pending-repair! state)
      (when (and (gate-enabled? state)
                 (gate-auto-repair-enabled? state))
        (send-direct-repair! pi
                             ctx
                             state
                             (aget pending "message")
                             (aget pending "attempt")
                             (aget pending "max")
                             0)))))

(defn handle-command [args ctx]
  (let [state (get-state)
        tokens (if (str/blank? args) [] (str/split (str/trim args) #"\s+"))
        cmd (or (first tokens) "status")]
    (cond
      (= cmd "status")
      (when (aget ctx "hasUI")
        (.call (aget (aget ctx "ui") "setWidget")
               (aget ctx "ui")
               "output-gate"
               #js [(str "enabled: " (aget (aget state "config") "enabled"))
                    (str "autoRepair: " (aget (aget state "config") "autoRepair"))
                    (str "contract: " (aget (aget state "config") "contractPath"))
                    (str "configSource: " (or (aget (aget state "config") "configSource") "unknown"))
                    (str "runtimeContract: " (or (aget (aget state "config") "runtimeContractPath") "n/a"))
                    (str "last ok: " (or (some-> (aget state "lastResult") (aget "ok")) "n/a"))]))

      (#{"on" "enable"} cmd)
      (do
        (aset (aget state "config") "enabled" true)
        (write-config (aget state "config"))
        (set-status ctx state)
        (notify ctx "output-contract-gate enabled" "success"))

      (#{"off" "disable"} cmd)
      (do
        (aset (aget state "config") "enabled" false)
        (clear-pending-repair! state)
        (aset state "contractError" nil)
        (write-config (aget state "config"))
        (set-status ctx state)
        (notify ctx "output-contract-gate disabled" "warn"))

      (= cmd "validate-last")
      (-> (validate-latest-assistant ctx state)
          (.then (fn [result]
                   (set-status ctx state)
                   (notify ctx
                           (str "validation ok: " (aget result "ok"))
                           (if (aget result "ok") "success" "warn")))))

      :else
      (notify ctx "Unknown /output-gate command. Use: status|on|off|validate-last" "warn"))))

(defn handle-session-start [pi ctx]
  (let [state (get-state)]
    (aset state "config" (read-config (or (aget ctx "cwd") (.cwd js/process))))
    (clear-pending-repair! state)
    (aset state "repairCounts" #js {})
    (aset state "sessionRepairCount" 0)
    (if-not (gate-enabled? state)
      (do
        (aset state "contractError" nil)
        (set-status ctx state))
      (-> (load-contract state)
          (.then (fn [_]
                   (aset state "contractError" nil)
                   (set-status ctx state)))
          (.catch (fn [error]
                    (aset state "contractError" (or (aget error "message") (str error)))
                    (notify ctx (str "output-contract-gate: " (aget state "contractError")) "warn")
                    (set-status ctx state)))))))

(defn handle-before-agent-start [event ctx]
  (let [state (get-state)]
    (aset state "config" (read-config (or (aget ctx "cwd") (.cwd js/process))))
    (if-not (gate-enabled? state)
      (do
        (clear-pending-repair! state)
        (aset state "contractError" nil))
      (-> (load-contract state)
          (.then (fn [cached]
                   (aset state "contractError" nil)
                   #js {:systemPrompt
                        (inject-contract-prompt (aget event "systemPrompt")
                                                (aget cached "contract"))}))
          (.catch (fn [error]
                    (aset state "contractError" (or (aget error "message") (str error)))))))))

(defn handle-session-shutdown [ctx]
  (when (aget ctx "hasUI")
    (.call (aget (aget ctx "ui") "setStatus")
           (aget ctx "ui")
           STATUS-KEY
           "")))

(defn register-output-contract-gate! [pi]
  (.call (aget pi "registerCommand")
         pi
         "output-gate"
         #js {:description "Manage the output contract gate (status|on|off|validate-last)"
              :handler handle-command})
  (.call (aget pi "on") pi "session_start" (fn [_event ctx] (handle-session-start pi ctx)))
  (.call (aget pi "on") pi "before_agent_start" (fn [event ctx] (handle-before-agent-start event ctx)))
  (.call (aget pi "on") pi "agent_end" (fn [event ctx] (handle-agent-end pi ctx event)))
  (.call (aget pi "on") pi "agent_idle" (fn [event ctx] (handle-agent-idle pi ctx event)))
  (.call (aget pi "on") pi "session_shutdown" (fn [_event ctx] (handle-session-shutdown ctx))))

(em/defextension opmf-contract-gate
  :name "opmf-contract-gate"
  :description "Canonical output contract gate - pure CLJS implementation"
  :init register-output-contract-gate!)
