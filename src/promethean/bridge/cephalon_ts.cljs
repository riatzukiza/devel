;;; cephalon-ts.cljs - Bridge to TypeScript Cephalon implementation
;;;
;;; This namespace provides a ClojureScript interface to the TypeScript
;;; Cephalon implementation (@promethean-os/cephalon-ts). It handles
;;; the async nature of the TS module and provides a clean CLJS API.

(ns promethean.bridge.cephalon-ts
  (:require
   ["@promethean-os/cephalon-ts" :as cephalon-ts]))

;; ============================================================================
;; Type Definitions (for documentation)
;; ============================================================================

;; CephalonAppOptions:
;; {:discordToken string
;;  :policy map
;;  :uiPort number
;;  :enableProactiveLoop boolean
;;  :tickIntervalMs number
;;  :mongoUri string}

;; CephalonApp:
;; {:policy map
;;  :eventBus object
;;  :memoryStore object
;;  :chromaStore object
;;  :sessionManager object
;;  :discord object
;;  :start (-> promise)
;;  :stop (-> promise)}

;; ============================================================================
;; Bridge Functions
;; ============================================================================

(defn create-cephalon-app!
  "Create a new Cephalon application instance.

   Args:
     - options: map with keys:
       - :discordToken (optional) Discord bot token
       - :policy (optional) Cephalon policy map
       - :uiPort (optional) UI server port
       - :enableProactiveLoop (optional) Enable proactive behavior loop
       - :tickIntervalMs (optional) Tick interval in milliseconds
       - :mongoUri (optional) MongoDB connection URI

   Returns:
     A promise that resolves to a CephalonApp instance.

   Example:
     (create-cephalon-app!
       {:discordToken \"...\"
        :enableProactiveLoop true
        :tickIntervalMs 15000})"
  ([]
   (create-cephalon-app! {}))
  ([options]
   (let [opts (clj->js options)]
     (.then (cephalon-ts/createCephalonApp opts)
            (fn [app]
              ;; Convert to CLJS-friendly format with keyword keys
              (js->clj app :keywordize-keys true))))))

(defn start-cephalon!
  "Start a Cephalon application instance.

   Args:
     - app: CephalonApp instance from create-cephalon-app!

   Returns:
     A promise that resolves when the app is started."
  [app]
  (.start app))

(defn stop-cephalon!
  "Stop a Cephalon application instance.

   Args:
     - app: CephalonApp instance from create-cephalon-app!
     - signal (optional): Signal string passed to stop

   Returns:
     A promise that resolves when the app is stopped."
  ([app]
   (stop-cephalon! app nil))
  ([app signal]
   (.stop app signal)))

;; ============================================================================
;; Convenience Wrappers
;; ============================================================================

(defn create-and-start-cephalon!
  "Create and start a Cephalon app in one call.

   This is a convenience function that combines create-cephalon-app!
   and start-cephalon!.

   Args:
     - options: Same as create-cephalon-app!

   Returns:
     A promise that resolves to a started CephalonApp instance."
  ([]
   (create-and-start-cephalon! {}))
  ([options]
   (-> (create-cephalon-app! options)
       (.then (fn [app]
                (-> (start-cephalon! app)
                    (.then (constantly app))))))))

;; ============================================================================
;; Accessor Functions
;; ============================================================================

(defn get-policy
  "Get the policy from a CephalonApp instance."
  [app]
  (.-policy app))

(defn get-event-bus
  "Get the event bus from a CephalonApp instance."
  [app]
  (.-eventBus app))

(defn get-memory-store
  "Get the memory store from a CephalonApp instance."
  [app]
  (.-memoryStore app))

(defn get-session-manager
  "Get the session manager from a CephalonApp instance."
  [app]
  (.-sessionManager app))

(defn get-discord
  "Get the Discord integration from a CephalonApp instance."
  [app]
  (.-discord app))

;; ============================================================================
;; Default Configuration
;; ============================================================================

(def default-options
  "Default options for Cephalon app creation."
  {:enableProactiveLoop true
   :tickIntervalMs 15000
   :uiPort 3000})

(defn with-defaults
  "Merge options with default options."
  [options]
  (merge default-options options))
