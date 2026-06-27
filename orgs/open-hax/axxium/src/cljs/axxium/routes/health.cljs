(ns axxium.routes.health
  "Health check and system routes."
  (:require [axxium.db :as db]))

(defn register-health-routes!
  "Register health and system routes."
  [app]
  ;; GET /health — Service health
  (.get app "/health"
    (fn [_req reply]
      (-> (db/query "SELECT 1 as ping" [])
          (.then
            (fn [_]
              (.send reply (clj->js {:status "ok"
                                       :service "axxium"
                                       :version "0.1.0"}))))
          (.catch
            (fn [err]
              (.send (.code reply 503)
                     (clj->js {:status "error"
                                :service "axxium"
                                :error (.-message err)})))))))

  ;; GET / — Redirect to portal
  (.get app "/"
    (fn [_req reply]
      (.redirect reply "/portal/index.html")))
)