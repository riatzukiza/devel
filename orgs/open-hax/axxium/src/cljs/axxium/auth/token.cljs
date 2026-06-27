(ns axxium.auth.token
  "JWT token creation and verification using jose.
   Tokens carry the auth context that downstream services consume."
  (:require [axxium.config :as cfg]
            [clojure.string :as str]
            ["jose" :refer [SignJWT jwtVerify]]))

(defn- secret-key []
  (let [secret (cfg/get-in-config [:jwt/secret])]
    (.encode (new js/TextEncoder) secret)))

(defn create-token
  "Create a JWT for an actor with their capabilities.
   Returns promise of token string."
  [actor]
  (let [secret (cfg/get-in-config [:jwt/secret])
        issuer (cfg/get-in-config [:jwt/issuer])
        audience (cfg/get-in-config [:jwt/audience])
        expiry-hours (cfg/get-in-config [:jwt/expiry-hours])
        encoder (new (.-TextEncoder js/globalThis))
        secret-key (.encode encoder secret)
        claims {:sub (:actor/id actor)
                :entity-id (:actor/entity-id actor)
                :email (:actor/email actor)
                :capabilities (:actor/capabilities actor)
                :roles (:actor/roles actor)
                :status (:actor/status actor)}]
    (-> (new SignJWT (clj->js claims))
        (.setProtectedHeader #js {"alg" "HS256" "typ" "JWT"})
        (.setIssuedAt)
        (.setIssuer issuer)
        (.setAudience audience)
        (.setExpirationTime (str expiry-hours "h"))
        (.sign secret-key))))

(defn verify-token
  "Verify a JWT and return the claims.
   Returns promise of verified payload or throws."
  [token]
  (let [secret (cfg/get-in-config [:jwt/secret])
        issuer (cfg/get-in-config [:jwt/issuer])
        audience (cfg/get-in-config [:jwt/audience])
        encoder (new (.-TextEncoder js/globalThis))
        secret-key (.encode encoder secret)]
    (-> (jwtVerify token secret-key #js {:issuer issuer
                                         :audience audience
                                         :clockTolerance 60})
        (.then (fn [result]
                 (js->clj (.-payload result) :keywordize-keys true))))))
