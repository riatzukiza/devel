(ns eta-mu.extensions.session-mycology
  "Per-turn retrospection with p-scores and skill spore incubation.

  Migrated from: ~/.ημ/agent/extensions/session-mycology.ts"
  (:require-macros [eta-mu.core :as em])
  (:require ["os" :as os]
            ["fs" :as fs]
            ["path" :as path]
            [clojure.string :as str]
            [eta-mu.extensions.prompt-section :as prompt-section]))

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
(def ^:const STATE-DIR (resolve-state-dir "session-mycology"))
(def ^:const REFLECTIONS-FILE (path/join STATE-DIR "turn-reflections.jsonl"))
(def ^:const SPORES-FILE (path/join STATE-DIR "skill-spores.jsonl"))
(def ^:const PROMOTIONS-FILE (path/join STATE-DIR "skill-promotions.jsonl"))
(def ^:const SPORE-DRAFTS-DIR (path/join STATE-DIR "spores"))
(def ^:const LIVE-SKILLS-DIR (str HOME "/.ημ/agent/skills")) ;; stays under pi — skills are pi's config
(def ^:const STATUS-KEY "session-mycology")
(def ^:const GLOBAL-KEY "__pi_session_mycology_state__")
(def ^:const PROMPT-SECTION-START "<!-- eta-mu:session-mycology:start -->")
(def ^:const PROMPT-SECTION-END "<!-- eta-mu:session-mycology:end -->")
(def ^:const SPORE-THRESHOLD 0.72)
(def ^:const PROMOTION-MIN-RECURRENCE
  (js/Math.max 2 (js/Number (or (aget js/process.env "PI_MYCOLOGY_PROMOTION_MIN_RECURRENCE") 2))))
(def ^:const PROMOTION-HINT-P
  (let [v (js/Number (or (aget js/process.env "PI_MYCOLOGY_PROMOTION_HINT_P") 0.84))]
    (js/Math.max 0 (js/Math.min 1 (if (js/Number.isFinite v) v 0.84)))))
(def ^:const RECEIPT-PI-VERSION "0.58.0")

(defn now-iso []
  (.toISOString (js/Date.)))

(defn ensure-dir [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn clamp-01 [value fallback]
  (let [n (js/Number value)]
    (if (js/Number.isFinite n)
      (js/Math.max 0 (js/Math.min 1 n))
      fallback)))

(defn slugify [value]
  (let [s (-> (str (or value ""))
              (.toLowerCase)
              (.replace #"[^a-z0-9]+" "-")
              (.replace #"^-+|-$" "")
              (.replace #"--+" "-"))]
    (if (str/blank? s) "skill-spore" s)))

(defn yaml-quote [value]
  (js/JSON.stringify (str (or value ""))))

(defn edn-quote [value]
  (js/JSON.stringify (str (or value ""))))

(defn append-jsonl [file-path value]
  (ensure-dir (path/dirname file-path))
  (.appendFileSync fs file-path (str (js/JSON.stringify value) "\n") "utf8"))

(defn read-jsonl [file-path limit]
  (if-not (.existsSync fs file-path)
    #js []
    (let [text (.readFileSync fs file-path "utf8")
          lines (-> (.split text #"\r?\n")
                     (.filter (fn [x] x))
                     (.slice (- limit)))]
      (js/Array.from
       (.filter (.map lines
                      (fn [line]
                        (try (js/JSON.parse line)
                             (catch js/Error _ nil))))
                (fn [x] x))))))

(defn same-cwd [a b]
  (and a b (= (path/resolve a) (path/resolve b))))

(defn normalize-reuse-scope [value]
  (let [v (-> (str (or value "session"))
              (.trim)
              (.toLowerCase))]
    (if (or (= v "turn") (= v "session") (= v "multi-session"))
      v
      "session")))

(defn reflection-kind [reflection]
  (if-not reflection
    "none"
    (let [skill-p (clamp-01 (aget reflection "skillCandidateP") 0)
          fric-p (clamp-01 (aget reflection "frictionP") 0)
          eff-p (clamp-01 (aget reflection "efficiencyP") 0)]
      (cond
        (>= skill-p SPORE-THRESHOLD) "sporeworthy"
        (>= fric-p 0.68) "gnarly"
        (and (>= eff-p 0.75) (<= fric-p 0.35)) "smooth"
        :else "mixed"))))

(defn get-state []
  (if-let [existing (aget js/globalThis GLOBAL-KEY)]
    existing
    (let [fresh #js {:enabled true
                     :currentTurn 0
                     :lastReflection nil
                     :recentSpores #js []}]
      (aset js/globalThis GLOBAL-KEY fresh)
      fresh)))

(defn load-recent-spores [cwd limit]
  (let [rows (.filter (read-jsonl SPORES-FILE 400)
                      (fn [row]
                        (or (not cwd) (same-cwd (aget row "cwd") cwd))))]
    (-> (.slice rows (- (.-length rows) limit))
        (.reverse)
        (js/Array.from))))

(defn find-latest-spore [slug cwd]
  (let [rows (.filter (read-jsonl SPORES-FILE 400)
                      (fn [row]
                        (and (= (aget row "slug") slug)
                             (or (not cwd) (same-cwd (aget row "cwd") cwd)))))]
    (or (.at rows -1) nil)))

(defn summarize-spores [spores]
  (if (zero? (.-length spores))
    "- none yet"
    (.join (.map spores
                 (fn [spore]
                   (str "- " (aget spore "name")
                        " (recurrence " (aget spore "recurrence")
                        ", p_skill " (.toFixed (clamp-01 (aget spore "skillCandidateP") 0) 2) ")"
                        ": " (aget spore "description"))))
           "\n")))

(defn format-status [state]
  (if-not (aget state "enabled")
    "myco:off"
    (let [spores (or (aget state "recentSpores") #js [])
          last (when-let [r (aget state "lastReflection")]
                 (str " last=" (reflection-kind r)
                      " pS=" (.toFixed (clamp-01 (aget r "skillCandidateP") 0) 2)))]
      (str "myco:on spores=" (.-length spores) (or last "")))))

(defn set-status [ctx state]
  (let [ui (when (aget ctx "hasUI") (aget ctx "ui"))
        set-status-fn (and ui (aget ui "setStatus"))]
    (when set-status-fn
      (.call set-status-fn ui STATUS-KEY (if state (format-status state) "")))))

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

(defn session-file [ctx]
  (let [sm (aget ctx "sessionManager")
        get-session-file-fn (and sm (aget sm "getSessionFile"))]
    (when get-session-file-fn
      (.call get-session-file-fn sm))))

(defn model-label [ctx]
  (let [model (aget ctx "model")
        provider (or (and model (aget model "provider")) "unknown")
        id (or (and model (aget model "id")) "unknown")]
    (str provider "/" id)))

(defn build-spore-skill-draft [spore]
  (str "---\n"
       "name: " (aget spore "slug") "\n"
       "description: " (yaml-quote (aget spore "description")) "\n"
       "disable-model-invocation: true\n"
       "metadata:\n"
       "  origin: session-mycology-spore\n"
       "  recurrence: " (aget spore "recurrence") "\n"
       "---\n\n"
       "# " (aget spore "name") "\n\n"
       "## Goal\n"
       (aget spore "description") "\n\n"
       "## Use This Skill When\n"
       "- The same friction pattern recurs.\n\n"
       "## Do Not Use This Skill When\n"
       "- The pain was only a one-off environment glitch.\n"))

(defn build-spore-contract-draft [spore]
  (str "(skill-contract\n"
       "  (name " (edn-quote (aget spore "slug")) ")\n"
       "  (v \"ημ.skill/" (aget spore "slug") "@0.0.1-spore\")\n"
       "  (intent " (edn-quote (aget spore "description")) ")\n\n"
       "  (activation\n"
       "    (priority 35)\n"
       "    (explicit [\"skill:" (aget spore "slug") "\"])\n"
       "    (triggers [" (edn-quote (.toLowerCase (aget spore "name"))) "]))\n\n"
       "  (governance\n"
       "    (touch-layer :mutable)\n"
       "    (non-override [:mission :directives :safety :license :output-shape])\n"
       "    (requires-user-approval false))\n)"))

(defn promotion-eligible? [spore]
  (if-not spore
    false
    (let [reuse-scope (str (or (aget spore "reuseScope") "session"))
          recurrence (js/Number (or (aget spore "recurrence") 0))
          skill-p (clamp-01 (aget spore "skillCandidateP") 0)]
      (cond
        (and (= reuse-scope "turn") (< recurrence (inc PROMOTION-MIN-RECURRENCE))) false
        (>= recurrence PROMOTION-MIN-RECURRENCE) true
        (>= skill-p PROMOTION-HINT-P) true
        :else false))))

(defn latest-spores-by-slug [cwd]
  (let [rows (.filter (read-jsonl SPORES-FILE 1200)
                      (fn [row]
                        (or (not cwd) (same-cwd (aget row "cwd") cwd))))
        latest (js/Map.)]
    (.forEach rows
              (fn [row]
                (when (aget row "slug")
                  (.set latest (str (aget row "slug")) row))))
    (js/Array.from (.values latest))))

(defn build-live-skill [spore]
  (str "---\n"
       "name: " (aget spore "slug") "\n"
       "description: " (yaml-quote (aget spore "description")) "\n"
       "license: GPL-3.0\n"
       "metadata:\n"
       "  origin: session-mycology-promotion\n"
       "  promoted-from-spore: " (aget spore "slug") "\n"
       "  recurrence: " (aget spore "recurrence") "\n"
       "---\n\n"
       "# Skill: " (aget spore "name") "\n\n"
       "## Goal\n"
       (aget spore "description") "\n\n"
       "## Use This Skill When\n"
       "- The same pattern or failure mode has recurred enough to deserve a named protocol.\n"
       "- The current task clearly matches the lesson captured by this promoted spore.\n\n"
       "## Do Not Use This Skill When\n"
       "- The situation is obviously unrelated to " (aget spore "name") ".\n"
       "- You only have a one-off glitch with no evidence that the recurring pattern applies.\n\n"
       "## Inputs\n"
       "- The current task context.\n"
       "- The relevant files, logs, or artifacts that exhibit the pattern.\n\n"
       "## Steps\n"
       "1. Verify the current task really matches the recurring pattern.\n"
       "2. Apply the core lesson from the originating spore: " (aget spore "description") "\n"
       "3. Prefer concrete evidence over narrative momentum.\n"
       "4. If the pattern no longer fits reality, update or retire this skill instead of forcing it.\n\n"
       "## Output\n"
       "- A truthful, concrete application of the pattern to the current task.\n"))

(defn build-live-contract [spore]
  (str "(skill-contract\n"
       "  (name " (edn-quote (aget spore "slug")) ")\n"
       "  (v \"ημ.skill/" (aget spore "slug") "@0.1.0\")\n\n"
       "  (intent " (edn-quote (aget spore "description")) ")\n\n"
       "  (activation\n"
       "    (priority 41)\n"
       "    (explicit [\"skill:" (aget spore "slug") "\"])\n"
       "    (triggers [" (edn-quote (.toLowerCase (aget spore "name")))
       " " (edn-quote (.replace (aget spore "slug") #"-" " ")) "]))\n\n"
       "  (governance\n"
       "    (touch-layer :mutable)\n"
       "    (non-override [:mission :directives :safety :license :output-shape])\n"
       "    (requires-user-approval false))\n)\n"))

(defn promote-spore-to-skill [spore]
  (if-not (promotion-eligible? spore)
    #js {:promoted false :eligible false}
    (let [dir (path/join LIVE-SKILLS-DIR (aget spore "slug"))
          skill-path (path/join dir "SKILL.md")
          contract-path (path/join dir "CONTRACT.edn")]
      (ensure-dir dir)
      (let [created-skill (when-not (.existsSync fs skill-path)
                            (.writeFileSync fs skill-path (build-live-skill spore) "utf8")
                            true)
            created-contract (when-not (.existsSync fs contract-path)
                               (.writeFileSync fs contract-path (build-live-contract spore) "utf8")
                               true)]
        (when (or created-skill created-contract)
          (append-jsonl PROMOTIONS-FILE
                        #js {:ts (now-iso)
                             :slug (aget spore "slug")
                             :name (aget spore "name")
                             :recurrence (aget spore "recurrence")
                             :skillCandidateP (aget spore "skillCandidateP")
                             :cwd (aget spore "cwd")
                             :sessionFile (aget spore "sessionFile")
                             :skillPath skill-path
                             :contractPath contract-path
                             :createdSkill created-skill
                             :createdContract created-contract}))
        #js {:promoted (or created-skill created-contract)
             :eligible true
             :skillPath skill-path
             :contractPath contract-path
             :createdSkill created-skill
             :createdContract created-contract}))))

(defn write-spore-draft [reflection spore]
  (ensure-dir SPORE-DRAFTS-DIR)
  (let [file-path (path/join SPORE-DRAFTS-DIR (str (aget spore "slug") ".md"))
        skill-draft (build-spore-skill-draft spore)
        contract-draft (build-spore-contract-draft spore)
        content (str "# Skill Spore: " (aget spore "name") "\n\n"
                     "- Generated: " (aget spore "ts") "\n"
                     "- Recurrence: " (aget spore "recurrence") "\n"
                     "- CWD: " (aget spore "cwd") "\n"
                     "- Reuse scope: " (aget spore "reuseScope") "\n"
                     "- Reflection kind: " (aget spore "reflectionKind") "\n"
                     "- p-efficiency: " (.toFixed (clamp-01 (aget reflection "efficiencyP") 0) 2) "\n"
                     "- p-friction: " (.toFixed (clamp-01 (aget reflection "frictionP") 0) 2) "\n"
                     "- p-skill-candidate: " (.toFixed (clamp-01 (aget reflection "skillCandidateP") 0) 2) "\n\n"
                     "## Lesson\n"
                     (or (aget reflection "lesson") "_none captured_") "\n\n"
                     "## Better path next time\n"
                     (or (aget reflection "betterPath") "_none captured_") "\n\n"
                     "## Candidate description\n"
                     (aget spore "description") "\n\n"
                     "## Promotion gate\n"
                     "Promote this spore into a live skill after either:\n"
                     "- recurrence >= " PROMOTION-MIN-RECURRENCE "\n"
                     "- explicit user request\n"
                     "- or strong evidence that the pattern generalizes beyond the current task\n\n"
                     "## Draft SKILL.md\n\n"
                     "~~~markdown\n"
                     skill-draft
                     "~~~\n\n"
                     "## Draft CONTRACT.edn\n\n"
                     "~~~edn\n"
                     contract-draft
                     "~~~\n\n"
                     "## Suggested live-skill path\n\n"
                     "- " (path/join HOME ".ημ" "agent" "skills" (aget spore "slug") "SKILL.md") "\n"
                     "- " (path/join HOME ".ημ" "agent" "skills" (aget spore "slug") "CONTRACT.edn") "\n")]
    (.writeFileSync fs file-path content "utf8")
    file-path))

(defn append-receipt-if-present [ctx spore]
  (let [receipt-file (path/join (aget ctx "cwd") "receipts.log")]
    (when (.existsSync fs receipt-file)
      (let [refs (.join (.filter #js [(aget spore "draftPath") SPORES-FILE]
                                 (fn [x] x))
                        ",")
            line (str "ts=" (now-iso)
                      " | kind=:catalog | origin=pi | owner=session-mycology | dod=session-mycology"
                      " | pi=" RECEIPT-PI-VERSION " | host=local | manifest=none | refs=" refs
                      " | note=incubated skill spore " (aget spore "name") "\n")]
        (.appendFileSync fs receipt-file line "utf8")))))

(defn build-memory-message [cwd]
  (let [spores (load-recent-spores cwd 3)]
    (when (pos? (.-length spores))
      (str "[SESSION MYCOLOGY MEMORY]\n"
           "Recent reusable spores in this workspace:\n"
           (summarize-spores spores) "\n"
           "Reuse only when directly relevant; otherwise ignore them."))))

(defn prune-mycology-context-messages [messages enabled]
  (let [kept-one (volatile! false)]
    (-> (js/Array.from messages)
        (.reverse)
        (.filter (fn [message]
                   (if (not= (aget message "customType") "session-mycology-context")
                     true
                     (if (not enabled)
                       false
                       (if @kept-one
                         false
                         (do (vreset! kept-one true) true))))))
        (.reverse))))

(defn inject-mycology-prompt
  ([system-prompt]
   (inject-mycology-prompt system-prompt nil))
  ([system-prompt memory-message]
   (prompt-section/upsert-section
     system-prompt
     PROMPT-SECTION-START
     PROMPT-SECTION-END
     (str "[SESSION MYCOLOGY ACTIVE]\n"
          "At the end of each substantive turn, silently run a tiny retrospective.\n"
          "- p-efficiency = confidence the path was near-minimal.\n"
          "- p-friction = confidence the work felt harder than it should have.\n"
          "- p-skill-candidate = confidence a reusable skill or protocol would compress future effort.\n"
          "If you have enough evidence, call the session_mycology tool once near the end of the turn with action=\"reflect\".\n"
          "If p-skill-candidate >= " (.toFixed SPORE-THRESHOLD 2) " and the pattern seems reusable beyond the immediate task, include candidateName and candidateDescription so a draft skill spore can be incubated.\n"
          "Keep this loop quiet unless the user explicitly asks about it.\n"
          "Skip the tool for tiny conversational turns or when evidence is too thin."
          (when (and (string? memory-message) (not (str/blank? memory-message)))
            (str "\n\n" memory-message))))))

(defn make-text-result [text]
  #js {:content #js [#js {:type "text" :text text}]})

(defn make-result [text details]
  #js {:content #js [#js {:type "text" :text text}]
       :details details})

(defn handle-session-mycology-command [args ctx]
  (let [state (get-state)
        raw (str (or args ""))
        tokens (-> raw (.trim) (.split #"\s+") (.filter (fn [x] x)))
        cmd (.toLowerCase (or (.at tokens 0) "status"))
        target (-> tokens (.slice 1) (.join " ") (.trim))]
    (cond
      (= cmd "on")
      (do (aset state "enabled" true)
          (set-status ctx state)
          (ui-notify ctx "Session mycology enabled" "info"))

      (= cmd "off")
      (do (aset state "enabled" false)
          (set-status ctx state)
          (ui-notify ctx "Session mycology disabled" "info"))

      (= cmd "promote")
      (let [filter-cwd (when (or (str/blank? target)
                                 (not= (.toLowerCase target) "all"))
                         (aget ctx "cwd"))
            latest (latest-spores-by-slug filter-cwd)
            candidates (.filter latest
                                (fn [spore]
                                  (and (promotion-eligible? spore)
                                       (or (str/blank? target)
                                           (= (.toLowerCase target) "all")
                                           (= (aget spore "slug") (slugify target))
                                           (= (.toLowerCase (str (aget spore "name")))
                                              (.toLowerCase target))))))
            results (.map candidates
                          (fn [spore]
                            #js {:spore spore
                                 :promotion (promote-spore-to-skill spore)}))
            created (.filter results
                             (fn [row]
                               (aget row "promotion" "promoted")))]
        (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
        (set-status ctx state)
        (ui-set-widget ctx STATUS-KEY
                       (.concat
                        #js [(str "session-mycology: "
                                  (if (aget state "enabled") "enabled" "disabled"))
                             (str "promoted this run: " (.-length created))]
                        (.map results
                              (fn [row]
                                (str "- " (aget row "spore" "slug") ": "
                                     (if (aget row "promotion" "promoted")
                                       (aget row "promotion" "skillPath")
                                       "already present or not created"))))))
        (when (pos? (.-length created))
          (ui-notify ctx
                     (str "Promoted " (.-length created) " spore"
                          (when (not= (.-length created) 1) "s")
                          " into live skills; reloading")
                     "info")
          (when-let [reload (aget ctx "reload")]
            (reload))))

      :else
      (do (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
          (set-status ctx state)
          (let [spores (aget state "recentSpores")]
            (ui-set-widget ctx STATUS-KEY
                           (.concat
                            #js [(str "session-mycology: "
                                      (if (aget state "enabled") "enabled" "disabled"))
                                 (str "recent spores (" (.-length spores) "):")]
                            (if (pos? (.-length spores))
                              (.map spores
                                    (fn [spore]
                                      (str "- " (aget spore "name")
                                           " [" (aget spore "reuseScope") "]"
                                           " recurrence=" (aget spore "recurrence"))))
                              #js ["- none yet"]))))))))

(defn execute-session-mycology-tool [_toolCallId params _signal _onUpdate ctx]
  (let [state (get-state)
        action (.toLowerCase (.trim (str (or (aget params "action") "reflect"))))]
    (cond
      (= action "list_recent")
      (do (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
          (set-status ctx state)
          (make-result (if (pos? (.-length (aget state "recentSpores")))
                         (summarize-spores (aget state "recentSpores"))
                         "- none yet")
                       #js {:spores (aget state "recentSpores")}))

      (not= action "reflect")
      (throw (js/Error. (str "Unknown session_mycology action: " (aget params "action"))))

      :else
      (let [reflection #js {:ts (now-iso)
                            :turn (aget state "currentTurn")
                            :cwd (aget ctx "cwd")
                            :sessionFile (session-file ctx)
                            :model (model-label ctx)
                            :efficiencyP (clamp-01 (aget params "efficiencyP") 0.5)
                            :frictionP (clamp-01 (aget params "frictionP") 0.5)
                            :skillCandidateP (clamp-01 (aget params "skillCandidateP") 0.5)
                            :lesson (.trim (str (or (aget params "lesson") "")))
                            :betterPath (.trim (str (or (aget params "betterPath") "")))}]
        (append-jsonl REFLECTIONS-FILE reflection)
        (aset state "lastReflection" reflection)
        (let [name (.trim (str (or (aget params "candidateName") "")))
              description (.trim (str (or (aget params "candidateDescription") "")))
              should-incubate (and (pos? (.-length name))
                                   (pos? (.-length description))
                                   (or (>= (aget reflection "skillCandidateP") SPORE-THRESHOLD)
                                       (>= (aget reflection "frictionP") 0.68)))]
          (if-not should-incubate
            (do (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
                (set-status ctx state)
                (make-result (str "Recorded reflection (p_eff=" (.toFixed (aget reflection "efficiencyP") 2)
                                  ", p_fric=" (.toFixed (aget reflection "frictionP") 2)
                                  ", p_skill=" (.toFixed (aget reflection "skillCandidateP") 2)
                                  "). No spore incubated.")
                             #js {:reflection reflection}))
            (let [slug (slugify name)
                  prior (find-latest-spore slug (aget ctx "cwd"))
                  prior-recurrence (js/Number (or (when prior (aget prior "recurrence")) 0))
                  prior-draft-path (when prior (aget prior "draftPath"))
                  spore #js {:ts (now-iso)
                             :name name
                             :slug slug
                             :description description
                             :reuseScope (normalize-reuse-scope (aget params "reuseScope"))
                             :cwd (aget ctx "cwd")
                             :sessionFile (session-file ctx)
                             :model (model-label ctx)
                             :reflectionTs (aget reflection "ts")
                             :reflectionKind (reflection-kind reflection)
                             :recurrence (js/Math.max 1 (inc prior-recurrence))
                             :efficiencyP (aget reflection "efficiencyP")
                             :frictionP (aget reflection "frictionP")
                             :skillCandidateP (aget reflection "skillCandidateP")}]
              (aset spore "draftPath"
                    (or prior-draft-path
                        (path/join SPORE-DRAFTS-DIR (str slug ".md"))))
              (write-spore-draft reflection spore)
              (append-jsonl SPORES-FILE spore)
              (append-receipt-if-present ctx spore)
              (let [promotion (promote-spore-to-skill spore)]
                (when (aget ctx "hasUI")
                  (ui-notify ctx
                             (str "Session mycology incubated spore: " name)
                             "info")
                  (when (aget promotion "promoted")
                    (ui-notify ctx
                               (str "Session mycology promoted skill: " slug
                                    " (run /reload to expose it immediately)")
                               "info")))
                (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
                (set-status ctx state)
                (make-result (str "Recorded reflection (p_eff=" (.toFixed (aget reflection "efficiencyP") 2)
                                  ", p_fric=" (.toFixed (aget reflection "frictionP") 2)
                                  ", p_skill=" (.toFixed (aget reflection "skillCandidateP") 2)
                                  "). Incubated spore: " name " -> " (aget spore "draftPath")
                                  (when (aget promotion "promoted")
                                    (str " | promoted live skill: " (aget promotion "skillPath"))))
                             #js {:reflection reflection
                                  :spore spore
                                   :promotion promotion})))))))))

(em/defextension session-mycology
  :name "session-mycology"
  :description "Per-turn retrospection with p-scores and skill spore incubation."

  (em/command "mycology"
    :description "Show, toggle, or promote session-mycology spores (/mycology, /mycology on, /mycology off, /mycology spores, /mycology promote [slug|all])"
    :handler handle-session-mycology-command)

  (em/tool "session_mycology"
    :label "Session Mycology"
    :description "Record a per-turn retrospective with p-scores and incubate reusable skill spores when work felt harder than it should have."
    :parameters {:action {:type "string"
                          :description "Action: reflect to record a retrospective, or list_recent to inspect recent spores."}
                 :efficiencyP {:type "number" :description "Confidence 0..1 that the chosen path was near-minimal." :optional true}
                 :frictionP {:type "number" :description "Confidence 0..1 that the work was harder than it should have been." :optional true}
                 :skillCandidateP {:type "number" :description "Confidence 0..1 that a reusable skill or protocol would compress future effort." :optional true}
                 :lesson {:type "string" :description "Short lesson from the turn." :optional true}
                 :betterPath {:type "string" :description "Better path to try next time." :optional true}
                 :candidateName {:type "string" :description "Candidate skill name if a spore should be incubated." :optional true}
                 :candidateDescription {:type "string" :description "One sentence describing the candidate skill." :optional true}
                 :reuseScope {:type "string" :description "Optional reuse scope: turn, session, or multi-session." :optional true}}
    :execute execute-session-mycology-tool)

  (em/on "session_start"
    :handler (fn [_event ctx]
               (let [state (get-state)]
                 (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
                 (aset state "currentTurn" 0)
                 (set-status ctx state))))

  (em/on "session_switch"
    :handler (fn [_event ctx]
               (let [state (get-state)]
                 (aset state "recentSpores" (load-recent-spores (aget ctx "cwd") 5))
                 (aset state "currentTurn" 0)
                 (set-status ctx state))))

  (em/on "turn_start"
    :handler (fn [event ctx]
               (let [state (get-state)
                     turn-index (aget event "turnIndex")]
                 (aset state "currentTurn"
                       (if (number? turn-index)
                         turn-index
                         (inc (aget state "currentTurn"))))
                 (set-status ctx state))))

  (em/on "context"
    :handler (fn [event]
               (let [state (get-state)]
                 #js {:messages (prune-mycology-context-messages (aget event "messages")
                                                                (aget state "enabled"))})))

  (em/on "before_agent_start"
    :handler (fn [event ctx]
               (let [state (get-state)]
                 (when (aget state "enabled")
                   (let [memory-message (build-memory-message (aget ctx "cwd"))
                         system-prompt (inject-mycology-prompt (aget event "systemPrompt")
                                                               memory-message)]
                     ;; Keep recall in the idempotent system-prompt section instead of
                     ;; appending hidden messages to the durable branch on every turn.
                     #js {:systemPrompt system-prompt})))))

  (em/on "session_shutdown"
    :handler (fn [_event ctx]
               (set-status ctx js/undefined))))
