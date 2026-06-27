(ns opencode-unified.main
  "Main application entry point"
  (:require [opencode-unified.ui :as ui]
            [opencode-unified.keymap :as keymap]
            [opencode-unified.command-palette :as command-palette]
            [opencode-unified.evil :as evil]
            [opencode-unified.opencode :as opencode]
            [opencode-unified.plugins :as plugins]
            [opencode-unified.env :as env]))

;; Initialize the application
(defn init []
  (println (str "Starting Opencode on platform: " (env/get-platform)))

  ;; Initialize app state
  (println "Initializing app state...")

  ;; Initialize keymap
  (keymap/init)

  ;; Initialize command palette registry
  (command-palette/init!)

  ;; Initialize Evil mode
  (evil/init)

  ;; Initialize plugin system
  (plugins/initialize-plugin-system)

  ;; Initialize UI
  (ui/init)

  ;; Initialize Opencode SDK integration
  (opencode/init-opencode)

  ;; Set up Electron-specific event listeners
  (when (env/electron?)
    (let [electron-api (env/electron-api)]
      (.onMenuAction ^js electron-api
                     (fn [action]
                       (println "Menu action:" action)
                       (case action
                         "open-file" (println "Open file requested")
                         "save-file" (println "Save file requested")
                         "new-file" (println "New file requested")
                         "quit" (println "Quit requested")
                         (println "Unknown menu action:" action))))

      (.onPluginEvent ^js electron-api
                      (fn [event]
                        (println "Plugin event:" event)))

      (.onMainMessage ^js electron-api
                      "opencode-response"
                      (fn [response]
                        (println "Opencode response:" response)))))

  ;; Web-specific setup
  (when (env/web?)
    (println "Running in web mode - some Electron features will be unavailable"))

  ;; Expose app state for testing
  (let [opencode-api #js {:executeCommand (fn [cmd params] (-> (opencode/execute-tool cmd params) (.then clj->js)))
                          :listAgents (fn [] (-> (opencode/list-active-agents)
                                                (.then (fn [res] (clj->js (or (:agents res) res))))))
                          :createSession (fn [config] (-> (opencode/create-session) (.then clj->js)))
                          :deleteSession (fn [id] (-> (opencode/delete-session id) (.then clj->js)))
                          :listSessions (fn [] (-> (opencode/list-sessions)
                                                  (.then (fn [res] (clj->js (or (:sessions res) res))))))
                          :sendMessage (fn [id msg] (-> (opencode/send-agent-message id (:content (js->clj msg :keywordize-keys true))) (.then clj->js)))
                          :listTools (fn [] (-> (opencode/list-available-tools)
                                               (.then (fn [res] (clj->js (or (:tools res) res))))))
                          :executeTool (fn [name params] (-> (opencode/execute-tool name params) (.then clj->js)))
                          :listFiles (fn [path] (js/Promise.resolve #js []))
                          :on (fn [event handler] nil)
                          :updateSession (fn [id updates] (-> (opencode/update-session id (js->clj updates :keywordize-keys true)) (.then clj->js)))
                          :getDebugInfo (fn [] (js/Promise.resolve (clj->js (merge (opencode/get-opencode-state)
                                                                                  {:version "1.0.0"
                                                                                   :connectionStatus "connected"
                                                                                   :activeSessions 0}))))}]
    (js/Object.defineProperty opencode-api "connected"
                              #js {:get (fn [] (:connected? (opencode/get-opencode-state)))
                                   :enumerable true})
    (js/Object.defineProperty opencode-api "currentSessionId"
                              #js {:get (fn [] (:session-id (opencode/get-opencode-state)))
                                   :enumerable true})
    (set! (.-opencodeApp js/window)
          #js {:initialized true
               :plugins #js {}
               :opencode opencode-api}))

  (println "Opencode started successfully!"))

;; Start the app when DOM is ready
(when (exists? js/document)
  (if (and js/document
           (not= (.-readyState js/document) "loading"))
    (init)
    (.addEventListener js/document "DOMContentLoaded" init)))

;; Hot module replacement support
(defn ^:export reload []
  (println "Hot reloading main...")
  (ui/reload))

(defn ^:export clear []
  (println "Clearing main...")
  (ui/clear))

(defn ^:export main
  "Main entry point for the application"
  []
  (init))
