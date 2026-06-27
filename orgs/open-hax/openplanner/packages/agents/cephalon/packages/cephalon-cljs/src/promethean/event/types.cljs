(ns promethean.event.types
  "Event type definitions for Cephalon event bus")

;; ============================================================================
;; Event Types (keywords for dispatch)
;; ============================================================================

;; External ingress events
(def discord-message-new :discord.message/new)
(def discord-message-edited :discord.message/edited)
(def discord-message-deleted :discord.message/deleted)
(def fs-file-created :fs.file/created)
(def fs-file-modified :fs.file/modified)
(def timer-tick :timer/tick)

;; Internal pipeline events
(def memory-created :memory/created)
(def eidolon-indexed :eidolon/indexed)
(def embedding-job-enqueued :embedding/job.enqueued)
(def embedding-job-done :embedding/job.done)
(def cephalon-session-ready :cephalon/session.ready)
(def llm-response :llm/response)
(def tool-called :tool/called)
(def tool-result :tool/result)

;; Sentinel workflow events
(def sentinel-start :sentinel/start)
(def sentinel-validated :sentinel/validated)
(def sentinel-retry :sentinel/retry)
(def sentinel-done :sentinel/done)

;; Effect result events
(def fs-read-result :fs/read.result)
(def fs-write-result :fs/write.result)
(def llm-chat-result :llm/chat.result)
(def discord-send-result :discord/send.result)
(def effect-queued :effect/queued)

;; ============================================================================
;; Event Constructors
;; ============================================================================

(defn make-event
  "Create a new event"
  [type payload & {:keys [source session-id]
                   :or {source {:kind :system}}}]
  {:event/id (str (random-uuid))
   :event/ts (.now js/Date)
   :event/type type
   :event/source source
   :event/session-id session-id
   :event/payload payload})

(defn make-discord-message-event
  "Create a discord message event"
  [guild-id channel-id message-id author-id author-is-bot content embeds attachments]
  (make-event :discord.message/new
              {:guild-id guild-id
               :channel-id channel-id
               :message-id message-id
               :author-id author-id
               :author-is-bot author-is-bot
               :content content
               :embeds embeds
               :attachments attachments}
              :source {:kind :discord :channel-id channel-id :message-id message-id}))

(defn make-timer-tick-event
  "Create a timer tick event"
  [interval-ms tick-number]
  (make-event :timer/tick
              {:interval-ms interval-ms :tick-number tick-number}
              :source {:kind :timer}))

(defn make-tool-result-event
  "Create a tool result event"
  [tool-name call-id result error?]
  (make-event :tool/result
              {:tool-name tool-name
               :call-id call-id
               :result result
               :error error?}
              :source {:kind :tool}))

;; ============================================================================
;; Event Predicates
;; ============================================================================

(defn discord-message-event?
  "Check if event is a discord message"
  [evt]
  (= (:event/type evt) :discord.message/new))

(defn timer-tick-event?
  "Check if event is a timer tick"
  [evt]
  (= (:event/type evt) :timer/tick))

(defn memory-created-event?
  "Check if event is a memory creation"
  [evt]
  (= (:event/type evt) :memory/created))

(defn tool-result-event?
  "Check if event is a tool result"
  [evt]
  (= (:event/type evt) :tool/result))

;; ============================================================================
;; Payload Accessors
;; ============================================================================

(defn event-channel-id
  "Get channel ID from event"
  [evt]
  (get-in evt [:event/source :channel-id]))

(defn event-session-id
  "Get session ID from event"
  [evt]
  (:event/session-id evt))

(defn event-payload-get
  "Get a value from event payload"
  [evt key]
  (get (:event/payload evt) key))
