(ns opencode-unified.ui
  (:require [reagent.core :as r]
            [reagent.dom.client :as rdomc]
            [opencode-unified.state :as state]
            [opencode-unified.layout :as layout]
            [opencode-unified.buffers :as buffers]
            [opencode-unified.opencode :as opencode]
            [opencode-unified.command-palette :as command-palette]
            [opencode-unified.react-reagent-seam :as seam]
            [opencode-unified.theme :as theme]
            [opencode-unified.persistence :as persistence]
            [clojure.string :as str]))

(def KEY_ROUTE "workbench.route")

(defonce current-route (r/atom (persistence/load-state KEY_ROUTE "#/")))

(defonce route-listener-installed? (atom false))

(defonce ui-root (atom nil))

(defonce chat-draft (r/atom ""))
(defonce chat-session-draft (r/atom ""))
(defonce prompt-response-drafts (r/atom {}))
(defonce chat-scroll-node (atom nil))

(defn scroll-chat-to-bottom! []
  (when-let [node @chat-scroll-node]
    (set! (.-scrollTop node) (.-scrollHeight node))))

(defn- send-chat-draft! []
  (let [message (str/trim @chat-draft)]
    (when-not (str/blank? message)
      (reset! chat-draft "")
      (opencode/send-session-message message))))

(defn chat-stream-panel []
  (let [op-state (r/track opencode/get-opencode-state)]
    ;; Scroll to bottom after render when chat-stream changes
    (r/after-render #(scroll-chat-to-bottom!))
    (fn []
      (let [{:keys [chat-stream chat-pending? connected? session-id last-error]} @op-state]
        [:section
         {:data-testid "opencode-chat-stream-panel"
          :style {:display "flex"
                  :flex-direction "column"
                  :min-height "140px"
                  :max-height "240px"
                  :border-top "1px solid var(--border)"
                  :border-bottom "1px solid var(--border)"
                  :background "var(--bg-secondary)"
                  :overflow "hidden"}}
         [:div
          {:style {:display "flex"
                   :justify-content "space-between"
                   :align-items "center"
                   :padding "0.45rem 0.7rem"
                   :font-size "0.78rem"
                   :color "var(--text-secondary)"
                   :border-bottom "1px solid var(--border)"}}
          [:span (str "Chat Stream"
                       (when session-id
                         (str " • session " session-id))) ]
          [:span
           {:style {:color (if connected? "var(--success)" "var(--warning)")}}
           (if connected? "connected" "disconnected")]]
         [:div
          {:data-testid "opencode-chat-stream"
           :ref #(when % (reset! chat-scroll-node %))
           :style {:flex "1"
                   :overflow-y "auto"
                   :padding "0.6rem 0.7rem"
                   :display "flex"
                   :flex-direction "column"
                   :gap "0.45rem"}}
          (if (seq chat-stream)
            (for [{:keys [id role text]} chat-stream]
              ^{:key id}
              [:div
               {:style {:align-self (if (= role :user) "flex-end" "flex-start")
                        :max-width "86%"
                        :border "1px solid var(--border)"
                        :border-radius "6px"
                        :background (if (= role :user) "var(--bg-tertiary)" "var(--bg-primary)")
                        :padding "0.45rem 0.55rem"}}
               [:div
                {:style {:font-size "0.7rem"
                         :text-transform "uppercase"
                         :letter-spacing "0.03em"
                         :margin-bottom "0.2rem"
                         :color "var(--text-dim)"}}
                (name role)]
               [:div
                {:style {:font-size "0.82rem"
                         :line-height "1.35"
                         :white-space "pre-wrap"
                         :word-break "break-word"
                         :color "var(--text-primary)"}}
                text]])
            [:div
             {:style {:font-size "0.82rem"
                      :color "var(--text-dim)"}}
             "No messages yet. The first message creates a session."])
          (when chat-pending?
            [:div
             {:style {:font-size "0.78rem"
                      :color "var(--text-secondary)"}}
             "Sending message..."])
          (when (and last-error (not (str/blank? last-error)))
            [:div
             {:style {:font-size "0.78rem"
                      :color "var(--error)"}}
             last-error])]]))))

(defn- chat-input-panel []
  (let [op-state (r/track opencode/get-opencode-state)
        inspector-state (r/track state/get-inspector-state)]
    (fn []
      (let [{:keys [chat-pending? session-id]} @op-state
            selection (:selection @inspector-state)
            selected-session (or (:session selection) (:session-id selection))]
        [:section
         {:data-testid "opencode-chat-input-panel"
          :style {:display "flex"
                  :flex-direction "column"
                  :gap "0.4rem"
                  :padding "0.55rem 0.7rem"
                  :background "var(--bg-primary)"}}
         [:div
          {:style {:display "grid"
                   :grid-template-columns "1fr auto auto"
                   :gap "0.45rem"
                   :align-items "center"}}
          [:input
           {:data-testid "opencode-chat-session-input"
            :value @chat-session-draft
            :placeholder (or session-id "Session ID")
            :on-change #(reset! chat-session-draft (.. % -target -value))
            :on-key-down (fn [event]
                           (when (= "Enter" (.-key event))
                             (.preventDefault event)
                             (-> (opencode/use-session! (if (str/blank? (str/trim @chat-session-draft))
                                                          session-id
                                                          @chat-session-draft))
                                 (.then (fn [result]
                                          (when (:success result)
                                            (reset! chat-session-draft "")))))))
            :disabled chat-pending?
            :style {:padding "0.35rem 0.45rem"
                    :font-size "0.78rem"
                    :border "1px solid var(--border)"
                    :border-radius "4px"
                    :background "var(--bg-secondary)"
                    :color "var(--text-primary)"}}]
          [:button
           {:data-testid "opencode-chat-use-session"
            :on-click #(-> (opencode/use-session! (if (str/blank? (str/trim @chat-session-draft))
                                                    session-id
                                                    @chat-session-draft))
                           (.then (fn [result]
                                    (when (:success result)
                                      (reset! chat-session-draft "")))))
            :disabled (or chat-pending?
                          (str/blank? (str/trim (or @chat-session-draft session-id))))
            :style {:padding "0.35rem 0.5rem"
                    :font-size "0.75rem"
                    :border "1px solid var(--border)"
                    :background "var(--bg-secondary)"
                    :color "var(--text-secondary)"
                    :border-radius "4px"
                    :cursor "pointer"}}
           "Use session"]
          [:button
           {:data-testid "opencode-chat-use-selected-session"
            :on-click #(when selected-session
                         (-> (opencode/use-session! selected-session)
                             (.then (fn [result]
                                      (when (:success result)
                                        (reset! chat-session-draft ""))))))
            :disabled (or chat-pending? (str/blank? (str (or selected-session ""))))
            :style {:padding "0.35rem 0.5rem"
                    :font-size "0.75rem"
                    :border "1px solid var(--border)"
                    :background "var(--bg-secondary)"
                    :color "var(--text-secondary)"
                    :border-radius "4px"
                    :cursor "pointer"}}
           "Use selected"]]
         [:div
          {:style {:font-size "0.78rem"
                   :color "var(--text-secondary)"}}
          "Chat Input"]
         [:textarea
          {:data-testid "opencode-chat-input"
           :value @chat-draft
           :placeholder "Send a message to the current OpenCode session..."
           :on-change #(reset! chat-draft (.. % -target -value))
           :on-key-down (fn [event]
                          (when (and (= "Enter" (.-key event))
                                     (not (.-shiftKey event)))
                            (.preventDefault event)
                            (send-chat-draft!)))
           :disabled chat-pending?
           :style {:min-height "58px"
                   :max-height "120px"
                   :resize "vertical"
                   :padding "0.55rem"
                   :font-family "monospace"
                   :font-size "0.84rem"
                   :line-height "1.35"
                   :border "1px solid var(--border)"
                   :border-radius "6px"
                   :background "var(--bg-secondary)"
                   :color "var(--text-primary)"}}]
         [:div
          {:style {:display "flex"
                   :justify-content "space-between"
                   :align-items "center"
                   :gap "0.5rem"}}
          [:button
           {:data-testid "opencode-chat-clear"
            :on-click opencode/clear-chat-stream!
            :disabled chat-pending?
            :style {:padding "0.35rem 0.55rem"
                    :font-size "0.78rem"
                    :border "1px solid var(--border)"
                    :background "transparent"
                    :color "var(--text-secondary)"
                    :border-radius "4px"
                    :cursor "pointer"}}
           "Clear stream"]
          [:button
           {:data-testid "opencode-chat-send"
            :on-click #(send-chat-draft!)
            :disabled (or chat-pending? (str/blank? (str/trim @chat-draft)))
            :style {:padding "0.35rem 0.65rem"
                    :font-size "0.78rem"
                    :border "1px solid var(--accent)"
                    :background "var(--accent)"
                    :color "var(--bg-primary)"
                    :border-radius "4px"
                    :cursor "pointer"}}
           (if chat-pending? "Sending..." "Send")]]]))))

(defn- prompts-panel []
  (let [op-state (r/track opencode/get-opencode-state)]
    (fn []
      (let [{:keys [pending-permissions pending-prompts]} @op-state
            permissions (vals (or pending-permissions {}))
            prompts (or pending-prompts [])]
        (when (or (seq permissions) (seq prompts))
          (into
           [:section
            {:data-testid "opencode-prompts-panel"
             :style {:display "flex"
                     :flex-direction "column"
                     :gap "0.5rem"
                     :padding "0.6rem 0.7rem"
                     :border-bottom "1px solid var(--border)"
                     :background "var(--bg-secondary)"}}
            [:div
             {:style {:font-size "0.78rem" :color "var(--text-secondary)"}}
             "Pending input requests"]]
           (concat
            (for [{:keys [id title sessionID metadata]} permissions]
              ^{:key (str "permission-" id)}
              [:div
               {:data-testid "opencode-permission-prompt"
                :style {:border "1px solid var(--border)"
                        :background "var(--bg-primary)"
                        :border-radius "6px"
                        :padding "0.5rem"
                        :display "flex"
                        :flex-direction "column"
                        :gap "0.4rem"}}
               [:div
                {:style {:font-size "0.82rem" :font-weight "600" :color "var(--text-primary)"}}
                (or title "Permission request")]
               [:div
                {:style {:font-size "0.72rem" :color "var(--text-dim)"}}
                (str "session " sessionID)]
               (when (seq metadata)
                 [:pre
                  {:style {:margin "0"
                           :white-space "pre-wrap"
                           :font-size "0.72rem"
                           :color "var(--text-secondary)"
                           :background "var(--bg-tertiary)"
                           :padding "0.35rem"
                           :border-radius "4px"}}
                  (pr-str metadata)])
               [:div
                {:style {:display "flex" :gap "0.35rem" :flex-wrap "wrap"}}
                [:button
                 {:on-click #(opencode/respond-to-permission! id :once)
                  :style {:padding "0.25rem 0.45rem"
                          :font-size "0.74rem"
                          :border "1px solid var(--border)"
                          :border-radius "4px"
                          :background "var(--bg-secondary)"
                          :color "var(--text-secondary)"
                          :cursor "pointer"}}
                 "Allow Once"]
                [:button
                 {:on-click #(opencode/respond-to-permission! id :always)
                  :style {:padding "0.25rem 0.45rem"
                          :font-size "0.74rem"
                          :border "1px solid var(--success)"
                          :border-radius "4px"
                          :background "var(--success)"
                          :color "var(--bg-primary)"
                          :cursor "pointer"}}
                 "Always Allow"]
                [:button
                 {:on-click #(opencode/respond-to-permission! id :reject)
                  :style {:padding "0.25rem 0.45rem"
                          :font-size "0.74rem"
                          :border "1px solid var(--error)"
                          :border-radius "4px"
                          :background "var(--error)"
                          :color "var(--bg-primary)"
                          :cursor "pointer"}}
                 "Reject"]]])
            (for [{:keys [id title body]} prompts]
              ^{:key (str "prompt-" id)}
              [:div
               {:data-testid "opencode-control-prompt"
                :style {:border "1px solid var(--border)"
                        :background "var(--bg-primary)"
                        :border-radius "6px"
                        :padding "0.5rem"
                        :display "flex"
                        :flex-direction "column"
                        :gap "0.4rem"}}
               [:div
                {:style {:font-size "0.82rem" :font-weight "600" :color "var(--text-primary)"}}
                (or title "Input requested")]
               (when (and (map? body) (seq body))
                 [:pre
                  {:style {:margin "0"
                           :white-space "pre-wrap"
                           :font-size "0.72rem"
                           :color "var(--text-secondary)"
                           :background "var(--bg-tertiary)"
                           :padding "0.35rem"
                           :border-radius "4px"}}
                  (pr-str body)])
               [:div
                {:style {:display "flex" :gap "0.35rem" :align-items "center"}}
                [:input
                 {:value (get @prompt-response-drafts id "")
                  :placeholder "Type response..."
                  :on-change #(swap! prompt-response-drafts assoc id (.. % -target -value))
                  :on-key-down (fn [event]
                                 (when (= "Enter" (.-key event))
                                   (.preventDefault event)
                                   (let [response (str/trim (get @prompt-response-drafts id ""))]
                                     (when-not (str/blank? response)
                                       (-> (opencode/respond-to-control-prompt! id response)
                                           (.then (fn [result]
                                                    (when (:success result)
                                                      (swap! prompt-response-drafts dissoc id)))))))))
                  :style {:flex "1"
                          :padding "0.3rem 0.45rem"
                          :font-size "0.75rem"
                          :border "1px solid var(--border)"
                          :border-radius "4px"
                          :background "var(--bg-secondary)"
                          :color "var(--text-primary)"}}]
                [:button
                 {:on-click #(let [response (str/trim (get @prompt-response-drafts id ""))]
                               (when-not (str/blank? response)
                                 (-> (opencode/respond-to-control-prompt! id response)
                                     (.then (fn [result]
                                              (when (:success result)
                                                (swap! prompt-response-drafts dissoc id)))))))
                  :disabled (str/blank? (str/trim (get @prompt-response-drafts id "")))
                  :style {:padding "0.25rem 0.45rem"
                          :font-size "0.74rem"
                          :border "1px solid var(--accent)"
                          :border-radius "4px"
                          :background "var(--accent)"
                          :color "var(--bg-primary)"
                          :cursor "pointer"}}
                 "Submit"]]]))))))))

(defn- sync-route!
  "Sync browser hash into reagent route state."
  []
  (let [hash-value (.-hash js/location)
        route (if (str/blank? hash-value) "#/" hash-value)]
    (reset! current-route route)
    (persistence/save-state! KEY_ROUTE route)))

(defn- seam-enabled?
  "Feature flag gate for the React host donor seam route."
  []
  (let [flags (some-> js/window (aget "__OPENCODE_FEATURE_FLAGS__"))]
    (not= false (some-> flags (aget "reactReagentSeam")))))

(defn- donor-fallback-route []
  [:div
   {:data-testid "donor-fallback-route"
    :style {:display "flex"
            :flex-direction "column"
            :height "100%"
            :overflow "hidden"
            :background "var(--bg-primary)"}}
   [:div
    {:data-testid "donor-fallback-banner"
     :style {:padding "0.75rem 1rem"
             :font-size "0.8rem"
             :color "var(--text-secondary)"
             :border-bottom "1px solid var(--border)"
             :background "var(--bg-secondary)"}}
    "React seam disabled by feature flag. Donor fallback route is active."]
   [:div.no-buffer
    {:style {:display "flex"
             :flex-direction "column"
             :height "100%"
             :overflow "hidden"}}
    [layout/search-content]]])

;; Main app component
(defn app []
  (let [buffer-content (r/track #(when-let [buffer-id (:current-buffer @state/app-state)]
                                   (get-in @state/app-state [:buffers buffer-id])))]
    
    [:div
     [theme/global-styles]
     
      (if (and (seam/spike-route? @current-route)
               (seam-enabled?))
        [seam/react-host-route]
        (if (seam/spike-route? @current-route)
          [layout/shell
           @current-route
           [donor-fallback-route]]

          ;; Unified Shell Layout
          [layout/shell
           @current-route
           (cond
             (= @current-route layout/ROUTE_DOCS)
             [layout/docs-route]

             (= @current-route layout/ROUTE_SETTINGS)
             [layout/settings-route]

             :else
              [:div.editor-area
               {:style {:display "flex"
                        :flex-direction "column"
                       :flex "1"
                       :height "100%"
                       :overflow "hidden"}}

              ;; Tab bar
              [layout/tab-bar]

              ;; Editor pane
              [:div.editor-pane
               {:style {:flex "1"
                        :display "flex"
                        :overflow "hidden"
                        :position "relative"}}

                 (if @buffer-content
                   [opencode-unified.buffers/editor @buffer-content]
                   [:div.no-buffer
                    {:style {:display "flex"
                             :flex-direction "column"
                             :height "100%"
                             :align-items "center"
                             :justify-content "center"
                             :color "var(--text-dim)"
                             :background "var(--bg-primary)"}}
                    [:div {:style {:font-size "3rem" :margin-bottom "1rem" :opacity 0.2}} "⌘"]
                    [:div {:style {:font-size "1.1rem"}} "OpenCode Unified Workbench"]
                    [:div {:style {:font-size "0.85rem" :margin-top "0.5rem" :opacity 0.6}}
                     "Select a session or file to begin work."]])]

                [chat-stream-panel]
                [prompts-panel]
                [chat-input-panel]

               ;; Minimap (if enabled)
               (when (get-in @state/app-state [:ui :minimap])
                 [layout/minimap @buffer-content])])]))]))

;; Initialize app
(defn init []
  (println "Initializing UI...")

  ;; Restore route from persistence if hash is empty
  (when (str/blank? (.-hash js/location))
    (set! (.-hash js/location) @current-route))

  (sync-route!)
  (when-not @route-listener-installed?
    (.addEventListener js/window "hashchange" sync-route!)
    (reset! route-listener-installed? true))

  ;; Keep action palette semantics on Ctrl/Cmd+P.
  (let [handle-keydown (fn [event]
                         (let [key (str/lower-case (.-key event))
                               mod? (or (.-ctrlKey event) (.-metaKey event))]
                            (when (and mod? (or (= key "p") (= key "k")))
                              (.preventDefault event)
                               (.stopPropagation event)
                               (.stopImmediatePropagation event)
                                (if (= key "p")
                                  (command-palette/handle-open-key!)
                                  (state/open-search-surface!))))) ]
    (.addEventListener js/window "keydown" handle-keydown true))

  ;; Initialize OpenPlanner-backed activity feed.
  (state/bootstrap-openplanner!)

  ;; Register layout commands
  (command-palette/register-commands! (layout/layout-commands))

  ;; Mount the React app
  (when-let [app-element (.getElementById js/document "app")]
    (let [root (rdomc/create-root app-element)]
      (rdomc/render root (r/as-element [app]))
      (reset! ui-root root)))

  (println "UI initialized with unified shell"))

;; Hot module replacement support
(defn ^:export reload []
  (println "Hot reloading UI...")
  (when-let [root @ui-root]
    (rdomc/render root (r/as-element [app]))))

(defn ^:export clear []
  (println "Clearing UI...")
  (when-let [root ^js @ui-root]
    (.unmount root)
    (reset! ui-root nil)))
