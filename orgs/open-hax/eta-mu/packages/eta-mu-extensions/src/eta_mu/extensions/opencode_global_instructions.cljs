(ns eta-mu.extensions.opencode-global-instructions
  "Loads operation-mindfuck .edn contract files, parses structured contract
  forms, and injects both the contract data and prose into the system prompt.

  Replaces:
    - opencode-global-instructions.ts (legacy .lisp loader)
    - opmf-contract-runtime.ts (linting + skill-graph)

  Contract forms recognized and parsed as structured data:
    (prompt ...)          — metadata header (name, version)
    (mission ...)        — mission statement
    (directives ...)     — non-negotiable principles
    (operators ...)      — η μ Π A delivery modes + precedence + detection
    (context-symbols ...) — 己 汝 彼 世 主 bindings + p= rules
    (uncertainty-operators ...) — ლა לா graded uncertainty
    (output-shape ...)   — section order + rules for the 5-section response
    (format-rule ...)    — enforcement rules
    (safety ...)         — safety constraints
    (license ...)        — license terms
    (lisp-semantics ...) — knowledge representation (fact, obs, unknown)
    (model-architecture ...) — two-model system config
    (delegation ...)     — skill delegation rules
    (skill-system ...)   — skill registry system rules
    (skill-registry ...) — skill registry entries

  Any form NOT in the recognized set is treated as prose and passed through
  to the system prompt unchanged (so .edn files remain valid as prompts).

  The parsed contract map is stored in global state for tool access."
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            [cljs.reader :as reader]
            [goog.object :as gobj]
            [eta-mu.extensions.prompt-section :as prompt-section]
            ["node:fs" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]))

;; ── Paths ──────────────────────────────────────────────────

(def HOME (.homedir os))
(def PROMPT-SECTION-START "<!-- eta-mu:opmf:start -->")
(def PROMPT-SECTION-END "<!-- eta-mu:opmf:end -->")
(def PI-AGENT-DIR (path/join HOME ".ημ" "agent"))
(def OPMF-DIR (path/join PI-AGENT-DIR "operation-mindfuck"))
(def LEGACY-OPMF-DIR (path/join HOME ".config" "opencode" "operation-mindfuck"))
(def PI-SETTINGS (path/join PI-AGENT-DIR "settings.json"))
(def STATE-DIR (path/join HOME ".ημ" "state" "opmf-contract-runtime"))
(def LINT-DIR (path/join HOME ".config" "opencode" "lint"))
(def STATUS-KEY "opmf-runtime")
(def GLOBAL-KEY "__eta_mu_opmf_global_instructions__")

(def PRIMARY-SKILL-ROOT (path/join PI-AGENT-DIR "skills"))
(def COMMON-SKILL-ROOTS
  [PRIMARY-SKILL-ROOT
   (path/join HOME ".codex" "skills")
   (path/join HOME ".codex" "vendor_imports" "skills" "skills" ".curated")
   (path/join HOME ".claude" "skills")])

;; ── Recognized contract form heads ─────────────────────────

(def ^:private contract-forms
  "Set of symbol heads that constitute structured contract language.
  Everything else is prose."
  '#{prompt mission directives operators context-symbols
     uncertainty-operators output-shape format-rule safety license
     lisp-semantics model-architecture delegation skill-system
     skill-registry remember-protocol})

;; ── Filesystem helpers ─────────────────────────────────────

(defn ensure-dir [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn file-exists? [p]
  (.existsSync fs p))

(defn safe-read [p]
  (try (.readFileSync fs p "utf8") (catch :default _ nil)))

(defn- cwd []
  (try (js/process.cwd) (catch :default _ HOME)))

(defn- candidate-opmf-dirs []
  (let [c (cwd)]
    [(path/join c "operation-mindfuck")
     (path/join c ".." "operation-mindfuck")
     (path/join c ".." "eta-mu" "operation-mindfuck")
     (path/join c ".." ".." "eta-mu" "operation-mindfuck")
     (path/join c ".." ".." ".." "eta-mu" "operation-mindfuck")
     (path/join HOME "devel" "orgs" "open-hax" "eta-mu" "operation-mindfuck")
     OPMF-DIR
     LEGACY-OPMF-DIR]))

(defn resolve-opmf-dir []
  (first (filter file-exists? (map path/resolve (candidate-opmf-dirs)))))

(defn expand-tilde [p]
  (if (and (string? p) (str/starts-with? p "~/"))
    (path/join HOME (subs p 2))
    p))

(defn append-jsonl [file obj]
  (ensure-dir (path/dirname file))
  (.appendFileSync fs file (str (js/JSON.stringify (clj->js obj)) "\n") "utf8"))

;; ── EDN Reading ────────────────────────────────────────────

(defn- strip-comments [text]
  (->> (str/split (or text "") #"\r?\n")
       (remove #(str/starts-with? (str/trim %) ";;"))
       (str/join "\n")))

(defn read-edn-forms [text]
  "Read all top-level EDN forms from text by wrapping in a vector.
   cljs.reader/read-string only reads one form, so we wrap the entire
   file content in [ ] to read all forms as a single vector."
  (try
    (let [cleaned (strip-comments text)
          ;; Wrap in vector brackets so read-string returns all forms
          wrapped (str "[" cleaned "]")]
      (reader/read-string wrapped))
    (catch :default e
      [])))

(defn read-edn-file [path]
  (when-let [text (safe-read path)]
    (read-edn-forms text)))

;; ── Contract Parser ────────────────────────────────────────

(defn- fm-head [f]
  (when (and (sequential? f) (symbol? (first f)))
    (first f)))

(defn- fm-children [f]
  (when (sequential? f)
    (rest f)))

(defn- clause-map [clauses]
  "Convert a sequence of clauses like ((name \"x\") (v \"1\")) into a map."
  (reduce
    (fn [m clause]
      (if (and (sequential? clause) (symbol? (first clause)) (next clause))
        (assoc m (first clause) (second clause))
        m))
    {}
    clauses))

(defn- clause-seq [clauses]
  "Convert a sequence of clauses into a map of head -> seq of rest-forms."
  (reduce
    (fn [m clause]
      (if (and (sequential? clause) (symbol? (first clause)))
        (update m (first clause) (fnil conj []) (rest clause))
        m))
    {}
    clauses))

(defn parse-context-symbols [f]
  (let [children (fm-children f)
        entries (clause-seq children)
        rules (mapv #(if (string? %) % (str %)) (get entries 'rule))]
    {:entries (into {}
                    (map (fn [[k v]]
                           (let [vals (->> v
                                           (mapcat #(if (sequential? %) % [%]))
                                           (map str)
                                           vec)]
                             [(str k) (if (= 1 (count vals)) (first vals) vals)]))
                    (dissoc entries 'rule)))
     :rules rules}))

(defn parse-operators [f]
  (let [children (fm-children f)
        entries (clause-seq children)
        modes (into {}
                  (keep (fn [clause]
                          (when (and (sequential? clause)
                                     (symbol? (first clause))
                                     (string? (first (rest clause))))
                            [(first clause) (str (second clause))]))
                        children))
        precedence-clause (first (get entries 'precedence))
        detection-rules (mapv str (get entries 'detection))]
    {:modes modes
     :precedence (when (sequential? precedence-clause)
                   (mapv str precedence-clause))
     :detection detection-rules}))

(defn parse-uncertainty-operators [f]
  (let [children (fm-children f)
        entries (clause-seq children)]
    {:entries (mapv (fn [entry-clause]
                      (when (and (sequential? entry-clause)
                                 (symbol? (first entry-clause))
                                 (= 'entry (first entry-clause)))
                        (let [m (clause-map (rest entry-clause))]
                          {:symbol (str (get m 'symbol ""))
                           :name (str (get m 'name ""))
                           :grade (str (get m 'grade ""))
                           :meaning (str (get m 'meaning ""))
                           :action (str (get m 'action ""))})))
                    (get entries 'entry))
     :binding (str (or (first (get entries 'binding)) ""))
     :format (str (or (first (get entries 'format)) ""))
     :modifiers (mapv str (get entries 'modifiers))
     :rules (mapv str (get entries 'rule))}))

(defn parse-output-shape [f]
  (let [children (fm-children f)
        entries (clause-seq children)
        sections-clause (first (get entries 'sections))
        sections (if (sequential? sections-clause)
                   (mapv str sections-clause)
                   [])
        rules (mapv str (get entries 'rules))]
    {:sections sections
     :rules rules}))

(defn parse-prompt-meta [f]
  (let [children (fm-children f)]
    (when (string? (first children))
      {:name (str (first children))})))

(defn parse-mission [f]
  {:text (str (first (fm-children f)))})

(defn parse-directives [f]
  {:items (mapv str (fm-children f))})

(defn parse-generic-list [f head]
  {:items (mapv str (fm-children f))
   :form head})

(defn parse-form [f]
  "Parse a single recognized contract form into structured data.
  Returns nil for unrecognized forms (they become prose)."
  (let [head (fm-head f)]
    (case head
      prompt (parse-prompt-meta f)
      mission (parse-mission f)
      directives (parse-directives f)
      operators (parse-operators f)
      context-symbols (parse-context-symbols f)
      uncertainty-operators (parse-uncertainty-operators f)
      output-shape (parse-output-shape f)
      format-rule (parse-generic-list f "format-rule")
      safety (parse-generic-list f "safety")
      license (parse-generic-list f "license")
      lisp-semantics (parse-generic-list f "lisp-semantics")
      model-architecture (parse-generic-list f "model-architecture")
      delegation (parse-generic-list f "delegation")
      skill-system (parse-generic-list f "skill-system")
      skill-registry (parse-generic-list f "skill-registry")
      remember-protocol (parse-generic-list f "remember-protocol")
      nil)))

;; ── Full contract file parser ──────────────────────────────

(defn parse-contract-file [path]
  "Parse a .edn contract file. Returns a map with:
    :source   — original file content (RAW PROMPT - the mindfuck IS the prompt)
    :forms    — all raw EDN forms
    :contract — parsed structured contract map (for deterministic enforcement)
    :prose    — ENTIRE raw source (the contract IS the prompt)
    :errors   — any parse errors"
  (let [source (or (safe-read path) "")
        forms (read-edn-forms source)
        ;; Most operation-mindfuck files are a single top-level (prompt ...)
        ;; form containing nested contract clauses. Parse both the prompt form
        ;; itself and its nested clause forms.
        parse-forms (if (and (= 1 (count forms))
                             (= 'prompt (fm-head (first forms))))
                      (let [top (first forms)]
                        (into [top] (filter sequential? (fm-children top))))
                      forms)
        parsed (atom {})
        errors (atom [])]
    ;; Parse recognized forms for deterministic enforcement
    ;; BUT the raw source IS the prompt - pass through everything
    (doseq [fm parse-forms]
      (when (contract-forms (fm-head fm))
        (try
          (when-let [parsed-fm (parse-form fm)]
            (swap! parsed assoc (keyword (name (fm-head fm))) parsed-fm))
          (catch :default e
            (swap! errors conj (str (fm-head fm) ": " (.-message e)))))))
    {:source source
     :path path
     :forms forms
     :contract @parsed
     ;; THE MINDFUCK: the raw contract IS the prompt
     :prose source
     :errors @errors}))

;; ── State ─────────────────────────────────────────────────

(defn get-state []
  (let [g (.-globalThis js/globalThis)]
    (if-let [s (aget g GLOBAL-KEY)]
      s
      (let [fresh #js {:contracts {} :contractCount 0 :lastError nil :promptAppend nil}]
        (aset g GLOBAL-KEY fresh)
        fresh))))

;; ── Skill graph (from CONTRACT.edn files) ─────────────────

(defn dirents [dir]
  (try (js/Array.from (.readdirSync fs dir #js {:withFileTypes true}))
       (catch :default _ [])))

(defn discover-contract-edn-files [root]
  (letfn [(walk [dir depth]
            (if (> depth 4) []
                (mapcat (fn [entry]
                          (let [full (path/join dir (.-name entry))]
                            (cond
                              (.isDirectory entry) (walk full (inc depth))
                              (and (.isFile entry) (= "CONTRACT.edn" (.-name entry))) [full]
                              :else [])))
                        (dirents dir))))]
    (if (file-exists? root) (walk root 0) [])))

(defn configured-skill-roots []
  (let [settings (try (js/JSON.parse (safe-read PI-SETTINGS))
                      (catch :default _ nil))
        extra (if (and settings (array? (aget settings "skills")))
                (->> (js/Array.from (aget settings "skills"))
                     (map expand-tilde)
                     (remove nil?)
                     vec)
                [])]
    (vec (distinct (concat COMMON-SKILL-ROOTS extra)))))

(defn discover-all-skill-contracts []
  (->> (configured-skill-roots)
       (mapcat discover-contract-edn-files)
       distinct
       sort
       vec))

(defn parse-skill-contract-entry [f]
  (when (and (sequential? f) (= 'entry (first f)))
    (let [m (clause-map (rest f))]
      {:name (str (or (get m 'name) ""))
       :contract (str (or (get m 'contract) ""))
       :priority (or (get m 'priority) nil)
       :autoload (or (get m 'autoload) false)
       :description (str (or (get m 'description) ""))})))

(defn parse-skill-contract-file [path]
  (try
    (let [forms (read-edn-file path)
          sc (first (filter #(and (sequential? %) (= 'skill-contract (first %))) forms))]
      (when sc
        (let [m (clause-map (rest sc))
              nm (str (or (get m 'name) (path/basename (path/dirname path))))
              v (str (or (get m 'v) ""))
              exposes-clauses (get m 'exposes)]
          {:name nm
           :v v
           :contract path
           :exposes (when exposes-clauses
                      (->> exposes-clauses
                           (filter sequential?)
                           (filter #(= 'skill-registry (first %)))
                           (mapcat rest)
                           (filter sequential?)
                           (filter #(= 'entry (first %)))
                           (mapv parse-skill-contract-entry)))})))
    (catch :default _ nil)))

(defn build-skill-graph []
  (let [files (discover-all-skill-contracts)]
    (reduce
      (fn [acc file]
        (if-let [node (parse-skill-contract-file file)]
          (update acc :nodes conj node)
          (update acc :errors conj (str "parse error: " file))))
      {:nodes [] :errors []}
      files)))

;; ── EDN block linting (from assistant messages) ────────────

(defn extract-fenced-edn-blocks [text]
  (let [re #"`{3}(edn|clojure|lith)\n([\s\S]*?)`{3}"
        blocks (atom [])]
    (loop [m (.exec re text)]
      (when m
        (swap! blocks conj {:lang (aget m 1) :body (aget m 2)})
        (recur (.exec re text))))
    @blocks))

(defn lint-edn-text [text]
  (try
    (let [forms (read-edn-forms text)]
      {:ok true :forms (count forms)})
    (catch :default e
      {:ok false :error (.-message e)})))

;; ── System prompt injection ────────────────────────────────

(defn load-and-parse-contracts []
  (let [opmf-dir (resolve-opmf-dir)]
    (if-not opmf-dir
      {:contracts {} :prose "" :contract-count 0 :errors []}
      (let [entries (try (js/Array.from
                          (.readdirSync fs opmf-dir #js {:withFileTypes true}))
                        (catch :default _ []))
            files (->> (js/Array.from entries)
                       (filter #(and (.isFile %)
                                    (or (.endsWith (.-name %) ".edn")
                                        (.endsWith (.-name %) ".lisp"))))
                       (map #(path/join opmf-dir (.-name %)))
                       (sort (fn [a b]
                               (.localeCompare (path/basename a) (path/basename b)
                                               "en" #js {:numeric true :sensitivity "base"}))))]
        (reduce
          (fn [acc file]
            (let [parsed (parse-contract-file file)
                  basename (path/basename file)]
              (-> acc
                  (update :contracts assoc basename parsed)
                  (update :prose str (when (seq (:prose parsed))
                                       (str "\n\n;; --- " basename " (prose) ---\n"
                                            (:prose parsed))))
                  (update :errors into (:errors parsed)))))
          {:contracts {} :prose "" :contract-count 0 :errors []}
          files)))))

(defn build-contract-summary [contracts]
  "Build a concise summary of parsed contract data for the system prompt."
  (let [parts (atom [])]
    (doseq [[filename parsed] contracts]
      (let [c (:contract parsed)]
        (when (seq c)
          (swap! parts conj
                 (str ";; ── " filename " ──")
                 (when (:mission c)
                   (str "MISSION: " (get-in c [:mission :text])))
                 (when (:directives c)
                   (str "DIRECTIVES:\n"
                        (str/join "\n" (map #(str "  - " %) (get-in c [:directives :items])))))
                 (when (:operators c)
                   (let [op (:operators c)]
                     (str "OPERATORS: " (str/join ", " (keys (:modes op)))
                          (when (:precedence op)
                            (str " | precedence: " (str/join " > " (:precedence op))))
                          (when (seq (:detection op))
                            (str "\n  detection: "
                                 (str/join "; " (:detection op)))))))
                 (when (:context-symbols c)
                   (let [cs (:context-symbols c)]
                     (str "CONTEXT SYMBOLS: "
                          (str/join ", " (keys (:entries cs)))
                          "\n  rule: every observation must specify context + p= value"
                          (when (seq (:rules cs))
                            (str "\n  " (str/join "\n  " (:rules cs)))))))
                 (when (:uncertainty-operators c)
                   (let [uo (:uncertainty-operators c)]
                     (str "UNCERTAINTY: "
                          (str/join ", "
                                   (keep (fn [e] (when e (str (:symbol e) "=" (:name e))))
                                         (:entries uo)))
                          (when (:binding uo)
                            (str "\n  binding: " (:binding uo)))
                          (when (:format uo)
                            (str "\n  format: " (:format uo))))))
                 ""))))
    (str/join "\n\n" @parts)))

(defn build-prompt-append [state]
  (let [contracts (js->clj (aget state "contracts") :keywordize-keys true)
        summary (build-contract-summary contracts)
        prose (aget state "prose")]
    (str/join "\n\n"
              (filter identity
                      [(when (seq summary)
                         (str "## Operation Mindfuck — Living Contracts\n\n"
                              "The following are parsed from structured .edn contract files.\n"
                              "Context symbols and p=n confidences are enforced.\n\n"
                              summary))
                       (when (seq prose)
                         (str "## Contract Prose (raw)\n\n" prose))]))))

(defn inject-contract-prompt [system-prompt state]
  (let [append (build-prompt-append state)]
    (if (and (string? append) (not (str/blank? append)))
      (if (str/includes? system-prompt "## Operation Mindfuck")
        system-prompt
        (str system-prompt "\n\n" append))
      system-prompt)))

(defn inject-opmf-section [system-prompt body]
  (prompt-section/upsert-section system-prompt
                                 PROMPT-SECTION-START
                                 PROMPT-SECTION-END
                                 body))

;; ── UI helpers ─────────────────────────────────────────────

(defn has-ui? [ctx]
  (boolean (gobj/get ctx "hasUI")))

(defn ctx-ui [ctx]
  (gobj/get ctx "ui"))

(defn notify [ctx msg level]
  (when (has-ui? ctx)
    (.call (gobj/get (ctx-ui ctx) "notify") (ctx-ui ctx) msg level)))

(defn set-status [ctx state]
  (when (has-ui? ctx)
    (let [skill-graph (aget state "skillGraph")
          nodes (when skill-graph (aget skill-graph "nodes"))]
      (.call (gobj/get (ctx-ui ctx) "setStatus") (ctx-ui ctx) STATUS-KEY
             (str "contracts:" (aget state "contractCount")
                  " skills:" (or (when nodes (.-length nodes)) 0))))))

;; ── Event handlers ─────────────────────────────────────────

(defn handle-before-agent-start [event state]
  ;; TWO THINGS:
  ;; 1. RAW PASSTHROUGH - The .edn content IS the system prompt
  ;; 2. PARSED CONTRACT - The forms are parsed for enforcement/tools
  (try
    (let [opmf-dir (resolve-opmf-dir)]
      (if-not opmf-dir
        nil
        (let [entries (try (js/Array.from
                            (.readdirSync fs opmf-dir #js {:withFileTypes true}))
                          (catch :default _ []))
              ;; Load .edn files, sorted
              files (->> (js/Array.from entries)
                         (filter #(and (.isFile %)
                                      (.endsWith (.-name %) ".edn")))
                         (map #(.-name %))
                         (sort (fn [a b]
                                 (.localeCompare a b "en" #js {:numeric true :sensitivity "base"}))))
              ;; Build parts from RAW file content (THE PROMPT)
              parts (atom [])]
          (doseq [file files]
            (let [file-path (path/join opmf-dir file)
                  content (str/replace (or (safe-read file-path) "") #"\s+$" "")]
              (when (seq content)
                (swap! parts conj (str ";; --- " file " ---\n" content)))))
          (if (empty? @parts)
            nil
            (let [;; RAW PASSTHROUGH - this IS the prompt
                  opmf (str "## OpenCode Global Instructions (operation-mindfuck)\n"
                            "This block is appended after all AGENTS.md instructions and has priority on conflicts.\n\n"
                            (str/join "\n\n" @parts))
                  ;; ALSO PARSE for contract enforcement (tools can query this)
                  data (load-and-parse-contracts)]
              ;; Store parsed contracts for tools
              (aset state "contracts" (clj->js (:contracts data)))
              (aset state "prose" (:prose data))
              (aset state "contractCount" (count (:contracts data)))
              ;; Return modified system prompt with RAW content
              #js {:systemPrompt (inject-opmf-section (aget event "systemPrompt") opmf)})))))
    (catch :default e
      (js/console.log "[opmf] ERROR:" (.-message e))
      nil)))

(defn handle-session-start [ctx state]
  (ensure-dir STATE-DIR)
  (ensure-dir LINT-DIR)
  (aset state "skillGraph" (clj->js (build-skill-graph)))
  (let [data (load-and-parse-contracts)]
    (aset state "contracts" (clj->js (:contracts data)))
    (aset state "prose" (:prose data))
    (aset state "contractCount" (count (:contracts data)))
    (set-status ctx state)
    nil))

(defn handle-message-end [event ctx state]
  (let [msg (aget event "message")]
    (when (and msg (= "assistant" (aget msg "role")))
      (let [parts (js/Array.from
                    (if (array? (aget msg "content"))
                      (aget msg "content")
                      #js []))
            text (->> (js/Array.from parts)
                      (filter #(and (gobj/get % "type")
                                    (= "text" (gobj/get % "type"))
                                    (string? (gobj/get % "text"))))
                      (map #(gobj/get % "text"))
                      (str/join ""))]
        (when (and (string? text) (str/includes? text "```"))
          (let [blocks (extract-fenced-edn-blocks text)]
            (doseq [{:keys [lang body]} blocks
                    :let [result (lint-edn-text body)]]
              (append-jsonl (path/join LINT-DIR "assistant-edn-lint.jsonl")
                            (assoc result
                                   :lang lang
                                   :ts (.toISOString (js/Date.))
                                   :sha256 (-> (js/require "node:crypto")
                                                (.createHash "sha256")
                                                (.update body)
                                                (.digest "hex"))))
              (when-not (:ok result)
                (notify ctx
                        (str "EDN lint: " (:error result))
                        "warn")))))))))

(defn handle-session-shutdown [ctx state]
  (when (has-ui? ctx)
    (.call (gobj/get (ctx-ui ctx) "setStatus") (ctx-ui ctx) STATUS-KEY js/undefined)))

;; ── Tools ──────────────────────────────────────────────────

(defn tool-skill-graph [params ctx state]
  (let [action (or (aget params "action") "list")
        graph (js->clj (aget state "skillGraph") :keywordize-keys true)
        nodes (:nodes graph)
        errors (:errors graph)]
    (case action
      "list"
      (let [text (str/join "\n"
                           (sort-by :name
                                    (map (fn [n] (str (:name n)
                                                   (when (:v n) (str " (" (:v n) ")"))
                                                   "\t"
                                                   (:contract n)))
                                         nodes)))]
        {:content [{:type "text" :text text}]
         :details {"count" (count nodes)}})

      "show"
      (let [name (aget params "name")
            matches (filter #(= name (:name %)) nodes)]
        (if (seq matches)
          {:content [{:type "text" :text
                      (str/join "\n\n---\n\n"
                                (map (fn [n]
                                       (str "name: " (:name n)
                                            (when (:v n) (str "\nv: " (:v n)))
                                            "\ncontract: " (:contract n)
                                            "\nexposes: "
                                            (if (seq (:exposes n))
                                              (str/join "\n  - "
                                                       (map (fn [e] (str (:name e)
                                                                        (when (:priority e)
                                                                          (str " (p" (:priority e) ")"))))
                                                            (:exposes n)))
                                              "(none)")))
                                     matches))}]
           :details {"ok" true "matches" (count matches)}}
          {:content [{:type "text" :text (str "not found: " name)}]
           :details {"ok" false}}))

      ;; default
      {:content [{:type "text" :text (str "unknown action: " action)}]
       :details {"ok" false}})))

(defn tool-opmf-parse [params ctx state]
  "Parse and display the structured contract data from operation-mindfuck .edn files."
  (let [action (or (aget params "action") "summary")
        contracts (js->clj (aget state "contracts") :keywordize-keys true)]
    (case action
      "summary"
      (let [text (str/join "\n\n"
                           (map (fn [[filename parsed]]
                                  (let [c (:contract parsed)]
                                    (str "## " filename
                                         (when (:mission c)
                                           (str "\nMission: " (get-in c [:mission :text])))
                                         (when (:operators c)
                                           (str "\nOperators: "
                                                (str/join ", " (keys (get-in c [:operators :modes])))))
                                         (when (:context-symbols c)
                                           (str "\nContext symbols: "
                                                (str/join ", " (keys (get-in c [:context-symbols :entries])))))
                                         (when (:output-shape c)
                                           (str "\nOutput sections: "
                                                (str/join " → " (get-in c [:output-shape :sections]))))
                                         (when (seq (:errors parsed))
                                           (str "\n⚠ Parse errors: "
                                                (str/join "; " (:errors parsed)))))))
                                (sort-by key contracts)))]
        {:content [{:type "text" :text text}]
         :details {"files" (count contracts)}})

      "context-symbols"
      (let [all-symbols (atom {})
            _ (doseq [[_ parsed] contracts
                      :let [c (:contract parsed)]]
                (when-let [cs (:context-symbols c)]
                  (doseq [[k v] (:entries cs)]
                    (swap! all-symbols assoc k v))))]
        {:content [{:type "text" :text
                    (str/join "\n"
                              (map (fn [[k v]]
                                     (str (if (keyword? k) (name k) k) " = " v))
                                   (sort-by key @all-symbols)))}]
         :details {"count" (count @all-symbols)}})

      "operators"
      (let [ops (atom {})]
        (doseq [[_ parsed] contracts
                :let [c (:contract parsed)]]
          (when-let [op (:operators c)]
            (doseq [[k v] (:modes op)]
              (swap! ops assoc k v))))
        {:content [{:type "text" :text
                    (str/join "\n" (map (fn [[k v]] (str k ": " v)) (sort-by key @ops)))}]
         :details {"count" (count @ops)}})

      {:content [{:type "text" :text (str "unknown action: " action)}]
       :details {"ok" false}})))

;; ── Extension registration ─────────────────────────────────

(em/defextension opencode-global-instructions
  :name "opencode-global-instructions"
  :description "Parse operation-mindfuck .edn contracts, inject structured data + prose into system prompt, skill graph, EDN linting."

  (em/command "opmf"
    :description "Inspect operation-mindfuck contracts (/opmf summary|context-symbols|operators)"
    :handler (fn [args ctx]
               (let [state (get-state)
                     tokens (if (str/blank? args) [] (str/split (str/trim args) #"\s+"))
                     cmd (or (first tokens) "summary")]
                 (cond
                   (= cmd "summary")
                   (when (has-ui? ctx)
                     (let [contracts (js->clj (aget state "contracts") :keywordize-keys true)
                           lines (vec
                                  (concat
                                    [(str "contracts loaded: " (aget state "contractCount"))]
                                    (map (fn [[f _]] (str "  " f)) (sort-by key contracts))
                                    (when-let [err (aget state "lastError")]
                                      [(str "errors: " err)])))]
                       (.setWidget (ctx-ui ctx) "opmf-runtime" (clj->js lines)))))

                   (= cmd "context-symbols")
                   (when (has-ui? ctx)
                     (.notify (ctx-ui ctx)
                              (str "Use the opmf-parse tool with action=context-symbols")
                              "info"))

                   :else
                   (when (has-ui? ctx)
                     (.notify (ctx-ui ctx)
                              (str "Unknown /opmf command. Use: summary|context-symbols|operators")
                              "warn")))))

  (em/tool "opmf_parse"
    :label "OMPF Parse"
    :description "Parse and inspect structured contract data from operation-mindfuck .edn files. Actions: summary, context-symbols, operators."
    :parameters {:action {:type "string"
                          :enum ["summary" "context-symbols" "operators"]
                          :description "What to inspect"}}
    :execute (fn [_tcid params _signal _onUpdate ctx]
               (let [state (get-state)]
                 (clj->js (tool-opmf-parse params ctx state)))))

  (em/tool "skill_graph"
    :label "Skill Graph"
    :description "Query the skill graph derived from CONTRACT.edn files."
    :parameters {:action {:type "string"
                          :enum ["list" "show"]
                          :description "list: list nodes. show: show one node's exposures."}
                 :name {:type "string"
                        :description "Skill name for action=show"
                        :optional true}}
    :execute (fn [_tcid params _signal _onUpdate ctx]
               (let [state (get-state)]
                 (clj->js (tool-skill-graph params ctx state)))))

  (em/on "session_start"
    :handler (fn [event ctx]
               (handle-session-start ctx (get-state))))

  (em/on "before_agent_start"
    :handler (fn [event ctx]
               (handle-before-agent-start event (get-state))))

  (em/on "message_end"
    :handler (fn [event ctx]
               (handle-message-end event ctx (get-state))))

  (em/on "session_shutdown"
    :handler (fn [event ctx]
               (handle-session-shutdown ctx (get-state)))))
