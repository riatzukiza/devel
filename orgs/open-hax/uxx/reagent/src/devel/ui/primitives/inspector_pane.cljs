(ns devel.ui.primitives.inspector-pane
  "InspectorPane component implementing the inspector-pane.edn contract.
   
   Story 3.1: Core implementation with selection, detail view, error state, and empty state.
   Story 3.2: Context panel showing related entities.
   Story 3.3: Pin & Compare functionality.
   
   A panel for inspecting selected entities with context, detail view, and comparison support.
   
   Usage:
   ```clojure
   [inspector-pane
    {:selection @selected-entity
     :context @context-entities
     :pinned @pinned-entities
     :active-pinned-key @active-key
     :on-pin #(pin-entity! %)
     :on-unpin #(unpin-entity! %)
     :on-set-active #(set-active! %)
     :error @error-state
     :on-retry #(retry-load!)}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :entity - {:id string, :key string?, :title string, :type keyword?, :text string?, :time string?, :timestamp number?, :metadata object?}
;; :pinned-entry - {:key string, :selection entity, :context array}
;; :error-state - {:message string, :retryable boolean}

(def ^:private max-pinned 5)

(defn- get-entity-key
  "Get a stable key for an entity."
  [entity]
  (or (:key entity) (:id entity) (str entity)))

(defn- render-empty-state
  "Render empty state when no selection."
  []
  [:div
   {:data-testid "inspector-empty"
    :style {:padding (str (get tokens/spacing 4) "px")
            :text-align "center"
            :color (get-in tokens/colors [:text :muted])
            :font-size (get-in tokens/typography [:bodySm :font-size])}}
   "Select an item to inspect details and context."])

(defn- render-error-state
  "Render error state with retry button."
  [{:keys [message retryable] :or {retryable true}}
   on-retry]
  [:div
   {:data-testid "inspector-pane-error"
    :style {:display "flex"
            :align-items "center"
            :justify-content "space-between"
            :gap (str (get tokens/spacing 2) "px")
            :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 2) "px")
            :border (str "1px solid " (get-in tokens/colors [:accent :pink] "#f92672"))
            :border-radius (str (get tokens/spacing 1) "px")
            :background "rgba(249, 38, 114, 0.1)"
            :color (get-in tokens/colors [:text :default])}}
   [:div
    {:data-testid "inspector-pane-error-message"
     :style {:font-size (get-in tokens/typography [:bodySm :font-size])
             :flex "1"}}
    message]
   (when (and retryable on-retry)
     [:button
      {:type "button"
       :data-testid "inspector-pane-error-retry"
       :on-click on-retry
       :style {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
               :border (str "1px solid " (get-in tokens/colors [:border :default]))
               :border-radius (str (get tokens/spacing 0.5) "px")
               :font-size (get-in tokens/typography [:bodySm :font-size])
               :background (get-in tokens/colors [:background :default])
               :color (get-in tokens/colors [:text :default])
               :cursor "pointer"}}
      "Retry"])])

(defn- render-detail-view
  "Render entity detail view."
  [{:keys [title type text time timestamp] :as entity}
   render-detail]
  (if render-detail
    ;; Custom renderer
    (render-detail entity)
    ;; Default detail view
    [:div
     {:data-testid "inspector-detail"
      :style {:padding (str (get tokens/spacing 3) "px")
              :border (str "1px solid " (get-in tokens/colors [:border :default]))
              :border-radius (str (get tokens/spacing 1) "px")
              :background (get-in tokens/colors [:background :elevated])}}
     [:div
      {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
               :color (get-in tokens/colors [:text :muted])
               :margin-bottom (str (get tokens/spacing 1) "px")}}
      "Detail"]
     [:div
      {:style {:font-size (get-in tokens/typography [:body :font-size])
               :font-weight (:medium tokens/font-weight)
               :color (get-in tokens/colors [:text :default])
               :margin-bottom (str (get tokens/spacing 2) "px")}}
      (or title "")]
     (when type
       [:div
        {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                 :color (get-in tokens/colors [:text :secondary])
                 :text-transform "capitalize"
                 :margin-bottom (str (get tokens/spacing 2) "px")}}
        (name type)])
     (when (and text (not= text ""))
       [:div
        {:style {:color (get-in tokens/colors [:text :secondary])
                 :white-space "pre-wrap"
                 :font-family (:mono tokens/font-family)
                 :font-size (get-in tokens/typography [:bodySm :font-size])
                 :max-height "300px"
                 :overflow-y "auto"
                 :padding (str (get tokens/spacing 2) "px")
                 :background (get-in tokens/colors [:background :default])
                 :border (str "1px solid " (get-in tokens/colors [:border :default]))
                 :border-radius (str (get tokens/spacing 0.5) "px")}}
        text])
     (when time
       [:div
        {:style {:margin-top (str (get tokens/spacing 2) "px")
                 :font-size (get-in tokens/typography [:bodySm :font-size])
                 :color (get-in tokens/colors [:text :muted])}}
        (str "Observed " time)])]))

(defn- render-context-item
  "Render a single context item."
  [entity on-select render-context-item]
  (let [handler (when on-select #(on-select entity))]
    (if render-context-item
      ;; Custom renderer
      [:div.context-item-wrapper
       {:style {:cursor (when on-select "pointer")}
        :on-click handler}
       (render-context-item entity)]
      ;; Default context item
      [:div.context-item
       {:data-testid "inspector-context-item"
        :on-click handler
        :style {:margin-top (str (get tokens/spacing 2) "px")
                :padding (str (get tokens/spacing 2) "px")
                :border-radius (str (get tokens/spacing 0.5) "px")
                :background (get-in tokens/colors [:background :default])
                :color (get-in tokens/colors [:text :secondary])
                :font-size (get-in tokens/typography [:bodySm :font-size])
                :cursor (when on-select "pointer")}
        :class (when on-select "context-item-clickable")}
       (:title entity "Untitled")])))

(defn- render-context-section
  "Render context section showing related entities."
  [context on-context-select render-context-item]
  [:div
   {:data-testid "inspector-context"
    :style {:padding (str (get tokens/spacing 3) "px")
            :border (str "1px solid " (get-in tokens/colors [:border :default]))
            :border-radius (str (get tokens/spacing 1) "px")
            :background (get-in tokens/colors [:background :elevated])}}
   [:div
    {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
             :color (get-in tokens/colors [:text :muted])
             :margin-bottom (str (get tokens/spacing 1) "px")}}
    "Context"]
   (if (seq context)
     (into [:div.context-list]
           (for [entity context]
             ^{:key (or (:id entity) (:key entity) (str entity))}
             [render-context-item entity on-context-select render-context-item]))
     [:div
      {:style {:margin-top (str (get tokens/spacing 2) "px")
               :font-size (get-in tokens/typography [:bodySm :font-size])
               :color (get-in tokens/colors [:text :muted])}}
      "No related context"])])

(defn- render-pinned-tab
  "Render a single pinned entity tab."
  [{:keys [key selection] :as pinned-entry}
   is-active?
   on-set-active
   on-unpin]
  [:div.pinned-tab
   {:data-testid "pinned-tab"
    :data-key key
    :tab-index 0
    :on-click #(when on-set-active (on-set-active key))
    :on-key-down (fn [e]
                   (when (and (= (.-key e) "Delete") is-active? on-unpin)
                     (on-unpin key)))
    :style {:display "inline-flex"
            :align-items "center"
            :gap (str (get tokens/spacing 1) "px")
            :padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
            :border-radius (str (get tokens/spacing 0.5) "px")
            :font-size (get-in tokens/typography [:bodySm :font-size])
            :cursor "pointer"
            :background (if is-active?
                          (get-in tokens/colors [:selection :default] "rgba(117, 113, 94, 0.3)")
                          (get-in tokens/colors [:background :default]))
            :color (if is-active?
                     (get-in tokens/colors [:text :default])
                     (get-in tokens/colors [:text :secondary]))
            :border (str "1px solid " (if is-active?
                                        (get-in tokens/colors [:accent :green] "#a6e22e")
                                        (get-in tokens/colors [:border :default])))}}
   [:span.pinned-tab-title
    {:style {:max-width "100px"
             :overflow "hidden"
             :text-overflow "ellipsis"
             :white-space "nowrap"}}
    (:title selection "Untitled")]
   [:button.pinned-tab-close
    {:type "button"
     :data-testid "pinned-tab-unpin"
     :on-click (fn [e]
                 (.stopPropagation e)
                 (when on-unpin (on-unpin key)))
     :style {:padding "2px 4px"
             :margin-left (str (get tokens/spacing 1) "px")
             :border "none"
             :border-radius "2px"
             :font-size "10px"
             :background "transparent"
             :color (get-in tokens/colors [:text :muted])
             :cursor "pointer"}}
    "×"]])

(defn- render-pinned-tabs-bar
  "Render the pinned tabs bar above the content."
  [pinned active-pinned-key on-set-active on-unpin on-pin selection can-pin?]
  [:div.pinned-tabs-bar
   {:data-testid "pinned-tabs-bar"
    :style {:display "flex"
            :align-items "center"
            :gap (str (get tokens/spacing 1) "px")
            :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
            :border-bottom (str "1px solid " (get-in tokens/colors [:border :default]))
            :flex-wrap "wrap"}}
   (when (seq pinned)
     (into [:div.pinned-tabs
            {:style {:display "flex"
                     :gap (str (get tokens/spacing 1) "px")
                     :flex-wrap "wrap"}}]
           (for [entry pinned]
             ^{:key (:key entry)}
             [render-pinned-tab entry
              (= (:key entry) active-pinned-key)
              on-set-active
              on-unpin])))
   (when (and can-pin? on-pin)
     [:button.pin-button
      {:type "button"
       :data-testid "pin-button"
       :on-click #(on-pin selection)
       :style {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
               :border (str "1px solid " (get-in tokens/colors [:border :default]))
               :border-radius (str (get tokens/spacing 0.5) "px")
               :font-size (get-in tokens/typography [:bodySm :font-size])
               :background "transparent"
               :color (get-in tokens/colors [:text :muted])
               :cursor "pointer"
               :margin-left "auto"}}
      "Pin"])])

(defn inspector-pane
  "Panel for inspecting selected entities.
   
   Story 3.1: Core implementation.
   Story 3.2: Context panel.
   Story 3.3: Pin & Compare.
   
   Props:
   - :selection - entity map, currently selected (optional)
   - :context - array of related entity maps (optional, default: [])
   - :pinned - array of pinned entries {:key string, :selection entity, :context array} (optional, default: [])
   - :active-pinned-key - key of currently active pinned entity (optional)
   - :error - error state map with :message and :retryable (optional)
   - :on-pin - callback to pin selection (optional)
   - :on-unpin - callback to unpin by key (optional)
   - :on-set-active - callback to set active pinned entity (optional)
   - :on-retry - callback for retry button (optional)
   - :on-context-select - callback when context item is clicked (optional)
   - :render-detail - custom renderer for detail view (optional)
   - :render-context-item - custom renderer for context items (optional)
   
   Entity shape:
   {:id string
    :key string (optional)
    :title string
    :type keyword (optional)
    :text string (optional)
    :time string (optional)
    :timestamp number (optional)
    :metadata object (optional)}
   
   Example:
   ```clojure
   [inspector-pane
    {:selection {:id \"1\" :title \"Session 123\" :type :info}
     :context [{:id \"2\" :title \"Related\"}]
     :pinned [{:key \"1\" :selection {:id \"1\" :title \"Session 123\"} :context []}]
     :active-pinned-key \"1\"
     :on-pin #(pin-entity! %)
     :on-unpin #(unpin-entity! %)}]
   ```"
  [{:keys [selection context pinned active-pinned-key error
           on-pin on-unpin on-set-active on-retry on-context-select
           render-detail render-context-item]
    :or {selection nil
         context []
         pinned []
         error nil}
    :as props}]
  (let []
    (fn [{:keys [selection context pinned active-pinned-key error
                 on-pin on-unpin on-set-active on-retry on-context-select
                 render-detail render-context-item]
          :or {selection nil
               context []
               pinned []
               error nil}
          :as props}]
      (let [has-selection? (some? selection)
            has-pinned? (seq pinned)
            ;; Determine what to display: active pinned or current selection
            active-pinned (when (and has-pinned? active-pinned-key)
                            (first (filter #(= (:key %) active-pinned-key) pinned)))
            display-entity (or active-pinned selection)
            display-context (if active-pinned
                              (:context active-pinned [])
                              context)
            ;; Check if we can pin the current selection
            selection-key (when selection (get-entity-key selection))
            already-pinned? (some #(= (:key %) selection-key) pinned)
            at-max-pinned? (>= (count pinned) max-pinned)
            can-pin? (and has-selection? (not already-pinned?) (not at-max-pinned?))]
        [:div.inspector-pane
         {:data-component "inspector-pane"
          :data-has-selection (when has-selection? true)
          :data-has-pinned (when has-pinned? true)
          :style {:height "100%"
                  :background-color (get-in tokens/colors [:background :surface])
                  :display "flex"
                  :flex-direction "column"
                  :overflow "hidden"}}
         
         ;; Header
         [:div.inspector-header
          {:data-testid "inspector-header"
           :style {:position "sticky"
                   :top 0
                   :z-index 1
                   :padding (str (get tokens/spacing 3) "px")
                   :background (get-in tokens/colors [:background :surface])
                   :border-bottom (when-not has-pinned?
                                    (str "1px solid " (get-in tokens/colors [:border :default])))}}
          [:h3.inspector-title
           {:style {:margin 0
                    :font-size (get-in tokens/typography [:bodySm :font-size])
                    :text-transform "uppercase"
                    :letter-spacing "0.05em"
                    :color (get-in tokens/colors [:text :muted])}}
           "Inspector"]
          (when (and has-selection? (not active-pinned))
            [:div
             {:data-testid "inspector-selection-title"
              :style {:margin-top (str (get tokens/spacing 2) "px")
                      :font-size (get-in tokens/typography [:body :font-size])
                      :font-weight (:medium tokens/font-weight)
                      :color (get-in tokens/colors [:text :default])}}
             (:title selection)])
          (when (and has-selection? (:type selection) (not active-pinned))
            [:div
             {:style {:margin-top (str (get tokens/spacing 1) "px")
                      :font-size (get-in tokens/typography [:bodySm :font-size])
                      :color (get-in tokens/colors [:text :secondary])
                      :text-transform "capitalize"}}
             (name (:type selection))])]
         
         ;; Pinned tabs bar (if any pinned)
         (when (or has-pinned? can-pin?)
           [render-pinned-tabs-bar pinned active-pinned-key on-set-active on-unpin on-pin selection can-pin?])
         
         ;; Content
         [:div.inspector-content
          {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                   :color (get-in tokens/colors [:text :secondary])
                   :padding (str (get tokens/spacing 3) "px")
                   :overflow-y "auto"
                   :display "flex"
                   :flex-direction "column"
                   :gap (str (get tokens/spacing 3) "px")}}
          
          ;; Error state
          (when error
            [render-error-state error on-retry])
          
          ;; Detail or empty state
          (if display-entity
            [:div
             {:style {:display "flex"
                      :flex-direction "column"
                      :gap (str (get tokens/spacing 3) "px")}}
             [render-detail-view (:selection display-entity display-entity) render-detail]
             [render-context-section display-context on-context-select render-context-item]]
            [render-empty-state])]]))))
