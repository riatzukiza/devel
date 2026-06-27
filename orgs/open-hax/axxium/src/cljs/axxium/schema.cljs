(ns axxium.schema
  "Malli schemas for Axxium identity and auth kernel.
   These are the canonical data shapes that proxx, knoxx, and openplanner consume."
  (:require [malli.core :as m]
            [malli.registry :as mr]))

;; ─── Core Primitives ───────────────────────────────────────────────

(def ActorId
  "Axxium actor identifier — URI-safe string"
  [:string {:min 1 :max 256}])

(def EntityId
  "Axxium entity identifier — the underlying identity"
  [:string {:min 1 :max 256}])

(def Email
  [:and :string [:re #"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"]])

(def Password
  "BCrypt hashed password"
  [:string {:min 60 :max 255}])

(def Capability
  "A capability is a namespaced keyword representing something an actor can do"
  :keyword)

(def Role
  "A role is a named set of capabilities"
  [:map
   [:role/id :keyword]
   [:role/name :string]
   [:role/capabilities [:vector Capability]]])

;; ─── Actor ─────────────────────────────────────────────────────────

(def Actor
  "An actor is an entity with capabilities, status, and attribution.
   This is the shape that proxx, knoxx, and openplanner all agree on."
  [:map
   [:actor/id ActorId]
   [:actor/entity-id EntityId]
   [:actor/email {:optional true} Email]
   [:actor/display-name {:optional true} :string]
   [:actor/capabilities [:vector Capability]]
   [:actor/roles {:optional true} [:vector :keyword]]
   [:actor/status [:enum :active :suspended :retired]]
   [:actor/created-at :inst]
   [:actor/updated-at :inst]])

;; ─── Entity (the pure identity) ────────────────────────────────────

(def Entity
  "An entity is the bare identity — just an ID and metadata.
   Actors are entities with capabilities."
  [:map
   [:entity/id EntityId]
   [:entity/kind [:enum :human :agent :service :org]]
   [:entity/email {:optional true} Email]
   [:entity/display-name {:optional true} :string]
   [:entity/created-at :inst]])

;; ─── Session ───────────────────────────────────────────────────────

(def Session
  "Axxium session — the result of successful authentication"
  [:map
   [:session/id :uuid]
   [:session/actor-id ActorId]
   [:session/token-hash :string]
   [:session/expires-at :inst]
   [:session/created-at :inst]])

;; ─── Auth Context ──────────────────────────────────────────────────

(def AuthContext
  "The auth context that gets attached to requests after verification.
   This is what downstream services (proxx, knoxx, openplanner) receive."
  [:map
   [:auth/actor-id ActorId]
   [:auth/entity-id EntityId]
   [:auth/capabilities [:vector Capability]]
   [:auth/roles {:optional true} [:vector :keyword]]
   [:auth/email {:optional true} Email]
   [:auth/scopes {:optional true} [:vector :string]]])

;; ─── OAuth Client ──────────────────────────────────────────────────

(def OAuthClient
  "Registered OAuth client — proxx, knoxx, openplanner register themselves"
  [:map
   [:client/id :string]
   [:client/secret-hash :string]
   [:client/name :string]
   [:client/redirect-uris [:vector :string]]
   [:client/grant-types [:vector :string]]
   [:client/scopes [:vector :string]]
   [:client/created-at :inst]])

;; ─── Registry ──────────────────────────────────────────────────────

(def registry
  {:axxium/actor Actor
   :axxium/entity Entity
   :axxium/role Role
   :axxium/session Session
   :axxium/auth-context AuthContext
   :axxium/oauth-client OAuthClient})

(mr/set-default-registry! registry)

(defn validate! [schema value]
  (when-not (m/validate schema value)
    (throw (ex-info "Validation failed"
                    {:schema schema
                     :errors (m/explain schema value)
                     :value value})))
  value)

(defn valid? [schema value]
  (m/validate schema value))
