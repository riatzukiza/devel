(ns opencode-unified.opencode
  "Opencode SDK integration for ClojureScript Electron app"
  (:require ["@opencode-ai/sdk/client" :refer [createOpencodeClient]]
             [clojure.string :as str]
             [opencode-unified.state :as state]
             [opencode-unified.buffers :as buffers]
             [opencode-unified.workspace :as workspace]
             [reagent.core :as r]))

;; Opencode API state
(defonce opencode-state
  (r/atom {:connected? false
            :api-endpoint "http://localhost:3000"
            :client nil
            :session-id nil
            :available-tools []
            :active-agents []
            :chat-stream []
            :pending-prompts {}
            :pending-permissions {}
            :last-error nil}))

;; Tool execution tracking
(defonce tool-executions
  (r/atom {}))

;; Agent communication tracking
(defonce agent-communications
  (r/atom {}))

(declare create-session)

(defn- make-client [endpoint]
  (createOpencodeClient (clj->js {:baseUrl endpoint})))

(defn- ensure-client []
  (or (:client @opencode-state)
      (let [client (make-client (:api-endpoint @opencode-state))]
        (swap! opencode-state assoc :client client)
        client)))

(defn- sdk-response->result [response]
  (let [result (js->clj response :keywordize-keys true)
        data (:data result)
        error (or (:error result)
                  (get-in result [:error :message]))]
    (if error
      {:error (if (string? error) error (str error))}
      (or data result))))

(defn- response-error [error]
  (if (string? error)
    error
    (or (.-message error) (str error))))

(defn- session-id-from [value]
  (or (:id value)
      (:session-id value)
      (get-in value [:info :id])))

(defn- ensure-session-id!
  []
  (if-let [session-id (:session-id @opencode-state)]
    (js/Promise.resolve session-id)
    (-> (create-session)
        (.then (fn [result]
                 (let [normalized (if (map? result) result (sdk-response->result result))
                       session-id (session-id-from normalized)]
                   (if session-id
                     (do
                       (swap! opencode-state assoc :session-id session-id)
                       session-id)
                     (throw (js/Error. (or (:error normalized)
                                           "Failed to create Opencode session"))))))))))

;; Connection management
(defn connect-to-opencode
  "Connect to Opencode MCP server"
  [endpoint]
  (let [client (make-client endpoint)]
    (swap! opencode-state assoc :api-endpoint endpoint :client client)
    (-> (.get (.-config client))
      (.then (fn [result]
               (let [normalized (sdk-response->result result)]
                 (if (:error normalized)
                  (do
                    (swap! opencode-state assoc :connected? false :last-error (:error normalized))
                    {:error (:error normalized)})
                  (do
                    (swap! opencode-state assoc :connected? true :last-error nil)
                    {:success true :server-info normalized})))))
      (.catch (fn [error]
                (let [message (.-message error)]
                  (swap! opencode-state assoc :connected? false :last-error message)
                  {:error message}))))))

(defn disconnect-from-opencode
  "Disconnect from Opencode server"
  []
  (swap! opencode-state assoc
         :connected? false
         :session-id nil
         :available-tools []
         :active-agents []))

;; Session management
(defn create-session
  "Create new Opencode session"
  []
  (let [client (ensure-client)]
    (-> (.create (.-session client)
                 (clj->js {:body {:title "Opencode Editor Session"
                                  :description "Session created from Opencode Unified Editor"
                                  :app-name "Opencode ClojureScript Editor"
                                  :version "1.0.0"}}))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (.-message error)})))))

(defn list-sessions
  "List all Opencode sessions"
  []
  (let [client (ensure-client)]
    (-> (.list (.-session client))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (.-message error)})))))

(defn delete-session
  "Delete Opencode session"
  [session-id]
  (let [client (ensure-client)]
    (-> (.delete (.-session client)
                 (clj->js {:path {:id session-id}}))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (.-message error)})))))

(defn update-session
  "Update Opencode session state"
  [session-id updates]
  (let [client (ensure-client)]
    (-> (.update (.-session client)
                 (clj->js {:path {:id session-id}
                           :body updates}))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (.-message error)})))))

(defn join-session
  "Join existing Opencode session"
  [session-id]
  (let [client (ensure-client)]
    (-> (.get (.-session client)
              (clj->js {:path {:id session-id}}))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (.-message error)})))))

;; Tool management
(defn list-available-tools
  "Get list of available Opencode tools"
  []
  (let [client ^js (ensure-client)
        tool-api (.-tool client)]
    (-> (.call (aget tool-api "ids") tool-api (clj->js {}))
        (.then sdk-response->result)
        (.then (fn [result]
                 (if (:error result)
                   result
                   (let [tool-ids (if (vector? result)
                                    result
                                    (or (:tools result) []))
                         tools (into {}
                                     (map (fn [tool-id]
                                            [(keyword tool-id)
                                             {:id tool-id
                                              :name tool-id
                                              :description "Tool exposed by Opencode MCP"}]))
                                     tool-ids)]
                     (swap! opencode-state assoc :available-tools tool-ids)
                     {:success true :tools tools}))))
        (.catch (fn [error]
                  {:error (response-error error)})))))

(defn execute-tool
  "Execute an Opencode tool via MCP"
  [tool-name parameters & [options]]
  (let [execution-id (random-uuid)]
    (swap! tool-executions assoc execution-id
            {:tool-name tool-name
             :parameters parameters
             :status "running"
             :started-at (js/Date.)
             :options options})
    (let [client ^js (ensure-client)]
      (-> (ensure-session-id!)
          (.then (fn [session-id]
                   (.command (.-session client)
                             (clj->js {:path {:id session-id}
                                       :body {:command tool-name
                                              :arguments (js/JSON.stringify (clj->js parameters))}}))))
          (.then sdk-response->result)
          (.then (fn [result]
                   (if (:error result)
                     (do
                       (swap! tool-executions update execution-id
                              merge {:status "failed"
                                     :error (:error result)
                                     :completed-at (js/Date.)})
                       {:success false :execution-id (str execution-id) :error (:error result)})
                     (do
                       (swap! tool-executions update execution-id
                              merge {:status "completed"
                                     :result result
                                     :completed-at (js/Date.)})
                       {:success true :execution-id (str execution-id) :result result}))))
          (.catch (fn [error]
                    (let [message (response-error error)]
                      (swap! tool-executions update execution-id
                             merge {:status "failed"
                                    :error message
                                    :completed-at (js/Date.)})
                      {:success false :execution-id (str execution-id) :error message})))))))

;; Agent management
(defn list-active-agents
  "Get list of active Opencode agents"
  []
  (let [client ^js (ensure-client)
        app-api (.-app client)]
    (-> (.call (aget app-api "agents") app-api (clj->js {}))
        (.then sdk-response->result)
        (.then (fn [result]
                 (if (:error result)
                   result
                   (let [agents (if (vector? result)
                                  result
                                  (or (:agents result) []))]
                     {:success true :agents agents}))))
        (.catch (fn [error]
                  {:error (response-error error)})))))

(defn spawn-agent
  "Create a session for an agent"
  [agent-type _prompt & [_options]]
  (let [client (ensure-client)]
    (-> (.create (.-session client)
                 (clj->js {:body {:title (str "Agent session: " agent-type)
                                  :description "Session created from Opencode Unified Editor"
                                  :agent agent-type}}))
        (.then sdk-response->result)
        (.then (fn [result]
                 (if (:error result)
                   result
                   (let [session-id (session-id-from result)]
                     (when session-id
                       (swap! opencode-state assoc :session-id session-id))
                     {:success true
                      :agent-id session-id
                      :agent-type agent-type
                      :status "active"}))))
        (.catch (fn [error]
                  {:error (response-error error)})))))

(defn send-agent-message
  "Send message to an Opencode agent"
  [agent-id message & [_message-type]]
  (let [client (ensure-client)]
    (-> (.prompt (.-session client)
                (clj->js {:path {:id agent-id}
                          :body {:parts [{:type "text" :text message}]}}))
        (.then sdk-response->result)
        (.then (fn [result]
                 (if (:error result)
                   result
                   {:success true
                    :message-id (or (:id result) (get-in result [:info :id]))
                    :response result})))
        (.catch (fn [error]
                  {:error (response-error error)})))))

(defn get-agent-status
  "Get status of an Opencode agent"
  [agent-id]
  (let [client (ensure-client)]
    (-> (.get (.-session client) (clj->js {:path {:id agent-id}}))
        (.then sdk-response->result)
        (.then (fn [result]
                 (if (:error result)
                   result
                   {:success true
                    :agent-id agent-id
                    :status (or (:status result) "active")
                    :last-activity (or (:updated result) (:created result))
                    :session result})))
        (.catch (fn [error]
                  {:error (response-error error)})))))

(defn use-session!
  "Set active Opencode session"
  [session-id]
  (swap! opencode-state assoc :session-id session-id)
  (js/Promise.resolve {:success true :session-id session-id}))

(defn clear-chat-stream!
  "Clear local chat stream"
  []
  (swap! opencode-state assoc :chat-stream []))

(defn send-session-message
  "Send message to active Opencode session"
  [message]
  (if-let [session-id (:session-id @opencode-state)]
    (do
      (swap! opencode-state update :chat-stream conj {:role "user" :content message})
      (-> (send-agent-message session-id message)
          (.then (fn [result]
                   (if-let [error (:error result)]
                     (swap! opencode-state update :chat-stream conj {:role "error" :content error})
                     (let [response (or (:response result) result)
                           text (if (string? response) response (get-in response [:data :parts 0 :text]))]
                       (swap! opencode-state update :chat-stream conj {:role "assistant" :content (or text (str response))})))
                   result))))
    (js/Promise.resolve {:error "No active session"})))

(defn respond-to-permission!
  "Respond to a pending permission request"
  [id _response]
  ;; Response can be :once, :always, or :reject
  (swap! opencode-state update :pending-permissions dissoc id)
  (js/Promise.resolve {:success true}))

(defn respond-to-control-prompt!
  "Respond to a pending control prompt"
  [id _response]
  (swap! opencode-state update :pending-prompts dissoc id)
  (js/Promise.resolve {:success true}))

;; File operations through Opencode
(defn opencode-read-file
  "Read file using Opencode file operations"
  [file-path]
  (workspace/read-file file-path))

(defn opencode-write-file
  "Write file using Opencode file operations"
  [file-path content]
  (workspace/write-file file-path content))

(defn opencode-search-code
  "Search code using Opencode tools"
  [pattern & [options]]
  (let [client (ensure-client)]
    (-> (.text (.-find client)
               (clj->js {:query (merge {:pattern pattern} options)}))
        (.then sdk-response->result)
        (.catch (fn [error]
                  {:error (response-error error)})))))

;; Buffer integration with Opencode
(defn open-buffer-with-opencode
  "Open buffer using Opencode file operations"
  [file-path]
  (-> (opencode-read-file file-path)
      (.then (fn [result]
               (if (:error result)
                 (buffers/create-buffer
                  file-path
                  (str "Error loading file: " (:error result)))
                 (buffers/create-buffer file-path (:content result)))))))

(defn save-buffer-with-opencode
  "Save buffer using Opencode file operations"
  [buffer-id]
  (when-let [buffer (get-in @state/app-state [:buffers buffer-id])]
    (-> (opencode-write-file (:path buffer) (:content buffer))
        (.then (fn [result]
                 (if (:error result)
                   (state/update-current-buffer!
                    (fn [b] (assoc b :saved? false :error (:error result))))
                   (state/update-current-buffer!
                    (fn [b] (assoc b :saved? true :error nil :last-saved (js/Date.))))))))))

;; Agent communication integration
(defn create-agent-chat-buffer
  "Create buffer for agent communication"
  [agent-id agent-type]
  (let [buffer-path (str "agent://" agent-id)
        initial-content (str "# Agent Chat: " agent-type " (" agent-id ")\n\n"
                             "---\n\n"
                             "Type your message below and press C-c C-c to send.\n\n")]
    (buffers/create-buffer buffer-path initial-content {:agent-id agent-id}
                           :agent-type agent-type
                           :buffer-type :agent-chat)))

(defn send-buffer-content-to-agent
  "Send buffer content to agent"
  [buffer-id]
  (when-let [buffer (get-in @state/app-state [:buffers buffer-id])]
    (let [agent-id (:agent-id (:metadata buffer))]
      (when agent-id
        (let [content (:content buffer)
              lines (str/split content #"\n")
              message-lines (take-while #(not= % "---") (drop 3 lines))
              message (str/join "\n" message-lines)]
          (-> (send-agent-message agent-id message)
              (.then (fn [result]
                       (if (:error result)
                         (state/update-current-buffer!
                          (fn [b] (assoc b :error (:error result))))
                          (state/update-current-buffer!
                           (fn [b] (assoc b :content (str content "\n\nAgent: " (pr-str (:response result)) "\n\n---\n\n")
                                          :error nil))))))))))))

;; Tool execution UI integration
(defn create-tool-execution-buffer
  "Create buffer to display tool execution results"
  [tool-name parameters execution-id]
  (let [buffer-path (str "tool://" tool-name "/" execution-id)
        initial-content (str "# Tool Execution: " tool-name "\n\n"
                             "Execution ID: " execution-id "\n\n"
                             "Parameters:\n```json\n"
                             (js/JSON.stringify (clj->js parameters) nil 2)
                             "\n```\n\n"
                             "Status: Running...\n\n"
                             "---\n\n"
                             "Results will appear below.\n\n")]
    (buffers/create-buffer buffer-path initial-content {:tool-name tool-name}
                           :execution-id execution-id
                           :buffer-type :tool-execution)))

(defn update-tool-execution-buffer
  "Update tool execution buffer with results"
  [execution-id]
  (let [execution (get @tool-executions execution-id)
        buffer-path (str "tool://" (:tool-name execution) "/" execution-id)
        buffer-id (when-let [buffer (buffers/find-buffer-by-path buffer-path)]
                    (:id buffer))]
    (when (and buffer-id execution)
      (let [status-line (case (:status execution)
                          "running" "Status: Running..."
                          "completed" (str "Status: Completed\n\nResult:\n```json\n"
                                           (js/JSON.stringify (clj->js (:result execution)) nil 2)
                                           "\n```\n\n")
                          "failed" (str "Status: Failed\n\nError: " (:error execution) "\n\n"))
            updated-content (str "# Tool Execution: " (:tool-name execution) "\n\n"
                                 "Execution ID: " execution-id "\n\n"
                                 "Parameters:\n```json\n"
                                 (js/JSON.stringify (clj->js (:parameters execution)) nil 2)
                                 "\n```\n\n"
                                 status-line
                                 "---\n\n"
                                 (when (:result execution)
                                   (:result execution))
                                 "\n\n")]
        (state/update-current-buffer!
         (fn [b] (assoc b :content updated-content)))))))

;; Opencode command palette integration
(defn opencode-commands
  "Get Opencode-specific commands for command palette"
  []
  [{:name "Connect to Opencode"
    :description "Connect to Opencode server"
    :action #(connect-to-opencode "http://localhost:3000")}
   {:name "Disconnect from Opencode"
    :description "Disconnect from Opencode server"
    :action disconnect-from-opencode}
   {:name "List Available Tools"
    :description "Show available Opencode tools"
    :action #(-> (list-available-tools)
                 (.then (fn [result]
                           (when-not (:error result)
                             (js/alert (str "Available tools:\n"
                                            (str/join "\n"
                                                      (map :name (vals (:tools result))))))))))}
   {:name "Spawn Agent"
    :description "Spawn a new Opencode agent"
    :action #(let [agent-type (js/prompt "Agent type (e.g., 'general', 'code-reviewer'):")
                   prompt (js/prompt "Agent prompt:")]
               (when (and agent-type prompt)
                 (-> (spawn-agent agent-type prompt)
                     (.then (fn [result]
                              (when-not (:error result)
                                (create-agent-chat-buffer (:agent-id result) agent-type)))))))}
   {:name "Execute Tool"
    :description "Execute an Opencode tool"
    :action #(let [tool-name (js/prompt "Tool name:")
                   parameters (js/prompt "Parameters (JSON):")]
               (when (and tool-name parameters)
                 (try
                    (let [parsed-params (js/JSON.parse ^js parameters)]
                     (-> (execute-tool tool-name (js->clj parsed-params :keywordize-keys true))
                         (.then (fn [result]
                                  (create-tool-execution-buffer tool-name
                                                                (js->clj parsed-params :keywordize-keys true)
                                                                (:execution-id result))))))
                   (catch js/Error e
                     (js/alert (str "Invalid JSON: " (.-message e)))))))}])

;; Auto-save integration with Opencode
(defn setup-opencode-auto-save
  "Set up auto-save using Opencode file operations"
  []
  (add-watch state/app-state :opencode-auto-save
             (fn [_ _ old-state new-state]
               (let [old-buffers (:buffers old-state)
                     new-buffers (:buffers new-state)]
                 (doseq [[buffer-id buffer] new-buffers]
                   (when (and (not (:saved? buffer))
                              (:path buffer)
                              (not (str/starts-with? (:path buffer) "agent:"))
                              (not (str/starts-with? (:path buffer) "tool:"))
                              (not= (:content buffer)
                                      (:content (get old-buffers buffer-id))))
                     (save-buffer-with-opencode buffer-id)))))))

;; Initialize Opencode integration
(defn init-opencode
  "Initialize Opencode SDK integration"
  []
  (println "Initializing Opencode SDK integration...")

  ;; Try to connect to default endpoint
  (-> (connect-to-opencode "http://localhost:4096")
      (.then (fn [result]
               (if (:error result)
                   (println "Opencode server not available:" (:error result))
                   (do
                     (println "Connected to Opencode server")
                    (-> (create-session)
                        (.then (fn [session-result]
                                 (if (:error session-result)
                                   (println "Failed to create session:" (:error session-result))
                                   (do
                                    (swap! opencode-state assoc :session-id (:id session-result))
                                    (println "Opencode session created:" (:id session-result))))))))))))

  ;; Set up auto-save
  (setup-opencode-auto-save)

  ;; Add Opencode commands to command palette
  (swap! state/app-state update-in [:ui :command-palette] concat (opencode-commands)))

;; Export functions for use in other modules
(defn get-opencode-state []
  @opencode-state)

(defn get-tool-executions []
  @tool-executions)

(defn get-agent-communications []
  @agent-communications)
