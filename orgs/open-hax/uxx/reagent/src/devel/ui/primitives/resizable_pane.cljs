(ns devel.ui.primitives.resizable-pane
  "ResizablePane component implementing the resizable-pane.edn contract.
   
   A panel that supports bidirectional drag-resize with min/max constraints
   and optional persistence to localStorage.
   
   Usage:
   ```clojure
   [resizable-pane
    {:width 280
     :min-width 180
     :max-width 500
     :direction :left
     :persistence-key \"sidebar-width\"
     :on-resize #(reset! width %)}
    [sidebar-content]]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :direction - :left | :right (which edge has the resize handle)

(defn- load-persisted-width
  "Load width from localStorage if available."
  [key default-width]
  (if-not key
    default-width
    (let [stored (some-> js/window
                         (.-localStorage)
                         (.getItem key))]
      (if (and stored (not= stored ""))
        (let [parsed (js/parseFloat stored)]
          (if (js/isNaN parsed)
            default-width
            parsed))
        default-width))))

(defn- save-persisted-width
  "Save width to localStorage with debounce."
  [key width]
  (when key
    (some-> js/window
            (.-localStorage)
            (.setItem key (str width)))))

(defn- get-window-width
  "Get current window inner width."
  []
  (some-> js/window (.-innerWidth)))

(defn- narrow-layout?
  "Check if we're in narrow layout mode."
  [breakpoint]
  (let [window-width (get-window-width)]
    (and window-width (< window-width (or breakpoint 820)))))

(defn- handle-start
  "Start drag operation."
  [state-atom client-x start-width]
  (swap! state-atom assoc
         :dragging? true
         :start-x client-x
         :start-width start-width)
  (set! (.-cursor (.-style js/document.body)) "col-resize"))

(defn- handle-move
  "Handle drag movement."
  [state-atom direction client-x min-width max-width on-resize]
  (when (:dragging? @state-atom)
    (let [start-x (:start-x @state-atom)
          start-width (:start-width @state-atom)
          dx (- client-x start-x)
          new-width (if (= direction :left)
                      (+ start-width dx)
                      (- start-width dx))
          clamped-width (max (or min-width 100)
                             (min (or max-width 800) new-width))]
      (when on-resize
        (on-resize clamped-width)))))

(defn- handle-end
  "End drag operation."
  [state-atom persistence-key width]
  (when (:dragging? @state-atom)
    (swap! state-atom dissoc :dragging? :start-x :start-width)
    (set! (.-cursor (.-style js/document.body)) "")
    (save-persisted-width persistence-key width)))

(defn resizable-pane
  "Resizable pane component with drag-resize support.
   
   Props:
   - :width - Current width in pixels (default: 240)
   - :min-width - Minimum width constraint (default: 100)
   - :max-width - Maximum width constraint (default: 800)
   - :direction - :left | :right, which edge has handle (default: :right)
   - :persistence-key - localStorage key for persisting width
   - :on-resize - callback when width changes
   - :collapsible - boolean, can pane be collapsed (default: false)
   - :collapsed - boolean, is pane currently collapsed (default: false)
   - :on-collapse - callback when collapse state changes
   - :handle-width - width of resize handle in pixels (default: 3)
   - :show-handle - whether to show the resize handle (default: true)
   - :narrow-layout-breakpoint - window width below which resize is disabled (default: 820)
   
   Example:
   ```clojure
   [resizable-pane
    {:width 280
     :min-width 180
     :max-width 500
     :direction :left
     :persistence-key \"sidebar-width\"}
    [my-sidebar-content]]
   ```"
  [{:keys [width min-width max-width direction persistence-key on-resize
           collapsible collapsed on-collapse handle-width show-handle
           narrow-layout-breakpoint]
    :or {width 240
         min-width 100
         max-width 800
         direction :right
         collapsible false
         collapsed false
         handle-width 3
         show-handle true
         narrow-layout-breakpoint 820}
    :as props}
   & children]
  (let [;; State for drag operation
        state (r/atom {:dragging? false
                       :start-x 0
                       :start-width 0})
        
        ;; Current width (controlled or from persistence)
        current-width (r/atom (load-persisted-width persistence-key width))
        
        ;; Track if event listeners are installed
        listeners-installed? (r/atom false)
        
        ;; Event handlers (stored for cleanup)
        handle-move-fn (atom nil)
        handle-up-fn (atom nil)]
    
    (r/create-class
     {:component-did-mount
      (fn []
        ;; Install global event listeners for drag
        (when-not @listeners-installed?
          (reset! handle-move-fn
                  (fn [e]
                    (when (:dragging? @state)
                      (.preventDefault e)
                      (handle-move state direction (.-clientX e) min-width max-width on-resize))))
          
          (reset! handle-up-fn
                  (fn []
                    (when (:dragging? @state)
                      (handle-end state persistence-key @current-width))))
          
          (.addEventListener js/window "mousemove" @handle-move-fn)
          (.addEventListener js/window "mouseup" @handle-up-fn)
          (reset! listeners-installed? true)))
      
      :component-will-unmount
      (fn []
        ;; Clean up event listeners
        (when @listeners-installed?
          (.removeEventListener js/window "mousemove" @handle-move-fn)
          (.removeEventListener js/window "mouseup" @handle-up-fn)
          (reset! listeners-installed? false)))
      
      :reagent-render
      (fn [{:keys [width min-width max-width direction persistence-key on-resize
                   collapsible collapsed on-collapse handle-width show-handle
                   narrow-layout-breakpoint class style]
            :or {width 240
                 min-width 100
                 max-width 800
                 direction :right
                 collapsible false
                 collapsed false
                 handle-width 3
                 show-handle true
                 narrow-layout-breakpoint 820}
            :as props}
           & children]
        (let [is-narrow (narrow-layout? narrow-layout-breakpoint)
              is-dragging (:dragging? @state)
              effective-width (if collapsed 0 (or width @current-width))
              
              ;; Container styles
              container-style (merge
                               {:width (str effective-width "px")
                                :position "relative"
                                :display "flex"
                                :flex-direction "column"
                                :overflow "hidden"}
                               style)
              
              ;; Handle styles
              handle-style {:position "absolute"
                            (if (= direction :left) :right :left) (- (dec handle-width))
                            :top 0
                            :bottom 0
                            :width (str handle-width "px")
                            :cursor (when-not is-narrow "col-resize")
                            :z-index 2
                            :background-color (if is-dragging
                                                (get-in tokens/colors [:accent :cyan])
                                                "transparent")
                            :transition (str "background-color " (get tokens/duration :fast) " "
                                            (get tokens/easing :easeInOut))}]
          
          [:div.resizable-pane
           {:class class
            :data-component "resizable-pane"
            :data-direction (name direction)
            :data-collapsed (when collapsed true)
            :data-resizing (when is-dragging true)
            :style container-style}
           
           ;; Content
           (into [:div.pane-content
                  {:style {:flex "1"
                           :overflow "hidden"
                           :display (if collapsed "none" "flex")
                           :flex-direction "column"}}]
                 children)
           
           ;; Resize handle (not shown in narrow layout or when collapsed)
           (when (and show-handle (not is-narrow) (not collapsed))
             [:div.resize-handle
              {:on-mouse-down (fn [e]
                                (.preventDefault e)
                                (handle-start state (.-clientX e) effective-width))
               :style handle-style}])]))})))
