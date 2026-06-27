(ns devel.ui.helix.primitives.progress
  "Progress component for loading indicators.
   
   Usage:
   ```clojure
   ($ progress {:value 75 :max 100 :variant :default})
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc]]
            [helix.dom :as d]))

(defn- variant-colors [variant]
  (case variant
    :success (:success (:semantic tokens/monokai))
    :warning (:warning (:semantic tokens/monokai))
    :error (:error (:semantic tokens/monokai))
    ;; default
    (:cyan (:accent tokens/monokai))))

(defnc progress
  "Progress bar component.
   
   Props:
   - :value - current progress value (default: 0)
   - :max - maximum progress value (default: 100)
   - :variant - :default | :success | :warning | :error (default: :default)
   - :size - :sm | :md | :lg (default: :md)
   - :show-label - boolean to show percentage label (default: false)
   
   Example:
   ```clojure
   ($ progress {:value 75 :variant :success})
   ($ progress {:value 50 :show-label true})
   ```"
  [{:keys [value max variant size show-label]
    :or {value 0
         max 100
         variant :default
         size :md
         show-label false}}]
  (let [percentage (min 100 (max 0 (* (/ value max) 100)))
        height (case size
                 :sm "4px"
                 :lg "12px"
                 ;; default :md
                 "8px")
        bar-color (variant-colors variant)]
    (d/div
     {:data-component "progress"
      :data-variant (name variant)
      :data-size (name size)
      :style {:width "100%"}}
     (when show-label
       (d/div
        {:style {:display "flex"
                 :justify-content "space-between"
                 :margin-bottom (str (get tokens/spacing 1) "px")
                 :font-size (:font-size (:sm tokens/font-size))
                 :color (:muted (:text tokens/colors))}}
        (d/span {} (str (js/Math.round percentage) "%"))))
     (d/div
      {:role "progressbar"
       :aria-valuenow value
       :aria-valuemin 0
       :aria-valuemax max
       :style {:width "100%"
               :height height
               :background-color "#3e3d32"
               :border-radius (str (get tokens/spacing 1) "px")
               :overflow "hidden"}}
      (d/div
       {:style {:width (str percentage "%")
                :height "100%"
                :background-color bar-color
                :transition (:transform tokens/transitions)}})))))
