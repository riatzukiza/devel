(ns devel.ui.helix.primitives.spinner
  "Spinner component for loading states.
   
   Usage:
   ```clojure
   ($ spinner {:size :md})
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc]]
            [helix.dom :as d]))

(defn- size-styles [size]
  (case size
    :sm {:width 16 :height 16}
    :lg {:width 32 :height 32}
    ;; default :md
    {:width 24 :height 24}))

(defnc spinner
  "Spinner component for loading states.
   
   Props:
   - :size - :sm | :md | :lg (default: :md)
   - :color - CSS color value (default: currentColor)
   
   Example:
   ```clojure
   ($ spinner {:size :lg})
   ($ spinner {:size :sm :color \"#a6e22e\"})
   ```"
  [{:keys [size color]
    :or {size :md
         color "currentColor"}}]
  (let [styles (size-styles size)]
    (d/svg
     {:width (:width styles)
      :height (:height styles)
      :viewBox "0 0 24 24"
      :fill "none"
      :stroke color
      :stroke-width 2
      :stroke-linecap "round"
      :stroke-linejoin "round"
      :style {:animation "spin 1s linear infinite"
              :display "inline-block"}
      :data-component "spinner"
      :data-size (name size)}
     (d/path {:d "M21 12a9 9 0 11-6.219-8.56"}))))
