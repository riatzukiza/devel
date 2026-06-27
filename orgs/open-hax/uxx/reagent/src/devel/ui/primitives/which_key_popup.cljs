(ns devel.ui.primitives.which-key-popup
  "WhichKeyPopup component implementing the which-key-popup.edn contract.
   
   A popup that displays available keybindings when a prefix key is pressed,
   following Emacs which-key conventions.
   
   Usage:
   ```clojure
   [which-key-popup
    {:active @show-popup
     :prefix [\"SPC\" \"f\"]
     :bindings [{:key \"f\" :description \"Find file\" :category \"File\"}
                {:key \"s\" :description \"Save file\" :category \"File\"}
                {:key \"d\" :description \"Delete file\" :category \"File\" :destructive true}]
     :position :bottom}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]
            [clojure.string :as str]))

;; Types derived from contract
;; :position - :bottom | :top | :auto
;; :sort-key - :key | :description | :none

(defn- sort-bindings
  "Sort bindings by the specified key."
  [bindings sort-key]
  (case sort-key
    :key (sort-by :key bindings)
    :description (sort-by :description bindings)
    :none bindings
    bindings))

(defn- group-by-category
  "Group bindings by category."
  [bindings show-category?]
  (if show-category?
    (group-by :category bindings)
    {nil bindings}))

(defn- render-binding
  "Render a single binding entry."
  [{:keys [key description destructive] :as binding} on-select]
  (let [key-style {:font-family (:mono tokens/font-family)
                   :font-size (get-in tokens/typography [:code :font-size])
                   :color (if destructive
                            (get-in tokens/colors [:accent :pink])
                            (get-in tokens/colors [:accent :cyan]))
                   :background (get-in tokens/colors [:background :surface])
                   :padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
                   :border-radius (str (get tokens/spacing 0.5) "px")
                   :min-width "40px"
                   :text-align "center"}
        desc-style {:color (get-in tokens/colors [:text :muted])
                    :font-size (get-in tokens/typography [:bodySm :font-size])}]
    [:div.binding-row
     {:style {:display "flex"
              :justify-content "space-between"
              :align-items "center"
              :padding (str (get tokens/spacing 1) "px 0")
              :cursor (when on-select "pointer")
              :gap (str (get tokens/spacing 3) "px")}
      :on-click (when on-select #(on-select binding))}
     [:span.key {:style key-style} key]
     [:span.description {:style desc-style} description]]))

(defn- render-category-group
  "Render a category group with header."
  [category bindings on-select]
  [:div.category-group
   {:style {:margin-bottom (str (get tokens/spacing 3) "px")}}
   (when category
     [:div.category-header
      {:style {:font-size (get-in tokens/typography [:bodySm :font-size])
               :font-weight (:medium tokens/font-weight)
               :color (get-in tokens/colors [:text :subtle])
               :text-transform "uppercase"
               :letter-spacing "0.05em"
               :margin-bottom (str (get tokens/spacing 1) "px")}}
      category])
   (into [:div.bindings]
         (for [binding bindings]
           ^{:key (:key binding)}
           [render-binding binding on-select]))])

(defn- compute-position-style
  "Compute position styles based on position prop."
  [position]
  (case position
    :top {:top "30px"
          :bottom "auto"}
    :bottom {:bottom "30px"
             :top "auto"}
    :auto {:bottom "30px"
           :top "auto"}
    {:bottom "30px"
     :top "auto"}))

(defn which-key-popup
  "Popup component displaying available keybindings.
   
   Props:
   - :active - boolean, whether popup is visible (default: false)
   - :prefix - array of strings, the key sequence prefix (default: [])
   - :bindings - array of binding maps, required
   - :position - :bottom | :top | :auto (default: :bottom)
   - :max-columns - number (default: 3)
   - :sort-key - :key | :description | :none (default: :key)
   - :show-category - boolean (default: true)
   - :timeout-ms - number, auto-dismiss timeout (default: 0 = disabled)
   - :on-select - callback when binding is selected
   
   Example:
   ```clojure
   [which-key-popup
    {:active true
     :prefix [\"SPC\" \"f\"]
     :bindings [{:key \"f\" :description \"Find file\"}
                {:key \"s\" :description \"Save file\"}]}]
   ```"
  [{:keys [active prefix bindings position max-columns sort-key show-category
           timeout-ms on-select]
    :or {active false
         prefix []
         position :bottom
         max-columns 3
         sort-key :key
         show-category true
         timeout-ms 0}
    :as props}]
  (let [;; Auto-dismiss timer
        timer-ref (r/atom nil)
        
        ;; Sorted and grouped bindings
        sorted (sort-bindings bindings sort-key)
        grouped (group-by-category sorted show-category)]
    
    (r/create-class
     {:component-did-update
      (fn [_ _]
        ;; Handle auto-dismiss timeout
        (when @timer-ref
          (js/clearTimeout @timer-ref)
          (reset! timer-ref nil))
        (when (and active (> timeout-ms 0))
          (reset! timer-ref
                  (js/setTimeout
                   #(when on-select (on-select nil))
                   timeout-ms))))
      
      :component-will-unmount
      (fn []
        (when @timer-ref
          (js/clearTimeout @timer-ref)))
      
      :reagent-render
      (fn [{:keys [active prefix bindings position max-columns sort-key show-category
                   timeout-ms on-select]
            :or {active false
                 prefix []
                 position :bottom
                 max-columns 3
                 sort-key :key
                 show-category true
                 timeout-ms 0}
            :as props}]
        (let [position-style (compute-position-style position)
              
              ;; Container styles
              container-style (merge
                               {:position "fixed"
                                :left "50%"
                                :transform "translateX(-50%)"
                                :background-color (get-in tokens/colors [:background :elevated])
                                :border (str "1px solid " (get-in tokens/colors [:border :default]))
                                :border-radius (str (get tokens/spacing 1) "px")
                                :padding (str (get tokens/spacing 3) "px")
                                :box-shadow (get tokens/shadow :lg)
                                :z-index (get tokens/z-index :tooltip)
                                :max-width "800px"
                                :max-height "60vh"
                                :overflow-y "auto"
                                :font-family (:sans tokens/font-family)
                                :opacity (if active 1 0)
                                :visibility (if active "visible" "hidden")
                                :transition (str "opacity " (get tokens/duration :fast) " "
                                                (get tokens/easing :easeInOut) ", "
                                                "visibility " (get tokens/duration :fast) " "
                                                (get tokens/easing :easeInOut))}
                               position-style)
              
              ;; Title style
              title-style {:margin (str "0 0 " (get tokens/spacing 2) "px 0")
                           :font-size (get-in tokens/typography [:body :font-size])
                           :font-weight (:medium tokens/font-weight)
                           :color (get-in tokens/colors [:text :default])}
              
              ;; Grid style for columns
              grid-style {:display "grid"
                          :grid-template-columns (str "repeat(" max-columns ", 1fr)")
                          :gap (str (get tokens/spacing 4) "px")}]
          
          [:div.which-key-popup
           {:data-component "which-key-popup"
            :data-active active
            :data-position (name position)
            :style container-style}
           
           ;; Title showing prefix
           [:div.which-key-title
            {:style title-style}
            (str "Prefix: " (str/join " " prefix))]
           
           ;; Bindings grid
           [:div.which-key-bindings
            {:style grid-style}
            (for [[category category-bindings] grouped]
              ^{:key (or category "uncategorized")}
              [render-category-group category category-bindings on-select])]]))})))
