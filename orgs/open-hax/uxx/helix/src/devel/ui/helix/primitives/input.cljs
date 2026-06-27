(ns devel.ui.helix.primitives.input
  "Input component for forms.
   
   Usage:
   ```clojure
   ($ input {:type :text
             :placeholder \"Enter value\"
             :value @value
             :on-change #(reset! value (.. % -target -value))})
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc]]
            [helix.hooks :as hooks]
            [helix.dom :as d]))

(defn- size-styles [size]
  (case size
    :sm {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
         :font-size (:font-size (:sm tokens/font-size))}
    :lg {:padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
         :font-size (:font-size (:lg tokens/font-size))}
    ;; default :md
    {:padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
     :font-size (:font-size (:base tokens/font-size))}))

(def ^:private base-styles
  {:width "100%"
   :border-radius (str (get tokens/spacing 1.5) "px")
   :border (str "1px solid " (:default (:border tokens/colors)))
   :background-color (:surface (:background tokens/colors))
   :color (:default (:text tokens/colors))
   :font-family (:sans tokens/font-family)
   :outline "none"
   :transition (:colors tokens/transitions)})

(defnc input
  "Input component for text entry.
   
   Props:
   - :type - :text | :password | :email | :number (default: :text)
   - :size - :sm | :md | :lg (default: :md)
   - :disabled - boolean (default: false)
   - :error - boolean for error state (default: false)
   - :placeholder - placeholder text
   - :value - controlled value
   - :on-change - change handler
   - :on-focus - focus handler
   - :on-blur - blur handler
   
   Example:
   ```clojure
   ($ input {:placeholder \"Email\"
             :type :email
             :value @email
             :on-change #(reset! email (.. % -target -value))})
   ```"
  [{:keys [type size disabled error placeholder value on-change on-focus on-blur]
    :or {type :text
         size :md
         disabled false
         error false}}]
  (let [[focused? set-focused] (hooks/use-state false)
        styles (merge base-styles
                      (size-styles size)
                      {:border-color (cond
                                       error (:error (:border tokens/colors))
                                       focused? (:focus (:border tokens/colors))
                                       :else (:default (:border tokens/colors)))
                       :box-shadow (cond
                                     error (:focusError tokens/shadow)
                                     focused? (:focus tokens/shadow)
                                     :else (:none tokens/shadow))
                       :cursor (when disabled "not-allowed")
                       :opacity (when disabled 0.6)})]
    (d/input
     {:type (name type)
      :data-component "input"
      :data-size (name size)
      :data-error (when error true)
      :disabled disabled
      :placeholder placeholder
      :value value
      :style styles
      :on-focus (fn [e]
                  (set-focused true)
                  (when on-focus (on-focus e)))
      :on-blur (fn [e]
                 (set-focused false)
                 (when on-blur (on-blur e)))
      :on-change on-change})))
