(ns eta-mu.runtime.shape.compat)

(def belief-key->internal
  {:urgency :urgency
   :ambiguity :ambiguity
   :socialFriction :social-friction
   :social-friction :social-friction
   :deployRisk :deploy-risk
   :deploy-risk :deploy-risk
   :reviewDebt :review-debt
   :review-debt :review-debt
   :drift :drift
   :crust :crust
   :bloomNeed :bloom-need
   :bloom-need :bloom-need
   :userIntentConfidence :user-intent-confidence
   :user-intent-confidence :user-intent-confidence})

(def belief-key->external
  {:urgency :urgency
   :ambiguity :ambiguity
   :social-friction :socialFriction
   :deploy-risk :deployRisk
   :review-debt :reviewDebt
   :drift :drift
   :crust :crust
   :bloom-need :bloomNeed
   :user-intent-confidence :userIntentConfidence})

(def candidate-key->internal
  {:id :id
   :kind :kind
   :target :target
   :reason :reason
   :confidence :confidence
   :costClass :cost-class
   :cost-class :cost-class
   :reversibility :reversibility
   :needsProof :needs-proof
   :needs-proof :needs-proof})

(def candidate-key->external
  {:id :id
   :kind :kind
   :target :target
   :reason :reason
   :confidence :confidence
   :cost-class :costClass
   :reversibility :reversibility
   :needs-proof :needsProof})

(defn- contains-any?
  [m keys]
  (boolean (some #(contains? m %) keys)))

(defn- first-present
  ([m keys]
   (first-present m keys nil))
  ([m keys default-value]
   (if-let [key (first (filter #(contains? m %) keys))]
     (get m key)
     default-value)))

(defn- maybe-keyword
  [value]
  (cond
    (keyword? value) value
    (string? value) (keyword value)
    :else value))

(defn- maybe-name
  [value]
  (cond
    (keyword? value) (name value)
    :else value))

(defn belief-from-external
  "Convert a JS-compatible belief map to the internal kebab-key shape."
  [belief]
  (reduce-kv
   (fn [acc external-key internal-key]
     (if (contains? belief external-key)
       (assoc acc internal-key (get belief external-key))
       acc))
   {}
   belief-key->internal))

(defn belief->external
  "Convert an internal belief map to the current public camelCase shape."
  [belief]
  (reduce-kv
   (fn [acc internal-key external-key]
     (assoc acc external-key (get belief internal-key)))
   {}
   belief-key->external))

(defn panel-from-external
  [panel]
  (maybe-keyword panel))

(defn panel->external
  [panel]
  (maybe-name panel))

(defn candidate-from-external
  "Convert a JS-compatible candidate map to the internal shape."
  [candidate]
  (reduce-kv
   (fn [acc external-key internal-key]
     (if (contains? candidate external-key)
       (assoc acc internal-key
              (if (#{:kind :cost-class :reversibility} internal-key)
                (maybe-keyword (get candidate external-key))
                (get candidate external-key)))
       acc))
   {}
   candidate-key->internal))

(defn candidate->external
  "Convert an internal candidate map to the public camelCase shape."
  [candidate]
  (reduce-kv
   (fn [acc internal-key external-key]
     (let [value (get candidate internal-key)]
       (assoc acc external-key
              (if (#{:kind :cost-class :reversibility} internal-key)
                (maybe-name value)
                value))))
   {}
   candidate-key->external))

(defn breath-episode->external
  [episode]
  {:id (:id episode)
   :openedAt (:opened-at episode)
   :lastActivityAt (:last-activity-at episode)
   :activityScalar (:activity-scalar episode)
   :pendingCommit (:pending-commit episode)})

(defn state-options-from-external
  [options]
  (cond-> {:now (first-present options [:now])}
    (contains-any? options [:belief])
    (assoc :belief (belief-from-external (:belief options)))

    (contains-any? options [:panels])
    (assoc :panels (mapv panel-from-external (:panels options)))

    (contains-any? options [:proposedMoves :proposed-moves])
    (assoc :proposed-moves (mapv candidate-from-external
                                  (first-present options [:proposedMoves :proposed-moves] [])))

    (contains-any? options [:currentEpisodeId :current-episode-id])
    (assoc :current-episode-id (first-present options [:currentEpisodeId :current-episode-id]))

    (contains-any? options [:pendingCommit :pending-commit])
    (assoc :pending-commit (first-present options [:pendingCommit :pending-commit]))

    (contains-any? options [:activityScalar :activity-scalar])
    (assoc :activity-scalar (first-present options [:activityScalar :activity-scalar]))))

(defn state->external
  [state]
  {:belief (belief->external (:belief state))
   :panels (mapv panel->external (:panels state))
   :proposedMoves (mapv candidate->external (:proposed-moves state))
   :currentEpisode (breath-episode->external (:current-episode state))})

(defn planning-context-from-external
  "Convert a JS-compatible planning context to the internal normalized shape."
  [context]
  (cond-> {:repo (:repo context)
           :trigger (:trigger context)
           :target (:target context)
           :summary (:summary context)
           :belief (when (contains? context :belief)
                     (belief-from-external (:belief context)))
           :unresolved-review-threads (first-present context [:unresolvedReviewThreads :unresolved-review-threads] 0)
           :failing-checks (vec (first-present context [:failingChecks :failing-checks] []))
           :has-pending-human-attention (boolean (first-present context [:hasPendingHumanAttention :has-pending-human-attention] false))
           :quiet-window-detected (boolean (first-present context [:quietWindowDetected :quiet-window-detected] false))
           :pending-commit (boolean (first-present context [:pendingCommit :pending-commit] false))}
    (contains-any? context [:now])
    (assoc :now (first-present context [:now]))))

(defn breath-recommendation->external
  [recommendation]
  {:shouldCommit (:should-commit recommendation)
   :reason (:reason recommendation)})

(defn action-batch->external
  [batch]
  {:kind (:kind batch)
   :repo (:repo batch)
   :trigger (:trigger batch)
   :summary (:summary batch)
   :panels (mapv panel->external (:panels batch))
   :belief (belief->external (:belief batch))
   :actions (mapv candidate->external (:actions batch))
   :breath (breath-recommendation->external (:breath batch))})
