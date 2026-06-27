(ns opencode-unified.command-palette
  (:require [clojure.string :as str]
            [opencode-unified.state :as state]
            [reagent.core :as r]))

(defonce command-registry (r/atom {}))

(def default-palette-state
  {:visible? false
   :query ""
   :selected-index 0
   :feedback nil
   :last-event nil
   :events []
   :pending-confirmation nil})

(defn- coerce-palette-state [value]
  (if (map? value)
    (merge default-palette-state value)
    default-palette-state))

(defn ensure-palette-state! []
  (swap! state/app-state update :ui #(merge {:command-palette default-palette-state} %)))

(defn palette-state []
  (coerce-palette-state (get-in @state/app-state [:ui :command-palette])))

(defn update-palette! [f & args]
  (swap! state/app-state update-in [:ui :command-palette]
         (fn [current]
           (apply f (coerce-palette-state current) args))))

(defn emit-feedback! [event]
  (let [stamp (.toISOString (js/Date.))
        normalized (assoc event :timestamp stamp)]
    (update-palette!
     (fn [palette]
       (-> palette
           (assoc :feedback normalized
                  :last-event normalized)
           (update :events (fn [events] (->> (conj (or events []) normalized)
                                             (take-last 25)
                                             vec))))))))

(defn close! []
  (update-palette! merge {:visible? false :query "" :selected-index 0 :pending-confirmation nil}))

(defn focus-input! []
  (letfn [(focus-with-retry! [remaining]
            (when-let [input (.querySelector js/document "[data-testid='command-palette-input']")]
              (.focus input)
              (when (and (pos? remaining)
                         (not= input (.-activeElement js/document)))
                (js/setTimeout #(focus-with-retry! (dec remaining)) 16))))]
    (js/setTimeout #(focus-with-retry! 6) 0)))

(defn open! []
  (update-palette! merge {:visible? true :query "" :selected-index 0 :pending-confirmation nil})
  (focus-input!))

(defn visible? []
  (:visible? (palette-state)))

(defn- normalize-command [{:keys [id title description handler destructive? confirm-message keywords]}]
  {:id id
   :title title
   :description (or description "")
   :handler handler
   :destructive? (boolean destructive?)
   :confirm-message (or confirm-message "This action cannot be undone. Continue?")
   :keywords (vec keywords)})

(defn register-command! [command]
  (swap! command-registry assoc (:id command) (normalize-command command)))

(defn register-commands! [commands]
  (doseq [command commands]
    (register-command! command)))

(defn all-commands []
  (->> @command-registry
       vals
       (sort-by :title)
       vec))

(defn- command-haystack [{:keys [id title description keywords]}]
  (str/lower-case (str/join " " (concat [id title description] keywords))))

(defn filtered-commands []
  (let [{:keys [query]} (palette-state)
        needle (str/lower-case (str/trim (or query "")))
        commands (all-commands)]
    (if (str/blank? needle)
      commands
      (->> commands
           (filter #(str/includes? (command-haystack %) needle))
           vec))))

(defn- promise-like? [value]
  (and value (fn? (.-then value))))

(defn- error-message [error]
  (cond
    (string? error) error
    (and error (some? (.-message error))) (.-message error)
    :else "Unknown error"))

(defn- execute-sync! [command result]
  (let [failed? (and (map? result) (= false (:success result)))
        message (or (:message result)
                    (if failed?
                      (str "Failed: " (:title command))
                      (str "Executed: " (:title command))))]
    (emit-feedback! {:command-id (:id command)
                     :status (if failed? :error :success)
                     :message message})))

(defn- execute-unsafe! [command]
  (try
    (let [result ((:handler command))]
      (if (promise-like? result)
        (-> result
             (.then (fn [resolved]
                      (execute-sync! command resolved)))
             (.catch (fn [error]
                       (emit-feedback! {:command-id (:id command)
                                        :status :error
                                        :message (str "Failed: " (error-message error))}))))
         (execute-sync! command result)))
    (catch js/Error error
      (emit-feedback! {:command-id (:id command)
                       :status :error
                       :message (str "Failed: " (error-message error))}))))

(defn execute! [command]
  (if (:destructive? command)
    (update-palette! assoc :pending-confirmation command)
    (execute-unsafe! command)))

(defn execute-selected! []
  (let [{:keys [selected-index]} (palette-state)
        commands (filtered-commands)
        command (nth commands selected-index nil)]
    (when command
      (execute! command))))

(defn clear-confirmation! []
  (update-palette! assoc :pending-confirmation nil)
  (focus-input!))

(defn confirm-destructive! []
  (when-let [command (get (palette-state) :pending-confirmation)]
    (update-palette! assoc :pending-confirmation nil)
    (execute-unsafe! command)))

(defn select-next! []
  (let [command-count (count (filtered-commands))]
    (when (pos? command-count)
      (update-palette! update :selected-index (fn [index] (mod (inc index) command-count))))))

(defn select-prev! []
  (let [command-count (count (filtered-commands))]
    (when (pos? command-count)
      (update-palette! update :selected-index (fn [index] (mod (dec index) command-count))))))

(defn update-query! [query]
  (update-palette! merge {:query query :selected-index 0}))

(defn handle-open-key! []
  (if (visible?)
    (close!)
    (open!)))

(defn handle-palette-keydown! [event]
  (let [key (.-key event)]
    (case key
      "ArrowDown" (do (.preventDefault event) (select-next!))
      "ArrowUp" (do (.preventDefault event) (select-prev!))
      "Enter" (do (.preventDefault event) (execute-selected!))
      "Escape" (do (.preventDefault event) (close!))
      nil)))

(defn init! []
  (ensure-palette-state!)
  (register-commands!
   [{:id "palette.open"
     :title "Open Action Palette"
     :description "Open action-centric command palette"
     :handler (fn []
                (open!)
                {:success true :message "Action palette opened"})
     :keywords ["actions" "palette"]}
    {:id "workspace.save"
     :title "Save Workspace Snapshot"
     :description "Save a lightweight workspace snapshot"
     :handler (fn []
                (when-let [storage (some-> js/window (aget "localStorage"))]
                  (.setItem storage "opencode.workbench.last-save" (.toISOString (js/Date.))))
                {:success true :message "Workspace snapshot saved"})
     :keywords ["save" "workspace"]}
    {:id "theme.toggle"
     :title "Toggle Theme"
     :description "Switch between dark and light themes"
     :handler (fn []
                (let [next-theme (if (= :dark (get-in @state/app-state [:ui :theme])) :light :dark)]
                  (swap! state/app-state assoc-in [:ui :theme] next-theme)
                  {:success true :message (str "Theme set to " (name next-theme))}))
     :keywords ["appearance" "colors"]}
    {:id "workspace.reset"
     :title "Reset Workspace"
     :description "Clear all buffers and restore defaults"
     :destructive? true
     :confirm-message "Reset workspace and discard unsaved buffers?"
     :handler (fn []
                (swap! state/app-state
                       (fn [current]
                         (-> current
                             (assoc :buffers {})
                             (assoc :current-buffer nil)
                             (assoc-in [:evil-state :mode] :normal))))
                {:success true :message "Workspace reset"})
     :keywords ["danger" "clear" "destructive"]}]))

(defn command-palette []
  (let [{:keys [visible? query selected-index feedback pending-confirmation]} (palette-state)
        commands (filtered-commands)]
    [:div.command-palette
     {:data-testid "command-palette"
      :style {:position "fixed"
              :top "12%"
              :left "50%"
              :transform "translateX(-50%)"
              :width "560px"
              :max-height "420px"
              :background-color "var(--bg-tertiary)"
              :border "1px solid var(--border)"
              :border-radius "6px"
              :box-shadow "0 14px 42px rgba(0,0,0,0.45)"
              :z-index 2200
              :display (if visible? "flex" "none")
              :flex-direction "column"
              :overflow "hidden"}}
     [:div
      {:style {:padding "0.55rem 0.7rem"
               :border-bottom "1px solid var(--border)"
               :font-size "0.75rem"
               :text-transform "uppercase"
               :letter-spacing "0.08em"
               :color "var(--text-dim)"}}
      "Actions"]
     [:input.command-input
      {:data-testid "command-palette-input"
       :value query
       :on-change #(update-query! (-> % .-target .-value))
       :on-key-down handle-palette-keydown!
       :placeholder "> Run action"
       :style {:width "100%"
               :padding "0.6rem 0.7rem"
               :border "none"
               :border-bottom "1px solid var(--border)"
               :background "transparent"
               :color "var(--text-primary)"
               :font-size "0.9rem"
               :outline "none"}}]
      (when feedback
        [:div
         {:data-testid "command-feedback"
          :data-command-id (:command-id feedback)
          :data-status (name (:status feedback))
          :style {:padding "0.45rem 0.7rem"
                  :font-size "0.8rem"
                 :border-bottom "1px solid var(--border)"
                 :color (if (= :error (:status feedback)) "var(--error)" "var(--success)")}}
        (:message feedback)])
     [:div.command-list
      {:style {:max-height "250px"
               :overflow-y "auto"}}
      (if (empty? commands)
        [:div {:style {:padding "0.7rem"
                       :color "var(--text-dim)"
                       :font-size "0.82rem"}}
         "No actions found"]
        (for [[index command] (map-indexed vector commands)]
          ^{:key (:id command)}
          [:button.command-item
           {:type "button"
            :data-testid "command-palette-item"
            :class (when (= selected-index index) "selected")
            :on-mouse-enter #(update-palette! assoc :selected-index index)
            :on-click #(execute! command)
            :style {:display "flex"
                    :width "100%"
                    :background (if (= selected-index index) "var(--bg-selection)" "transparent")
                    :border "none"
                    :border-left (if (= selected-index index) "2px solid var(--accent)" "2px solid transparent")
                    :padding "0.58rem 0.65rem"
                    :cursor "pointer"
                    :text-align "left"
                    :justify-content "space-between"
                    :align-items "center"
                    :gap "0.5rem"}}
           [:div
            [:div {:style {:color "var(--text-primary)"
                           :font-size "0.83rem"
                           :font-weight "600"}}
             (:title command)]
            [:div {:style {:color "var(--text-secondary)"
                           :font-size "0.76rem"}}
             (:description command)]]
            [:div {:style {:font-size "0.72rem"
                           :color (if (:destructive? command) "var(--error)" "var(--text-dim)")}}
             (if (:destructive? command) "Destructive" (:id command))]]))]
     (when pending-confirmation
       [:div
        {:data-testid "destructive-confirmation"
         :style {:padding "0.65rem 0.7rem"
                 :border-top "1px solid var(--border)"
                 :background "rgba(249,38,114,0.12)"
                 :display "flex"
                 :align-items "center"
                 :justify-content "space-between"
                 :gap "0.6rem"}}
        [:span {:style {:font-size "0.78rem" :color "var(--text-primary)"}}
         (:confirm-message pending-confirmation)]
        [:div {:style {:display "flex" :gap "0.35rem"}}
         [:button
          {:type "button"
           :data-testid "destructive-cancel"
           :on-click clear-confirmation!
           :style {:background "var(--bg-secondary)"
                   :color "var(--text-secondary)"
                   :border "1px solid var(--border)"
                   :padding "0.25rem 0.45rem"
                   :font-size "0.74rem"
                   :cursor "pointer"}}
          "Cancel"]
         [:button
          {:type "button"
           :data-testid "destructive-confirm"
           :on-click confirm-destructive!
           :style {:background "var(--error)"
                   :color "var(--bg-primary)"
                   :border "1px solid var(--error)"
                   :padding "0.25rem 0.45rem"
                   :font-size "0.74rem"
                   :font-weight "700"
                   :cursor "pointer"}}
          "Confirm"]]])]))
