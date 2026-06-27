(ns devel.ui.primitives.chat
  "Chat component implementing the chat.edn contract.
   
   AI conversation interface with messages, input, typing indicators,
   session context, and connection status.
   
   Usage:
   ```clojure
   [chat
    {:messages @messages
     :on-send #(send-message! %)
     :session-id @session-id
     :connected @connected?}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :chat-message - {:id string, :role :user|:assistant|:system, :content string,
;;                  :timestamp date?, :attachments file[]?, :metadata object?, :actions string[]?}

(defn- get-scroll-container
  "Get the scroll container from the ref."
  [ref]
  @ref)

(defn- is-at-bottom?
  "Check if user is at bottom of scroll (within threshold)."
  [container threshold]
  (if-not container
    true
    (let [scroll-top (.-scrollTop container)
          scroll-height (.-scrollHeight container)
          client-height (.-clientHeight container)]
      (< (- scroll-height scroll-top client-height) threshold))))

(defn- scroll-to-bottom!
  "Scroll container to bottom."
  [container]
  (when container
    (set! (.-scrollTop container) (.-scrollHeight container))))

(defn- render-content
  "Render message content with basic markdown support."
  [content allow-markdown?]
  (if-not allow-markdown?
    content
    ;; Simple markdown rendering (code blocks, inline code, bold, italic)
    (let [parts (-> content
                    (clojure.string/split #"(?s)```.+?```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\n"))]
      ;; For simplicity, just return content for now
      ;; Full markdown rendering would require more complex parsing
      content)))

(defn- format-time
  "Format a date as time string."
  [date]
  (when date
    (.toLocaleTimeString date #js {:hour "2-digit" :minute "2-digit"})))

(defn chat
  "AI conversation interface.
   
   Props:
   - :messages - array of chat messages (required)
   - :on-send - callback (message, attachments?) => void (required)
   - :placeholder - input placeholder (default: 'Type a message...')
   - :loading - whether AI is generating (default: false)
   - :typing-indicator - show typing indicator when loading (default: true)
   - :avatar - custom avatar for AI (default: '🤖')
   - :user-avatar - custom avatar for user (default: '👤')
   - :max-height - max height of messages container (default: '500px')
   - :show-timestamps - show message timestamps (default: false)
   - :allow-attachments - allow file attachments (default: false)
   - :allow-markdown - render markdown (default: true)
   - :empty-state - custom empty state node
   - :on-message-action - callback for message actions
   - :session-id - session identifier for header
   - :connected - connection status (default: true)
   - :pending-message - message being sent
   - :show-header - show header with session/status (default: false)
   
   Example:
   ```clojure
   [chat
    {:messages [{:id \"1\" :role :user :content \"Hello!\"}]
     :on-send #(send-message! %)
     :session-id \"sess-123\"
     :connected true
     :show-header true}]
   ```"
  [{:keys [messages on-send placeholder loading typing-indicator avatar user-avatar
           max-height show-timestamps allow-attachments allow-markdown empty-state
           on-message-action session-id connected pending-message show-header]
    :or {placeholder "Type a message..."
         loading false
         typing-indicator true
         avatar "🤖"
         user-avatar "👤"
         max-height "500px"
         show-timestamps false
         allow-attachments false
         allow-markdown true
         connected true
         show-header false}
    :as props}]
  (let [input (r/atom "")
        attachments (r/atom [])
        container-ref (r/atom nil)
        user-at-bottom? (r/atom true)
        prev-messages-count (r/atom (count messages))
        
        ;; Check and update user-at-bottom on scroll
        handle-scroll #(reset! user-at-bottom? (is-at-bottom? @container-ref 100))
        
        ;; Smart scroll: only scroll if user was at bottom
        maybe-scroll!
        (fn []
          (when (and @user-at-bottom? @container-ref)
            (scroll-to-bottom! @container-ref)))]
    
    ;; Auto-scroll when messages change
    (r/create-class
     {:component-did-update
      (fn []
        (let [current-count (count messages)]
          (when (not= current-count @prev-messages-count)
            (reset! prev-messages-count current-count)
            (maybe-scroll!))))
      
      :reagent-render
      (fn [{:keys [messages on-send placeholder loading typing-indicator avatar user-avatar
                   max-height show-timestamps allow-attachments allow-markdown empty-state
                   on-message-action session-id connected pending-message show-header]
            :or {placeholder "Type a message..."
                 loading false
                 typing-indicator true
                 avatar "🤖"
                 user-avatar "👤"
                 max-height "500px"
                 show-timestamps false
                 allow-attachments false
                 allow-markdown true
                 connected true
                 show-header false}
            :as props}]
        (let [has-messages? (seq messages)
              handle-send (fn []
                           (when (and (seq @input) on-send)
                             (on-send @input @attachments)
                             (reset! input "")
                             (reset! attachments [])))
              handle-key-down (fn [e]
                               (when (and (= (.-key e) "Enter") (not (.-shiftKey e)))
                                 (.preventDefault e)
                                 (handle-send)))]
          [:div
           {:data-component "chat"
            :data-loading loading
            :style {:display "flex"
                    :flex-direction "column"
                    :background-color (get-in tokens/colors [:background :default])
                    :border-radius (str (get tokens/spacing 2) "px")
                    :border (str "1px solid " (get-in tokens/colors [:border :default]))
                    :font-family (:sans tokens/font-family)
                    :overflow "hidden"}}
           
           ;; Header
           (when show-header
             [:div
              {:data-testid "chat-header"
               :style {:display "flex"
                       :justify-content "space-between"
                       :align-items "center"
                       :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                       :border-bottom (str "1px solid " (get-in tokens/colors [:border :default]))
                       :font-size (get tokens/font-size :xs)
                       :color (get-in tokens/colors [:text :muted])}}
              [:span
               "Chat"
               (when session-id
                 [:span {:style {:margin-left "8px"
                                 :color (get-in tokens/colors [:text :secondary])}}
                  (str "• session " session-id)])]
              [:span
               {:data-testid "connection-status"
                :style {:color (if connected
                                 (get-in tokens/colors [:accent :green] "#a6e22e")
                                 (get-in tokens/colors [:accent :orange] "#fd971f"))}}
               (if connected "connected" "disconnected")]])
           
           ;; Messages container
           [:div
            {:ref #(reset! container-ref %)
             :on-scroll handle-scroll
             :style {:flex "1"
                     :overflow-y "auto"
                     :padding (str (get tokens/spacing 4) "px")
                     :display "flex"
                     :flex-direction "column"
                     :gap (str (get tokens/spacing 4) "px")
                     :max-height max-height}}
            
            (if has-messages?
              [:div
               ;; Messages
               (for [message messages]
                 ^{:key (:id message)}
                 [:div
                  {:style {:display "flex"
                           :gap (str (get tokens/spacing 3) "px")
                           :align-items "flex-start"
                           :flex-direction (if (= (:role message) :user) "row-reverse" "row")}}
                  [:div
                   {:style {:width "32px"
                            :height "32px"
                            :border-radius "50%"
                            :background-color (get-in tokens/colors [:background :surface])
                            :display "flex"
                            :align-items "center"
                            :justify-content "center"
                            :font-size "16px"
                            :flex-shrink 0}}
                   (if (= (:role message) :user) user-avatar avatar)]
                  [:div
                   {:style {:flex "1"
                            :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
                            :border-radius (str (get tokens/spacing 2) "px")
                            :line-height 1.5
                            :background-color (if (= (:role message) :user)
                                                (get-in tokens/colors [:background :surface])
                                                "transparent")
                            :color (get-in tokens/colors [:text :default])}}
                   [:div (render-content (:content message) allow-markdown)]
                   (when (and show-timestamps (:timestamp message))
                     [:div
                      {:style {:font-size (get tokens/font-size :xs)
                               :color (get-in tokens/colors [:text :muted])
                               :margin-top (str (get tokens/spacing 1) "px")}}
                      (format-time (:timestamp message))])]])
               
               ;; Pending message
               (when pending-message
                 [:div
                  {:data-testid "pending-message"
                   :style {:display "flex"
                           :gap (str (get tokens/spacing 3) "px")
                           :align-items "flex-start"
                           :flex-direction "row-reverse"
                           :opacity 0.6}}
                  [:div
                   {:style {:width "32px"
                            :height "32px"
                            :border-radius "50%"
                            :background-color (get-in tokens/colors [:background :surface])
                            :display "flex"
                            :align-items "center"
                            :justify-content "center"
                            :font-size "16px"}}
                   user-avatar]
                  [:div
                   {:style {:flex "1"
                            :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
                            :border-radius (str (get tokens/spacing 2) "px")
                            :line-height 1.5
                            :background-color (get-in tokens/colors [:background :surface])
                            :color (get-in tokens/colors [:text :default])}}
                   [:div (render-content (:content pending-message) allow-markdown)]
                   [:div
                    {:style {:font-size (get tokens/font-size :xs)
                             :color (get-in tokens/colors [:text :muted])
                             :margin-top "4px"
                             :display "flex"
                             :align-items "center"
                             :gap "4px"}}
                    [:span "●"]
                    [:span "Sending..."]]]])
               
               ;; Typing indicator
               (when (and loading typing-indicator)
                 [:div
                  {:style {:display "flex"
                           :gap (str (get tokens/spacing 3) "px")
                           :align-items "flex-start"}}
                  [:div
                   {:style {:width "32px"
                            :height "32px"
                            :border-radius "50%"
                            :background-color (get-in tokens/colors [:background :surface])
                            :display "flex"
                            :align-items "center"
                            :justify-content "center"
                            :font-size "16px"}}
                   avatar]
                  [:div
                   {:style {:flex "1"
                            :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
                            :border-radius (str (get tokens/spacing 2) "px"
                            :line-height 1.5
                            :background-color "transparent"
                            :color (get-in tokens/colors [:text :default])}}
                   [:span "●●●"]]])
               
               ;; Scroll anchor
               [:div {:ref #(when % (maybe-scroll!))}]]
              
              ;; Empty state
              (or empty-state
                  [:div
                   {:style {:flex "1"
                            :display "flex"
                            :flex-direction "column"
                            :align-items "center"
                            :justify-content "center"
                            :padding (str (get tokens/spacing 8) "px")
                            :color (get-in tokens/colors [:text :muted])
                            :text-align "center"}}
                   [:div {:style {:font-size "48px" :margin-bottom "16px"}} "💬"]
                   [:div {:style {:font-size (get tokens/font-size :lg) :margin-bottom "8px"}}
                    "Start a conversation"]
                   [:div {:style {:font-size (get tokens/font-size :sm)}}
                    "Ask anything and I'll help you out"]]))]
           
           ;; Input area
           [:div
            {:style {:padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
                     :border-top (str "1px solid " (get-in tokens/colors [:border :default]))
                     :background-color (get-in tokens/colors [:background :surface])}}
            [:form
             {:on-submit (fn [e]
                          (.preventDefault e)
                          (handle-send))
              :style {:display "flex"
                      :align-items "flex-end"
                      :gap (str (get tokens/spacing 2) "px")
                      :background-color (get-in tokens/colors [:background :default])
                      :border-radius (str (get tokens/spacing 2) "px")
                      :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")}}
             [:textarea
              {:value @input
               :on-change #(reset! input (.. % -target -value))
               :on-key-down handle-key-down
               :placeholder placeholder
               :disabled loading
               :rows 1
               :style {:flex "1"
                       :background "transparent"
                       :border "none"
                       :outline "none"
                       :resize "none"
                       :color (get-in tokens/colors [:text :default])
                       :font-family (:sans tokens/font-family)
                       :font-size (get tokens/font-size :base)
                       :line-height 1.5
                       :max-height "120px"}}]
             [:button
              {:type "submit"
               :disabled (or (empty? @input) loading)
               :style {:background (get-in tokens/colors [:button :primary :bg])
                       :color (get-in tokens/colors [:button :primary :fg])
                       :border "none"
                       :border-radius (str (get tokens/spacing 1) "px")
                       :padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
                       :cursor (if (or (empty? @input) loading) "not-allowed" "pointer")
                       :font-family (:sans tokens/font-family)
                       :font-size (get tokens/font-size :sm)
                       :font-weight (:medium tokens/font-weight)
                       :opacity (if (or (empty? @input) loading) 0.5 1)}}
              "Send"]]]]))})))
