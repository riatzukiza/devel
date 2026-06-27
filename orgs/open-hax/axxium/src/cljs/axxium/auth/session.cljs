(ns axxium.auth.session
  "Session management for Axxium.
   Cookie-based sessions for browser clients,
   JWT bearer tokens for API clients."
  (:require [axxium.config :as cfg]
            [axxium.db :as db]
            [axxium.auth.token :as token]
            [clojure.string :as str]))

(def COOKIE-NAME (cfg/get-in-config [:session/cookie-name]))

(defn- hash-token [token]
  (-> (js/crypto.createHash "sha256")
      (.update token)
      (.digest "hex")))

(defn- body-map [req]
  (js->clj (or (aget req "body") #js {}) :keywordize-keys true))

(defn create-session!
  "Create a session for an actor. Returns {:token token :actor actor}."
  [actor]
  (let [token-promise (token/create-token actor)]
    (-> token-promise
        (.then (fn [token]
                 (let [token-hash (hash-token token)
                       actor-id (:actor/id actor)
                       expiry-hours (cfg/get-in-config [:jwt/expiry-hours])
                       expires-at (js/Date. (+ (.getTime (js/Date.)) (* expiry-hours 3600000)))]
                   (-> (db/query
                        "INSERT INTO sessions (actor_id, token_hash, expires_at) VALUES ($1, $2, $3)"
                        [actor-id token-hash expires-at])
                       (.then (fn [_]
                                {:token token
                                 :actor actor})))))))))

(defn verify-session
  "Verify a session token. Returns promise of actor or nil."
  [token]
  (if (str/blank? token)
    (js/Promise.resolve nil)
    (-> (token/verify-token token)
        (.then (fn [claims]
                 (let [actor-id (:sub claims)]
                   (-> (db/query-one
                        "SELECT a.* FROM actors a
                         JOIN sessions s ON a.id = s.actor_id
                         WHERE a.id = $1 AND s.token_hash = $2 AND s.expires_at > NOW()"
                        [actor-id (hash-token token)])
                       (.then (fn [actor]
                                (when actor
                                  (js->clj actor :keywordize-keys true))))))))
        (.catch (fn [_] nil)))))

(defn delete-session!
  "Delete a session by token."
  [token]
  (db/query "DELETE FROM sessions WHERE token_hash = $1"
            [(hash-token token)]))

(defn set-session-cookie
  "Set the session cookie on a Fastify reply."
  [reply token]
  (let [cookie-opts #js {:path "/"
                         :httpOnly true
                         :secure (cfg/get-in-config [:session/cookie-secure])
                         :sameSite (cfg/get-in-config [:session/cookie-same-site])
                         :maxAge (* (cfg/get-in-config [:jwt/expiry-hours]) 3600000)}]
    (.setCookie reply COOKIE-NAME token cookie-opts)))

(defn clear-session-cookie
  "Clear the session cookie."
  [reply]
  (.clearCookie reply COOKIE-NAME #js {:path "/"}))

(defn extract-auth-token
  "Extract bearer token from request headers or cookie."
  [req]
  (let [headers (aget req "headers")
        auth-header (str (or (aget headers "authorization") ""))
        cookie-token (some-> req (aget "cookies") (aget COOKIE-NAME))]
    (or
     (when (str/starts-with? (str/lower-case auth-header) "bearer ")
       (str/trim (subs auth-header 7)))
     cookie-token)))

(defn resolve-auth-context
  "Resolve auth context from request. Returns promise of context map or nil."
  [req]
  (let [token (extract-auth-token req)]
    (-> (verify-session token)
        (.then (fn [actor]
                 (when actor
                   {:auth/actor-id (:id actor)
                    :auth/entity-id (:entity_id actor)
                    :auth/email (:email actor)
                    :auth/capabilities (js->clj (:capabilities actor) :keywordize-keys true)
                    :auth/roles (js->clj (:roles actor) :keywordize-keys true)}))))))
