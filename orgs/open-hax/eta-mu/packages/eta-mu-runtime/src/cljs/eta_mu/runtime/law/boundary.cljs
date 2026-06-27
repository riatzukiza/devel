(ns eta-mu.runtime.law.boundary)

(def boundary-name-schema
  ;; `proxx` is the project/provider name, not a typo for proxy.
  [:enum
   :js
   :time
   :json
   :http
   :process
   :fs
   :path
   :process-exec
   :git
   :opencode
   :pi-host
   :provider-proxx])

(def normalized-error-schema
  [:map
   [:ok [:= false]]
   [:boundary boundary-name-schema]
   [:message [:string {:min 1}]]
   [:code {:optional true} [:string {:min 1}]]
   [:cause {:optional true} any?]])

(def normalized-success-schema
  [:map
   [:ok [:= true]]
   [:boundary boundary-name-schema]
   [:value any?]])

(def normalized-result-schema
  [:or normalized-success-schema normalized-error-schema])

(def http-method-schema
  [:enum :get :post :put :patch :delete :head :options])

(def http-request-schema
  [:map
   [:url [:string {:min 1}]]
   [:method {:optional true} http-method-schema]
   [:headers {:optional true} map?]
   [:body {:optional true} any?]
   [:json {:optional true} any?]
   [:signal {:optional true} any?]])

(def process-snapshot-schema
  [:map
   [:argv [:vector string?]]
   [:cwd [:string {:min 1}]]
   [:env map?]])
