(ns devel.ui.helix.primitives.tooltip
  "Tooltip component for contextual information.
   
   Usage:
   ```clojure
   ($ tooltip {:text \"Helpful info\" :position :top}
      ($ button {} \"Hover me\"))
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc $]]
            [helix.hooks :as hooks]
            [helix.dom :as d]))

(defn- position-styles [position]
  (case position
    :top {:bottom "100%"
          :left "50%"
          :transform "translateX(-50%)"
          :margin-bottom "8px"}
    :bottom {:top "100%"
             :left "50%"
             :transform "translateX(-50%)"
             :margin-top "8px"}
    :left {:right "100%"
           :top "50%"
           :transform "translateY(-50%)"
           :margin-right "8px"}
    :right {:left "100%"
            :top "50%"
            :transform "translateY(-50%)"
            :margin-left "8px"}
    ;; default :top
    {:bottom "100%"
     :left "50%"
     :transform "translateX(-50%)"
     :margin-bottom "8px"}))

(defnc tooltip
  "Tooltip wrapper component.
   
   Props:
   - :text - tooltip content string
   - :position - :top | :bottom | :left | :right (default: :top)
   
   Example:
   ```clojure
   ($ tooltip {:text \"Click to submit\"}
      ($ button {} \"Submit\"))
   ```"
  [{:keys [text position children]
    :or {position :top}}]
  (let [[visible? set-visible] (hooks/use-state false)]
    (d/div
     {:data-component "tooltip"
      :style {:position "relative"
              :display "inline-block"}
      :on-mouse-enter #(set-visible true)
      :on-mouse-leave #(set-visible false)}
     children
     (when (and visible? text)
       (d/div
        {:role "tooltip"
         :style (merge
                 {:position "absolute"
                  :z-index (:tooltip tokens/z-index)
                  :padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
                  :background-color "#1e1f1c"
                  :color "#f8f8f2"
                  :border-radius (str (get tokens/spacing 1) "px")
                  :font-size (:font-size (:sm tokens/font-size))
                  :white-space "nowrap"
                  :pointer-events "none"}
                 (position-styles position))}
        text)))))
