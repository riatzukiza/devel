(ns devel.ui.primitives.badge
  "Badge component implementing the badge.edn contract.
   
   Compact status or category indicator with variant styling.
   
   Usage:
   ```clojure
   [badge {:variant :success} \"Active\"]
   [badge {:variant :warning :dot true} \"Running\"]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

(defn- variant-styles [variant]
  (case variant
    :default {:bg (get-in tokens/colors [:badge :default :bg])
              :fg (get-in tokens/colors [:badge :default :fg])}
    :success {:bg (get-in tokens/colors [:badge :success :bg])
              :fg (get-in tokens/colors [:badge :success :fg])}
    :warning {:bg (get-in tokens/colors [:badge :warning :bg])
              :fg (get-in tokens/colors [:badge :warning :fg])}
    :error {:bg (get-in tokens/colors [:badge :error :bg])
            :fg (get-in tokens/colors [:badge :error :fg])}
    :info {:bg (get-in tokens/colors [:badge :info :bg])
           :fg (get-in tokens/colors [:badge :info :fg])}
    ;; default
    {:bg (get-in tokens/colors [:badge :default :bg])
     :fg (get-in tokens/colors [:badge :default :fg])}))

(defn- size-styles [size]
  (case size
    :sm {:padding (str (get tokens/spacing 0.5) "px " (get tokens/spacing 1.5) "px")
         :font-size (:xs tokens/font-size)
         :gap (str (get tokens/spacing 0.5) "px")}
    :lg {:padding (str (get tokens/spacing 1.5) "px " (get tokens/spacing 3) "px")
         :font-size (:sm tokens/font-size)
         :gap (str (get tokens/spacing 1) "px")}
    ;; default :md
    {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
     :font-size (:xs tokens/font-size)
     :gap (str (get tokens/spacing 0.5) "px")}))

(def ^:private base-styles
  {:display "inline-flex"
   :align-items "center"
   :justify-content "center"
   :font-weight (:medium tokens/font-weight)
   :line-height (:none tokens/line-height)
   :border-radius (str (get tokens/spacing 1) "px")
   :font-family (:sans tokens/font-family)
   :white-space "nowrap"})

(defn- status-dot [color size]
  (let [dot-size (case size
                   :sm 6
                   :lg 10
                   8)]
    [:span {:style {:width dot-size
                    :height dot-size
                    :border-radius "50%"
                    :background-color color
                    :flex-shrink 0}}]))

(defn badge
  "Badge component for status and category indicators.
   
   Props:
   - :variant - :default | :success | :warning | :error | :info (default: :default)
   - :size - :sm | :md | :lg (default: :md)
   - :dot - boolean, shows status dot (default: false)
   - :rounded - boolean, uses pill-shaped corners (default: false)
   - :outline - boolean, uses outline style (default: false)
   
   Example:
   ```clojure
   [badge {:variant :success} \"Active\"]
   [badge {:variant :warning :dot true} \"Running\"]
   ```"
  [{:keys [variant size dot rounded outline]
   :or {variant :default
        size :md
        dot false
        rounded false
        outline false}
   :as props}
   & children]
  (let [{:keys [bg fg]} (variant-styles variant)
        size-style (size-styles size)
        styles (merge base-styles
                     size-style
                     {:background-color (if outline "transparent" bg)
                      :color (if outline bg fg)
                      :border (if outline (str "1px solid " bg) "none")
                      :border-radius (if rounded "9999px" (str (get tokens/spacing 1) "px"))})]
    [:span
     (merge
      {:data-component "badge"
       :data-variant (name variant)
       :data-size (name size)
       :role "status"
       :aria-label (name variant)
       :style styles}
      (when dot {:data-dot true})
      (when rounded {:data-rounded true})
      (when outline {:data-outline true}))
     (when dot
       [status-dot (if outline bg fg) size])
     children]))
