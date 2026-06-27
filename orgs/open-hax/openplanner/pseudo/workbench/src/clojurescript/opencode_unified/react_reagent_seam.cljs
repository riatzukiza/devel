(ns opencode-unified.react-reagent-seam
  "React host + Reagent donor adapter seam spike."
  (:require [reagent.core :as r]))

(def spike-route "#/react-reagent-spike")

(defn spike-route?
  "Returns true when the route targets the seam spike host view."
  [route]
  (= route spike-route))

(defn- create-adapter
  "Adapter seam contract for donor integration.

  Contract:
  - host publishes ready/host state via tracks
  - donor triggers host events via explicit callbacks
  - CSS stays scoped to `.react-host-seam-scope`"
  [host-state]
  {:ready-state (r/track #(if (:mounted? @host-state) "ready" "booting"))
   :host-count (r/track #(:host-count @host-state))
   :event-count (r/track #(:event-count @host-state))
   :increment-host-count! #(swap! host-state update :host-count (fnil inc 0))
   :emit-donor-event! #(swap! host-state update :event-count (fnil inc 0))})

(defn- donor-panel [adapter]
  [:aside
   {:class "reagent-donor-panel"
    :data-testid "reagent-donor-panel"}
   [:h3 "Reagent Donor Panel"]
   [:p
    [:span "Host count handoff: "]
    [:strong {:data-testid "donor-host-count"} @(get adapter :host-count)]]
   [:button
    {:type "button"
     :data-testid "donor-event-trigger"
     :on-click #(let [emit! (get adapter :emit-donor-event!)]
                  (emit!))}
    "Emit donor event"]])

(defn react-host-route []
  (let [host-state (r/atom {:mounted? false
                            :host-count 0
                            :event-count 0})
        adapter (create-adapter host-state)]
    (r/create-class
     {:component-did-mount #(swap! host-state assoc :mounted? true)
      :reagent-render
      (fn []
        [:section
         {:class "react-host-seam-scope"
          :data-testid "react-host-route"}
         [:style
          (str
           ".react-host-seam-scope {"
           "display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);"
           "gap:1rem;padding:1.25rem;background:#12171b;min-height:100vh;color:#e6edf3;"
           "font-family:'SF Mono','Monaco','Inconsolata','Fira Code',monospace;}"
           ".react-host-seam-scope *{box-sizing:border-box;}"
           ".react-host-seam-scope .host-panel,.react-host-seam-scope .reagent-donor-panel{"
           "border:1px solid #2d3743;border-radius:10px;padding:1rem;background:#19212a;}"
           ".react-host-seam-scope h2,.react-host-seam-scope h3{margin:0 0 0.75rem 0;}"
           ".react-host-seam-scope p{margin:0.35rem 0;color:#9fb0c2;}"
           ".react-host-seam-scope button{margin-top:0.5rem;background:#2a6f97;color:#f5fbff;"
           "border:0;border-radius:6px;padding:0.45rem 0.7rem;cursor:pointer;}"
           ".react-host-seam-scope button:hover{background:#3b85b0;}"
           ".react-host-seam-scope .status{display:inline-block;padding:0.15rem 0.45rem;"
           "border-radius:4px;background:#1f5132;color:#d9ffe8;font-size:0.85rem;}"
           ".react-host-seam-scope strong{color:#ffffff;}")]
         [:article {:class "host-panel"}
          [:h2 "React Host Route (Seam Spike)"]
          [:p
           [:span "Adapter ready state: "]
           [:span {:class "status" :data-testid "adapter-ready-state"}
            @(get adapter :ready-state)]]
          [:p
           [:span "Host event count: "]
           [:strong {:data-testid "host-event-count"} @(get adapter :event-count)]]
          [:p
           [:span "Host state count: "]
           [:strong {:data-testid "host-count-value"} @(get adapter :host-count)]]
          [:button
           {:type "button"
            :data-testid "host-count-increment"
            :on-click #(let [increment! (get adapter :increment-host-count!)]
                         (increment!))}
           "Increment host count"]]
         [donor-panel adapter]])})))
