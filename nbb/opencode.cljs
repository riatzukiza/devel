(ns opencode
  (:require ["child_process" :as child-process]
            ["node:fs/promises" :as fs]
            ["path" :as path]
            ["@opencode-ai/sdk" :as oc]
            [promesa.core :as p]
            [clojure.string :as str]))

(defn create [config] oc/createOpencode config
  (p/let [client (oc/createOpencode #js {:config config :port 0})]
    client.client))

(defn spawn-agent [client title prompt]
  (p/let [session  (.create client.session #js {:body #js {:title title}})
          prompt-result (.prompt client.session #js { :path #js { :id (.-id session) }
                                                     :body #js { :prompt (str prompt) }})]
    prompt-result))
