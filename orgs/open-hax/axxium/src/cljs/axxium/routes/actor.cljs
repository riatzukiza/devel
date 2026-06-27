(ns axxium.routes.actor
  "Actor registry routes for Axxium."
  (:require [axxium.db :as db]
            [axxium.auth.session :as session]))

(defn- sanitize-actor [actor]
  (dissoc actor :password_hash))

(defn- register-list-actors-route! [app]
  (.get app "/api/actors"
    (fn [req reply]
      (-> (session/resolve-auth-context req)
          (.then
            (fn [ctx]
              (if-not ctx
                (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                (let [limit (js/parseInt (or (aget (aget req "query") "limit") "50"))
                      offset (js/parseInt (or (aget (aget req "query") "offset") "0"))]
                  (-> (db/query-all
                       "SELECT * FROM actors WHERE status = 'active' ORDER BY created_at DESC LIMIT $1 OFFSET $2"
                       [limit offset])
                      (.then
                        (fn [actors]
                          (.send reply (clj->js {:ok true
                                                   :actors (map sanitize-actor actors)
                                                   :count (count actors)}))))))))))))

(defn- register-get-actor-route! [app]
  (.get app "/api/actors/:id"
    (fn [req reply]
      (-> (session/resolve-auth-context req)
          (.then
            (fn [ctx]
              (if-not ctx
                (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                (let [actor-id (aget (aget req "params") "id")]
                  (-> (db/query-one "SELECT * FROM actors WHERE id = $1" [actor-id])
                      (.then
                        (fn [actor]
                          (if-not actor
                            (.send (.code reply 404) (clj->js {:error "Actor not found"}))
                             (.send reply (clj->js {:ok true
                                                      :actor (sanitize-actor (js->clj actor :keywordize-keys true))})))))))))))))))

(defn- register-get-me-route! [app]
  (.get app "/api/actors/me"
    (fn [req reply]
      (-> (session/resolve-auth-context req)
          (.then
            (fn [ctx]
              (if-not ctx
                (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                (-> (db/query-one "SELECT * FROM actors WHERE id = $1" [(:auth/actor-id ctx)])
                    (.then
                      (fn [actor]
                        (if-not actor
                          (.send (.code reply 404) (clj->js {:error "Actor not found"}))
                          (.send reply (clj->js {:ok true
                                                   :actor (sanitize-actor (js->clj actor :keywordize-keys true))}))))))))))))

(defn- register-get-entity-route! [app]
  (.get app "/api/entities/:id"
    (fn [req reply]
      (-> (session/resolve-auth-context req)
          (.then
            (fn [ctx]
              (if-not ctx
                (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                (let [entity-id (aget (aget req "params") "id")]
                  (-> (db/query-one "SELECT * FROM entities WHERE id = $1" [entity-id])
                      (.then
                        (fn [entity]
                          (if-not entity
                            (.send (.code reply 404) (clj->js {:error "Entity not found"}))
                             (.send reply (clj->js {:ok true
                                                      :entity (js->clj entity :keywordize-keys true)})))))))))))))))

(defn- register-update-capabilities-route! [app]
  (.post app "/api/actors/:id/capabilities"
    (fn [req reply]
      (-> (session/resolve-auth-context req)
          (.then
            (fn [ctx]
              (if-not ctx
                (.send (.code reply 401) (clj->js {:error "Unauthorized"}))
                (let [actor-id (aget (aget req "params") "id")
                      body (js->clj (or (aget req "body") #js {}) :keywordize-keys true)
                      capabilities (:capabilities body)]
                  (-> (db/query
                       "UPDATE actors SET capabilities = $1, updated_at = NOW() WHERE id = $2"
                       [(clj->js capabilities) actor-id])
                      (.then
                        (fn [_]
                          (.send reply (clj->js {:ok true})))))))))))))

(defn register-actor-routes! [app]
  (register-list-actors-route! app)
  (register-get-actor-route! app)
  (register-get-me-route! app)
  (register-get-entity-route! app)
  (register-update-capabilities-route! app))
