(ns promethean.sessions.types
  "Session type definitions for Cephalon")

;; ============================================================================
;; Session Status
;; ============================================================================

(def status-idle :idle)
(def status-ready :ready)
(def status-blocked :blocked)

;; ============================================================================
;; Session Priority Classes
;; ============================================================================

(def priority-interactive :interactive)
(def priority-operational :operational)
(def priority-maintenance :maintenance)

;; ============================================================================
;; Session Constructor
;; ============================================================================

(defn make-session
  [{:keys [id cephalon-id name priority-class credits recent-buffer
           subscriptions tool-permissions persona attention-focus focus]
    :or {priority-class priority-operational
         credits 100
         recent-buffer []
         tool-permissions #{}
         subscriptions {:hard-locked true
                        :filters []}
         attention-focus ""}}]
  {:session/id id
   :session/cephalon-id cephalon-id
   :session/name name
   :session/priority-class priority-class
   :session/credits credits
   :session/recent-buffer recent-buffer
   :session/subscriptions subscriptions
   :session/tool-permissions tool-permissions
   :session/persona persona
   :session/attention-focus attention-focus
   :session/focus focus
   :session/status status-idle
   :session/queue []})

;; ============================================================================
;; Cephalon Constructor
;; ============================================================================

(defn make-cephalon
  [{:keys [id name policy shared-state sessions]
    :or {policy {}
         shared-state {}
         sessions []}}]
  {:cephalon/id id
   :cephalon/name name
   :cephalon/policy policy
   :cephalon/shared-state shared-state
   :cephalon/sessions (set sessions)})
