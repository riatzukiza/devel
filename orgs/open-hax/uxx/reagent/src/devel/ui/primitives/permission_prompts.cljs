(ns devel.ui.primitives.permission-prompts
  "PermissionPrompts component implementing the permission-prompts.edn contract.
   
   A panel for handling permission requests and input prompts from an AI agent or system,
   with options for one-time approval, persistent approval, and rejection.
   
   Usage:
   ```clojure
   [permission-prompts
    {:permissions @pending-permissions
     :prompts @pending-prompts
     :on-permission-response handle-permission
     :on-prompt-response handle-prompt}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :permission-request - {:id string, :title string?, :session-id string?, :metadata object?, :timeout-ms number?, :default-response keyword?}
;; :input-prompt - {:id string, :title string?, :body object?, :placeholder string?, :multiline boolean?, :session-id string?}

(defn- get-prompt-text
  "Extract prompt text from body object."
  [body]
  (cond
    (string? body) body
    (map? body) (:prompt body "Enter input")
    :else "Enter input"))

(defn- render-permission-card
  "Render a single permission request card."
  [{:keys [id title session-id metadata timeout-ms default-response] :as permission}
   on-response
   show-metadata?]
  (let [default-response (or default-response :once)]
    [:div.permission-card
     {:data-testid "permission-card"
      :data-permission-id id
      :style {:padding (str (get tokens/spacing 3) "px")
              :border (str "1px solid " (get-in tokens/colors [:border :default]))
              :border-radius (str (get tokens/spacing 1) "px")
              :background (get-in tokens/colors [:background :default])
              :margin-bottom (str (get tokens/spacing 2) "px")}}
     
     ;; Title
     [:div.permission-title
      {:style {:font-size (get-in tokens/typography [:body :font-size])
               :font-weight (:medium tokens/font-weight)
               :color (get-in tokens/colors [:text :default])
               :margin-bottom (str (get tokens/spacing 2) "px")}}
      (or title "Permission Request")]
     
     ;; Metadata (optional)
     (when (and show-metadata? metadata)
       [:div.permission-metadata
        {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                 :color (get-in tokens/colors [:text :secondary])
                 :margin-bottom (str (get tokens/spacing 2) "px")
                 :font-family (:mono tokens/font-family)}}
        (cond
          (:path metadata) [:span (str "Path: " (:path metadata))]
          (:command metadata) [:span (str "Command: " (:command metadata))]
          :else [:span (str (pr-str metadata))])])
     
     ;; Session ID (optional)
     (when session-id
       [:div.permission-session
        {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                 :color (get-in tokens/colors [:text :muted])
                 :margin-bottom (str (get tokens/spacing 2) "px")}}
        (str "Session: " session-id)])
     
     ;; Timeout indicator (optional)
     (when timeout-ms
       [:div.permission-timeout
        {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                 :color (get-in tokens/colors [:text :muted])
                 :margin-bottom (str (get tokens/spacing 2) "px")}}
        (str "Expires in " (quot timeout-ms 1000) "s")])
     
     ;; Action buttons
     [:div.permission-actions
      {:style {:display "flex"
               :gap (str (get tokens/spacing 2) "px")
               :flex-wrap "wrap"}}
      [:button.permission-btn-once
       {:type "button"
        :data-testid "permission-btn-once"
        :on-click #(on-response id :once)
        :style {:flex "1"
                :min-width "80px"
                :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                :border (str "1px solid " (get-in tokens/colors [:border :default]))
                :border-radius (str (get tokens/spacing 0.5) "px")
                :font-size (get-in tokens/typography [:bodySm :font-size])
                :background (if (= default-response :once)
                              (get-in tokens/colors [:background :elevated])
                              (get-in tokens/colors [:background :default]))
                :color (get-in tokens/colors [:text :default])
                :cursor "pointer"}}
       "Allow Once"]
      [:button.permission-btn-always
       {:type "button"
        :data-testid "permission-btn-always"
        :on-click #(on-response id :always)
        :style {:flex "1"
                :min-width "80px"
                :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                :border (str "1px solid " (get-in tokens/colors [:accent :green] "#a6e22e"))
                :border-radius (str (get tokens/spacing 0.5) "px")
                :font-size (get-in tokens/typography [:bodySm :font-size])
                :background (if (= default-response :always)
                              (get-in tokens/colors [:accent :green] "#a6e22e")
                              "transparent")
                :color (if (= default-response :always)
                         (get-in tokens/colors [:background :default])
                         (get-in tokens/colors [:accent :green] "#a6e22e"))
                :cursor "pointer"}}
       "Always Allow"]
      [:button.permission-btn-reject
       {:type "button"
        :data-testid "permission-btn-reject"
        :on-click #(on-response id :reject)
        :style {:flex "1"
                :min-width "80px"
                :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                :border (str "1px solid " (get-in tokens/colors [:accent :pink] "#f92672"))
                :border-radius (str (get tokens/spacing 0.5) "px")
                :font-size (get-in tokens/typography [:bodySm :font-size])
                :background (if (= default-response :reject)
                              (get-in tokens/colors [:accent :pink] "#f92672")
                              "transparent")
                :color (if (= default-response :reject)
                         (get-in tokens/colors [:background :default])
                         (get-in tokens/colors [:accent :pink] "#f92672"))
                :cursor "pointer"}}
       "Reject"]]]))

(defn- render-prompt-card
  "Render a single input prompt card."
  [{:keys [id title body placeholder multiline session-id] :as prompt}
   on-response
   auto-focus?]
  (let [input-value (r/atom "")
        multiline? (or multiline false)]
    (fn [{:keys [id title body placeholder multiline session-id] :as prompt}
         on-response
         auto-focus?]
      (let [prompt-text (get-prompt-text body)]
        [:div.prompt-card
         {:data-testid "prompt-card"
          :data-prompt-id id
          :style {:padding (str (get tokens/spacing 3) "px")
                  :border (str "1px solid " (get-in tokens/colors [:border :default]))
                  :border-radius (str (get tokens/spacing 1) "px")
                  :background (get-in tokens/colors [:background :default])
                  :margin-bottom (str (get tokens/spacing 2) "px")}}
         
         ;; Title
         [:div.prompt-title
          {:style {:font-size (get-in tokens/typography [:body :font-size])
                   :font-weight (:medium tokens/font-weight)
                   :color (get-in tokens/colors [:text :default])
                   :margin-bottom (str (get tokens/spacing 2) "px")}}
          (or title "Input Required")]
         
         ;; Prompt text
         [:div.prompt-body
          {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                   :color (get-in tokens/colors [:text :secondary])
                   :margin-bottom (str (get tokens/spacing 2) "px")}}
          prompt-text]
         
         ;; Session ID (optional)
         (when session-id
           [:div.prompt-session
            {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                     :color (get-in tokens/colors [:text :muted])
                     :margin-bottom (str (get tokens/spacing 2) "px")}}
            (str "Session: " session-id)])
         
         ;; Input field
         [(if multiline? :textarea :input)
          (merge
           {:data-testid "prompt-input"
            :value @input-value
            :on-change #(reset! input-value (-> % .-target .-value))
            :placeholder (or placeholder "Enter response...")
            :auto-focus auto-focus?
            :style {:width "100%"
                    :padding (str (get tokens/spacing 2) "px")
                    :border (str "1px solid " (get-in tokens/colors [:border :default]))
                    :border-radius (str (get tokens/spacing 0.5) "px")
                    :font-size (get-in tokens/typography [:bodySm :font-size])
                    :font-family (:mono tokens/font-family)
                    :background (get-in tokens/colors [:background :elevated])
                    :color (get-in tokens/colors [:text :default])
                    :box-sizing "border-box"
                    :outline "none"}}
           (when multiline?
             {:rows 3
              :style (assoc (:style {})
                           :min-height "60px"
                           :resize "vertical")}))
          (when-not multiline? nil)]
         
         ;; Submit button
         [:button.prompt-submit
          {:type "button"
           :data-testid "prompt-submit"
           :on-click (fn []
                       (when (seq @input-value)
                         (on-response id @input-value)
                         (reset! input-value "")))
           :disabled (empty? @input-value)
           :style {:margin-top (str (get tokens/spacing 2) "px")
                   :width "100%"
                   :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                   :border (str "1px solid " (get-in tokens/colors [:accent :green] "#a6e22e"))
                   :border-radius (str (get tokens/spacing 0.5) "px")
                   :font-size (get-in tokens/typography [:bodySm :font-size])
                   :background (if (empty? @input-value)
                                 (get-in tokens/colors [:background :elevated])
                                 (get-in tokens/colors [:accent :green] "#a6e22e"))
                   :color (if (empty? @input-value)
                            (get-in tokens/colors [:text :muted])
                            (get-in tokens/colors [:background :default]))
                   :cursor (if (empty? @input-value) "not-allowed" "pointer")}}
          "Submit"]]))))

(defn permission-prompts
  "Panel for handling permission requests and input prompts.
   
   Props:
   - :permissions - array of permission request maps (default: [])
   - :prompts - array of input prompt maps (default: [])
   - :on-permission-response - callback (id, response) for permission responses (required)
   - :on-prompt-response - callback (id, response) for prompt responses (required)
   - :auto-focus-input - auto-focus input fields (default: true)
   - :show-metadata - show permission metadata (default: true)
   - :group-by-session - group prompts by session (default: false)
   
   Permission request shape:
   {:id string
    :title string (optional)
    :session-id string (optional)
    :metadata object (optional)
    :timeout-ms number (optional)
    :default-response :once | :always | :reject (optional)}
   
   Input prompt shape:
   {:id string
    :title string (optional)
    :body {:prompt string} | string (optional)
    :placeholder string (optional)
    :multiline boolean (optional)
    :session-id string (optional)}
   
   Example:
   ```clojure
   [permission-prompts
    {:permissions [{:id \"perm-1\" :title \"Read file\" :metadata {:path \"/src/core.cljs\"}}]
     :prompts [{:id \"prompt-1\" :title \"Input\" :body {:prompt \"Name?\"}}]
     :on-permission-response #(handle-perm %1 %2)
     :on-prompt-response #(handle-prompt %1 %2)}]
   ```"
  [{:keys [permissions prompts on-permission-response on-prompt-response
           auto-focus-input show-metadata group-by-session]
    :or {permissions []
         prompts []
         auto-focus-input true
         show-metadata true
         group-by-session false}
    :as props}]
  (let []
    (fn [{:keys [permissions prompts on-permission-response on-prompt-response
                 auto-focus-input show-metadata group-by-session]
          :or {permissions []
               prompts []
               auto-focus-input true
               show-metadata true
               group-by-session false}
          :as props}]
      (let [pending-count (+ (count permissions) (count prompts))
            has-pending? (> pending-count 0)]
        [:div.permission-prompts
         {:data-component "permission-prompts"
          :data-pending-count pending-count
          :role "region"
          :aria-label "Pending requests"
          :aria-live "polite"
          :style {:padding (str (get tokens/spacing 3) "px")
                  :background-color (get-in tokens/colors [:background :surface])
                  :min-height "100%"}}
         
         ;; Header
         [:div.prompts-header
          {:style {:margin-bottom (str (get tokens/spacing 3) "px")
                   :display "flex"
                   :align-items "center"
                   :justify-content "space-between"}}
          [:h3.prompts-title
           {:style {:margin 0
                    :font-size (get-in tokens/typography [:bodySm :font-size])
                    :text-transform "uppercase"
                    :letter-spacing "0.05em"
                    :color (get-in tokens/colors [:text :muted])}}
           "Pending Requests"]
          (when has-pending?
            [:span.prompts-count
             {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
                      :color (get-in tokens/colors [:accent :green] "#a6e22e")
                      :padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
                      :background "rgba(166, 226, 46, 0.1)"
                      :border-radius (str (get tokens/spacing 0.5) "px")}}
             pending-count])]]
         
         ;; Empty state
         (when-not has-pending?
           [:div.prompts-empty
            {:data-testid "prompts-empty"
             :style {:padding (str (get tokens/spacing 4) "px")
                     :text-align "center"
                     :color (get-in tokens/colors [:text :muted])
                     :font-size (get-in tokens/typography [:bodySm :font-size])}}
            "No pending requests"])
         
         ;; Permission requests
         (when (seq permissions)
           [:div.permissions-section
            (for [permission permissions]
              ^{:key (:id permission)}
              [render-permission-card permission on-permission-response show-metadata])])
         
         ;; Input prompts
         (when (seq prompts)
           [:div.prompts-section
            (for [[idx prompt] (map-indexed vector prompts)]
              ^{:key (:id prompt)}
              [render-prompt-card prompt on-prompt-response (and auto-focus-input (= idx 0))])])))))
