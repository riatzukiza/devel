(ns devel.ui.primitives.react-reagent-seam
  "ReactReagentSeam component implementing the react-reagent-seam.edn contract.
   
   An adapter pattern for embedding Reagent (ClojureScript React wrapper) components
   inside a React host application, enabling bidirectional state sharing and event communication.
   
   Usage:
   ```clojure
   [react-reagent-seam
    {:host-state host-atom
     :render-donor (fn [adapter] [donor-component adapter])
     :render-host (fn [adapter] [host-component adapter])
     :on-mount #(println \"mounted\")
     :on-unmount #(println \"unmounted\")}]
   ```"
  (:require [devel.ui.tokens :as tokens]
            [reagent.core :as r]))

;; Types derived from contract
;; :atom-like - any reactive container supporting deref and swap!
;; :adapter - {:ready-state reaction, :host-count reaction, :event-count reaction,
;;             :increment-host-count! fn, :emit-donor-event! fn}

(defn create-adapter
  "Create an adapter for host/donor state sharing.
   
   Returns a map with:
   - :ready-state - reaction returning 'ready' or 'booting'
   - :host-count - reaction returning host count
   - :event-count - reaction returning event count
   - :increment-host-count! - function to increment host count
   - :emit-donor-event! - function to emit donor event"
  [host-state]
  {:ready-state (r/track #(if (:mounted? @host-state) "ready" "booting"))
   :host-count (r/track #(:host-count @host-state 0))
   :event-count (r/track #(:event-count @host-state 0))
   :increment-host-count! #(swap! host-state update :host-count (fnil inc 0))
   :emit-donor-event! #(swap! host-state update :event-count (fnil inc 0))})

(defn- get-scope-styles
  "Generate scoped CSS for the seam container."
  [scope-class]
  (str
   "." scope-class " {"
   "display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);"
   "gap:" (get tokens/spacing 4) "px;"
   "padding:" (get tokens/spacing 4) "px;"
   "background:" (get-in tokens/colors [:background :elevated]) ";"
   "min-height:100%;"
   "color:" (get-in tokens/colors [:text :default]) ";"
   "font-family:" (:default tokens/font-family) ";"
   "}"
   "." scope-class " *{box-sizing:border-box;}"
   "." scope-class " .host-panel,"
   "." scope-class " .donor-panel{"
   "border:1px solid " (get-in tokens/colors [:border :default]) ";"
   "border-radius:" (get tokens/spacing 1) "px;"
   "padding:" (get tokens/spacing 3) "px;"
   "background:" (get-in tokens/colors [:background :surface]) ";"
   "}"
   "." scope-class " h2," scope-class " h3{margin:0 0 " (get tokens/spacing 2) "px 0;}"
   "." scope-class " p{margin:" (get tokens/spacing 1) "px 0;color:" (get-in tokens/colors [:text :secondary]) ";}"
   "." scope-class " button{"
   "margin-top:" (get tokens/spacing 2) "px;"
   "background:" (get-in tokens/colors [:accent :cyan] "#66d9ef") ";"
   "color:" (get-in tokens/colors [:background :default]) ";"
   "border:0;border-radius:" (get tokens/spacing 0.5) "px;"
   "padding:" (get tokens/spacing 2) "px " (get tokens/spacing 3) "px;"
   "cursor:pointer;"
   "font-size:" (get-in tokens/typography [:bodySm :font-size]) ";"
   "}"
   "." scope-class " button:hover{opacity:0.9;}"
   "." scope-class " .status{"
   "display:inline-block;"
   "padding:" (get tokens/spacing 1) "px " (get tokens/spacing 2) "px;"
   "border-radius:" (get tokens/spacing 0.5) "px;"
   "background:" (get-in tokens/colors [:accent :green] "rgba(166, 226, 46, 0.2)") ";"
   "color:" (get-in tokens/colors [:accent :green] "#a6e22e") ";"
   "font-size:" (get-in tokens/typography [:bodySm :font-size]) ";"
   "}"
   "." scope-class " strong{color:" (get-in tokens/colors [:text :default]) ";}"))

(defn react-reagent-seam
  "Adapter seam for embedding Reagent in React and vice versa.
   
   Props:
   - :host-ready? - reactive container for host ready state (optional, internal if not provided)
   - :host-state - reactive container for shared host/donor state (required)
   - :render-donor - function (adapter) => ReactNode (required)
   - :render-host - function (adapter) => ReactNode (required)
   - :scope-class - CSS class for scoping styles (default: 'react-host-seam-scope')
   - :on-mount - callback when seam is mounted (optional)
   - :on-unmount - callback when seam is unmounted (optional)
   
   Adapter shape:
   {:ready-state reaction   ; 'ready' or 'booting'
    :host-count reaction    ; host count value
    :event-count reaction   ; event count value
    :increment-host-count! fn
    :emit-donor-event! fn}
   
   Example:
   ```clojure
   (let [host-state (r/atom {:mounted? false :host-count 0 :event-count 0})]
     [react-reagent-seam
      {:host-state host-state
       :render-donor (fn [adapter]
                       [:div.donor-panel
                        [:h3 \"Donor\"]
                        [:p \"Count: \" @(get adapter :host-count)]])
       :render-host (fn [adapter]
                      [:div.host-panel
                       [:h2 \"Host\"]
                       [:p \"Events: \" @(get adapter :event-count)]])}])
   ```"
  [{:keys [host-ready? host-state render-donor render-host scope-class on-mount on-unmount]
    :or {scope-class "react-host-seam-scope"}
    :as props}]
  (when (nil? host-state)
    (throw (js/Error. "react-reagent-seam: host-state is required")))
  (when (nil? render-donor)
    (throw (js/Error. "react-reagent-seam: render-donor is required")))
  (when (nil? render-host)
    (throw (js/Error. "react-reagent-seam: render-host is required")))
  
  (let [internal-state (or host-state (r/atom {:mounted? false :host-count 0 :event-count 0}))
        adapter (create-adapter internal-state)]
    (r/create-class
     {:component-did-mount
      (fn []
        (swap! internal-state assoc :mounted? true)
        (when on-mount (on-mount)))
      
      :component-will-unmount
      (fn []
        (swap! internal-state assoc :mounted? false)
        (when on-unmount (on-unmount)))
      
      :reagent-render
      (fn [{:keys [scope-class] :or {scope-class "react-host-seam-scope"}}]
        [:section
         {:data-component "react-reagent-seam"
          :data-host-ready @(get adapter :ready-state)
          :role "region"
          :aria-label "Hybrid React/Reagent container"
          :class scope-class}
         
         ;; Inject scoped styles
         [:style (get-scope-styles scope-class)]
         
         ;; Host panel
         [:article.host-panel
          {:data-testid "host-panel"}
          [render-host adapter]]
         
         ;; Donor panel
         [:article.donor-panel
          {:data-testid "donor-panel"}
          [render-donor adapter]]])})))
