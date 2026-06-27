(ns eta-mu.runtime.shape.message)

(def role->internal
  {:user :user
   "user" :user
   :assistant :assistant
   "assistant" :assistant
   :toolResult :tool-result
   :tool-result :tool-result
   "toolResult" :tool-result
   "tool-result" :tool-result
   :bashExecution :bash-execution
   :bash-execution :bash-execution
   "bashExecution" :bash-execution
   "bash-execution" :bash-execution
   :custom :custom
   "custom" :custom
   :branchSummary :branch-summary
   :branch-summary :branch-summary
   "branchSummary" :branch-summary
   "branch-summary" :branch-summary
   :compactionSummary :compaction-summary
   :compaction-summary :compaction-summary
   "compactionSummary" :compaction-summary
   "compaction-summary" :compaction-summary})

(def role->external
  {:user :user
   :assistant :assistant
   :tool-result :toolResult
   :bash-execution :bashExecution
   :custom :custom
   :branch-summary :branchSummary
   :compaction-summary :compactionSummary})

(def content-type->internal
  {:text :text
   "text" :text
   :image :image
   "image" :image
   :audio :audio
   "audio" :audio
   :thinking :thinking
   "thinking" :thinking
   :toolCall :tool-call
   :tool-call :tool-call
   "toolCall" :tool-call
   "tool-call" :tool-call})

(def content-type->external
  {:text :text
   :image :image
   :audio :audio
   :thinking :thinking
   :tool-call :toolCall})

(defn- maybe-keyword
  [value]
  (cond
    (keyword? value) value
    (string? value) (keyword value)
    :else value))

(defn- first-present
  [m keys]
  (when-let [key (first (filter #(contains? m %) keys))]
    (get m key)))

(defn content-from-external
  [content]
  (let [content-type (get content-type->internal (:type content))]
    (case content-type
      :text
      (cond-> {:type :text
               :text (or (:text content) "")}
        (:textSignature content) (assoc :text-signature (:textSignature content))
        (:text-signature content) (assoc :text-signature (:text-signature content)))

      :image
      {:type :image
       :data (:data content)
       :mime-type (or (:mimeType content) (:mime-type content))}

      :audio
      (cond-> {:type :audio
               :data (:data content)
               :mime-type (or (:mimeType content) (:mime-type content))}
        (:format content) (assoc :format (maybe-keyword (:format content))))

      :thinking
      (cond-> {:type :thinking
               :thinking (or (:thinking content) "")}
        (:thinkingSignature content) (assoc :thinking-signature (:thinkingSignature content))
        (:thinking-signature content) (assoc :thinking-signature (:thinking-signature content))
        (contains? content :redacted) (assoc :redacted (boolean (:redacted content))))

      :tool-call
      (cond-> {:type :tool-call
               :id (:id content)
               :name (:name content)
               :arguments (or (:arguments content) {})}
        (:thoughtSignature content) (assoc :thought-signature (:thoughtSignature content))
        (:thought-signature content) (assoc :thought-signature (:thought-signature content)))

      content)))

(defn content->external
  [content]
  (case (:type content)
    :text
    (cond-> {:type :text
             :text (:text content)}
      (:text-signature content) (assoc :textSignature (:text-signature content)))

    :image
    {:type :image
     :data (:data content)
     :mimeType (:mime-type content)}

    :audio
    (cond-> {:type :audio
             :data (:data content)
             :mimeType (:mime-type content)}
      (:format content) (assoc :format (name (:format content))))

    :thinking
    (cond-> {:type :thinking
             :thinking (:thinking content)}
      (:thinking-signature content) (assoc :thinkingSignature (:thinking-signature content))
      (contains? content :redacted) (assoc :redacted (:redacted content)))

    :tool-call
    (cond-> {:type :toolCall
             :id (:id content)
             :name (:name content)
             :arguments (:arguments content)}
      (:thought-signature content) (assoc :thoughtSignature (:thought-signature content)))

    content))

(defn content-list-from-external
  [content]
  (if (string? content)
    content
    (mapv content-from-external content)))

(defn content-list->external
  [content]
  (if (string? content)
    content
    (mapv content->external content)))

(defn usage-from-external
  [usage]
  {:input (:input usage)
   :output (:output usage)
   :cache-read (or (:cacheRead usage) (:cache-read usage))
   :cache-write (or (:cacheWrite usage) (:cache-write usage))
   :total-tokens (or (:totalTokens usage) (:total-tokens usage))
   :cost {:input (get-in usage [:cost :input])
          :output (get-in usage [:cost :output])
          :cache-read (or (get-in usage [:cost :cacheRead]) (get-in usage [:cost :cache-read]))
          :cache-write (or (get-in usage [:cost :cacheWrite]) (get-in usage [:cost :cache-write]))
          :total (get-in usage [:cost :total])}})

(defn usage->external
  [usage]
  {:input (:input usage)
   :output (:output usage)
   :cacheRead (:cache-read usage)
   :cacheWrite (:cache-write usage)
   :totalTokens (:total-tokens usage)
   :cost {:input (get-in usage [:cost :input])
          :output (get-in usage [:cost :output])
          :cacheRead (get-in usage [:cost :cache-read])
          :cacheWrite (get-in usage [:cost :cache-write])
          :total (get-in usage [:cost :total])}})

(defn message-from-external
  [message]
  (let [role (get role->internal (:role message))]
    (case role
      :user
      {:role :user
       :content (content-list-from-external (:content message))
       :timestamp (:timestamp message)}

      :assistant
      (cond-> {:role :assistant
               :content (mapv content-from-external (:content message))
               :api (:api message)
               :provider (:provider message)
               :model (:model message)
               :usage (usage-from-external (:usage message))
               :stop-reason (maybe-keyword (or (:stopReason message) (:stop-reason message)))
               :timestamp (:timestamp message)}
        (:responseId message) (assoc :response-id (:responseId message))
        (:response-id message) (assoc :response-id (:response-id message))
        (:errorMessage message) (assoc :error-message (:errorMessage message))
        (:error-message message) (assoc :error-message (:error-message message)))

      :tool-result
      (cond-> {:role :tool-result
               :tool-call-id (or (:toolCallId message) (:tool-call-id message))
               :tool-name (or (:toolName message) (:tool-name message))
               :content (mapv content-from-external (:content message))
               :is-error (boolean (or (:isError message) (:is-error message)))
               :timestamp (:timestamp message)}
        (contains? message :details) (assoc :details (:details message)))

      :bash-execution
      (cond-> {:role :bash-execution
               :command (:command message)
               :output (or (:output message) "")
               :exit-code (first-present message [:exitCode :exit-code])
               :cancelled (if (contains? message :cancelled) (:cancelled message) false)
               :truncated (if (contains? message :truncated) (:truncated message) false)
               :timestamp (:timestamp message)}
        (some? (first-present message [:fullOutputPath :full-output-path]))
        (assoc :full-output-path (first-present message [:fullOutputPath :full-output-path]))
        (contains? message :excludeFromContext)
        (assoc :exclude-from-context (:excludeFromContext message))
        (contains? message :exclude-from-context)
        (assoc :exclude-from-context (:exclude-from-context message)))

      :custom
      (cond-> {:role :custom
               :custom-type (or (:customType message) (:custom-type message))
               :content (content-list-from-external (:content message))
               :display (:display message)
               :timestamp (:timestamp message)}
        (contains? message :details) (assoc :details (:details message)))

      :branch-summary
      {:role :branch-summary
       :summary (:summary message)
       :from-id (or (:fromId message) (:from-id message))
       :timestamp (:timestamp message)}

      :compaction-summary
      {:role :compaction-summary
       :summary (:summary message)
       :tokens-before (or (:tokensBefore message) (:tokens-before message))
       :timestamp (:timestamp message)}

      message)))

(defn message->external
  [message]
  (case (:role message)
    :user
    {:role :user
     :content (content-list->external (:content message))
     :timestamp (:timestamp message)}

    :assistant
    (cond-> {:role :assistant
             :content (mapv content->external (:content message))
             :api (:api message)
             :provider (:provider message)
             :model (:model message)
             :usage (usage->external (:usage message))
             :stopReason (name (:stop-reason message))
             :timestamp (:timestamp message)}
      (:response-id message) (assoc :responseId (:response-id message))
      (:error-message message) (assoc :errorMessage (:error-message message)))

    :tool-result
    (cond-> {:role :toolResult
             :toolCallId (:tool-call-id message)
             :toolName (:tool-name message)
             :content (mapv content->external (:content message))
             :isError (:is-error message)
             :timestamp (:timestamp message)}
      (contains? message :details) (assoc :details (:details message)))

    :bash-execution
    (cond-> {:role :bashExecution
             :command (:command message)
             :output (:output message)
             :exitCode (:exit-code message)
             :cancelled (:cancelled message)
             :truncated (:truncated message)
             :timestamp (:timestamp message)}
      (:full-output-path message) (assoc :fullOutputPath (:full-output-path message))
      (contains? message :exclude-from-context) (assoc :excludeFromContext (:exclude-from-context message)))

    :custom
    (cond-> {:role :custom
             :customType (:custom-type message)
             :content (content-list->external (:content message))
             :display (:display message)
             :timestamp (:timestamp message)}
      (contains? message :details) (assoc :details (:details message)))

    :branch-summary
    {:role :branchSummary
     :summary (:summary message)
     :fromId (:from-id message)
     :timestamp (:timestamp message)}

    :compaction-summary
    {:role :compactionSummary
     :summary (:summary message)
     :tokensBefore (:tokens-before message)
     :timestamp (:timestamp message)}

    message))
