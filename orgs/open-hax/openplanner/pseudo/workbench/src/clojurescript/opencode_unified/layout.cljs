(ns opencode-unified.layout
  (:require [reagent.core :as r]
            [opencode-unified.state :as state]
            [opencode-unified.buffers :as buffers]
            [opencode-unified.opencode :as opencode]
            [opencode-unified.workspace :as workspace]
            [opencode-unified.command-palette :as command-palette]
            [opencode-unified.persistence :as persistence]
            [clojure.string :as str]))

;; --- Persistence Keys ---
(def KEY_LEFT_PANE_WIDTH "workbench.layout.leftPaneWidth")
(def KEY_SESSIONS_PANE_WIDTH "workbench.layout.sessionsPaneWidth")
(def KEY_RIGHT_PANE_WIDTH "workbench.layout.rightPaneWidth")
(def KEY_INSPECTOR_VISIBLE "workbench.layout.inspectorVisible")
(def KEY_SESSIONS_VISIBLE "workbench.layout.sessionsVisible")
(def KEY_COMPACT_MODE "settings.compactMode")

(def ROUTE_HOME "#/")
(def ROUTE_DOCS "#/workflow/docs")
(def ROUTE_SETTINGS "#/workflow/settings")

(declare testid-safe)

(defn navigate-route! [route]
  (set! (.-hash js/location) route))

;; --- Resizable Pane Component ---
(defn resizable-pane [{:keys [min-width max-width on-resize direction children]}]
  (let [dragging? (r/atom false)
        start-x (r/atom 0)
        start-width (r/atom 0)]
    (r/create-class
     {:component-did-mount
      (fn []
        (let [handle-move (fn [e]
                            (when @dragging?
                              (.preventDefault e)
                              (let [dx (- (.-clientX e) @start-x)
                                    new-width (if (= direction :left)
                                                (+ @start-width dx)
                                                (- @start-width dx))]
                                (on-resize (max (or min-width 0)
                                                (min (or max-width 10000) new-width))))))
              handle-up (fn []
                          (when @dragging?
                            (reset! dragging? false)
                            (set! (.-cursor (.-style js/document.body)) "")))]
          (.addEventListener js/window "mousemove" handle-move)
          (.addEventListener js/window "mouseup" handle-up)))

      :reagent-render
      (fn [{:keys [width direction class style]}]
        (let [narrow-layout? (< (.-innerWidth js/window) 820)]
          [:div.resizable-pane
           {:class class
            :style (merge {:width width
                           :position "relative"
                           :display "flex"
                           :flex-direction "column"}
                           style)}
           children

           ;; Resize Handle
           (when-not narrow-layout?
             [:div.resize-handle
              {:on-mouse-down (fn [e]
                                (.preventDefault e)
                                (reset! dragging? true)
                                (reset! start-x (.-clientX e))
                                (reset! start-width width)
                                (set! (.-cursor (.-style js/document.body)) "col-resize"))
               :style {:position "absolute"
                       (if (= direction :left) :right :left) -2
                       :top 0
                       :bottom 0
                       :width "3px"
                       :cursor "col-resize"
                       :z-index 2
                       :background-color (if @dragging? "var(--accent)" "transparent")
                       :transition "background-color 0.2s"}}])]))})))

;; --- Workflow Nav (Activity Bar) ---
(defn workflow-nav [route]
  [:div.workflow-nav
   {:style {:width "48px"
            :background-color "var(--bg-tertiary)"
            :border-right "1px solid var(--border)"
            :display "flex"
            :flex-direction "column"
            :align-items "center"
            :padding-top "10px"
            :gap "10px"}}
   (for [{:keys [id label icon target-route]} [{:id "workflow-nav-home"
                                                :label "Workflow"
                                                :icon "📁"
                                                :target-route ROUTE_HOME}
                                               {:id "workflow-nav-docs"
                                                :label "Docs"
                                                :icon "📄"
                                                :target-route ROUTE_DOCS}
                                               {:id "workflow-nav-settings"
                                                :label "Settings"
                                                :icon "⚙"
                                                :target-route ROUTE_SETTINGS}]]
     (let [active? (= route target-route)]
       ^{:key id}
       [:button.nav-item
        {:type "button"
         :data-testid id
         :title label
         :on-click #(navigate-route! target-route)
         :style {:width "32px"
                 :height "32px"
                 :display "flex"
                 :align-items "center"
                 :justify-content "center"
                 :cursor "pointer"
                 :border "none"
                 :border-left (if active? "2px solid var(--accent)" "2px solid transparent")
                 :background-color (if active? "var(--bg-selection)" "transparent")
                 :color (if active? "var(--text-primary)" "var(--text-dim)")
                 :padding 0
                 :font-size "1rem"}}
        icon]))])

(defn docs-route []
  (let [activity-items (r/track state/get-activity-items)]
    (fn []
      (let [docs (->> @activity-items
                      (filter (fn [item]
                                (or (= (:kind item) "docs")
                                    (str/includes? (str/lower-case (or (:title item) "")) "doc"))))
                      vec)]
        [:div
         {:data-testid "workflow-docs-route"
          :style {:height "100%"
                  :overflow-y "auto"
                  :padding "1rem"
                  :background "var(--bg-primary)"
                  :display "flex"
                  :flex-direction "column"
                  :gap "0.8rem"}}
         [:div
          [:h2 {:style {:margin "0 0 0.25rem"
                        :font-size "1rem"
                        :font-weight "600"
                        :color "var(--text-primary)"}}
           "Workflow Documents"]
          [:p {:style {:margin 0
                       :font-size "0.82rem"
                       :color "var(--text-secondary)"}}
           "Documents inferred from current OpenPlanner activity."]]
         (if (seq docs)
           (for [{:keys [id title time source]} docs]
             ^{:key id}
             [:div
              {:data-testid "workflow-doc-item"
               :style {:display "grid"
                       :grid-template-columns "minmax(0, 1fr) auto"
                       :gap "0.5rem"
                       :align-items "center"
                       :padding "0.65rem 0.75rem"
                       :border "1px solid var(--border)"
                       :border-radius "6px"
                       :background "var(--bg-secondary)"}}
              [:div
               [:div {:style {:font-size "0.86rem"
                              :font-weight "600"
                              :color "var(--text-primary)"}}
                title]
               [:div {:style {:font-size "0.75rem"
                              :color "var(--text-secondary)"}}
                (str "source " (or source "openplanner") " • " (or time "updated recently"))]]
              [:span
               {:style {:font-size "0.72rem"
                        :text-transform "uppercase"
                        :letter-spacing "0.04em"
                        :padding "0.2rem 0.45rem"
                        :border-radius "999px"
                        :color "var(--success)"
                        :border "1px solid var(--success)"}}
               "live"]])
           [:div
            {:data-testid "workflow-doc-empty"
             :style {:padding "0.8rem"
                     :border "1px dashed var(--border)"
                     :border-radius "6px"
                     :color "var(--text-secondary)"
                     :font-size "0.82rem"}}
            "No document events available yet."]) ]))))

(defn settings-route []
  (let [compact-mode? (r/atom (persistence/load-state KEY_COMPACT_MODE false))]
    (fn []
      [:div
       {:data-testid "workflow-settings-route"
        :style {:height "100%"
                :overflow-y "auto"
                :padding "1rem"
                :background "var(--bg-primary)"
                :display "flex"
                :flex-direction "column"
                :gap "0.8rem"}}
       [:div
        [:h2 {:style {:margin "0 0 0.25rem"
                      :font-size "1rem"
                      :font-weight "600"
                      :color "var(--text-primary)"}}
         "Workflow Settings"]
        [:p {:style {:margin 0
                     :font-size "0.82rem"
                     :color "var(--text-secondary)"}}
         "Shell preferences persist locally for operator continuity."]]
       [:div
        {:style {:display "flex"
                 :align-items "center"
                 :justify-content "space-between"
                 :padding "0.65rem 0.75rem"
                 :border "1px solid var(--border)"
                 :border-radius "6px"
                 :background "var(--bg-secondary)"
                 :gap "0.75rem"}}
        [:div
         [:div {:style {:font-size "0.86rem"
                        :font-weight "600"
                        :color "var(--text-primary)"}}
          "Compact operator density"]
         [:div {:style {:font-size "0.75rem"
                        :color "var(--text-secondary)"}}
          "Tightens spacing for high-throughput workflow sessions."]]
        [:label
         {:style {:display "flex"
                  :align-items "center"
                  :gap "0.4rem"
                  :font-size "0.75rem"
                  :color "var(--text-secondary)"
                  :cursor "pointer"}}
         [:input
          {:type "checkbox"
           :data-testid "settings-compact-mode-toggle"
           :checked @compact-mode?
           :on-change (fn [event]
                        (let [checked? (.. event -target -checked)]
                          (reset! compact-mode? checked?)
                          (persistence/save-state! KEY_COMPACT_MODE checked?)))}]
         "Enabled"]]
       [:div
        {:data-testid "settings-compact-mode-value"
         :style {:font-size "0.78rem"
                 :color "var(--text-dim)"}}
        (str "compact-mode=" @compact-mode?)]])))

;; --- Header component with menu bar ---
(defn header []
  [:div.header
   {:style {:background-color "var(--bg-secondary)"
            :border-bottom "1px solid var(--border)"
            :padding "0 1rem"
            :display "flex"
            :align-items "center"
            :justify-content "space-between"
            :height "35px"}} ;; Dense height

   ;; App title and menu
   [:div.header-left
    {:style {:display "flex"
             :align-items "center"
             :gap "1rem"}}

    [:h1.app-title
     {:style {:margin 0
              :font-size "0.9rem"
              :font-weight "600"
              :color "var(--text-primary)"}}
     "Opencode"]

    [:nav.menu-bar
     {:style {:display "flex"
              :gap "0.25rem"}}

     (for [{:keys [label on-click]} [{:label "File"
                                      :on-click #(buffers/save-current-buffer)}
                                      {:label "Edit"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "Edit actions available via command palette")}
                                      {:label "View"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "View actions available via command palette")}
                                      {:label "Go"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "Go actions available via command palette")}
                                      {:label "Run"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "Run actions available via command palette")}
                                      {:label "Terminal"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "Terminal actions available via command palette")}
                                      {:label "Help"
                                       :on-click #(state/update-statusbar! "NORMAL" "" "Help available in docs route and command palette")}]]
        ^{:key label}
        [:button.menu-item
         {:on-click on-click
          :data-testid (str "menu-" (str/lower-case label))
          :style {:background "none"
                  :border "none"
                  :color "var(--text-secondary)"
                  :padding "0.15rem 0.5rem"
                  :cursor "pointer"
                  :font-size "0.8rem"
                  :border-radius "3px"}}
         label])]]

   ;; Window controls
   [:div.header-right
    {:style {:display "flex"
             :align-items "center"
             :gap "0.5rem"}}

    [:button.window-control
     {:on-click #(js/window.close)
      :style {:background "none"
              :border "none"
              :color "var(--text-secondary)"
              :padding "0.25rem"
              :cursor "pointer"}}
     "×"]]])

;; --- Left sidebar with file tree ---
(defn left-sidebar []
  (let [tree-data (r/atom {})
        loading-paths (r/atom #{})
        error-by-path (r/atom {})
        expanded-paths (r/atom #{"."})
        workspace-root (r/atom ".")]
    (letfn [(load-directory! [directory-path force?]
              (when (or force? (nil? (get @tree-data directory-path)))
                (swap! loading-paths conj directory-path)
                (-> (workspace/list-directory directory-path)
                    (.then (fn [result]
                             (swap! tree-data assoc directory-path (vec (:entries result)))
                             (swap! error-by-path dissoc directory-path)
                             (when (= directory-path ".")
                               (reset! workspace-root (or (:root result) ".")))))
                    (.catch (fn [error]
                              (swap! error-by-path assoc directory-path
                                     (or (.-message error) (str error)))))
                    (.then (fn [_]
                             (swap! loading-paths disj directory-path))))))
            (toggle-directory! [directory-path]
              (if (contains? @expanded-paths directory-path)
                (swap! expanded-paths disj directory-path)
                (do
                  (swap! expanded-paths conj directory-path)
                  (load-directory! directory-path false))))
            (render-directory [directory-path depth]
              (let [entries (get @tree-data directory-path [])
                    directory-loading? (contains? @loading-paths directory-path)
                    directory-error (get @error-by-path directory-path)]
                [:div
                 (when directory-loading?
                   [:div
                    {:style {:padding (str "0.1rem 0 0.1rem " (+ 0.35 (* depth 0.9)) "rem")
                             :font-size "0.72rem"
                             :color "var(--text-dim)"}}
                    "Loading..."])
                 (when directory-error
                   [:div
                    {:style {:padding (str "0.1rem 0 0.1rem " (+ 0.35 (* depth 0.9)) "rem")
                             :font-size "0.72rem"
                             :color "var(--danger)"}}
                    directory-error])
                 (for [entry entries]
                   ^{:key (:path entry)}
                   (if (= (:type entry) "directory")
                     [:div
                      [:div.file-item
                       {:data-testid (str "workspace-dir-" (testid-safe (:path entry)))
                        :on-click #(toggle-directory! (:path entry))
                        :style {:padding (str "0.15rem 0 0.15rem " (+ 0.35 (* depth 0.9)) "rem")
                                :cursor "pointer"
                                :color "var(--text-secondary)"
                                :display "flex"
                                :align-items "center"
                                :gap "4px"
                                :font-size "0.82rem"}}
                       [:span (if (contains? @expanded-paths (:path entry)) "v" ">")]
                       [:span (:name entry)]]
                      (when (contains? @expanded-paths (:path entry))
                        (render-directory (:path entry) (inc depth)))]
                     [:div.file-item
                      {:data-testid (str "workspace-file-" (testid-safe (:path entry)))
                       :on-click #(buffers/open-file (:path entry))
                       :style {:padding (str "0.15rem 0 0.15rem " (+ 1.4 (* depth 0.9)) "rem")
                               :cursor "pointer"
                               :color "var(--text-primary)"
                               :font-size "0.82rem"
                               :white-space "nowrap"
                               :overflow "hidden"
                               :text-overflow "ellipsis"}}
                      (:name entry)]))]))]
      (r/create-class
       {:component-did-mount
        (fn []
          (load-directory! "." true))
        :reagent-render
        (fn []
          [:div.left-sidebar
           {:style {:height "100%"
                    :display (if (< (.-innerWidth js/window) 820) "none" "block")
                    :background-color "var(--bg-secondary)"
                    :padding "0.5rem"
                    :overflow-y "auto"}}

           [:div.sidebar-section
            [:div
             {:style {:display "flex"
                      :align-items "center"
                      :justify-content "space-between"
                      :gap "0.35rem"
                      :margin-bottom "0.45rem"}}
             [:h3.sidebar-title
              {:style {:margin 0
                       :font-size "0.8rem"
                       :text-transform "uppercase"
                       :letter-spacing "0.5px"
                       :color "var(--text-dim)"}}
              "Explorer"]
             [:button
              {:type "button"
               :data-testid "workspace-refresh"
               :on-click #(load-directory! "." true)
               :style {:background "none"
                       :border "1px solid var(--border)"
                       :border-radius "4px"
                       :color "var(--text-secondary)"
                       :padding "0.1rem 0.35rem"
                       :font-size "0.7rem"
                       :cursor "pointer"}}
              "Refresh"]]
            [:div
             {:data-testid "workspace-root"
              :style {:font-size "0.72rem"
                      :color "var(--text-dim)"
                      :margin-bottom "0.35rem"
                      :word-break "break-all"}}
             (str "root: " @workspace-root)]
             [:div.file-tree
              {:style {:font-size "0.85rem"}}
              (render-directory "." 0)]]])}))))

;; --- Tab bar ---
(defn tab-bar []
  (let [buffers (:buffers @state/app-state)
        current-buffer-id (:current-buffer @state/app-state)]
    [:div.tab-bar
     {:style {:background-color "var(--bg-primary)"
              :display "flex"
              :overflow-x "auto"
              :height "32px"}}

      (for [[buffer-id buffer] buffers]
        ^{:key buffer-id}
        [:div.tab
         {:class (when (= buffer-id current-buffer-id) "active")
          :on-click #(state/set-current-buffer! buffer-id)
          :style {:display "flex"
                  :align-items "center"
                  :padding "0 1rem"
                 :background-color (if (= buffer-id current-buffer-id)
                                     "var(--bg-primary)"
                                     "var(--bg-secondary)")
                 :border-right "1px solid var(--border)"
                 :border-top (if (= buffer-id current-buffer-id)
                               "2px solid var(--accent)"
                               "2px solid transparent")
                 :cursor "pointer"
                 :min-width "120px"
                 :font-size "0.85rem"
                 :color (if (= buffer-id current-buffer-id)
                          "var(--text-primary)"
                          "var(--text-secondary)")}}

        [:span.tab-name
         {:style {:margin-right "0.5rem"
                  :white-space "nowrap"
                  :overflow "hidden"
                  :text-overflow "ellipsis"}}
         (:name buffer)]

        (when (:modified? buffer)
          [:span.modified-indicator
           {:style {:color "var(--accent)"}}
           "●"])

        [:button.tab-close
         {:on-click (fn [e]
                      (.stopPropagation e)
                      (buffers/close-buffer buffer-id))
          :style {:background "none"
                  :border "none"
                  :color "var(--text-secondary)"
                  :padding "0.25rem"
                  :cursor "pointer"
                  :border-radius "2px"
                  :margin-left "0.5rem"}}
         "×"]])]))

(defn- testid-safe [value]
  (-> (if (keyword? value) (str (namespace value) "-" (name value)) (str value))
      (str/lower-case)
      (str/replace #"[^a-z0-9]+" "-")
      (str/replace #"(^-+|-+$)" "")
      (str/replace #"^-" "")))

(defn- selection-result-testid [item]
  (str "result-select-"
       (testid-safe (or (:type item) "item"))
       "-"
       (testid-safe (or (:id item) (:title item) "unknown"))))

(defn- session-id-of [item]
  (or (:session-id item) (:session item)))

(defn- session-item? [item]
  (boolean (session-id-of item)))

(defn- session-title-of [item]
  (or (:session-title item) (:title item) "OpenCode Session"))

(defn- open-session-in-chat! [item]
  (if-let [session-id (session-id-of item)]
    (-> (opencode/use-session! session-id)
        (.then (fn [result]
                 (if-let [error (:error result)]
                   (state/update-statusbar! "NORMAL" "" (str "Failed to open session in chat: " error))
                   (state/update-statusbar! "NORMAL" "" (str "Opened session " session-id " in chat"))))))
    (state/update-statusbar! "NORMAL" "" "Selected item has no session ID")))

(defn- open-session-in-inspector! [item sorted-items]
  (state/set-inspector-selection!
   item
   (remove (fn [candidate] (= (:id candidate) (:id item))) sorted-items)))

(defn- pinned-tab-testid [entity-key]
  (str "inspector-compare-tab-" (testid-safe entity-key)))

(defn- pinned-card-testid [entity-key]
  (str "inspector-compare-card-" (testid-safe entity-key)))

;; --- Inspector Pane ---
(defn inspector-pane []
  (let [inspector-state (r/track state/get-inspector-state)]
    (fn []
      (let [{:keys [selection context pane-error pinned active-pinned-key]} @inspector-state
            pinned-entities (or pinned [])
            active-pinned (when active-pinned-key
                            (some #(when (= (:key %) active-pinned-key) %) pinned-entities))
            active-selection (or (:selection active-pinned) selection)
            active-context (or (:context active-pinned) context)
            details (or active-selection {:title "No selection"
                                          :type :info
                                          :time ""
                                          :timestamp nil})
            current-key (when active-selection (state/inspector-entity-key active-selection))
            pinned-current? (and current-key (state/inspector-entity-pinned? current-key))]
        [:div.inspector-pane
         {:data-testid "inspector-pane"
          :style {:height "100%"
                  :background-color "var(--bg-secondary)"
                  :display "flex"
                  :flex-direction "column"
                  :overflow "hidden"}}

         [:div.sidebar-section
          {:style {:display "flex"
                   :flex-direction "column"
                   :height "100%"}}

           [:div.inspector-sticky-header
            {:data-testid "inspector-sticky-header"
            :style {:position "sticky"
                    :top 0
                    :z-index 1
                    :padding "0.75rem"
                    :background "var(--bg-secondary)"
                    :border-bottom "1px solid var(--border)"}}
            [:h3.sidebar-title
            {:style {:margin 0
                     :font-size "0.8rem"
                     :text-transform "uppercase"
                     :letter-spacing "0.5px"
                     :color "var(--text-dim)"}}
             "Inspector"]
            [:div
             {:style {:margin-top "0.6rem"
                      :display "flex"
                      :align-items "center"
                      :gap "0.4rem"
                      :flex-wrap "wrap"}}
             [:button
              {:type "button"
               :data-testid "inspector-pin-action"
               :on-click #(state/pin-selected-inspector-entity!)
               :disabled (nil? selection)
               :style {:padding "0.22rem 0.5rem"
                       :border "1px solid var(--border)"
                       :border-radius "4px"
                       :font-size "0.74rem"
                       :background (if pinned-current? "var(--bg-selection)" "var(--bg-primary)")
                       :color "var(--text-primary)"
                       :cursor (if selection "pointer" "not-allowed")
                       :opacity (if selection 1 0.7)}}
              (if pinned-current? "Pinned" "Pin current")]
             (when active-pinned
               [:button
                {:type "button"
                 :data-testid "inspector-unpin-active"
                 :on-click #(state/unpin-inspector-entity! (:key active-pinned))
                 :style {:padding "0.22rem 0.5rem"
                         :border "1px solid var(--border)"
                         :border-radius "4px"
                         :font-size "0.74rem"
                         :background "var(--bg-primary)"
                         :color "var(--text-secondary)"
                         :cursor "pointer"}}
                "Unpin active"])]
            (when (seq pinned-entities)
              [:div
               {:data-testid "inspector-compare-tabs"
                :style {:margin-top "0.6rem"
                        :display "flex"
                        :gap "0.35rem"
                        :overflow-x "auto"
                        :padding-bottom "0.15rem"}}
               (for [entry pinned-entities]
                 (let [entry-selection (:selection entry)
                       entry-key (:key entry)
                       active? (= entry-key active-pinned-key)]
                   ^{:key entry-key}
                   [:button
                    {:type "button"
                     :data-testid (pinned-tab-testid entry-key)
                     :on-click #(state/set-active-inspector-pinned! entry-key)
                     :style {:padding "0.24rem 0.5rem"
                             :border "1px solid var(--border)"
                             :border-radius "999px"
                             :background (if active? "var(--bg-selection)" "var(--bg-primary)")
                             :color "var(--text-primary)"
                             :font-size "0.72rem"
                             :cursor "pointer"
                             :white-space "nowrap"}}
                    (or (:title entry-selection) "Untitled")]))])
            [:div
             {:data-testid "inspector-selection-title"
              :style {:margin-top "0.5rem"
                     :font-size "0.85rem"
                     :font-weight "600"
                     :color "var(--text-primary)"}}
            (:title details)]
           (when-let [item-type (:type details)]
             [:div
              {:style {:margin-top "0.25rem"
                       :font-size "0.75rem"
                       :color "var(--text-secondary)"
                       :text-transform "capitalize"}}
              (name item-type)])]

            [:div.inspector-content
            {:style {:font-size "0.85rem"
                     :color "var(--text-secondary)"
                     :padding "0.75rem"
                     :overflow-y "auto"
                     :display "flex"
                     :flex-direction "column"
                     :gap "0.75rem"}}
            (when pane-error
              [:div
               {:data-testid "inspector-pane-error"
                :style {:display "flex"
                        :align-items "center"
                        :justify-content "space-between"
                        :gap "0.6rem"
                        :padding "0.55rem 0.6rem"
                        :border "1px solid rgba(255, 0, 0, 0.28)"
                        :border-radius "6px"
                        :background "rgba(90, 0, 0, 0.22)"
                        :color "var(--text-primary)"}}
               [:div
                {:data-testid "inspector-pane-error-message"
                 :style {:font-size "0.76rem"}}
                (:message pane-error)]
               [:button
                {:type "button"
                 :data-testid "inspector-pane-error-retry"
                 :on-click #(state/retry-inspector-context!)
                 :style {:padding "0.2rem 0.5rem"
                         :border "1px solid var(--border)"
                         :border-radius "4px"
                         :font-size "0.72rem"
                         :background "var(--bg-primary)"
                         :color "var(--text-primary)"
                         :cursor "pointer"}}
                "Retry"]])
            (if active-selection
              [:div
               {:style {:display "flex"
                        :flex-direction "column"
                        :gap "0.75rem"}}
               (when (seq pinned-entities)
                 [:div
                  {:data-testid "inspector-compare-cards"
                   :style {:display "grid"
                           :gap "0.45rem"
                           :grid-template-columns "1fr"}}
                  (for [entry pinned-entities]
                    (let [entry-selection (:selection entry)
                          entry-context (:context entry)
                          entry-key (:key entry)
                          active? (= entry-key active-pinned-key)]
                      ^{:key entry-key}
                      [:div
                       {:data-testid (pinned-card-testid entry-key)
                        :style {:padding "0.55rem"
                                :border "1px solid var(--border)"
                                :border-radius "6px"
                                :background (if active? "var(--bg-selection)" "var(--bg-tertiary)")
                                :display "flex"
                                :justify-content "space-between"
                                :align-items "center"
                                :gap "0.4rem"}}
                       [:div
                        [:div {:style {:font-size "0.76rem"
                                       :color "var(--text-primary)"
                                       :font-weight "600"}}
                         (or (:title entry-selection) "Untitled")]
                        [:div {:style {:font-size "0.68rem"
                                       :color "var(--text-secondary)"}}
                         (str "Context " (count (or entry-context [])))]]
                       [:button
                        {:type "button"
                         :data-testid (str (pinned-card-testid entry-key) "-open")
                         :on-click #(state/set-active-inspector-pinned! entry-key)
                         :style {:padding "0.2rem 0.45rem"
                                 :border "1px solid var(--border)"
                                 :border-radius "4px"
                                 :font-size "0.7rem"
                                 :background "var(--bg-primary)"
                                 :color "var(--text-primary)"
                                 :cursor "pointer"}}
                        (if active? "Viewing" "View")]]))])
               [:div
                {:data-testid "inspector-detail"
                 :style {:padding "0.75rem"
                        :border "1px solid var(--border)"
                        :border-radius "6px"
                        :background "var(--bg-tertiary)"}}
                [:div {:style {:font-size "0.75rem" :color "var(--text-dim)"}} "Detail"]
                [:div {:style {:margin-top "0.5rem" :color "var(--text-primary)" :font-weight "600"}}
                 (or (:title active-selection) "")]
                (when-let [text (:text active-selection)]
                  [:div {:style {:margin-top "0.75rem" 
                                 :color "var(--text-secondary)"
                                 :white-space "pre-wrap"
                                 :font-family "monospace"
                                 :font-size "0.8rem"
                                 :max-height "300px"
                                 :overflow-y "auto"
                                 :padding "0.5rem"
                                 :background "var(--bg-primary)"
                                 :border "1px solid var(--border)"
                                 :border-radius "4px"}}
                   text])
                 (when-let [time-value (:time active-selection)]
                  [:div {:style {:margin-top "0.5rem" :font-size "0.75rem"}}
                   (str "Observed " time-value)])]
               [:div
                {:data-testid "inspector-context"
                :style {:padding "0.75rem"
                        :border "1px solid var(--border)"
                        :border-radius "6px"
                        :background "var(--bg-tertiary)"}}
               [:div {:style {:font-size "0.75rem" :color "var(--text-dim)"}} "Context"]
                (if (seq active-context)
                  (for [ctx-item active-context]
                    ^{:key (:id ctx-item)}
                    [:div
                     {:style {:margin-top "0.5rem"
                             :padding "0.5rem"
                             :border-radius "4px"
                             :background "var(--bg-primary)"
                             :color "var(--text-secondary)"
                             :font-size "0.8rem"}}
                    (:title ctx-item)])
                 [:div {:style {:margin-top "0.5rem" :font-size "0.8rem"}} "No related context"])]]
             [:p {:data-testid "inspector-empty"}
              "Select an item to inspect details and context."])]]]))))

;; --- Status bar ---
(defn status-bar []
  (let [left-text (r/track #(clojure.string/upper-case (name (get-in @state/app-state [:evil-state :mode]))))
        center-text (r/track #(get-in @state/app-state [:statusbar :center]))
        right-text (r/track #(str "Evil Mode - " (name (get-in @state/app-state [:evil-state :mode]))))]
    [:div.status-bar
     {:style {:background-color "var(--accent)"
              :display "flex"
              :justify-content "space-between"
              :align-items "center"
              :padding "0 0.5rem"
              :height "22px"
              :font-size "0.75rem"
              :color "var(--bg-primary)"
              :font-weight "600"}}

     ;; Left section
     [:div.status-left
      {:data-testid "mode-indicator"}
      @left-text]

     ;; Center section
     [:div.status-center
      @center-text]

     ;; Right section
     [:div.status-right
      @right-text]]))

;; --- Which-key popup ---
(defn which-key-popup []
  (let [which-key-state (:which-key @state/app-state)]
    [:div.which-key-popup
     {:class (when (:active which-key-state) "visible")
      :style {:position "fixed"
              :bottom "30px"
              :left "50%"
              :transform "translateX(-50%)"
              :background-color "var(--bg-tertiary)"
              :border "1px solid var(--border)"
              :border-radius "4px"
              :padding "0.5rem"
              :box-shadow "0 4px 12px rgba(0, 0, 0, 0.3)"
              :z-index 1000
              :min-width "300px"
              :opacity (if (:active which-key-state) 1 0)
              :visibility (if (:active which-key-state) "visible" "hidden")
              :transition "all 0.1s ease-in-out"}}

     [:div.which-key-title
      {:style {:margin "0 0 0.5rem 0"
               :font-size "0.8rem"
               :color "var(--text-primary)"
               :font-weight "600"}}
      (str "Prefix: " (str/join " " (:prefix which-key-state)))]

     [:div.which-key-bindings
      {:style {:font-size "0.8rem"}}

      ;; Sample bindings
      [:div.binding-row
       {:style {:display "flex"
                :justify-content "space-between"
                :padding "0.15rem 0"}}
       [:span.key {:style {:color "var(--accent)"}} "f"] [:span.desc "File"]]

      [:div.binding-row
       {:style {:display "flex"
                :justify-content "space-between"
                :padding "0.15rem 0"}}
       [:span.key {:style {:color "var(--accent)"}} "b"] [:span.desc "Buffer"]]

      [:div.binding-row
       {:style {:display "flex"
                :justify-content "space-between"
                :padding "0.15rem 0"}}
       [:span.key {:style {:color "var(--accent)"}} "w"] [:span.desc "Window"]]]]))

;; --- Command palette ---
(defn command-palette []
  [command-palette/command-palette])

;; --- Minimap ---
(defn minimap [buffer]
  (when buffer
    [:div.minimap
     {:style {:width "100px"
              :background-color "var(--bg-primary)"
              :border-left "1px solid var(--border)"
              :padding "0.25rem"
              :overflow-y "auto"
              :font-size "0.5rem"
              :color "var(--text-dim)"
              :line-height "1.2"}}

     (for [line (take 50 (str/split-lines (:content buffer)))]
       ^{:key line}
       [:div.minimap-line
        {:style {:white-space "nowrap"
                 :overflow "hidden"
                 :text-overflow "ellipsis"}}
         (or line "")])]))

(defn- paginate-items [items page page-size]
  (let [safe-page (max 1 page)
        safe-size (max 1 page-size)
        offset (* (dec safe-page) safe-size)]
    (->> items
         (drop offset)
         (take safe-size))))

(defn- pagination-controls [page total-pages]
  (when (> total-pages 1)
    [:div
     {:data-testid "pagination-controls"
      :style {:display "flex"
              :justify-content "center"
              :align-items "center"
              :gap "0.75rem"
              :padding "0.75rem"
              :border-top "1px solid var(--border)"
              :background "var(--bg-secondary)"}}
     [:button
      {:data-testid "pagination-prev"
       :on-click #(state/set-search-page! (dec page))
       :disabled (<= page 1)
       :style {:padding "0.35rem 0.6rem"
               :border-radius "4px"
               :border "1px solid var(--border)"
               :cursor (if (<= page 1) "not-allowed" "pointer")
               :color (if (<= page 1) "var(--text-dim)" "var(--text-primary)")
               :background "var(--bg-primary)"}}
      "Previous"]
     [:span
      {:data-testid "pagination-status"
       :style {:font-size "0.8rem" :color "var(--text-secondary)"}}
      (str "Page " page " of " total-pages)]
     [:button
      {:data-testid "pagination-next"
       :on-click #(state/set-search-page! (inc page))
       :disabled (>= page total-pages)
       :style {:padding "0.35rem 0.6rem"
               :border-radius "4px"
               :border "1px solid var(--border)"
               :cursor (if (>= page total-pages) "not-allowed" "pointer")
               :color (if (>= page total-pages) "var(--text-dim)" "var(--text-primary)")
               :background "var(--bg-primary)"}}
      "Next"]]))

(defn- chatgpt-import-panel []
  (let [import-state (r/track state/get-chatgpt-import-state)]
    (fn []
      (let [{:keys [file-path status error job]} @import-state
            processed (get-in job [:output :processed])]
        [:div
         {:data-testid "chatgpt-import-panel"
          :style {:margin-bottom "0.75rem"
                  :padding "0.65rem"
                  :border "1px solid var(--border)"
                  :border-radius "6px"
                  :background "var(--bg-secondary)"
                  :display "flex"
                  :flex-direction "column"
                  :gap "0.45rem"}}
         [:div
          {:style {:font-size "0.78rem"
                   :font-weight "600"
                   :color "var(--text-primary)"}}
          "ChatGPT Import (OpenPlanner)"]
         [:div
          {:style {:display "flex"
                   :gap "0.45rem"
                   :align-items "center"}}
          [:input
           {:data-testid "chatgpt-import-file-path"
            :value (or file-path "")
            :on-change #(state/set-chatgpt-import-file-path! (.. % -target -value))
            :placeholder "/absolute/path/to/chatgpt-export.zip"
            :style {:flex "1"
                    :padding "0.35rem 0.5rem"
                    :border "1px solid var(--border)"
                    :border-radius "4px"
                    :background "var(--bg-primary)"
                    :color "var(--text-primary)"
                    :font-size "0.75rem"}}]
          [:button
           {:type "button"
            :data-testid "chatgpt-import-start"
            :on-click #(state/start-chatgpt-import! file-path)
            :style {:padding "0.36rem 0.55rem"
                    :border "1px solid var(--border)"
                    :border-radius "4px"
                    :background "var(--bg-primary)"
                    :color "var(--text-primary)"
                    :cursor "pointer"
                    :font-size "0.74rem"}}
           "Start import"]]
         [:div
          {:data-testid "chatgpt-import-status"
           :style {:font-size "0.72rem"
                   :color "var(--text-secondary)"}}
          (str "status=" (name (or status :idle))
               (when processed (str " • processed=" processed)))]
         (when error
           [:div
            {:data-testid "chatgpt-import-error"
             :style {:font-size "0.72rem"
                     :color "var(--danger)"}}
            error])]))))

;; --- Activity List ---
(defn activity-list [items query filter-type view-mode page page-size]
  (let [normalized-query (str/lower-case (or query ""))
        filtered-items (->> items
                            (filter (fn [item]
                                      (let [matches-filter? (or (= filter-type :all)
                                                                (= (:type item) filter-type))
                                            title (str/lower-case (or (:title item) ""))
                                            matches-query? (or (str/blank? normalized-query)
                                                               (str/includes? title normalized-query))]
                                        (and matches-filter? matches-query?)))))
        sorted-items (sort-by (juxt (fn [item] (if (= (:type item) :error) 0 1))
                                    (comp - :timestamp))
                              filtered-items)
        total-items (count sorted-items)
        total-pages (max 1 (js/Math.ceil (/ total-items (max 1 page-size))))
        visible-page (min page total-pages)
        page-items (paginate-items sorted-items visible-page page-size)]
    [:div.activity-list
     {:style {:display "flex" :flex-direction "column" :gap "0.5rem" :height "100%"}}
     
     [:div
      {:style {:display "flex"
               :justify-content "space-between"
               :align-items "center"
               :gap "0.5rem"
               :margin-bottom "0.5rem"
               :padding "0.5rem"}}
      [:div.activity-filters
       {:style {:display "flex" :gap "0.5rem"}}
       (for [f [:all :error :info]]
         ^{:key f}
         [:button.filter-btn
          {:on-click #(state/set-search-filter! (if (= f :all) :all f))
           :data-testid (str "filter-" (name f))
           :style {:background (if (or (= filter-type f)
                                       (and (= filter-type :all) (= f :all)))
                                 "var(--bg-selection)" "transparent")
                   :border "1px solid var(--border)"
                   :border-radius "4px"
                   :padding "0.25rem 0.5rem"
                   :cursor "pointer"
                   :color "var(--text-primary)"
                   :font-size "0.8rem"
                   :text-transform "capitalize"}}
          (name f)])]
      [:div.view-toggle
       {:data-testid "view-toggle"
        :style {:display "flex" :gap "0.35rem"}}
       (for [[view-key label] [[:list "List"] [:table "Table"]]]
         ^{:key (name view-key)}
         [:button
          {:data-testid (str "view-toggle-" (name view-key))
           :on-click #(state/set-search-view! view-key)
           :style {:padding "0.25rem 0.5rem"
                   :border "1px solid var(--border)"
                   :border-radius "4px"
                   :font-size "0.75rem"
                   :cursor "pointer"
                   :background (if (= view-mode view-key) "var(--bg-selection)" "var(--bg-primary)")
                   :color "var(--text-primary)"}}
          label])]]

     ;; List
     (if (empty? page-items)
       [:div.no-results 
        {:style {:padding "1rem" :text-align "center" :color "var(--text-dim)"}}
        "No activity found"]
        (if (= view-mode :table)
          [:div
           {:style {:display "grid"
                    :grid-template-columns "minmax(0, 1fr) auto"
                    :gap "0.25rem"
                    :padding "0.5rem"}}
           (for [item page-items]
             ^{:key (:id item)}
             [:<>
              [:button
                {:data-testid "result-item"
                 :data-select-testid (selection-result-testid item)
                 :on-click #(if (session-item? item)
                              (open-session-in-chat! item)
                              (open-session-in-inspector! item sorted-items))
                :style {:text-align "left"
                        :padding "0.6rem"
                        :border "1px solid var(--border)"
                        :border-radius "4px"
                        :background "var(--bg-primary)"
                        :color "var(--text-primary)"
                        :cursor "pointer"}}
               (if (session-item? item)
                 [:div
                  {:style {:display "flex" :flex-direction "column" :gap "0.25rem"}}
                  [:span
                   {:style {:font-weight "600" :color "var(--text-primary)"}}
                   (session-title-of item)]
                   [:span
                    {:style {:font-size "0.7rem"
                             :color "var(--text-dim)"
                             :background "var(--bg-tertiary)"
                             :padding "0.1rem 0.35rem"
                             :border-radius "999px"
                             :display "inline-flex"
                             :width "fit-content"}}
                    (session-id-of item)]]
                  [:div
                   {:style {:display "flex" :flex-direction "column" :gap "0.25rem"}}
                   [:span {:style {:font-weight "500"}} (:title item)]
                   (when (:snippet item)
                     [:span {:style {:font-size "0.75rem" :color "var(--text-secondary)"
                                     :white-space "nowrap" :overflow "hidden" :text-overflow "ellipsis"}}
                      (:snippet item)])])]
              [:div
               {:style {:font-size "0.75rem"
                        :color "var(--text-dim)"
                        :align-self "center"
                        :padding-right "0.25rem"
                        :display "flex"
                        :align-items "center"
                        :gap "0.35rem"}}
               (when (session-item? item)
                 [:button
                  {:type "button"
                   :data-testid "result-open-inspector"
                   :on-click (fn [e]
                               (.preventDefault e)
                               (.stopPropagation e)
                               (open-session-in-inspector! item sorted-items))
                   :style {:padding "0.2rem 0.35rem"
                           :font-size "0.68rem"
                           :border "1px solid var(--border)"
                           :border-radius "4px"
                           :background "var(--bg-secondary)"
                           :color "var(--text-secondary)"
                           :cursor "pointer"}}
                  "Inspector"])
               (:time item)]])]
          (for [item page-items]
            ^{:key (:id item)}
             [:div.result-item
              {:data-testid (if (= (:type item) :error) "result-error" "result-item")
               :data-select-testid (selection-result-testid item)
               :on-click #(if (session-item? item)
                            (open-session-in-chat! item)
                            (open-session-in-inspector! item sorted-items))
              :style {:padding "0.75rem"
                      :border-radius "4px"
                      :cursor "pointer"
                      :display "flex"
                     :align-items "center"
                     :gap "0.75rem"
                     :background-color (if (= (:type item) :error) "rgba(255, 0, 0, 0.1)" "transparent")
                     :border (if (= (:type item) :error) "1px solid rgba(255, 0, 0, 0.2)" "1px solid transparent")}}

            [:div.result-icon
             {:style {:font-size "1.2rem"}}
             (case (:type item)
               :error "🔴"
               :info "🔵"
               "•")]

              [:div.result-content
               {:style {:flex "1"}}
               [:div.result-title
                {:style {:font-weight "500" :color "var(--text-primary)"}}
                (if (session-item? item)
                  (session-title-of item)
                  (:title item))]
               (when (session-item? item)
                 [:div
                  {:style {:font-size "0.7rem"
                           :color "var(--text-dim)"
                           :margin-top "0.25rem"
                           :display "inline-flex"
                           :background "var(--bg-tertiary)"
                           :padding "0.08rem 0.35rem"
                           :border-radius "999px"}}
                  (session-id-of item)])
               (when (and (:snippet item) (not (session-item? item)))
                 [:div.result-snippet
                  {:style {:font-size "0.8rem"
                           :color "var(--text-secondary)"
                           :margin-top "0.35rem"
                           :white-space "pre-wrap"
                           :display "-webkit-box"
                           :-webkit-line-clamp "3"
                           :-webkit-box-orient "vertical"
                           :overflow "hidden"}}
                  (:snippet item)])
               [:div.result-time
                {:style {:font-size "0.8rem" :color "var(--text-dim)" :margin-top "0.25rem"}}
                (:time item)]]
             (when (session-item? item)
               [:button
                {:type "button"
                 :data-testid "result-open-inspector"
                 :on-click (fn [e]
                             (.preventDefault e)
                             (.stopPropagation e)
                             (open-session-in-inspector! item sorted-items))
                 :style {:padding "0.2rem 0.4rem"
                         :font-size "0.68rem"
                         :border "1px solid var(--border)"
                         :border-radius "4px"
                         :background "var(--bg-secondary)"
                         :color "var(--text-secondary)"
                         :cursor "pointer"}}
                "Inspector"])]))
        )

     [pagination-controls visible-page total-pages]]))

;; --- Search Content ---
(defn search-content []
  (let [search-state (r/track state/get-search-state)
        activity-items (r/track state/get-activity-items)]
    (fn []
       (let [query (:query @search-state)
             active-tab (:active-tab @search-state)
             filter-type (:filter @search-state :all)
             view-mode (:view @search-state :list)
             page (:page @search-state 1)
              page-size (:page-size @search-state 10)
             
              other-results (let [items @activity-items]
                              (case active-tab
                                :docs (->> items
                                           (filter (fn [item]
                                                     (or (= (:kind item) "docs")
                                                         (str/includes? (str/lower-case (or (:title item) "")) "doc"))))
                                           (map-indexed (fn [idx item]
                                                          {:id (or (:id item) (str "doc-" idx))
                                                           :type :doc
                                                           :title (:title item)
                                                           :desc (or (:snippet item) (:source item))}))
                                           vec)
                                :memories (->> items
                                               (filter (fn [item]
                                                         (or (= (:kind item) "memory")
                                                             (= (:kind item) "vector.result")
                                                             (str/includes? (str/lower-case (or (:title item) "")) "memory"))))
                                               (map-indexed (fn [idx item]
                                                              {:id (or (:id item) (str "memory-" idx))
                                                               :type :memory
                                                               :title (:title item)
                                                               :desc (or (:snippet item) (:source item))}))
                                               vec)
                                :tools (->> items
                                            (filter (fn [item]
                                                      (or (= (:kind item) "tool")
                                                          (str/includes? (str/lower-case (or (:title item) "")) "tool"))))
                                            (map-indexed (fn [idx item]
                                                           {:id (or (:id item) (str "tool-" idx))
                                                            :type :tool
                                                            :title (:title item)
                                                            :desc (or (:snippet item) (:source item))}))
                                            vec)
                                 []))
              semantic-results (if (= active-tab :semantic)
                                 @activity-items
                                 [])
              searched-other-results (if (str/blank? query)
                                       other-results
                                       (filter #(str/includes? (str/lower-case (:title %))
                                                               (str/lower-case query))
                                               other-results))
             total-other-pages (max 1 (js/Math.ceil (/ (count searched-other-results) (max 1 page-size))))
             visible-other-page (min page total-other-pages)
             paged-other-results (paginate-items searched-other-results visible-other-page page-size)]

        [:div.search-content
         {:data-testid "activity-view"
          :style {:display "flex"
                  :flex-direction "column"
                  :height "100%"
                  :background-color "var(--bg-tertiary)"}}

          ;; Search Input
          [:div.search-header
           {:style {:padding "0.75rem"
                    :border-bottom "1px solid var(--border)"}}
           [:input.search-input
            {:value query
             :data-testid "search-input"
             :on-change #(state/set-search-query! (-> % .-target .-value))
             :placeholder "Search..."
             :auto-focus true
             :style {:width "100%"
                     :padding "0.5rem"
                     :border "1px solid var(--border)"
                     :border-radius "4px"
                     :background-color "var(--bg-primary)"
                     :color "var(--text-primary)"
                      :font-size "0.9rem"
                      :outline "none"}}]]

          (when-let [backend-state (get-in @state/app-state [:ui :backend :openplanner])]
            [:div
             {:data-testid "openplanner-backend-status"
              :style {:margin-top "0.5rem"
                      :font-size "0.72rem"
                      :color (if (:connected? backend-state) "var(--success)" "var(--warning)")}}
             (if (:connected? backend-state)
               (str "OpenPlanner: connected" (when-let [endpoint (:endpoint backend-state)] (str " (" endpoint ")")))
               (str "OpenPlanner: disconnected"
                    (when-let [backend-error (:last-error backend-state)]
                      (str " • " backend-error))))])

          ;; Tabs
          [:div.search-tabs
           {:data-testid "search-tabs"
            :style {:display "flex"
                    :padding "0 1rem"
                    :border-bottom "1px solid var(--border)"
                    :background-color "var(--bg-secondary)"}}
           
           (for [tab [:sessions :semantic :docs :memories :tools]]
             ^{:key tab}
             [:div.search-tab
              {:data-testid (str "tab-" (name tab))
               :on-click #(state/set-search-tab! tab)
               :style {:padding "0.5rem 0.75rem"
                       :cursor "pointer"
                       :font-size "0.8rem"
                       :color (if (= active-tab tab) "var(--accent)" "var(--text-secondary)")
                       :border-bottom (if (= active-tab tab) "2px solid var(--accent)" "2px solid transparent")
                       :font-weight (if (= active-tab tab) "600" "400")
                       :text-transform "capitalize"}}
              (name tab)])]

          ;; Results
            [:div.search-results
             {:data-testid "search-results"
              :style {:padding "0.5rem"
                      :overflow-y "auto"
                      :flex "1"}}

             (when (= active-tab :tools)
               [chatgpt-import-panel])
            
            (if (or (= active-tab :sessions) (= active-tab :semantic))
              [activity-list @activity-items (if (= active-tab :semantic) "" query) filter-type view-mode page page-size]
              
              ;; Render other results
              (if (empty? paged-other-results)
               [:div.no-results
                {:style {:padding "2rem" :text-align "center" :color "var(--text-dim)"}}
                "No results found"]
               
               (for [item paged-other-results]
                 ^{:key (:id item)}
                  [:div.result-item
                   {:data-testid "result-item"
                    :data-select-testid (selection-result-testid item)
                    :on-click #(state/set-inspector-selection!
                                item
                                (remove (fn [candidate] (= (:id candidate) (:id item))) searched-other-results))
                   :style {:padding "0.75rem"
                           :margin "0.25rem 0"
                           :border-radius "4px"
                          :cursor "pointer"
                          :display "flex"
                          :align-items "center"
                          :gap "0.75rem"
                          :border "1px solid transparent"}}
                 
                 [:div.result-icon
                  {:style {:font-size "1.2rem"}}
                  (case (:type item)
                    :doc "📄"
                    :memory "🧠"
                    :tool "🔧"
                    "•")]
                 
                 [:div.result-content
                  {:style {:flex "1"}}
                   [:div.result-title
                    {:style {:font-weight "500" :color "var(--text-primary)"}}
                    (:title item)]
                   (when (:desc item)
                     [:div.result-desc
                      {:style {:font-size "0.85rem" :color "var(--text-secondary)"}}
                      (:desc item)])]])))

            (when (not (contains? #{:sessions :semantic} active-tab))
              [pagination-controls visible-other-page total-other-pages])]]))))

;; --- Search Surface ---
(defn search-surface []
  (let [search-state (r/track state/get-search-state)]
    (fn []
      (let [visible? (:visible? @search-state)]
        [:div.search-surface-modal
         {:class (when visible? "visible")
          :data-testid "search-surface"
          :style {:position "fixed"
                  :top "15%"
                  :left "50%"
                  :transform "translateX(-50%)"
                  :background-color "var(--bg-tertiary)"
                  :border "1px solid var(--border)"
                  :border-radius "6px"
                  :box-shadow "0 12px 32px rgba(0, 0, 0, 0.5)"
                  :z-index 2000
                  :width "600px"
                  :max-height "500px"
                  :display "flex"
                  :flex-direction "column"
                  :opacity (if visible? 1 0)
                  :visibility (if visible? "visible" "hidden")
                  :transition "all 0.1s ease-in-out"}}
         
         [search-content]]))))

(defonce layout-state
  (r/atom {:left-pane-width (persistence/load-state KEY_LEFT_PANE_WIDTH 220)
           :sessions-pane-width (persistence/load-state KEY_SESSIONS_PANE_WIDTH 350)
           :right-pane-width (persistence/load-state KEY_RIGHT_PANE_WIDTH 300)
           :sessions-visible? (persistence/load-state KEY_SESSIONS_VISIBLE true)
           :inspector-visible? (persistence/load-state KEY_INSPECTOR_VISIBLE true)}))

(defn toggle-sessions-pane! []
  (let [new-val (not (:sessions-visible? @layout-state))]
    (swap! layout-state assoc :sessions-visible? new-val)
    (persistence/save-state! KEY_SESSIONS_VISIBLE new-val)))

(defn toggle-inspector-pane! []
  (let [new-val (not (:inspector-visible? @layout-state))]
    (swap! layout-state assoc :inspector-visible? new-val)
    (persistence/save-state! KEY_INSPECTOR_VISIBLE new-val)))

;; --- Unified Shell ---
(defn shell [_route _children]
  (fn [route children]
    (let [{:keys [left-pane-width sessions-pane-width right-pane-width sessions-visible? inspector-visible?]} @layout-state
          viewport-width (.-innerWidth js/window)
          compact-layout? (< viewport-width 1100)
          narrow-layout? (< viewport-width 820)
          show-left-pane? (not narrow-layout?)
          show-sessions-pane? (and sessions-visible? (not narrow-layout?))
          show-right-pane? (and inspector-visible? (not compact-layout?))]
      [:div.shell
       {:role "application"
        :tabIndex "0"
        :style {:display "flex"
                :flex-direction "column"
                :height "100vh"
                :width "100vw"
                :background-color "var(--bg-primary)"
                :color "var(--text-primary)"}}
      
       [header]
      
       [:div.workspace
        {:style {:display "flex"
                 :flex "1"
                 :overflow "hidden"}}
       
        ;; 1. Workflow Nav (Activity Bar)
        [workflow-nav route]
       
        ;; 2. Left Pane (Explorer)
        (when show-left-pane?
          [resizable-pane
           {:width (if compact-layout?
                     (min left-pane-width 200)
                     left-pane-width)
            :min-width 150
            :max-width (if compact-layout? 250 400)
            :direction :left
            :on-resize (fn [w]
                         (swap! layout-state assoc :left-pane-width w)
                         (persistence/save-state! KEY_LEFT_PANE_WIDTH w))
            :style {:border-right "1px solid var(--border)"}
            :children [left-sidebar]}])
        
        ;; 2.5 Middle Pane (Sessions/Activity)
        (when show-sessions-pane?
          [resizable-pane
           {:width (if compact-layout?
                     (min sessions-pane-width 300)
                     sessions-pane-width)
            :min-width 250
            :max-width (if compact-layout? 400 600)
            :direction :left
            :on-resize (fn [w]
                         (swap! layout-state assoc :sessions-pane-width w)
                         (persistence/save-state! KEY_SESSIONS_PANE_WIDTH w))
            :style {:border-right "1px solid var(--border)"}
            :children [search-content]}])
       
        ;; 3. Main Area (Editor)
        [:div.main-area
         {:style {:flex "1"
                  :display "flex"
                  :flex-direction "column"
                  :min-width "0" ;; Prevent flex overflow
                  :background-color "var(--bg-primary)"}}
         children]
       
        ;; 4. Inspector Pane (Right)
        (when show-right-pane?
          [resizable-pane
           {:width right-pane-width
            :min-width 200
            :max-width 600
            :direction :right
            :on-resize (fn [w]
                         (swap! layout-state assoc :right-pane-width w)
                         (persistence/save-state! KEY_RIGHT_PANE_WIDTH w))
            :style {:border-left "1px solid var(--border)"}
            :children [inspector-pane]}])]
      
       [status-bar]
       [which-key-popup]
       [command-palette]
       [search-surface]])))

(defn layout-commands []
  [{:id "layout.toggle-sessions"
    :title "Toggle Sessions Pane"
    :description "Show/hide the sessions and activity side pane"
    :handler (fn []
               (toggle-sessions-pane!)
               (command-palette/close!)
               {:success true})}
   {:id "layout.toggle-inspector"
    :title "Toggle Inspector Pane"
    :description "Show/hide the right inspector side pane"
    :handler (fn []
               (toggle-inspector-pane!)
               (command-palette/close!)
               {:success true})}])
