(ns devel.ui.tokens
  "Design tokens for Reagent UI components.
   
   These tokens are programmatic equivalents of the TypeScript tokens
   defined in @open-hax/uxx/tokens. They provide consistent styling values
   across React and Reagent implementations."
  (:require [clojure.string :as str]))

;; Monokai Base Palette
(def monokai
  {:bg {:default "#272822"
        :lighter "#3e3d32"
        :darker "#1e1f1c"
        :selection "#49483e"}
   :fg {:default "#f8f8f2"
        :muted "#75715e"
        :subtle "#49483e"}
   :accent {:yellow "#e6db74"
            :orange "#fd971f"
            :red "#f92672"
            :magenta "#ae81ff"
            :blue "#66d9ef"
            :cyan "#a6e22e"
            :green "#a6e22e"}
   :semantic {:error "#f92672"
              :warning "#fd971f"
              :success "#a6e22e"
              :info "#66d9ef"}})

;; Semantic color aliases for components
(def colors
  {:background {:default (:default (:bg monokai))
                :surface (:lighter (:bg monokai))
                :elevated (:selection (:bg monokai))
                :overlay "rgba(0, 0, 0, 0.5)"}
   :text {:default (:default (:fg monokai))
          :muted (:muted (:fg monokai))
          :subtle (:subtle (:fg monokai))
          :inverse (:default (:bg monokai))}
   :interactive {:default (:cyan (:accent monokai))
                 :hover "#8fce26"
                 :active "#7cb824"
                 :disabled (:muted (:fg monokai))}
   :button {:primary {:bg (:cyan (:accent monokai))
                      :fg (:default (:bg monokai))
                      :hover "#8fce26"
                      :active "#7cb824"}
            :secondary {:bg (:lighter (:bg monokai))
                        :fg (:default (:fg monokai))
                        :hover (:selection (:bg monokai))
                        :active "#5a5947"}
            :ghost {:bg "transparent"
                    :fg (:default (:fg monokai))
                    :hover (:lighter (:bg monokai))
                    :active (:selection (:bg monokai))}
            :danger {:bg (:red (:accent monokai))
                     :fg (:default (:fg monokai))
                     :hover "#e61b63"
                     :active "#d1155c"}}
   :badge {:default {:bg (:lighter (:bg monokai))
                     :fg (:default (:fg monokai))}
           :success {:bg "rgba(166, 226, 46, 0.15)"
                     :fg (:cyan (:accent monokai))}
           :warning {:bg "rgba(253, 151, 31, 0.15)"
                     :fg (:orange (:accent monokai))}
           :error {:bg "rgba(249, 38, 114, 0.15)"
                   :fg (:red (:accent monokai))}
           :info {:bg "rgba(102, 217, 239, 0.15)"
                  :fg (:blue (:accent monokai))}}
   :border {:default (:selection (:bg monokai))
            :subtle (:subtle (:fg monokai))
            :focus (:cyan (:accent monokai))
            :error (:red (:accent monokai))}
   :status {:alive (:cyan (:accent monokai))
            :dead (:red (:accent monokai))
            :open (:cyan (:accent monokai))
            :closed (:muted (:fg monokai))
            :merged (:magenta (:accent monokai))
            :sleeping (:blue (:accent monokai))
            :eating (:orange (:accent monokai))
            :working (:yellow (:accent monokai))}})

;; Spacing (4px base unit)
(def spacing
  {0 0
   :px 1
   0.5 2
   1 4
   1.5 6
   2 8
   2.5 10
   3 12
   3.5 14
   4 16
   5 20
   6 24
   7 28
   8 32
   9 36
   10 40
   11 44
   12 48
   14 56
   16 64
   20 80
   24 96
   28 112
   32 128})

;; Semantic spacing aliases
(def space
  {:gap {:xs (spacing 1)
         :sm (spacing 2)
         :md (spacing 3)
         :lg (spacing 4)
         :xl (spacing 6)}
   :padding {:xs (spacing 1)
             :sm (spacing 2)
             :md (spacing 3)
             :lg (spacing 4)
             :xl (spacing 6)}
   :margin {:xs (spacing 1)
            :sm (spacing 2)
            :md (spacing 4)
            :lg (spacing 6)
            :xl (spacing 8)}})

;; Typography
(def font-family
  {:sans (str/join ", " ["Inter" "system-ui" "-apple-system" "BlinkMacSystemFont"
                         "Segoe UI" "Roboto" "Helvetica Neue" "Arial" "sans-serif"])
   :mono (str/join ", " ["JetBrains Mono" "Fira Code" "Monaco" "Consolas"
                         "Liberation Mono" "Courier New" "monospace"])})

(def font-size
  {:xs "0.75rem"
   :sm "0.875rem"
   :base "1rem"
   :lg "1.125rem"
   :xl "1.25rem"
   :2xl "1.5rem"
   :3xl "1.875rem"
   :4xl "2.25rem"
   :5xl "3rem"})

(def font-weight
  {:normal 400
   :medium 500
   :semibold 600
   :bold 700})

(def line-height
  {:none 1
   :tight 1.25
   :snug 1.375
   :normal 1.5
   :relaxed 1.625
   :loose 2})

(def typography
  {:h1 {:font-size (:4xl font-size)
        :font-weight (:bold font-weight)
        :line-height (:tight line-height)}
   :h2 {:font-size (:3xl font-size)
        :font-weight (:bold font-weight)
        :line-height (:tight line-height)}
   :h3 {:font-size (:2xl font-size)
        :font-weight (:semibold font-weight)
        :line-height (:snug line-height)}
   :h4 {:font-size (:xl font-size)
        :font-weight (:semibold font-weight)
        :line-height (:snug line-height)}
   :h5 {:font-size (:lg font-size)
        :font-weight (:semibold font-weight)
        :line-height (:normal line-height)}
   :h6 {:font-size (:base font-size)
        :font-weight (:semibold font-weight)
        :line-height (:normal line-height)}
   :body {:font-size (:base font-size)
          :font-weight (:normal font-weight)
          :line-height (:normal line-height)}
   :bodySm {:font-size (:sm font-size)
            :font-weight (:normal font-weight)
            :line-height (:normal line-height)}
   :label {:font-size (:sm font-size)
           :font-weight (:medium font-weight)
           :line-height (:none line-height)}
   :caption {:font-size (:xs font-size)
             :font-weight (:normal font-weight)
             :line-height (:normal line-height)}
   :code {:font-family (:mono font-family)
          :font-size (:sm font-size)
          :font-weight (:normal font-weight)
          :line-height (:normal line-height)}})

;; Motion
(def duration
  {:instant 0
   :fast "100ms"
   :normal "200ms"
   :slow "300ms"
   :slower "500ms"
   :slowest "700ms"})

(def easing
  {:linear "linear"
   :easeIn "cubic-bezier(0.4, 0, 1, 1)"
   :easeOut "cubic-bezier(0, 0, 0.2, 1)"
   :easeInOut "cubic-bezier(0.4, 0, 0.2, 1)"
   :standard "cubic-bezier(0.4, 0, 0.2, 1)"
   :decelerate "cubic-bezier(0, 0, 0.2, 1)"
   :accelerate "cubic-bezier(0.4, 0, 1, 1)"})

(def transitions
  {:all (str "all " (:normal duration) " " (:easeInOut easing))
   :colors (str "color, background-color, border-color " (:fast duration) " " (:easeInOut easing))
   :opacity (str "opacity " (:fast duration) " " (:easeInOut easing))
   :transform (str "transform " (:normal duration) " " (:easeInOut easing))})

;; Shadows
(def shadow
  {:xs "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
   :sm "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
   :md "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
   :lg "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
   :xl "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
   :focus "0 0 0 2px rgba(166, 226, 46, 0.5)"
   :focusError "0 0 0 2px rgba(249, 38, 114, 0.5)"
   :none "none"})

;; Z-index scale
(def z-index
  {:hide -1
   :base 0
   :dropdown 1000
   :sticky 1100
   :fixed 1200
   :modalBackdrop 1300
   :modal 1400
   :popover 1500
   :tooltip 1600
   :toast 1700
   :top 9999})
