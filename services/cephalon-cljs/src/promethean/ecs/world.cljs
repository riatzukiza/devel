(ns promethean.ecs.world
  "ECS World - core data structure for entity-component-system architecture")

;; ============================================================================
;; World Structure
;; ============================================================================

(defrecord World
  [tick                     ;; current tick number
   time-ms                  ;; current time in milliseconds
   entities                 ;; map of entity-id -> entity
   events-in                ;; incoming events for this tick
   events-out               ;; events emitted this tick
   effects                  ;; side effects to execute
   env                      ;; environment (config, clients, adapters)
   debug])                  ;; debug state

(defn empty-world
  "Create an empty world with default values"
  []
  (assoc (->World 0 0 {} [] [] [] {:config {} :clients {} :adapters {}} {})
         :effects/pending {}
         :effects/stats {:started 0 :done 0 :failed 0}))

(defn get-entity
  "Get entity by ID, returns nil if not found"
  [world eid]
  (get (:entities world) eid))

(defn add-entity
  "Add a new entity to the world"
  ([world eid components]
   (update world :entities assoc eid components))
  ([world eid key value & kvs]
   (let [components (apply hash-map key value kvs)]
     (add-entity world eid components))))

(defn update-entity
  "Update an entity's components"
  [world eid f & args]
  (update-in world [:entities eid] (fn [entity] (if entity (apply f entity args) nil))))

(defn remove-entity
  "Remove an entity from the world"
  [world eid]
  (update world :entities dissoc eid))

(defn entities-with
  "Find all entity IDs that have all the specified component keys"
  [world & keys]
  (let [required-keys (if (and (= 1 (count keys)) (vector? (first keys)))
                        (first keys)
                        keys)
        required-set (set required-keys)]
    (filter (fn [eid]
              (let [entity (get-entity world eid)]
                (and entity
                      (every? #(contains? entity %) required-set))))
            (keys (:entities world)))))

;; ============================================================================
;; Component Queries
;; ============================================================================

(defn get-component
  "Get a specific component from an entity"
  [world eid component-key]
  (get (get-entity world eid) component-key))

(defn set-component
  "Set a specific component on an entity"
  [world eid component-key value]
  (update-entity world eid assoc component-key value))

;; ============================================================================
;; Event Helpers
;; ============================================================================

(defn emit-event
  "Add an event to the output queue"
  [world event]
  (update world :events-out conj event))

(defn emit-effect
  "Add an effect to the execution queue"
  [world effect]
  (update world :effects conj effect))

;; ============================================================================
;; World Updates
;; ============================================================================

(defn advance-tick
  "Advance the world to the next tick"
  [world dt]
  (-> world
      (update :tick inc)
      (assoc :time-ms (+ (:time-ms world) dt))))
