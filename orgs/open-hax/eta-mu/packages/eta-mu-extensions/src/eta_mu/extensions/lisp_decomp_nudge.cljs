(ns eta-mu.extensions.lisp-decomp-nudge
  "Detects Clojure/Lisp paren-mismatch errors in tool results and nudges
   the agent to decompose the offending function instead of looping on
   re-counting parentheses.

   Hooks:
     before_agent_start → passive system-prompt instruction (burns in once)
     agent_end          → reactive user-turn injection on detected mismatch"
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            [goog.object :as gobj]))

(def GLOBAL-KEY "__eta_mu_lisp_decomp_nudge__")

(def SYSTEM-PROMPT-MARKER "## Lisp Parenthesis Discipline")

(def PASSIVE-NUDGE
  (str SYSTEM-PROMPT-MARKER "\n\n"
       "If you encounter a parenthesis or delimiter mismatch error in a Clojure/Lisp form:\n"
       "- **Do NOT** attempt to re-count or manually balance parentheses in the existing form.\n"
       "- A mismatch is a signal that the function is too large to hold in working memory.\n"
       "- **Required action**: break the function into named helper fns of ≤20 lines each, "
       "compose at the call site, and verify each helper independently.\n"
       "- Decomposition is the fix. Counting harder is not."))

(def REACTIVE-NUDGE
  (str "⚠️  **Paren/delimiter mismatch detected in a tool result.**\n\n"
       "**Do not re-count parentheses.** That approach will loop indefinitely.\n\n"
       "**Required decomposition steps:**\n"
       "1. Identify the outermost form that failed.\n"
       "2. Extract 2–3 named helper fns from it, each ≤20 lines.\n"
       "3. Write and verify (or compile) each helper independently.\n"
       "4. Compose the helpers at the original call site.\n\n"
       "A mismatched paren means the function is too large — not that you need to count harder."))

(defn get-state []
  (let [g js/globalThis]
    (or (aget g GLOBAL-KEY)
        (let [s #js {:nudgedThisTurn false}]
          (aset g GLOBAL-KEY s)
          s))))

(defn paren-mismatch? [text]
  (and (string? text)
       (boolean
         (or (re-find #"(?i)EOF while reading" text)
             (re-find #"(?i)unmatched\s+delimiter" text)
             (re-find #"(?i)unbalanced\s+paren" text)
             (re-find #"(?i)unexpected\s+(end|EOF|token)" text)
             (re-find #"(?i)mismatched\s+input" text)
             (re-find #"(?i)RuntimeException.*EOF" text)
             (re-find #"(?i)reader\s+error.*paren" text)))))

(defn extract-text [content]
  (cond
    (string? content) content
    (array? content)
    (->> (js/Array.from content)
         (filter #(and (some? %) (= "text" (aget % "type"))))
         (map #(aget % "text"))
         (str/join ""))
    :else ""))

(defn scan-for-paren-errors [ctx]
  (try
    (let [branch (.call (aget (aget ctx "sessionManager") "getBranch")
                        (aget ctx "sessionManager"))
          messages (->> (js/Array.from branch)
                        (filter #(= "message" (aget % "type")))
                        (map #(aget % "message"))
                        (filter some?))]
      ;; Check tool-role messages and assistant messages with tool_result content
      (->> messages
           (filter #(#{ "tool" "user"} (aget % "role")))
           (map #(extract-text (aget % "content")))
           (some paren-mismatch?)
           boolean))
    (catch :default _ false)))

(defn handle-before-agent-start [event]
  (let [sys (or (aget event "systemPrompt") "")]
    (when-not (str/includes? sys SYSTEM-PROMPT-MARKER)
      #js {:systemPrompt (str sys "\n\n" PASSIVE-NUDGE)})))

(defn handle-agent-end [pi ctx]
  (let [state (get-state)]
    (when (and (not (aget state "nudgedThisTurn"))
               (scan-for-paren-errors ctx))
      (aset state "nudgedThisTurn" true)
      (when (aget pi "sendUserMessage")
        (.call (aget pi "sendUserMessage") pi REACTIVE-NUDGE)))))

(defn handle-session-start [_pi _ctx]
  (aset (get-state) "nudgedThisTurn" false))

(defn register-lisp-decomp-nudge! [pi]
  (.call (aget pi "on") pi "session_start"
         (fn [_event ctx] (handle-session-start pi ctx)))
  (.call (aget pi "on") pi "before_agent_start"
         (fn [event _ctx] (handle-before-agent-start event)))
  (.call (aget pi "on") pi "agent_end"
         (fn [_event ctx] (handle-agent-end pi ctx))))

(em/defextension lisp-decomp-nudge
  :name "lisp-decomp-nudge"
  :description "Nudges agents to decompose large Lisp fns on paren mismatch instead of looping"
  :init register-lisp-decomp-nudge!)
