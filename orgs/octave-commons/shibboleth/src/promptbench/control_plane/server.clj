(ns promptbench.control-plane.server
  "HTTP control plane for shibboleth promptbench.

   Purpose: make DSL primitives (sources/transforms/pipelines) operational via an API,
   and provide a UI-friendly surface for generating and running pipeline instances.

   Run:
     clojure -M:control-plane -m promptbench.control-plane.server

   Env:
     PORT=8788 (default)
     PROMPTBENCH_RUNS_DIR=data/control-plane/runs
     PROXY_AUTH_TOKEN=... (required for MT/build)
     HF_TOKEN=...         (optional; for gated HF dataset fetch)" 
  (:require [ring.adapter.jetty :as jetty]
            [ring.middleware.cors :refer [wrap-cors]]
            [muuntaja.core :as m]
            [reitit.ring :as ring]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [clojure.string :as str]
            [promptbench.control-plane.bench :as bench]
            [promptbench.control-plane.chat-lab :as chat-lab]
            [promptbench.control-plane.runs :as runs]
            [promptbench.corpus.external :as external]
            [promptbench.corpus.curated :as curated]
            [promptbench.transform.builtins :as xforms-builtins]
            [promptbench.pipeline.sources :as sources])
  (:gen-class))

(defn- ensure-registrations!
  "Populate registries so /api/sources works out-of-the-box." 
  []
  ;; Sources
  (external/register-all!)
  (curated/register-all!)
  ;; Transforms
  (xforms-builtins/register-all!)
  nil)

(def muuntaja-instance
  (m/create
    (-> m/default-options
        ;; Keep keyword keys in Clojure world, JSON strings over the wire.
        (assoc-in [:formats "application/json" :decoder-opts] {:keywords? true}))))

(defn- ok [body]
  {:status 200
   :headers {"content-type" "application/json"}
   :body body})

(defn- bad-request [body]
  {:status 400
   :headers {"content-type" "application/json"}
   :body body})

(defn- not-found [body]
  {:status 404
   :headers {"content-type" "application/json"}
   :body body})

(defn- server-routes []
  ["/"
   ["api"
    ["/health" {:get (fn [_]
                        (ok {:ok true
                             :service "promptbench-control-plane"}))}]

    ["/sources" {:get (fn [_]
                         (ensure-registrations!)
                         (ok {:sources (runs/sources->api)}))}]

    ["/render/pipeline" {:post (fn [{:keys [body-params]}]
                                 (ensure-registrations!)
                                 (ok (runs/render-pipeline-edn body-params)))}]

    ["/runs" {:get (fn [_]
                     (ok {:runs (runs/list-runs)}))
              :post (fn [{:keys [body-params]}]
                      (ensure-registrations!)
                      (try
                        (let [run (runs/create-run! body-params)]
                          (ok {:run run
                               :logTail (runs/get-run-log-tail (:id run))}))
                        (catch clojure.lang.ExceptionInfo e
                          (bad-request {:error (.getMessage e)
                                        :data (ex-data e)}))
                        (catch Exception e
                          (bad-request {:error (.getMessage e)}))))}]

    ["/runs/:id" {:get (fn [req]
                         (let [id (get-in req [:path-params :id])]
                           (if-let [run (runs/get-run id)]
                             (ok {:run run
                                  :logTail (runs/get-run-log-tail id)})
                             (not-found {:error "run not found" :id id}))))}]

    ["/runs/:id/start" {:post (fn [{:keys [body-params path-params]}]
                                (let [id (:id path-params)
                                      cmd (or (:command body-params) (:cmd body-params))]
                                  (try
                                    (ok (runs/start-run! id cmd))
                                    (catch clojure.lang.ExceptionInfo e
                                      (bad-request {:error (.getMessage e)
                                                    :data (ex-data e)}))
                                    (catch Exception e
                                      (bad-request {:error (.getMessage e)})))))}]

    ["/bench/runs" {:get (fn [_]
                            (ok {:runs (bench/list-benchmark-runs)}))
                     :post (fn [{:keys [body-params]}]
                             (try
                               (ok (bench/start-benchmark-job! body-params))
                               (catch clojure.lang.ExceptionInfo e
                                 (bad-request {:error (.getMessage e)
                                               :data (ex-data e)}))
                               (catch Exception e
                                 (bad-request {:error (.getMessage e)}))))}]

    ["/bench/runs/:id" {:get (fn [req]
                                (let [id (get-in req [:path-params :id])]
                                  (if-let [run (some-> id bench/get-benchmark-run)]
                                    (ok {:run run})
                                    (not-found {:error "benchmark run not found" :id id}))))}]

    ["/bench/aggregate" {:get (fn [_]
                                 (ok {:aggregate (bench/aggregate-benchmark-runs)}))
                          :post (fn [{:keys [body-params]}]
                                  (try
                                    (ok {:aggregate (bench/aggregate-benchmark-runs body-params)})
                                    (catch clojure.lang.ExceptionInfo e
                                      (bad-request {:error (.getMessage e)
                                                    :data (ex-data e)}))
                                    (catch Exception e
                                      (bad-request {:error (.getMessage e)}))))}]

    ["/bench/runs/:id/stop" {:post (fn [req]
                                      (let [id (get-in req [:path-params :id])]
                                        (try
                                          (ok (bench/stop-benchmark-job! id))
                                          (catch clojure.lang.ExceptionInfo e
                                            (bad-request {:error (.getMessage e)
                                                          :data (ex-data e)}))
                                          (catch Exception e
                                            (bad-request {:error (.getMessage e)})))))}]

    ["/chat/schema" {:get (fn [_]
                             (ok (chat-lab/schema)))}]

    ["/chat/import" {:post (fn [{:keys [body-params]}]
                              (try
                                (ok {:session (chat-lab/import-session! body-params)})
                                (catch clojure.lang.ExceptionInfo e
                                  (bad-request {:error (.getMessage e)
                                                :data (ex-data e)}))
                                (catch Exception e
                                  (bad-request {:error (.getMessage e)}))))}]

    ["/chat/sessions" {:get (fn [_]
                               (ok {:sessions (chat-lab/list-sessions)}))
                        :post (fn [{:keys [body-params]}]
                                (try
                                  (ok {:session (chat-lab/create-session! body-params)})
                                  (catch clojure.lang.ExceptionInfo e
                                    (bad-request {:error (.getMessage e)
                                                  :data (ex-data e)}))
                                  (catch Exception e
                                    (bad-request {:error (.getMessage e)}))))}]

    ["/chat/sessions/:id" {:get (fn [req]
                                  (let [id (get-in req [:path-params :id])]
                                    (if-let [session (chat-lab/get-session id)]
                                      (ok {:session session})
                                      (not-found {:error "chat session not found" :id id}))))}]

    ["/chat/sessions/:id/messages" {:post (fn [{:keys [body-params path-params]}]
                                             (let [id (:id path-params)]
                                               (try
                                                 (ok {:session (chat-lab/add-user-turn! id body-params)})
                                                 (catch clojure.lang.ExceptionInfo e
                                                   (bad-request {:error (.getMessage e)
                                                                 :data (ex-data e)}))
                                                 (catch Exception e
                                                   (bad-request {:error (.getMessage e)})))))}]

    ["/chat/sessions/:id/items/:itemId/label" {:post (fn [{:keys [body-params path-params]}]
                                                        (let [id (:id path-params)
                                                              item-id (:itemId path-params)]
                                                          (try
                                                            (ok {:session (chat-lab/label-item! id item-id body-params)})
                                                            (catch clojure.lang.ExceptionInfo e
                                                              (bad-request {:error (.getMessage e)
                                                                            :data (ex-data e)}))
                                                            (catch Exception e
                                                              (bad-request {:error (.getMessage e)})))))}]

    ["/chat/sessions/:id/export" {:get (fn [req]
                                          (let [id (get-in req [:path-params :id])]
                                            (try
                                              (ok {:export (chat-lab/session-export-preview id)})
                                              (catch clojure.lang.ExceptionInfo e
                                                (bad-request {:error (.getMessage e)
                                                              :data (ex-data e)}))
                                              (catch Exception e
                                                (bad-request {:error (.getMessage e)})))))}]

    ["/chat/export" {:get (fn [_]
                             (ok {:export (chat-lab/export-preview)}))
                      :post (fn [_]
                              (try
                                (ok {:snapshot (chat-lab/write-export-snapshot!)} )
                                (catch clojure.lang.ExceptionInfo e
                                  (bad-request {:error (.getMessage e)
                                                :data (ex-data e)}))
                                (catch Exception e
                                  (bad-request {:error (.getMessage e)}))))}]]])

(def app
  (-> (ring/ring-handler
        (ring/router
          (server-routes)
          {:data {:muuntaja muuntaja-instance
                  :middleware [muuntaja/format-middleware]}})
        (ring/create-default-handler))
      ;; Dev CORS for local UI
      (wrap-cors
        :access-control-allow-origin [#"http://localhost:.*"
                                      #"http://127\.0\.0\.1:.*"
                                      #"https://shibboleth\.promethean\.rest"]
        :access-control-allow-methods [:get :post :put :delete :options]
        :access-control-allow-headers ["content-type"])))

(defn -main
  [& _args]
  (ensure-registrations!)
  (let [port (or (some-> (System/getenv "PORT") parse-long) 8788)]
    (println (str "Starting promptbench control-plane on :" port))
    (jetty/run-jetty #'app {:port port :join? true})))
