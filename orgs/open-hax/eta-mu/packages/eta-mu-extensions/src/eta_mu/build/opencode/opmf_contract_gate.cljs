(ns eta-mu.build.opencode.opmf-contract-gate
  (:require [eta-mu.extensions.opmf-contract-gate :as ext]))

(defn- append-system! [output text]
  (let [system (aget output "system")]
    (if (array? system)
      (.push system text)
      (aset output "system" #js [text]))))

(defn- text-part [text]
  #js {:type "text" :text text})

(defn- fake-message [role id text]
  #js {:id id
       :role role
       :content #js [(text-part text)]})

(defn- fake-messages [hook-input output]
  #js [(fake-message "user"
                      (str (or (aget hook-input "messageID") "message") ":user")
                      "")
       (fake-message "assistant"
                      (or (aget hook-input "messageID")
                          (aget hook-input "partID")
                          "opencode-assistant")
                      (or (aget output "text") ""))])

(defn- opencode-ctx [input hook-input]
  (let [dir (or (aget input "directory") (js/process.cwd))]
    #js {:cwd dir
         :directory dir
         :worktree (or (aget input "worktree") dir)
         :sessionID (aget hook-input "sessionID")
         :messageID (aget hook-input "messageID")
         :hasUI false
         :ui nil
         :sessionManager nil
         :metadata (fn [])}))

(defn- repair-max-retries [result]
  (or (:repair-max-retries (aget result "contract")) 0))

(defn- repair-attempt [result]
  (or (:attempt (js->clj (aget result "repairInfo") :keywordize-keys true)) 0))

(defn- text-fingerprint [text]
  (let [s (or text "")]
    (loop [idx 0
           hash 2166136261]
      (if (< idx (.-length s))
        (recur (inc idx)
               (js/Math.imul (bit-xor hash (.charCodeAt s idx)) 16777619))
        (str (.-length s) ":" hash)))))

(defn- repair-key [hook-input output]
  (str "opencode:"
       (or (aget hook-input "messageID")
           (aget hook-input "partID")
           "unknown")
       ":"
       (text-fingerprint (aget output "text"))))

(defn- repair-count [state key]
  (or (when key
        (aget (or (aget state "repairCounts") #js {}) key))
      0))

(defn- set-repair-count! [state key count]
  (let [counts (or (aget state "repairCounts") #js {})]
    (aset state "repairCounts" counts)
    (aset counts key count)))

(defn- inc-session-repair-count! [state]
  (let [next-count (inc (or (aget state "sessionRepairCount") 0))]
    (aset state "sessionRepairCount" next-count)
    next-count))

(defn- record-repair-event! [hook-input output key attempt max-retries status reason]
  (ext/append-jsonl ext/VALIDATIONS-FILE
                    {:ts (.toISOString (js/Date.))
                     :event "opencode-repair"
                     :status status
                     :reason reason
                     :repairAttempt attempt
                     :repairMax max-retries
                     :repairKey key
                     :messageId (aget hook-input "messageID")
                     :partId (aget hook-input "partID")
                     :outputFingerprint (text-fingerprint (aget output "text"))}))

(defn- prompt-async [input hook-input message]
  (let [client (aget input "client")
        session (when client (aget client "session"))
        send (when session (aget session "promptAsync"))
        session-id (aget hook-input "sessionID")
        directory (or (aget input "directory") (js/process.cwd))]
    (when (and send session-id)
      (.call send session
             #js {:path #js {:id session-id}
                  :query #js {:directory directory}
                  :body #js {:parts #js [(text-part message)]}}))))

(defn- enqueue-repair! [input hook-input output result]
  (let [state (ext/get-state)
        max-retries (repair-max-retries result)
        parsed-attempt (repair-attempt result)
        key (repair-key hook-input output)
        stored-attempt (repair-count state key)
        attempt (max parsed-attempt stored-attempt)
        next-attempt (inc attempt)
        session-repairs (or (aget state "sessionRepairCount") 0)
        session-repair-limit (or (aget (aget state "config") "maxSessionTurns") 10)
        repair-prompt (aget result "repairPrompt")]
    (cond
      (not (aget (aget state "config") "autoRepair"))
      (record-repair-event! hook-input output key attempt max-retries "skipped" "autoRepair disabled")

      (nil? repair-prompt)
      (record-repair-event! hook-input output key attempt max-retries "skipped" "missing repair prompt")

      (>= session-repairs session-repair-limit)
      (record-repair-event! hook-input output key attempt max-retries "skipped" "session repair budget exhausted")

      (< attempt max-retries)
      (let [message (ext/build-repair-turn-message repair-prompt next-attempt max-retries "")]
        (set-repair-count! state key next-attempt)
        (inc-session-repair-count! state)
        (aset state "pendingRepair" #js {:message message
                                         :attempt next-attempt
                                         :max max-retries
                                         :key key})
        (record-repair-event! hook-input output key next-attempt max-retries "queued" nil)
        (try
          (if-let [sent (prompt-async input hook-input message)]
            (when (aget sent "catch")
              (.catch sent (fn [error]
                             ;; Last-resort visible repair: if OpenCode rejects a nested
                             ;; prompt_async enqueue, replace the final text with the repair
                             ;; instruction rather than silently passing a failed contract.
                             (record-repair-event! hook-input output key next-attempt max-retries "promptAsync-failed"
                                                   (or (aget error "message") (str error)))
                             (aset output "text" message)
                             (js/console.warn "eta-mu-opmf-contract-gate prompt_async failed"
                                              (or (aget error "message") (str error))))))
            (aset output "text" message))
          (catch :default error
            (record-repair-event! hook-input output key next-attempt max-retries "enqueue-failed"
                                  (or (aget error "message") (str error)))
            (aset output "text" message)
            (js/console.warn "eta-mu-opmf-contract-gate repair enqueue failed"
                             (or (aget error "message") (str error))))))

      :else
      (record-repair-event! hook-input output key attempt max-retries "skipped" "repair budget exhausted"))))

(defn- validate-complete-text! [input hook-input output]
  (let [state (ext/get-state)]
    (when (aget (aget state "config") "enabled")
      (let [ctx (opencode-ctx input hook-input)
            messages (fake-messages hook-input output)]
        (-> (ext/validate-latest-assistant ctx state messages)
            (.then (fn [result]
                     (when-not (or (aget result "ok") (aget result "skip"))
                       (enqueue-repair! input hook-input output result))))
            (.catch (fn [error]
                      (aset state "contractError" (or (aget error "message") (str error)))
                      (js/console.warn "eta-mu-opmf-contract-gate validation failed"
                                       (aget state "contractError")))))))))

(defn ^:export init [input _options]
  (let [state (ext/get-state)]
    (aset state "config" (ext/read-config))
    #js {"experimental.chat.system.transform"
         (fn [_hook-input output]
           (when (aget (aget state "config") "enabled")
             (-> (ext/load-contract state)
                 (.then (fn [cached]
                          (aset state "contractError" nil)
                          (append-system! output
                                          (ext/build-prompt-append
                                           (aget cached "contract")))))
                 (.catch (fn [error]
                           (aset state "contractError"
                                 (or (aget error "message") (str error))))))))
         "experimental.text.complete"
         (fn [hook-input output]
           (validate-complete-text! input hook-input output))}))
