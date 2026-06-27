(ns devel.ui.primitives.progress
  "Progress component implementing the progress.edn contract.
   
   Progress indicator for showing completion status of a task.
   
   Usage:
   ```clojure
   [progress {:value 60}]
   
   [progress {:indeterminate true}]
   
   [progress {:value 100 :variant :success :show-value true}]
   ```"
  (:require [devel.ui.tokens :as tokens]))

;; Types derived from contract
;; :variant - :default | :success | :warning | :error | :gradient
;; :size - :sm | :md | :lg

(defn- size-styles [size]
  (case size
    :sm {:height "4px"}
    :lg {:height "12px"}
    ;; default :md
    {:height "8px"}))

(def ^:private variant-colors
  {:default "#66d9ef"
   :success "#a6e22e"
   :warning "#fd971f"
   :error "#f92672"
   :gradient "linear-gradient(90deg, #a6e22e, #66d9ef, #ae81ff)"})

(def ^:private track-styles
  {:background-color (:subtle (:background tokens/colors))
   :border-radius (str (get tokens/spacing 1) "px")
   :overflow :hidden
   :width "100%"})

(def ^:private bar-styles
  {:height "100%"
   :border-radius (str (get tokens/spacing 1) "px")
   :transition "width 200ms ease-out"})

(def ^:private value-label-styles
  {:font-size (:xs tokens/font-size)
   :color (:muted (:text tokens/colors))
   :margin-top (str (get tokens/spacing 1) "px")
   :text-align :right})

(def ^:private indeterminate-keyframes
  "@keyframes devel-progress-indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }")

(defonce style-injected (atom false))

(defn- inject-keyframes []
  (when (and js/document (not @style-injected))
    (let [style (.createElement js/document "style")]
      (set! (.-textContent style) indeterminate-keyframes)
      (.appendChild (.-head js/document) style)
      (reset! style-injected true))))

(defn progress
  "Progress indicator for showing completion status.
   
   Props:
   - :value - number (0-100) - current progress value
   - :max - number (default: 100) - maximum value
   - :variant - :default | :success | :warning | :error | :gradient (default: :default)
   - :size - :sm | :md | :lg (default: :md)
   - :indeterminate - boolean (default: false)
   - :animated - boolean (default: true)
   - :show-value - boolean (default: false)
   - :label - string - accessible label
   
   Example:
   ```clojure
   [progress {:value 60}]
   
   [progress {:indeterminate true}]
   
   [progress {:value 100 :variant :success :show-value true}]
   ```"
  [{:keys [value max variant size indeterminate animated show-value label]
   :or {value 0
        max 100
        variant :default
        size :md
        indeterminate false
        animated true
        show-value false}
   :as props}]
  (inject-keyframes)
  (let [percentage (min 100 (max 0 (* (/ value max) 100)))
        track-style (merge track-styles (size-styles size))
        color (get variant-colors variant)
        bar-style (merge bar-styles
                        (if (= variant :gradient)
                          {:background color}
                          {:background-color color})
                        (if indeterminate
                          {:position :absolute
                           :top 0
                           :left 0
                           :height "100%"
                           :width "50%"
                           :animation "devel-progress-indeterminate 1.5s infinite ease-in-out"}
                          {:width (str percentage "%")})
                        (when-not animated {:transition :none}))]
    [:div
     [:div
      {:role "progressbar"
       :data-component "progress"
       :data-variant (name variant)
       :data-size (name size)
       :data-indeterminate (when indeterminate true)
       :aria-valuemin 0
       :aria-valuemax max
       :aria-valuenow (when-not indeterminate value)
       :aria-label label
       :style track-style}
      [:div {:style bar-style}]]
     (when (and show-value (not indeterminate))
       [:div {:style value-label-styles}
        (str (js/Math.round percentage) "%")])]))
