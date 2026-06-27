(ns devel.ui.primitives.tooltip
  "Tooltip component implementing the tooltip.edn contract.
   
   Tooltip overlay that appears on hover or focus, with configurable positioning.
   
   Usage:
   ```clojure
   [tooltip {:content \"This is a tooltip\"}
    [button \"Hover me\"]]
   
   [tooltip {:content \"Helpful info\" :placement :right}
    [:span \"?\"]]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]
            [react-dom :as react-dom]))

;; Types derived from contract
;; :placement - :top | :bottom | :left | :right | :top-start | :top-end | :bottom-start | :bottom-end
;; :trigger - :hover | :focus | :hover-focus | :click

(def ^:private tooltip-styles
  {:position "fixed"
   :background-color "#1e1f1c"
   :color "#f8f8f2"
   :font-size (:xs tokens/font-size)
   :line-height 1.4
   :padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
   :border-radius (str (get tokens/spacing 1) "px")
   :box-shadow (:md tokens/shadow)
   :z-index (:tooltip tokens/z-index)
   :pointer-events "none"
   :max-width "250px"
   :word-wrap "break-word"})

(def ^:private arrow-styles
  {:position "absolute"
   :width 0
   :height 0
   :border "4px solid transparent"})

(defn- calculate-position
  [placement trigger-rect tooltip-rect offset]
  (let [result {:top 0 :left 0 :arrow-style arrow-styles}]
    (case placement
      :top
      (assoc result
             :top (- (:top trigger-rect) (:height tooltip-rect) offset)
             :left (+ (:left trigger-rect) (/ (- (:width trigger-rect) (:width tooltip-rect)) 2))
             :arrow-style (merge arrow-styles
                                 {:top "100%"
                                  :left "50%"
                                  :margin-left "-4px"
                                  :border-top-color "#1e1f1c"}))
      
      :bottom
      (assoc result
             :top (+ (:bottom trigger-rect) offset)
             :left (+ (:left trigger-rect) (/ (- (:width trigger-rect) (:width tooltip-rect)) 2))
             :arrow-style (merge arrow-styles
                                 {:bottom "100%"
                                  :left "50%"
                                  :margin-left "-4px"
                                  :border-bottom-color "#1e1f1c"}))
      
      :left
      (assoc result
             :top (+ (:top trigger-rect) (/ (- (:height trigger-rect) (:height tooltip-rect)) 2))
             :left (- (:left trigger-rect) (:width tooltip-rect) offset)
             :arrow-style (merge arrow-styles
                                 {:left "100%"
                                  :top "50%"
                                  :margin-top "-4px"
                                  :border-left-color "#1e1f1c"}))
      
      :right
      (assoc result
             :top (+ (:top trigger-rect) (/ (- (:height trigger-rect) (:height tooltip-rect)) 2))
             :left (+ (:right trigger-rect) offset)
             :arrow-style (merge arrow-styles
                                 {:right "100%"
                                  :top "50%"
                                  :margin-top "-4px"
                                  :border-right-color "#1e1f1c"}))
      
      :top-start
      (assoc result
             :top (- (:top trigger-rect) (:height tooltip-rect) offset)
             :left (:left trigger-rect)
             :arrow-style (merge arrow-styles
                                 {:top "100%"
                                  :left "8px"
                                  :border-top-color "#1e1f1c"}))
      
      :top-end
      (assoc result
             :top (- (:top trigger-rect) (:height tooltip-rect) offset)
             :left (- (:right trigger-rect) (:width tooltip-rect))
             :arrow-style (merge arrow-styles
                                 {:top "100%"
                                  :right "8px"
                                  :border-top-color "#1e1f1c"}))
      
      :bottom-start
      (assoc result
             :top (+ (:bottom trigger-rect) offset)
             :left (:left trigger-rect)
             :arrow-style (merge arrow-styles
                                 {:bottom "100%"
                                  :left "8px"
                                  :border-bottom-color "#1e1f1c"}))
      
      :bottom-end
      (assoc result
             :top (+ (:bottom trigger-rect) offset)
             :left (- (:right trigger-rect) (:width tooltip-rect))
             :arrow-style (merge arrow-styles
                                 {:bottom "100%"
                                  :right "8px"
                                  :border-bottom-color "#1e1f1c"}))
      
      ;; default
      result)))

(defn tooltip
  "Tooltip overlay that appears on hover or focus.
   
   Props:
   - :content - node (required) - content to display in tooltip
   - :placement - :top | :bottom | :left | :right | :top-start | :top-end | :bottom-start | :bottom-end (default: :top)
   - :trigger - :hover | :focus | :hover-focus | :click (default: :hover)
   - :delay - number in ms (default: 200)
   - :hide-delay - number in ms (default: 0)
   - :disabled - boolean (default: false)
   - :offset - number in px (default: 8)
   - :arrow - boolean (default: true)
   - :interactive - boolean (default: false)
   
   Example:
   ```clojure
   [tooltip {:content \"Helpful tooltip\"}
    [button \"Hover me\"]]
   ```"
  [{:keys [content placement trigger delay hide-delay disabled offset arrow interactive]
   :or {placement :top
        trigger :hover
        delay 200
        hide-delay 0
        disabled false
        offset 8
        arrow true
        interactive false}
   :as props}
   child]
  (let [visible (r/atom false)
        position (r/atom {:top 0 :left 0 :arrow-style arrow-styles})
        trigger-ref (atom nil)
        tooltip-ref (atom nil)
        show-timeout (atom nil)
        hide-timeout (atom nil)]
    (r/create-class
     {:component-will-unmount
      (fn []
        (when @show-timeout (js/clearTimeout @show-timeout))
        (when @hide-timeout (js/clearTimeout @hide-timeout)))
      
      :reagent-render
      (fn [props child]
        (if disabled
          child
          (let [show-tooltip (fn []
                              (when @hide-timeout (js/clearTimeout @hide-timeout))
                              (reset! show-timeout
                                      (js/setTimeout
                                       (fn []
                                         (reset! visible true)
                                         ;; Calculate position after render
                                         (js/requestAnimationFrame
                                          (fn []
                                            (when (and @trigger-ref @tooltip-ref)
                                              (let [trigger-rect (.getBoundingClientRect @trigger-ref)
                                                    tooltip-rect (.getBoundingClientRect @tooltip-ref)
                                                    new-pos (calculate-position placement
                                                                               (js->clj trigger-rect :keywordize-keys true)
                                                                               (js->clj tooltip-rect :keywordize-keys true)
                                                                               offset)]
                                                (reset! position new-pos))))))
                                       delay)))
                
                hide-tooltip (fn []
                              (when @show-timeout (js/clearTimeout @show-timeout))
                              (reset! hide-timeout
                                      (js/setTimeout
                                       (fn [] (reset! visible false))
                                       hide-delay)))
                
                trigger-props
                (merge
                 (when (or (= trigger :hover) (= trigger :hover-focus))
                   {:on-mouse-enter show-tooltip
                    :on-mouse-leave hide-tooltip})
                 (when (or (= trigger :focus) (= trigger :hover-focus))
                   {:on-focus show-tooltip
                    :on-blur hide-tooltip})
                 (when (= trigger :click)
                   {:on-click #(swap! visible not)}))
                
                tooltip-content
                (when @visible
                  [:div
                   {:ref #(reset! tooltip-ref %)
                    :role "tooltip"
                    :data-component "tooltip"
                    :data-placement (name placement)
                    :data-visible @visible
                    :style (merge tooltip-styles
                                 {:top (:top @position)
                                  :left (:left @position)
                                  :pointer-events (when interactive "auto")})
                    :on-mouse-enter (when interactive show-tooltip)
                    :on-mouse-leave (when interactive hide-tooltip)}
                   content
                   (when arrow
                     [:div {:style (:arrow-style @position)}])])]
            [:<>
             [:div
              (merge {:ref #(reset! trigger-ref %)
                      :style {:display "inline-block"}}
                     trigger-props)
              child]
             (when tooltip-content
               (react-dom/createPortal tooltip-content js/document.body))])))})))
