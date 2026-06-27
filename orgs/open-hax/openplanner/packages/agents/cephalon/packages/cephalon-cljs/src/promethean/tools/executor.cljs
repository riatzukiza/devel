(ns promethean.tools.executor
  "Tool executor with timeout and error handling."
  (:require
    [promethean.debug.log :as log]
    [promethean.tools.registry :as registry]))

;; ============================================================================
;; Tool Executor
;; ============================================================================

(defn make-executor
  "Create a tool executor."
  [registry deps]
  {:registry registry
   :deps deps
   :timeouts (atom {})
   :stats (atom {:executed 0 :errors 0 :timeouts 0})})

(defn- default-timeout-ms []
  (or (some-> (.-CEPHALON_TOOL_TIMEOUT_MS js/process.env) js/parseInt) 30000))

(defn- with-timeout [promise timeout-ms]
  (js/Promise.race
    #js [promise
         (js/Promise.
           (fn [_resolve reject]
             (js/setTimeout
               (fn [] (reject (js/Error. (str "Tool execution timeout after " timeout-ms "ms"))))
               timeout-ms)))]))

(defn execute
  "Execute a tool by name with arguments."
  ([executor tool-name args]
   (execute executor tool-name args nil))
  ([executor tool-name args session-id]
   (let [tool (registry/get-tool (:registry executor) tool-name)
         deps (:deps executor)
         timeout-ms (or (-> tool :tool/timeout-ms) (default-timeout-ms))
         stats (:stats executor)]
     (if tool
       (try
         (let [handler (:tool/impl tool)
               ctx {:session-id session-id
                    :deps deps
                    :tool-name tool-name}
               result-promise (handler ctx args)]
           (-> (with-timeout result-promise timeout-ms)
               (.then
                 (fn [result]
                   (swap! stats update :executed inc)
                   result))
               (.catch
                 (fn [err]
                   (swap! stats update :errors inc)
                   (log/error "Tool execution failed"
                              {:tool tool-name :error (str err)})
                   {:error (str err)
                    :tool tool-name}))))
         (catch js/Error err
           (swap! stats update :errors inc)
           (log/error "Tool execution threw synchronously"
                      {:tool tool-name :error (str err)})
           (js/Promise.resolve {:error (str err) :tool tool-name})))
       (js/Promise.resolve
         {:error (str "Unknown tool: " tool-name)
          :tool tool-name})))))

(defn get-definitions
  "Get tool definitions for LLM."
  [executor session-id]
  (let [tools (registry/list-tools (:registry executor))]
    (mapv
      (fn [tool]
        {:type "function"
         :function {:name (:tool/name tool)
                    :description (:tool/description tool)
                    :parameters (:tool/inputSchema tool)}})
      tools)))

(defn register-tool
  "Register a new tool."
  [executor tool]
  (update executor :registry registry/register-tool tool))

(defn stats
  "Get executor statistics."
  [executor]
  @(:stats executor))
