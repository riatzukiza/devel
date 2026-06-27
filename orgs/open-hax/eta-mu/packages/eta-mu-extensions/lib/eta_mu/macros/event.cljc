(ns eta-mu.macros.event
  "Event handler macros for eta-mu extensions.
   
   Provides:
   - defevents: define common event handlers
   - on-session-lifecycle: standard session start/shutdown handlers
   - on-turn-lifecycle: standard turn start/end handlers
   - on-tool-lifecycle: standard tool execution handlers"
  (:require-macros [eta-mu.macros.event])
  (:require [clojure.string :as str]))

(defmacro defevents
  "Define standard event handlers for an extension.
   
   Usage:
     (defevents receipt-river
       :state-var state
       :on-session-start (reset-state! state)
       :on-session-shutdown (set-status! ctx nil)
       :on-turn-start (aset state \"currentTurn\" (inc (aget state \"currentTurn\")))
       :on-before-agent (inject-system-prompt! event))
   
   Only generates handlers for specified events. Omit unused events."
  [ext-name & opts]
  (let [state-sym (or (:state-var opts) 'state)
        handlers (dissoc opts :state-var)]
    `(do
       ~@(for [[event-name handler] handlers]
           (let [event-str (case event-name
                            :on-session-start "session_start"
                            :on-session-shutdown "session_shutdown"
                            :on-session-switch "session_switch"
                            :on-turn-start "turn_start"
                            :on-turn-end "turn_end"
                            :on-before-agent "before_agent_start"
                            :on-after-agent "agent_end"
                            :on-tool-start "tool_execution_start"
                            :on-tool-end "tool_execution_end"
                            :on-message-end "message_end"
                            :on-context "context"
                            (name event-name))]
             `(em/on ~event-str
                :handler (fn [~'event ~'ctx]
                  (let [~state-sym (get-state)]
                    ~handler)))))))

(defmacro on-session-lifecycle
  "Standard session lifecycle handlers.
   
   Generates:
   - session_start: reset state, set status
   - session_shutdown: clear status
   - session_switch: reset counter, set status"
  [ext-name state-sym & {:keys [on-start on-shutdown on-switch reset-fn status-fn]}]
  `(do
     (em/on "session_start"
       :handler (fn [~'event ~'ctx]
                 (let [~state-sym (get-state)]
                   ~(or reset-fn `(do (aset ~state-sym "currentTurn" 0)
                                     (aset ~state-sym "enabled" true)))
                   ~on-start
                   (set-status! ~'ctx ~state-sym))))
     
     (em/on "session_shutdown"
       :handler (fn [~'event ~'ctx]
                 ~on-shutdown
                 (set-status! ~'ctx nil)))
     
     (em/on "session_switch"
       :handler (fn [~'event ~'ctx]
                 (let [~state-sym (get-state)]
                   (aset ~state-sym "currentTurn" 0)
                   ~on-switch
                   (set-status! ~'ctx ~state-sym))))))

(defmacro on-turn-lifecycle
  "Standard turn lifecycle handlers.
   
   Generates:
   - turn_start: increment counter, reset flags
   - message_end: track tool usage
   - agent_end: check for missing receipts"
  [ext-name state-sym & {:keys [on-turn-start on-message-end on-agent-end]}]
  `(do
     (em/on "turn_start"
       :handler (fn [~'event ~'ctx]
                 (let [~state-sym (get-state)
                       turn-idx# (aget ~'event "turnIndex")]
                   (aset ~state-sym "currentTurn"
                         (if (number? turn-idx#)
                           turn-idx#
                           (inc (aget ~state-sym "currentTurn"))))
                   ~on-turn-start
                   (set-status! ~'ctx ~state-sym))))
     
     ~@(when on-message-end
         `((em/on "message_end"
            :handler (fn [~'event ~'ctx]
                      (let [~state-sym (get-state)]
                        ~on-message-end
                        (set-status! ~'ctx ~state-sym))))))
     
     ~@(when on-agent-end
         `((em/on "agent_end"
            :handler (fn [~'event ~'ctx]
                      (let [~state-sym (get-state)]
                        ~on-agent-end
                        (set-status! ~'ctx ~state-sym))))))))

(defmacro on-tool-lifecycle
  "Standard tool execution lifecycle handlers.
   
   Generates:
   - tool_execution_start: track tool start
   - tool_execution_end: track tool completion"
  [ext-name state-sym & {:keys [on-start on-end track-tools]}]
  (let [track-tools-vec (or track-tools :all)]
    `(do
       (em/on "tool_execution_start"
         :handler (fn [~'event ~'ctx]
                   (let [~state-sym (get-state)
                         tool-name# (aget ~'event "toolName")]
                     ~on-start
                     (set-status! ~'ctx ~state-sym))))
       
       (em/on "tool_execution_end"
         :handler (fn [~'event ~'ctx]
                   (let [~state-sym (get-state)
                         tool-name# (aget ~'event "toolName")
                         result# (aget ~'event "result")]
                     ~on-end
                     (set-status! ~'ctx ~state-sym)))))))
