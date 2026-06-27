(ns axxium.routes.auth
  "Authentication routes for Axxium.
   Provides login, signup, logout, and OAuth callbacks.
   Designed to be consumed by proxx, knoxx, and openplanner."
  (:require [clojure.string :as str]
            [axxium.config :as cfg]
            [axxium.db :as db]
            [axxium.auth.session :as session]
            [axxium.schema :as schema]
            ["bcryptjs" :default bcrypt]))

(defn- body-map [req]
  (js->clj (or (aget req "body") #js {}) :keywordize-keys true))

(defn- http-error [status code message]
  (let [err (js/Error. message)]
    (set! (.-statusCode err) status)
    (set! (.-code err) code)
    err))

(defn- hash-password [password]
  (let [salt-rounds (cfg/get-in-config [:password/salt-rounds])]
    (.hash bcrypt password salt-rounds)))

(defn- verify-password [password hash]
  (.compare bcrypt password hash))

(defn- sanitize-actor [actor]
  (dissoc actor :password_hash))

(defn register-signup-route!
  "POST /api/auth/signup — Email/password registration."
  [app]
  (.post app "/api/auth/signup"
         (fn [req reply]
           (let [body (body-map req)
                 email (str/lower-case (str/trim (str (:email body))))
                 password (str (:password body))
                 display-name (str/trim (str (or (:display-name body) (:display_name body) email)))]
             (cond
               (str/blank? email)
               (.send (.code reply 400) (clj->js {:error "email is required"}))

               (str/blank? password)
               (.send (.code reply 400) (clj->js {:error "password is required"}))

               (< (count password) 8)
               (.send (.code reply 400) (clj->js {:error "password must be at least 8 characters"}))

               :else
               (-> (db/query-one "SELECT id FROM actors WHERE email = $1" [email])
                   (.then (fn [existing]
                            (when existing
                              (throw (http-error 409 "email_exists" "An account with this email already exists")))))
                   (.then (fn [_]
                            (-> (hash-password password)
                                (.then (fn [password-hash]
                                         (let [entity-id (str "entity_" (random-uuid))
                                               actor-id (str "actor_" (random-uuid))]
                                           (-> (db/query
                                                "INSERT INTO entities (id, kind, email, display_name) VALUES ($1, $2, $3, $4)"
                                                [entity-id "human" email display-name])
                                               (.then (fn [_]
                                                        (db/query
                                                         "INSERT INTO actors (id, entity_id, email, display_name, password_hash, capabilities, roles, status)
                                                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
                                                         [actor-id entity-id email display-name password-hash
                                                          (clj->js [:axxium/login :axxium/read :axxium/write])
                                                          (clj->js [:axxium/user])
                                                          "active"])))
                                               (.then (fn [_]
                                                        (-> (db/query-one "SELECT * FROM actors WHERE id = $1" [actor-id])
                                                            (.then (fn [actor]
                                                                     (let [actor (js->clj actor :keywordize-keys true)]
                                                                       (-> (session/create-session! actor)
                                                                           (.then (fn [{:keys [token]}]
                                                                                    (session/set-session-cookie reply token)
                                                                                    (.send reply (clj->js
                                                                                                  {:ok true
                                                                                                   :actor (sanitize-actor actor)
                                                                                                   :token token}))))))))))))))))))
                   (.catch (fn [err]
                             (.send (.code reply (or (.-statusCode err) 500))
                                    (clj->js {:error (or (.-message err) "Signup failed")
                                               :code (or (.-code err) "unknown")}))))))))))

(defn register-login-route!
  "POST /api/auth/login — Email/password login."
  [app]
  (.post app "/api/auth/login"
         (fn [req reply]
           (let [body (body-map req)
                 email (str/lower-case (str/trim (str (:email body))))
                 password (str (:password body))]
             (if (or (str/blank? email) (str/blank? password))
               (.send (.code reply 400) (clj->js {:error "email and password are required"}))
               (-> (db/query-one "SELECT * FROM actors WHERE email = $1 AND status = 'active'" [email])
                   (.then (fn [actor]
                            (if-not actor
                              (throw (http-error 401 "invalid_credentials" "Invalid email or password"))
                              (let [actor (js->clj actor :keywordize-keys true)]
                                (-> (verify-password password (:password_hash actor))
                                    (.then (fn [valid?]
                                             (if-not valid?
                                               (throw (http-error 401 "invalid_credentials" "Invalid email or password"))
                                               (-> (session/create-session! actor)
                                                   (.then (fn [{:keys [token]}]
                                                            (session/set-session-cookie reply token)
                                                            (.send reply (clj->js
                                                                          {:ok true
                                                                           :actor (sanitize-actor actor)
                                                                           :token token})))))))))))))
                   (.catch (fn [err]
                             (.send (.code reply (or (.-statusCode err) 500))
                                    (clj->js {:error (or (.-message err) "Login failed")
                                               :code (or (.-code err) "unknown")}))))))))))

(defn register-logout-route!
  "POST /api/auth/logout — Clear session."
  [app]
  (.post app "/api/auth/logout"
         (fn [req reply]
           (let [token (session/extract-auth-token req)]
             (when token
               (session/delete-session! token))
             (session/clear-session-cookie reply)
             (.send reply (clj->js {:ok true}))))))

(defn register-me-route!
  "GET /api/auth/me — Get current actor."
  [app]
  (.get app "/api/auth/me"
        (fn [req reply]
          (-> (session/resolve-auth-context req)
              (.then (fn [ctx]
                       (if-not ctx
                         (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                         (-> (db/query-one "SELECT * FROM actors WHERE id = $1" [(:auth/actor-id ctx)])
                             (.then (fn [actor]
                                      (if-not actor
                                        (.send (.code reply 401) (clj->js {:error "Actor not found"}))
                                        (.send reply (clj->js
                                                      {:ok true
                                                       :actor (sanitize-actor (js->clj actor :keywordize-keys true))})))))))))))))

(defn register-config-route!
  "GET /api/auth/config — Public auth configuration."
  [app]
  (.get app "/api/auth/config"
        (fn [_req reply]
          (.send reply (clj->js
                        {:githubEnabled (cfg/get-in-config [:oauth/github-enabled])
                         :publicBaseUrl (cfg/get-in-config [:axxium/public-base-url])
                         :loginUrl "/api/auth/login"
                         :signupUrl "/api/auth/signup"})))))

(defn register-auth-routes!
  "Register all auth routes on the Fastify app."
  [app]
  (register-config-route! app)
  (register-signup-route! app)
  (register-login-route! app)
  (register-logout-route! app)
  (register-me-route! app))
