(ns devel.ui.primitives.card
  "Card component implementing the card.edn contract.
   
   Versatile card container with optional header, title, and footer sections.
   
   Usage:
   ```clojure
   [card {:variant :elevated :title \"Card Title\"}
    \"Main content\"]
   
   [card {:interactive true :on-click #(js/console.log \"clicked\")}
    [:div \"Card body\"]]
   ```"
  (:require [devel.ui.tokens :as tokens]))

;; Types derived from contract
;; :variant - :default | :outlined | :elevated
;; :padding - :none | :sm | :md | :lg
;; :radius - :none | :sm | :md | :lg | :full

(defn- variant-styles [variant]
  (case variant
    :default {:background-color (:surface (:background tokens/colors))
              :border (str "1px solid " (:default (:border tokens/colors)))
              :box-shadow (:sm tokens/shadow)}
    :outlined {:background-color "transparent"
               :border (str "1px solid " (:default (:border tokens/colors)))
               :box-shadow (:none tokens/shadow)}
    :elevated {:background-color (:elevated (:background tokens/colors))
               :border (str "1px solid " (:subtle (:border tokens/colors)))
               :box-shadow (:md tokens/shadow)}
    ;; default
    {:background-color (:surface (:background tokens/colors))
     :border (str "1px solid " (:default (:border tokens/colors)))
     :box-shadow (:sm tokens/shadow)}))

(defn- padding-styles [padding]
  (case padding
    :none {:padding 0}
    :sm {:padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")}
    :lg {:padding (str (get tokens/spacing 6) "px " (get tokens/spacing 8) "px")}
    ;; default :md
    {:padding (str (get tokens/spacing 4) "px " (get tokens/spacing 5) "px")}))

(defn- radius-styles [radius]
  (case radius
    :none 0
    :sm (get tokens/spacing 1)
    :lg (get tokens/spacing 3)
    :full "9999px"
    ;; default :md
    (get tokens/spacing 2)))

(def ^:private base-styles
  {:display "flex"
   :flex-direction "column"
   :transition (:colors tokens/transitions)
   :font-family (:sans tokens/font-family)
   :overflow "hidden"})

(def ^:private header-styles
  {:display "flex"
   :align-items "center"
   :justify-content "space-between"
   :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
   :border-bottom (str "1px solid " (:default (:border tokens/colors)))
   :font-weight (:semibold tokens/font-weight)
   :font-size (:lg tokens/font-size)})

(def ^:private body-styles
  {:flex 1
   :min-height 0})

(def ^:private footer-styles
  {:display "flex"
   :align-items "center"
   :justify-content "flex-end"
   :gap (str (get tokens/spacing 2) "px")
   :padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
   :border-top (str "1px solid " (:default (:border tokens/colors)))})

(defn card
  "Card component for containing content with optional header and footer.
   
   Props:
   - :variant - :default | :outlined | :elevated (default: :default)
   - :interactive - boolean (default: false)
   - :padding - :none | :sm | :md | :lg (default: :md)
   - :radius - :none | :sm | :md | :lg | :full (default: :md)
   - :on-click - click handler for interactive cards
   - :header - header content slot
   - :title - title text (rendered in header if no header slot)
   - :extra - extra header content (e.g., actions)
   - :footer - footer content slot
   
   Example:
   ```clojure
   [card {:variant :elevated :title \"My Card\"}
    \"Card body content\"]
   
   [card {:interactive true :on-click #(js/alert \"clicked\")}
    \"Click me\"]
   ```"
  [{:keys [variant interactive padding radius on-click header title extra footer]
   :or {variant :default
        interactive false
        padding :md
        radius :md}
   :as props}
   & children]
  (let [is-interactive (or interactive (fn? on-click))
        variant-style (variant-styles variant)
        padding-style (padding-styles padding)
        border-radius (radius-styles radius)
        has-header (or header title extra)
        styles (merge base-styles
                     variant-style
                     (when-not (or header footer) padding-style)
                     {:border-radius border-radius
                      :cursor (if is-interactive "pointer" "default")})
        handle-key-down (fn [e]
                         (when (and is-interactive 
                                   (or (= (.-key e) "Enter")
                                       (= (.-key e) " ")))
                           (.preventDefault e)
                           (when on-click (on-click e))))]
    [:div
     (merge
      {:data-component "card"
       :data-variant (name variant)
       :role (when is-interactive "button")
       :tab-index (when is-interactive 0)
       :style styles}
      (when is-interactive
        {:on-click on-click
         :on-key-down handle-key-down})
      (when interactive {:data-interactive true}))
     
     ;; Header section
     (when has-header
       [:div {:style header-styles}
        [:div {:style {:display "flex" :align-items "center" :gap (str (get tokens/spacing 2) "px")}}
         (if header header nil)
         (when (and title (not header))
           [:span title])]
        (when extra [:div extra])])
     
     ;; Body section
     [:div {:style (merge body-styles 
                         (when (or has-header footer) padding-style))}
      children]
     
     ;; Footer section
     (when footer
       [:div {:style footer-styles} footer])]))
