(ns devel.ui.primitives.input
  "Input component implementing the input.edn contract.
   
   Text input field with validation states, icons, and sizing.
   
   Usage:
   ```clojure
   [input {:placeholder \"Enter your name\"}]
   
   [input {:type :email
           :placeholder \"Email\"
           :error true
           :error-message \"Invalid email format\"}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :type - :text | :password | :email | :number | :search | :url | :tel
;; :size - :sm | :md | :lg
;; :variant - :default | :filled | :unstyled

(defn- size-styles [size]
  (case size
    :sm {:padding (str (get tokens/spacing 1) "px " (get tokens/spacing 2) "px")
         :font-size (:sm tokens/font-size)}
    :lg {:padding (str (get tokens/spacing 3) "px " (get tokens/spacing 4) "px")
         :font-size (:lg tokens/font-size)}
    ;; default :md
    {:padding (str (get tokens/spacing 2) "px " (get tokens/spacing 3) "px")
     :font-size (:base tokens/font-size)}))

(defn- variant-styles [variant]
  (case variant
    :filled {:background-color (:subtle (:background tokens/colors))
             :border "1px solid transparent"}
    :unstyled {:background-color "transparent"
               :border :none
               :padding 0}
    ;; default :default
    {:background-color (:default (:background tokens/colors))
     :border (str "1px solid " (:default (:border tokens/colors)))}))

(def ^:private base-styles
  {:width "100%"
   :font-family (:sans tokens/font-family)
   :color (:default (:text tokens/colors))
   :border-radius (str (get tokens/spacing 1) "px")
   :outline :none
   :transition (:colors tokens/transitions)})

(def ^:private error-styles
  {:border-color (:error (:border tokens/colors))})

(def ^:private disabled-styles
  {:background-color (:subtle (:background tokens/colors))
   :color (:muted (:text tokens/colors))
   :cursor :not-allowed
   :opacity 0.7})

(def ^:private focus-styles
  {:border-color (:focus (:border tokens/colors))
   :box-shadow (str "0 0 0 2px " (:focus (:border tokens/colors)) "33")})

(def ^:private error-message-styles
  {:font-size (:xs tokens/font-size)
   :color (:error (:text tokens/colors))
   :margin-top (str (get tokens/spacing 1) "px")})

(defn input
  "Text input field with validation states, icons, and sizing.
   
   Props:
   - :type - :text | :password | :email | :number | :search | :url | :tel (default: :text)
   - :value - string - current value
   - :default-value - string - default value for uncontrolled input
   - :placeholder - string
   - :size - :sm | :md | :lg (default: :md)
   - :variant - :default | :filled | :unstyled (default: :default)
   - :disabled - boolean (default: false)
   - :readonly - boolean (default: false)
   - :required - boolean (default: false)
   - :error - boolean (default: false)
   - :error-message - string
   - :left-icon - node
   - :right-icon - node
   - :on-change - function
   - :on-focus - function
   - :on-blur - function
   - :name - string
   - :id - string
   - :auto-focus - boolean
   - :auto-complete - string
   - :max-length - number
   - :min-length - number
   - :pattern - string
   
   Example:
   ```clojure
   [input {:placeholder \"Enter your name\"}]
   
   [input {:type :email
           :placeholder \"Email\"
           :error true
           :error-message \"Invalid email\"}]
   ```"
  [{:keys [type value default-value placeholder size variant disabled readonly required
           error error-message left-icon right-icon on-change on-focus on-blur
           name id auto-focus auto-complete max-length min-length pattern]
   :or {type :text
        size :md
        variant :default
        disabled false
        readonly false
        required false
        error false}
   :as props}]
  (let [focused (r/atom false)]
    (fn [props]
      (let [is-focused @focused
            handle-focus (fn [e]
                          (reset! focused true)
                          (when on-focus (on-focus e)))
            handle-blur (fn [e]
                         (reset! focused false)
                         (when on-blur (on-blur e)))
            input-styles (merge base-styles
                               (variant-styles variant)
                               (when (not= variant :unstyled) (size-styles size))
                               (when error error-styles)
                               (when disabled disabled-styles)
                               (when (and is-focused (not disabled) (not= variant :unstyled)) focus-styles)
                               (when (and left-icon (not= variant :unstyled)) {:padding-left "32px"})
                               (when (and right-icon (not= variant :unstyled)) {:padding-right "32px"}))]
        [:div {:style {:position "relative" :width "100%"}}
         (when (and left-icon (not= variant :unstyled))
           [:div {:style {:position "absolute"
                          :top "50%"
                          :transform "translateY(-50%)"
                          :left (str (get tokens/spacing 2) "px")
                          :color (:muted (:text tokens/colors))
                          :pointer-events :none}}
            left-icon])
         [:input
          (merge
           {:data-component "input"
            :data-size (name size)
            :data-variant (name variant)
            :data-error (when error true)
            :data-disabled (when disabled true)
            :type (name type)
            :placeholder placeholder
            :disabled disabled
            :read-only readonly
            :required required
            :name name
            :id id
            :auto-focus auto-focus
            :auto-complete auto-complete
            :max-length max-length
            :min-length min-length
            :pattern pattern
            :style input-styles
            :on-change on-change
            :on-focus handle-focus
            :on-blur handle-blur
            :aria-invalid error
            :aria-describedby (when (and error error-message) (str id "-error"))}
           (when value {:value value})
           (when default-value {:default-value default-value}))]
         (when (and right-icon (not= variant :unstyled))
           [:div {:style {:position "absolute"
                          :top "50%"
                          :transform "translateY(-50%)"
                          :right (str (get tokens/spacing 2) "px")
                          :color (:muted (:text tokens/colors))
                          :pointer-events :none}}
            right-icon])
         (when (and error error-message)
           [:div {:id (str id "-error")
                  :role "alert"
                  :style error-message-styles}
            error-message])]))))
