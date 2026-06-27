(ns devel.ui.helix.primitives.card
  "Card component for content containers.
   
   Usage:
   ```clojure
   ($ card {:variant :elevated}
      ($ card-header {} \"Title\")
      ($ card-body {} \"Content\")
      ($ card-footer {} \"Actions\"))
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc]]
            [helix.dom :as d]))

(defn- variant-styles [variant]
  (case variant
    :elevated {:background-color (:elevated (:background tokens/colors))
               :box-shadow (:md tokens/shadow)}
    :outlined {:background-color (:default (:background tokens/colors))
               :border (str "1px solid " (:default (:border tokens/colors)))
               :box-shadow (:none tokens/shadow)}
    ;; default :flat
    {:background-color (:surface (:background tokens/colors))
     :box-shadow (:none tokens/shadow)}))

(def ^:private base-styles
  {:border-radius (str (get tokens/spacing 2) "px")
   :overflow "hidden"
   :font-family (:sans tokens/font-family)})

(defnc card
  "Card container component.
   
   Props:
   - :variant - :flat | :elevated | :outlined (default: :flat)
   - :padding - boolean or padding value (default: true)
   
   Example:
   ```clojure
   ($ card {:variant :elevated}
      \"Card content\")
   ```"
  [{:keys [variant padding children]
    :or {variant :flat
         padding true}}]
  (let [styles (merge base-styles
                      (variant-styles variant)
                      (when padding
                        {:padding (if (number? padding)
                                    (str padding "px")
                                    (str (get tokens/spacing 4) "px"))}))]
    (d/div
     {:data-component "card"
      :data-variant (name variant)
      :style styles}
     children)))

(defnc card-header
  "Card header section."
  [{:keys [children]}]
  (d/div
   {:data-component "card-header"
    :style {:padding-bottom (str (get tokens/spacing 3) "px")
            :border-bottom (str "1px solid " (:subtle (:border tokens/colors)))
            :margin-bottom (str (get tokens/spacing 3) "px")
            :font-weight (:semibold tokens/font-weight)}}
   children))

(defnc card-body
  "Card body section."
  [{:keys [children]}]
  (d/div
   {:data-component "card-body"
    :style {:color (:default (:text tokens/colors))}}
   children))

(defnc card-footer
  "Card footer section."
  [{:keys [children]}]
  (d/div
   {:data-component "card-footer"
    :style {:margin-top (str (get tokens/spacing 4) "px")
            :padding-top (str (get tokens/spacing 3) "px")
            :border-top (str "1px solid " (:subtle (:border tokens/colors)))
            :display "flex"
            :gap (str (get tokens/spacing 2) "px")}}
   children))
