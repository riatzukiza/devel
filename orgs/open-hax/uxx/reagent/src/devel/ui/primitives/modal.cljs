(ns devel.ui.primitives.modal
  "Modal component implementing the modal.edn contract.
   
   Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
   
   Usage:
   ```clojure
   [modal {:open true :on-close #(reset! show-modal false)
           :title \"Confirm Action\"}
    [:p \"Are you sure?\"]
    [button {:on-click #(reset! show-modal false)} \"Cancel\"]]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]
            [react-dom :as react-dom]))

;; Types derived from contract
;; :size - :sm | :md | :lg | :xl | :full
;; :scroll-behavior - :inside | :outside

(defn- size-styles [size]
  (case size
    :sm {:max-width "400px"}
    :lg {:max-width "800px"}
    :xl {:max-width "1000px"}
    :full {:max-width "calc(100vw - 64px)"
           :max-height "calc(100vh - 64px)"}
    ;; default :md
    {:max-width "600px"}))

(def ^:private backdrop-styles
  {:position "fixed"
   :inset 0
   :background-color "rgba(0, 0, 0, 0.6)"
   :backdrop-filter "blur(4px)"
   :z-index (:modal tokens/z-index)
   :display "flex"
   :align-items "center"
   :justify-content "center"
   :padding "32px"})

(def ^:private modal-styles
  {:background-color (:elevated (:background tokens/colors))
   :border-radius (str (get tokens/spacing 3) "px")
   :box-shadow (:2xl tokens/shadow)
   :border (str "1px solid " (:subtle (:border tokens/colors)))
   :display "flex"
   :flex-direction "column"
   :width "100%"
   :max-height "calc(100vh - 64px)"
   :font-family (:sans tokens/font-family)})

(def ^:private header-styles
  {:display "flex"
   :align-items "center"
   :justify-content "space-between"
   :padding (str (get tokens/spacing 4) "px " (get tokens/spacing 5) "px")
   :border-bottom (str "1px solid " (:default (:border tokens/colors)))
   :font-weight (:semibold tokens/font-weight)
   :font-size (:lg tokens/font-size)})

(def ^:private body-styles
  {:flex 1
   :padding (str (get tokens/spacing 4) "px " (get tokens/spacing 5) "px")
   :overflow-y "auto"})

(def ^:private footer-styles
  {:display "flex"
   :align-items "center"
   :justify-content "flex-end"
   :gap (str (get tokens/spacing 2) "px")
   :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 5) "px")
   :border-top (str "1px solid " (:default (:border tokens/colors)))})

(def ^:private close-button-styles
  {:background "none"
   :border "none"
   :cursor "pointer"
   :padding (str (get tokens/spacing 1) "px")
   :font-size "20px"
   :line-height 1
   :color (:muted (:text tokens/colors))
   :transition (:colors tokens/transitions)})

(defn modal
  "Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
   
   Props:
   - :open - boolean (default: false)
   - :on-close - function (required) - called when modal should close
   - :size - :sm | :md | :lg | :xl | :full (default: :md)
   - :closable - boolean (default: true)
   - :close-on-backdrop - boolean (default: true)
   - :close-on-escape - boolean (default: true)
   - :centered - boolean (default: true)
   - :scroll-behavior - :inside | :outside (default: :inside)
   - :header - header content slot
   - :title - title text
   - :footer - footer content slot
   
   Example:
   ```clojure
   [modal {:open @show-modal
           :on-close #(reset! show-modal false)
           :title \"Confirm Action\"}
    [:p \"Are you sure you want to proceed?\"]
    [button {:on-click #(reset! show-modal false)} \"Cancel\"]]
   ```"
  [{:keys [open on-close size closable close-on-backdrop close-on-escape
           scroll-behavior header title footer]
   :or {open false
        size :md
        closable true
        close-on-backdrop true
        close-on-escape true
        scroll-behavior :inside}
   :as props}
   & children]
  (r/create-class
   {:component-did-update
    (fn [this old-argv]
      (let [[_ old-props] old-argv
            [_ new-props] (r/argv this)
            was-open (:open old-props)
            is-open (:open new-props)]
        (cond
          (and (not was-open) is-open)
          (do
            (set! (.-overflow js/document.body.style) "hidden"))
          
          (and was-open (not is-open))
          (set! (.-overflow js/document.body.style) ""))))
    
    :reagent-render
    (fn [props & children]
      (when open
        (let [modal-ref (atom nil)
              handle-key-down (fn [e]
                               (when (and closable
                                         close-on-escape
                                         (= (.-key e) "Escape"))
                                 (on-close)))
              handle-backdrop-click (fn [e]
                                     (when (and closable
                                               close-on-backdrop
                                               (= (.-target e) (.-currentTarget e)))
                                       (on-close)))
              handle-modal-key-down (fn [e]
                                     (when (= (.-key e) "Tab")
                                       (let [modal @modal-ref
                                             focusable (when modal
                                                        (.querySelectorAll modal
                                                         "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"))]
                                         (when (and focusable (> (.-length focusable) 0))
                                           (let [first (aget focusable 0)
                                                 last (aget focusable (dec (.-length focusable)))]
                                             (cond
                                               (and (.-shiftKey e)
                                                    (= js/document.activeElement first))
                                               (do (.preventDefault e)
                                                   (.focus last))
                                               
                                               (and (not (.-shiftKey e))
                                                    (= js/document.activeElement last))
                                               (do (.preventDefault e)
                                                   (.focus first))))))))]
          (let [modal-content
                [:div
                 {:data-component "modal"
                  :data-size (name size)
                  :data-open open
                  :style backdrop-styles
                  :on-click handle-backdrop-click
                  :on-key-down handle-key-down}
                 [:div
                  {:ref #(reset! modal-ref %)
                   :role "dialog"
                   :aria-modal true
                   :tab-index -1
                   :style (merge modal-styles (size-styles size))
                   :on-key-down handle-modal-key-down}
                  (when (or header title)
                    [:div {:style header-styles}
                     [:div {:style {:display "flex" :align-items "center" :gap (str (get tokens/spacing 2) "px")}}
                      (when header header)
                      (when (and title (not header))
                        [:span title])]
                     (when closable
                       [:button
                        {:type "button"
                         :style close-button-styles
                         :on-click on-close
                         :aria-label "Close modal"}
                        "×"])])
                 [:div {:style body-styles}
                  children]
                 (when footer
                   [:div {:style footer-styles} footer])]]]
            ;; Render in portal
            (react-dom/createPortal
             modal-content
             js/document.body)))))}))
