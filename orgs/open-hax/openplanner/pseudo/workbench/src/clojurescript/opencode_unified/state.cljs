(ns opencode-unified.state
  (:require [reagent.core :as r]
            [goog.object :as gobj]
            [opencode-unified.env :as env]
            [opencode-unified.openplanner :as openplanner]
            [clojure.string :as str]))

(def default-activity-items
  [{:id 1 :type :error :title "Failed to connect to server" :time "2 mins ago" :timestamp 1700000120000}
   {:id 2 :type :info :title "Project initialized" :time "1 hour ago" :timestamp 1700000000000}
   {:id 3 :type :info :title "Dependencies installed" :time "2 hours ago" :timestamp 1699990000000}
   {:id 4 :type :error :title "Compilation failed" :time "5 mins ago" :timestamp 1700000100000}])

;; Global app state - simplified for debugging
(defonce app-state
  (r/atom {:buffers {}
           :current-buffer nil
           :evil-state {:mode :normal
                        :register ""
                        :last-search ""
                        :search-direction :forward
                        :count 1}
             :statusbar {:left "NORMAL" :center "" :right "Evil Mode - normal"}
             :ui {:theme :dark
                  :backend {:openplanner {:connected? false
                                          :endpoint nil
                                          :last-error nil}}
                  :search-surface {:visible? false
                                   :query ""
                                   :active-tab :sessions
                                   :filter :all
                                   :view :list
                                   :page 1
                                   :page-size 10} ;; :all, :errors, :info
                  :imports {:chatgpt {:file-path ""
                                      :job nil
                                      :status :idle
                                      :error nil}}
                  :inspector {:selection nil
                              :context []
                              :context-source []
                              :pane-error nil
                              :pinned []
                              :active-pinned-key nil}
                  :activity-items default-activity-items}}))

(defonce chatgpt-job-poller (atom nil))

(declare update-statusbar!)

(defn stop-chatgpt-job-poll! []
  (when-let [timer @chatgpt-job-poller]
    (js/clearInterval timer)
    (reset! chatgpt-job-poller nil)))

(defn- set-backend-error! [error-message]
  (swap! app-state assoc-in [:ui :backend :openplanner :connected?] false)
  (swap! app-state assoc-in [:ui :backend :openplanner :last-error] error-message)
  (swap! app-state assoc-in [:ui :activity-items] default-activity-items)
  (update-statusbar! "NORMAL" "" "OpenPlanner offline - using fallback activity"))

(defn- set-backend-connected! []
  (let [cfg (openplanner/runtime-config)]
    (swap! app-state assoc-in [:ui :backend :openplanner :connected?] true)
    (swap! app-state assoc-in [:ui :backend :openplanner :endpoint] (:endpoint cfg))
    (swap! app-state assoc-in [:ui :backend :openplanner :last-error] nil)
    (update-statusbar! "NORMAL" "" "OpenPlanner connected")))

(defn load-openplanner-activity!
  ([] (load-openplanner-activity! nil))
  ([query]
   (let [safe-query (str/trim (or query ""))
         active-tab (get-in @app-state [:ui :search-surface :active-tab])
         request (cond
                   (str/blank? safe-query)
                   (openplanner/load-sessions-activity)

                   (= active-tab :semantic)
                   (openplanner/search-vector safe-query)

                   :else
                   (openplanner/search-activity safe-query))]
     (-> request
         (.then (fn [items]
                  (set-backend-connected!)
                  (swap! app-state assoc-in [:ui :activity-items]
                         (if (seq items) items default-activity-items))
                  items))
         (.catch (fn [error]
                   (set-backend-error! (.-message error))
                   default-activity-items))))))

(defn set-chatgpt-import-file-path!
  [file-path]
  (swap! app-state assoc-in [:ui :imports :chatgpt :file-path] file-path))

(defn get-chatgpt-import-state []
  (get-in @app-state [:ui :imports :chatgpt]))

(defn- apply-chatgpt-job-status! [job]
  (let [status-key (keyword (or (:status job) "idle"))]
    (swap! app-state assoc-in [:ui :imports :chatgpt :job] job)
    (swap! app-state assoc-in [:ui :imports :chatgpt :status] status-key)
    (swap! app-state assoc-in [:ui :imports :chatgpt :error] (:error job))))

(defn poll-chatgpt-job!
  [job-id]
  (stop-chatgpt-job-poll!)
  (let [tick (fn []
               (let [request (openplanner/fetch-job job-id)]
                 (-> request
                     (.then (fn [result]
                               (let [job (:job result)
                                     status (keyword (or (:status job) "idle"))]
                                 (apply-chatgpt-job-status! job)
                                (when (contains? #{:done :error} status)
                                  (stop-chatgpt-job-poll!)
                                  (load-openplanner-activity!)))))
                     (.catch (fn [error]
                               (swap! app-state assoc-in [:ui :imports :chatgpt :status] :error)
                               (swap! app-state assoc-in [:ui :imports :chatgpt :error] (.-message error))
                               (stop-chatgpt-job-poll!))))))]
    (tick)
    (reset! chatgpt-job-poller (js/setInterval tick 2000))))

(defn start-chatgpt-import!
  ([] (start-chatgpt-import! (get-in @app-state [:ui :imports :chatgpt :file-path])))
  ([file-path]
   (let [trimmed-path (str/trim (or file-path ""))]
     (if (str/blank? trimmed-path)
       (do
         (swap! app-state assoc-in [:ui :imports :chatgpt :status] :error)
         (swap! app-state assoc-in [:ui :imports :chatgpt :error] "ChatGPT export file path is required"))
       (do
         (swap! app-state assoc-in [:ui :imports :chatgpt :status] :creating)
         (swap! app-state assoc-in [:ui :imports :chatgpt :error] nil)
         (-> (openplanner/create-chatgpt-import-job trimmed-path)
             (.then (fn [result]
                      (let [job (:job result)
                            job-id (:id job)]
                        (set-chatgpt-import-file-path! trimmed-path)
                        (apply-chatgpt-job-status! job)
                        (when job-id
                          (poll-chatgpt-job! job-id))
                        result)))
             (.catch (fn [error]
                       (swap! app-state assoc-in [:ui :imports :chatgpt :status] :error)
                       (swap! app-state assoc-in [:ui :imports :chatgpt :error] (.-message error))))))))))

(defn bootstrap-openplanner! []
  (load-openplanner-activity!))

(defn- inspector-context-failure?
  "Returns true when test flags request a simulated inspector context failure."
  []
  (let [flags (gobj/get js/window "__OPENCODE_TEST_FLAGS__")
        persistent-failure? (and flags (true? (gobj/get flags "failInspectorContext")))
        one-shot-failure? (and flags (true? (gobj/get flags "failInspectorContextOnce")))]
    (when one-shot-failure?
      (gobj/set flags "failInspectorContextOnce" false))
    (or persistent-failure? one-shot-failure?)))

;; Buffer structure
(defn create-buffer
  "Create a new buffer with given content and metadata"
  [id content & {:keys [name path language modified?]
                 :or {name (str "Buffer " id)
                      path nil
                      language "text"
                      modified? false}}]
  {:id id
   :name name
   :path path
   :content content
   :original-content content
   :language language
   :modified? modified?
   :cursor-pos 0
   :scroll-pos 0
   :selection nil
   :undo-stack []
   :redo-stack []
   :metadata {:created-at (js/Date.)
              :last-modified (js/Date.)}})

;; Buffer operations
(defn add-buffer!
  "Add a new buffer to app state"
  [buffer]
  (swap! app-state update :buffers assoc (:id buffer) buffer)
  (when (nil? (:current-buffer @app-state))
    (swap! app-state assoc :current-buffer (:id buffer))))

(defn remove-buffer!
  "Remove a buffer from app state"
  [buffer-id]
  (swap! app-state update :buffers dissoc buffer-id)
  (when (= (:current-buffer @app-state) buffer-id)
    (let [remaining-buffers (keys (:buffers @app-state))]
      (swap! app-state assoc :current-buffer (first remaining-buffers)))))

(defn get-current-buffer
  "Get currently active buffer"
  []
  (when-let [buffer-id (:current-buffer @app-state)]
    (get-in @app-state [:buffers buffer-id])))

(defn update-current-buffer!
  "Update the current buffer with the given function"
  [f]
  (when-let [buffer-id (:current-buffer @app-state)]
    (swap! app-state update-in [:buffers buffer-id] f)))

(defn set-current-buffer!
  "Set the current buffer by ID"
  [buffer-id]
  (swap! app-state assoc :current-buffer buffer-id))

;; Evil mode operations
(defn set-evil-mode!
  "Set the current Evil mode"
  [mode]
  (swap! app-state assoc-in [:evil-state :mode] mode))

(defn get-evil-mode
  "Get the current Evil mode"
  []
  (get-in @app-state [:evil-state :mode]))

;; Statusbar operations
(defn update-statusbar!
  "Update statusbar content"
  [left center right]
  (swap! app-state assoc :statusbar {:left left
                                     :center center
                                     :right right}))

;; Which-key operations
(defn show-which-key!
  "Show which-key popup"
  []
  (swap! app-state assoc-in [:ui :which-key?] true))

(defn hide-which-key!
  "Hide which-key popup"
  []
  (swap! app-state assoc-in [:ui :which-key?] false))

;; Command palette operations
(defn command-palette
  "Get command palette state"
  []
  (get-in @app-state [:ui :command-palette]))

;; Search Surface operations
(defn toggle-search-surface!
  "Toggle search surface visibility"
  []
  (swap! app-state update-in [:ui :search-surface :visible?] not))

(defn focus-search-input!
  "Focus the search input after the surface becomes visible."
  []
  (letfn [(focus-with-retry! [remaining]
            ;; Target the input inside the search surface modal specifically
            (when-let [input (.querySelector js/document "[data-testid='search-surface'] [data-testid='search-input']")]
              (.focus input)
              (when (and (pos? remaining)
                         (not= input (.-activeElement js/document)))
                (js/setTimeout #(focus-with-retry! (dec remaining)) 16))))]
    (js/setTimeout #(focus-with-retry! 6) 0)))

(defn open-search-surface!
  "Open search surface and focus input."
  []
  (swap! app-state assoc-in [:ui :search-surface :visible?] true)
  (focus-search-input!))

(defn set-search-query!
  "Set search surface query"
  [query]
  (swap! app-state assoc-in [:ui :search-surface :query] query)
  (swap! app-state assoc-in [:ui :search-surface :page] 1)
  (let [active-tab (get-in @app-state [:ui :search-surface :active-tab])]
    (when (contains? #{:sessions :semantic} active-tab)
      (load-openplanner-activity! query))))

(defn set-search-tab!
  "Set search surface active tab"
  [tab]
  (swap! app-state assoc-in [:ui :search-surface :active-tab] tab)
  (swap! app-state assoc-in [:ui :search-surface :page] 1)
  (swap! app-state assoc-in [:ui :inspector :selection] nil)
  (swap! app-state assoc-in [:ui :inspector :context] [])
  (load-openplanner-activity! (get-in @app-state [:ui :search-surface :query])))

(defn set-search-filter!
  "Set search surface filter"
  [filter-type]
  (swap! app-state assoc-in [:ui :search-surface :filter] filter-type)
  (swap! app-state assoc-in [:ui :search-surface :page] 1))

(defn set-search-view!
  "Set search result view mode"
  [view-mode]
  (swap! app-state assoc-in [:ui :search-surface :view] view-mode))

(defn set-search-page!
  "Set current search result page"
  [page]
  (swap! app-state assoc-in [:ui :search-surface :page] (max 1 page)))

(defn set-search-page-size!
  "Set search result page size"
  [page-size]
  (swap! app-state assoc-in [:ui :search-surface :page-size] (max 1 page-size))
  (swap! app-state assoc-in [:ui :search-surface :page] 1))

(defn set-inspector-selection!
  "Select an item and project context into inspector pane."
  [item context-items]
  (swap! app-state assoc-in [:ui :inspector :selection] item)
  (swap! app-state assoc-in [:ui :inspector :context-source] context-items)
  (if (inspector-context-failure?)
    (do
      (swap! app-state assoc-in [:ui :inspector :context] [])
      (swap! app-state assoc-in [:ui :inspector :pane-error]
             {:message "Inspector context API failed. You can continue and retry context load."}))
    (do
      (swap! app-state assoc-in [:ui :inspector :context] context-items)
      (swap! app-state assoc-in [:ui :inspector :pane-error] nil)))
  (swap! app-state assoc-in [:ui :inspector :active-pinned-key] nil))

(defn retry-inspector-context!
  "Retry loading inspector context after a recoverable pane error."
  []
  (let [{:keys [selection context-source]} (get-in @app-state [:ui :inspector])]
    (when selection
      (if (inspector-context-failure?)
        (swap! app-state assoc-in [:ui :inspector :pane-error]
               {:message "Inspector context API still unavailable. Retry when service recovers."})
        (do
          (swap! app-state assoc-in [:ui :inspector :context] (or context-source []))
          (swap! app-state assoc-in [:ui :inspector :pane-error] nil))))))

(defn inspector-entity-key
  "Stable key for inspector entities across tabs/views."
  [item]
  (let [entity-type (or (:type item) :item)
        entity-id (or (:id item) (:title item) "unknown")]
    (str (name entity-type) "::" entity-id)))

(defn pin-selected-inspector-entity!
  "Pin the current inspector selection into persistent compare set."
  []
  (let [{:keys [selection context]} (get-in @app-state [:ui :inspector])]
    (when selection
      (let [entity-key (inspector-entity-key selection)
            pinned-entry {:key entity-key
                          :selection selection
                          :context context}]
        (swap! app-state update-in [:ui :inspector :pinned]
               (fn [pinned]
                 (let [safe-pinned (or pinned [])]
                   (if (some #(= (:key %) entity-key) safe-pinned)
                     (mapv (fn [entry]
                             (if (= (:key entry) entity-key)
                               pinned-entry
                               entry))
                           safe-pinned)
                     (conj safe-pinned pinned-entry)))))
        (swap! app-state assoc-in [:ui :inspector :active-pinned-key] entity-key)))))

(defn unpin-inspector-entity!
  "Remove a pinned entity from compare set."
  [entity-key]
  (swap! app-state update-in [:ui :inspector :pinned]
         (fn [pinned]
           (vec (remove #(= (:key %) entity-key) (or pinned [])))))
  (let [inspector-state (get-in @app-state [:ui :inspector])
        active-key (:active-pinned-key inspector-state)
        pinned (:pinned inspector-state)]
    (when (= active-key entity-key)
      (swap! app-state assoc-in [:ui :inspector :active-pinned-key] (some-> pinned first :key)))))

(defn set-active-inspector-pinned!
  "Set active pinned entity in compare tabs."
  [entity-key]
  (swap! app-state assoc-in [:ui :inspector :active-pinned-key] entity-key))

(defn inspector-entity-pinned?
  "Check if current entity key is pinned."
  [entity-key]
  (some #(= (:key %) entity-key) (get-in @app-state [:ui :inspector :pinned])))

(defn get-inspector-state
  "Get right-pane inspector state."
  []
  (get-in @app-state [:ui :inspector]))

(defn get-search-state
  "Get search surface state"
  []
  (get-in @app-state [:ui :search-surface]))

(defn get-activity-items
  "Get activity items"
  []
  (get-in @app-state [:ui :activity-items]))

;; Workspace operations
(defn load-workspace!
  "Load workspace from file"
  [workspace-path]
  (println "Loading workspace from:" workspace-path)
  (if (and (exists? js/require) (not env/web?))
    ;; Electron environment - use Node.js fs
    (try
      (let [fs (js/require "fs")
            workspace-data (-> fs (.readFileSync workspace-path "utf8") js/JSON.parse (js->clj :keywordize-keys true))]

        ;; Restore buffers
        (when (:buffers workspace-data)
          (doseq [buffer-data (:buffers workspace-data)]
            (let [buffer (create-buffer (:id buffer-data) (:content buffer-data) buffer-data)]
              (add-buffer! buffer))))

        ;; Restore current buffer
        (when (:current-buffer workspace-data)
          (set-current-buffer! (:current-buffer workspace-data)))

        ;; Restore UI state
        (when (:ui workspace-data)
          (swap! app-state update :ui merge (:ui workspace-data)))

        ;; Restore Evil state
        (when (:evil-state workspace-data)
          (swap! app-state update :evil-state merge (:evil-state workspace-data)))

        (println "Workspace loaded successfully")
        {:success true})
      (catch js/Error e
        (println "Error loading workspace:" (.-message e))
        {:success false :error (.-message e)}))

    ;; Web environment - use localStorage or fetch
    (try
      (if-let [storage (some-> js/window (aget "localStorage"))]
        (let [workspace-key (str "workspace-" (hash workspace-path))
              stored-data (.getItem storage workspace-key)]
          (if stored-data
            (let [workspace-data (-> stored-data js/JSON.parse (js->clj :keywordize-keys true))]
              ;; Restore state similar to Electron version
              (when (:buffers workspace-data)
                (doseq [buffer-data (:buffers workspace-data)]
                  (let [buffer (create-buffer (:id buffer-data) (:content buffer-data) buffer-data)]
                    (add-buffer! buffer))))

              (when (:current-buffer workspace-data)
                (set-current-buffer! (:current-buffer workspace-data)))

              (when (:ui workspace-data)
                (swap! app-state update :ui merge (:ui workspace-data)))

              (when (:evil-state workspace-data)
                (swap! app-state update :evil-state merge (:evil-state workspace-data)))

              (println "Workspace loaded from localStorage")
              {:success true})
            {:success false :error "No workspace found in storage"}))
        {:success false :error "localStorage unavailable"})
      (catch js/Error e
        (println "Error loading workspace from localStorage:" (.-message e))
        {:success false :error (.-message e)}))))

(defn save-workspace!
  "Save current workspace to file"
  [workspace-path]
  (println "Saving workspace to:" workspace-path)
  (let [workspace-data {:buffers (into {} (for [[id buffer] (:buffers @app-state)]
                                            [id {:id id
                                                 :path (:path buffer)
                                                 :content (:content buffer)
                                                 :language (:language buffer)
                                                 :saved? (:saved? buffer)
                                                 :metadata (:metadata buffer)
                                                 :created-at (:created-at buffer)
                                                 :modified-at (:modified-at buffer)}]))
                        :current-buffer (:current-buffer @app-state)
                        :ui (:ui @app-state)
                        :evil-state (:evil-state @app-state)
                        :version "1.0.0"
                        :saved-at (js/Date.)}]

    (if (and (exists? js/require) (not env/web?))
      ;; Electron environment - use Node.js fs
      (try
        (let [fs (js/require "fs")
              path (js/require "path")
              workspace-dir (.dirname path workspace-path)]

          ;; Ensure directory exists
          (when-not (.existsSync fs workspace-dir)
            (.mkdirSync fs workspace-dir #js {:recursive true}))

          ;; Write workspace file
          (.writeFileSync fs workspace-path
                          (js/JSON.stringify (clj->js workspace-data) nil 2)
                          "utf8")

          (println "Workspace saved successfully")
          {:success true})
        (catch js/Error e
          (println "Error saving workspace:" (.-message e))
          {:success false :error (.-message e)}))

      ;; Web environment - use localStorage
      (try
        (if-let [storage (some-> js/window (aget "localStorage"))]
          (let [workspace-key (str "workspace-" (hash workspace-path))
                json-data (js/JSON.stringify (clj->js workspace-data) nil 2)]
            (.setItem storage workspace-key json-data)
            (println "Workspace saved to localStorage")
            {:success true})
          {:success false :error "localStorage unavailable"})
        (catch js/Error e
          (println "Error saving workspace to localStorage:" (.-message e))
          {:success false :error (.-message e)})))))

;; Buffer accessors
(defn get-buffers
  "Get all buffers"
  []
  (:buffers @app-state))

(defn buffers
  "Get all buffers (alias for get-buffers)"
  []
  (get-buffers))

;; Evil state helpers
(defn get-evil-state
  "Get the entire Evil state"
  []
  (:evil-state @app-state))

(defn set-evil-register!
  "Set the Evil register (yank buffer)"
  [text]
  (swap! app-state assoc-in [:evil-state :register] text))

(defn get-evil-register
  "Get the Evil register content"
  []
  (get-in @app-state [:evil-state :register]))

(defn set-evil-count!
  "Set the Evil count for commands"
  [count]
  (swap! app-state assoc-in [:evil-state :count] count))

(defn get-evil-count
  "Get the current Evil count"
  []
  (get-in @app-state [:evil-state :count] 1))

(defn set-last-search!
  "Set the last search query"
  [query]
  (swap! app-state assoc-in [:evil-state :last-search] query))

(defn get-last-search
  "Get the last search query"
  []
  (get-in @app-state [:evil-state :last-search]))

(defn set-search-direction!
  "Set the search direction"
  [direction]
  (swap! app-state assoc-in [:evil-state :search-direction] direction))

(defn get-search-direction
  "Get the search direction"
  []
  (get-in @app-state [:evil-state :search-direction] :forward))

;; Auto-save functionality
(defonce auto-save-timer (atom nil))

(defn enable-auto-save!
  "Enable auto-save with specified interval in milliseconds"
  [interval-ms workspace-path]
  (when @auto-save-timer
    (js/clearInterval @auto-save-timer))

  (reset! auto-save-timer
          (js/setInterval
           (fn []
             (when (:current-buffer @app-state)
               (save-workspace! workspace-path)))
           interval-ms))

  (println "Auto-save enabled with" interval-ms "ms interval"))

(defn disable-auto-save!
  "Disable auto-save"
  []
  (when @auto-save-timer
    (js/clearInterval @auto-save-timer)
    (reset! auto-save-timer nil)
    (println "Auto-save disabled")))

(defn get-auto-save-status
  "Get current auto-save status"
  []
  {:enabled (some? @auto-save-timer)
   :interval (when @auto-save-timer "active")})

;; Workspace management commands
(defn workspace-commands
  "Get workspace-related commands for command palette"
  []
  [{:name "Save Workspace"
    :description "Save current workspace to file"
    :keys "SPC w s"
    :handler (fn []
               (let [workspace-path (or (js/prompt "Workspace path:" "./workspace.json")
                                        "./workspace.json")]
                 (when workspace-path
                   (save-workspace! workspace-path))))}

   {:name "Load Workspace"
    :description "Load workspace from file"
    :keys "SPC w l"
    :handler (fn []
               (let [workspace-path (or (js/prompt "Workspace path:" "./workspace.json")
                                        "./workspace.json")]
                 (when workspace-path
                   (load-workspace! workspace-path))))}

   {:name "Enable Auto-Save"
    :description "Enable auto-save with custom interval"
    :keys "SPC w a"
    :handler (fn []
               (let [interval (or (js/prompt "Auto-save interval (ms):" "30000")
                                  "30000")
                     workspace-path (or (js/prompt "Workspace path for auto-save:" "./workspace.json")
                                        "./workspace.json")]
                 (when (and interval workspace-path)
                    (enable-auto-save! (js/parseInt interval 10) workspace-path))))}

   {:name "Disable Auto-Save"
    :description "Disable auto-save"
    :keys "SPC w d"
    :handler disable-auto-save!}

   {:name "New Workspace"
    :description "Create new workspace (clear current state)"
    :keys "SPC w n"
    :handler (fn []
               (when (js/confirm "Clear current workspace and create new one?")
                 ;; Clear all buffers
                 (swap! app-state assoc :buffers {})
                 ;; Reset current buffer
                 (swap! app-state assoc :current-buffer nil)
                 ;; Reset UI state
                 (swap! app-state update :ui merge {:theme :dark})
                 ;; Reset Evil state
                 (swap! app-state update :evil-state merge {:mode :normal})
                 (println "New workspace created")))}])
