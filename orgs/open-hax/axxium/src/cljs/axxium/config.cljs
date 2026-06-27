(ns axxium.config
  "Axxium runtime configuration from environment."
  (:require [clojure.string :as str]))

(defn- env
  ([key] (env key nil))
  ([key default]
   (or (aget (.-env js/process) key)
       default)))

(defn- env-int [key default]
  (let [v (env key)]
    (if v (js/parseInt v) default)))

(defn- env-bool [key default]
  (let [v (env key)]
    (if v (= "true" (str/lower-case v)) default)))

(def config
  {:axxium/env (or (env "NODE_ENV") "development")
   :axxium/port (env-int "AXXIUM_PORT" 8787)
   :axxium/host (env "AXXIUM_HOST" "0.0.0.0")
   :axxium/public-base-url (env "AXXIUM_PUBLIC_BASE_URL" "http://localhost:8787")
   
   ;; Database
   :db/host (env "DB_HOST" "localhost")
   :db/port (env-int "DB_PORT" 5432)
   :db/name (env "DB_NAME" "axxium")
   :db/user (env "DB_USER" "axxium")
   :db/password (env "DB_PASSWORD" "")
   
   ;; JWT
   :jwt/secret (env "JWT_SECRET" "axxium-dev-secret-change-me")
   :jwt/issuer (env "JWT_ISSUER" "axxium")
   :jwt/audience (env "JWT_AUDIENCE" "promethean")
   :jwt/expiry-hours (env-int "JWT_EXPIRY_HOURS" 168) ;; 7 days
   
   ;; OAuth
   :oauth/github-client-id (env "GITHUB_OAUTH_CLIENT_ID" "")
   :oauth/github-client-secret (env "GITHUB_OAUTH_CLIENT_SECRET" "")
   :oauth/github-enabled (env-bool "GITHUB_OAUTH_ENABLED" false)
   
   ;; Session
   :session/cookie-name (env "SESSION_COOKIE_NAME" "axxium_session")
   :session/cookie-secure (env-bool "SESSION_COOKIE_SECURE" false)
   :session/cookie-same-site (env "SESSION_COOKIE_SAME_SITE" "lax")
   
   ;; Password hashing
   :password/salt-rounds (env-int "BCRYPT_SALT_ROUNDS" 12)})

(defn get-in-config [ks]
  (get-in config ks))

(defn db-url []
  (let [{:keys [db/host db/port db/name db/user db/password]} config]
    (str "postgresql://" user 
         (when (seq password) (str ":" password))
         "@" host ":" port "/" name)))
