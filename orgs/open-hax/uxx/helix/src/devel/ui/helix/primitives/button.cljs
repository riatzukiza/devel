(ns devel.ui.helix.primitives.button
  "Button component implementing the button.edn contract.
   
   Provides consistent button styling across Helix applications.
   
   Usage:
   ```clojure
   ($ button {:variant :primary :on-click #(js/alert \"Clicked!\")}
      \"Click me\")
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc $]]
            [helix.hooks :as hooks]
            [helix.dom :as d]))

;; Types derived from contract
;; :variant - :primary | :secondary | :ghost | :danger
;; :size - :sm | :md | :lg

(defn- variant-styles [variant]
  (case variant
    :primary {:background-color (:bg (:primary (:button tokens/colors)))
              :color (:fg (:primary (:button tokens/colors)))
              :border "none"}
    :secondary {:background-color (:bg (:secondary (:button tokens/colors)))
                :color (:fg (:secondary (:button tokens/colors)))
                :border (str "1px solid " (:default (:border tokens/colors)))}
    :ghost {:background-color "transparent"
            :color (:fg (:ghost (:button tokens/colors)))
            :border "none"}
    :danger {:background-color (:bg (:danger (:button tokens/colors)))
             :color (:fg (:danger (:button tokens/colors)))
             :border "none"}
    ;; default
    {:background-color (:bg (:secondary (:button tokens/colors)))
     :color (:fg (:secondary (:button tokens/colors)))
     :border (str "1px solid " (:default (:border tokens/colors)))}))

(defn- size-styles [size]
  (case size
    :sm {:padding (str (get tokens/spacing 1.5) "px " (get tokens/spacing 3) "px")
         :font-size (:font-size (:bodySm tokens/typography))
         :gap (str (get tokens/spacing 1) "px")}
    :lg {:padding (str (get tokens/spacing 3) "px " (get tokens/spacing 6) "px")
         :font-size (:font-size (:body tokens/typography))
         :gap (str (get tokens/spacing 2) "px")}
    ;; default :md
    {:padding (str (get tokens/spacing 2) "px " (get tokens/spacing 4) "px")
     :font-size (:font-size (:body tokens/typography))
     :gap (str (get tokens/spacing 2) "px")}))

(def ^:private base-styles
  {:display "inline-flex"
   :align-items "center"
   :justify-content "center"
   :font-weight (:medium tokens/font-weight)
   :line-height (:none tokens/line-height)
   :border-radius (str (get tokens/spacing 1.5) "px")
   :cursor "pointer"
   :transition (:colors tokens/transitions)
   :outline "none"
   :font-family (:sans tokens/font-family)})

(defnc loading-spinner
  "Loading spinner SVG for button loading state."
  [{:keys [size]}]
  (let [spinner-size (case size
                       :sm 14
                       :lg 20
                       16)]
    (d/svg {:width spinner-size
            :height spinner-size
            :viewBox "0 0 24 24"
            :fill "none"
            :stroke "currentColor"
            :stroke-width 2
            :stroke-linecap "round"
            :stroke-linejoin "round"
            :style {:animation "spin 1s linear infinite"}}
      (d/path {:d "M21 12a9 9 0 11-6.219-8.56"}))))

(defnc button
  "Button component with variants, sizes, and loading state.
   
   Props:
   - :variant - :primary | :secondary | :ghost | :danger (default: :secondary)
   - :size - :sm | :md | :lg (default: :md)
   - :disabled - boolean (default: false)
   - :loading - boolean, shows spinner and disables click (default: false)
   - :full-width - boolean, makes button full width (default: false)
   - :icon-start - Helix element for icon before text
   - :icon-end - Helix element for icon after text
   - :on-click - click handler function
   - :type - :button | :submit | :reset (default: :button)
   
   Example:
   ```clojure
   ($ button {:variant :primary :on-click #(js/alert \"Hi!\")}
      \"Click me\")
   
   ($ button {:variant :danger :loading true}
      \"Deleting...\")
   ```"
  [{:keys [variant size disabled loading full-width icon-start icon-end on-click type children]
    :or {variant :secondary
         size :md
         disabled false
         loading false
         full-width false
         type :button}}]
  (let [is-disabled (or disabled loading)
        styles (merge base-styles
                      (variant-styles variant)
                      (size-styles size)
                      {:width (when full-width "100%")
                       :opacity (when is-disabled 0.6)
                       :cursor (if is-disabled "not-allowed" "pointer")})]
    (d/button
     {:type (name type)
      :disabled is-disabled
      :data-component "button"
      :data-variant (name variant)
      :data-size (name size)
      :data-loading (when loading true)
      :data-full-width (when full-width true)
      :aria-busy loading
      :style styles
      :on-click (when-not is-disabled on-click)}
     (when loading
       ($ loading-spinner {:size size}))
     (when (and (not loading) icon-start)
       icon-start)
     children
     (when (and (not loading) icon-end)
       icon-end))))
