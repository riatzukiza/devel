(ns devel.ui.helix.primitives.badge
  "Badge component for status indicators and labels.
   
   Usage:
   ```clojure
   ($ badge {:variant :success} \"Active\")
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc]]
            [helix.dom :as d]))

(defn- variant-styles [variant]
  (case variant
    :success {:background-color (:bg (:success (:badge tokens/colors)))
              :color (:fg (:success (:badge tokens/colors)))}
    :warning {:background-color (:bg (:warning (:badge tokens/colors)))
              :color (:fg (:warning (:badge tokens/colors)))}
    :error {:background-color (:bg (:error (:badge tokens/colors)))
            :color (:fg (:error (:badge tokens/colors)))}
    :info {:background-color (:bg (:info (:badge tokens/colors)))
           :color (:fg (:info (:badge tokens/colors)))}
    ;; default
    {:background-color (:bg (:default (:badge tokens/colors)))
     :color (:fg (:default (:badge tokens/colors)))}))

(def ^:private base-styles
  {:display "inline-flex"
   :align-items "center"
   :justify-content "center"
   :padding (str (get tokens/spacing 0.5) "px " (get tokens/spacing 2) "px")
   :border-radius (str (get tokens/spacing 1) "px")
   :font-size (:font-size (:caption tokens/typography))
   :font-weight (:medium tokens/font-weight)
   :line-height (:none tokens/line-height)
   :font-family (:sans tokens/font-family)})

(defnc badge
  "Badge component for status indicators and labels.
   
   Props:
   - :variant - :default | :success | :warning | :error | :info (default: :default)
   
   Example:
   ```clojure
   ($ badge {:variant :success} \"Active\")
   ($ badge {:variant :error} \"Failed\")
   ```"
  [{:keys [variant children]
    :or {variant :default}}]
  (let [styles (merge base-styles (variant-styles variant))]
    (d/span
     {:data-component "badge"
      :data-variant (name variant)
      :style styles}
     children)))
