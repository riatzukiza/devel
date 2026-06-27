(ns devel.ui.helix.primitives.modal
  "Modal component for dialogs and overlays.
   
   Usage:
   ```clojure
   ($ modal {:open? open? :on-close #(set-open? false)}
      ($ modal-header {} \"Title\")
      ($ modal-body {} \"Content\")
      ($ modal-footer {} \"Actions\"))
   ```"
  (:require [devel.ui.helix.tokens :as tokens]
            [helix.core :refer [defnc $]]
            [helix.dom :as d]))

(defnc modal-backdrop
  "Modal backdrop overlay."
  [{:keys [on-click]}]
  (d/div
   {:data-component "modal-backdrop"
    :style {:position "fixed"
            :inset 0
            :background-color (:overlay (:background tokens/colors))
            :z-index (:modalBackdrop tokens/z-index)}
    :on-click on-click}))

(defnc modal
  "Modal dialog component.
   
   Props:
   - :open? - boolean to control visibility (default: false)
   - :on-close - callback when modal should close
   - :size - :sm | :md | :lg | :full (default: :md)
   
   Example:
   ```clojure
   ($ modal {:open? @open? :on-close #(reset! open? false)}
      \"Modal content\")
   ```"
  [{:keys [open? on-close size children]
    :or {open? false
         size :md}}]
  (when open?
    (let [width (case size
                  :sm "400px"
                  :lg "800px"
                  :full "95vw"
                  ;; default :md
                  "600px")]
      (d/div
       {:data-component "modal"
        :data-size (name size)}
       ($ modal-backdrop {:on-click on-close})
       (d/div
        {:role "dialog"
         :aria-modal true
         :style {:position "fixed"
                 :top "50%"
                 :left "50%"
                 :transform "translate(-50%, -50%)"
                 :width width
                 :max-width "95vw"
                 :max-height "90vh"
                 :overflow "auto"
                 :background-color (:default (:background tokens/colors))
                 :border-radius (str (get tokens/spacing 3) "px")
                 :box-shadow (:xl tokens/shadow)
                 :z-index (:modal tokens/z-index)}}
        children)))))

(defnc modal-header
  "Modal header section with close button."
  [{:keys [on-close children]}]
  (d/div
   {:data-component "modal-header"
    :style {:display "flex"
            :justify-content "space-between"
            :align-items "center"
            :padding (str (get tokens/spacing 4) "px")
            :border-bottom (str "1px solid " (:default (:border tokens/colors)))
            :font-weight (:semibold tokens/font-weight)
            :font-size (:font-size (:lg tokens/font-size))}}
   children
   (when on-close
     (d/button
      {:on-click on-close
       :style {:background "none"
               :border "none"
               :font-size (:font-size (:xl tokens/font-size))
               :cursor "pointer"
               :color (:muted (:text tokens/colors))}}
      "×"))))

(defnc modal-body
  "Modal body section."
  [{:keys [children]}]
  (d/div
   {:data-component "modal-body"
    :style {:padding (str (get tokens/spacing 4) "px")}}
   children))

(defnc modal-footer
  "Modal footer section for actions."
  [{:keys [children]}]
  (d/div
   {:data-component "modal-footer"
    :style {:display "flex"
            :justify-content "flex-end"
            :gap (str (get tokens/spacing 2) "px")
            :padding (str (get tokens/spacing 4) "px")
            :border-top (str "1px solid " (:default (:border tokens/colors)))}}
   children))
