(ns devel.ui.primitives.spinner
  "Spinner component implementing the spinner.edn contract.
   
   Loading indicator with customizable size and color.
   
   Usage:
   ```clojure
   [spinner {:size :lg}]
   [spinner {:size :sm :color \"#22d3ee\"}]
   ```"
  (:require [devel.ui.tokens :as tokens]))

;; Types derived from contract
;; :size - :sm | :md | :lg | :xl

(def ^:private size-values
  {:sm 14
   :md 16
   :lg 20
   :xl 24})

(def ^:private spin-animation
  "devel-ui-spin 1s linear infinite")

(defn spinner
  "Spinner component for loading states.
   
   Props:
   - :size - :sm | :md | :lg | :xl (default: :md)
   - :color - CSS color value (default: \"currentColor\")
   - :thickness - stroke thickness (default: 2.5)
   - :label - accessible label (default: \"Loading\")
   
   Example:
   ```clojure
   [spinner {:size :lg}]
   [spinner {:size :sm :color \"#22d3ee\"}]
   ```"
  [{:keys [size color thickness label]
   :or {size :md
        color "currentColor"
        thickness 2.5
        label "Loading"}}]
  (let [dimension (get size-values size)
        stroke-width thickness
        c (or color "currentColor")]
    [:svg
     (merge
      {:data-component "spinner"
       :data-size (name size)
       :role "status"
       :aria-busy "true"
       :aria-label label
       :width dimension
       :height dimension
       :view-box "0 0 24 24"
       :fill "none"
       :stroke c
       :stroke-width stroke-width
       :stroke-linecap "round"
       :style {:animation spin-animation}})
     [:path {:d "M21 12a9 9 0 11-6.219-8.56"}]]))
