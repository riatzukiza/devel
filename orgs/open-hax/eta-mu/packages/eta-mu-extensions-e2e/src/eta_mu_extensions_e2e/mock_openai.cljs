(ns eta-mu-extensions-e2e.mock-openai)

(defn scripted-response
  [{:keys [_messages _tools state]}]
  (let [step   (or (:step state) 0)
        script (:script state)
        response (nth script step {:type :message :content "done"})]
    (case (:type response)
      :tool-call
      {:model "gpt-4.1"
       :choices [{:index 0
                  :message {:role "assistant"
                            :content nil
                            :tool_calls [{:id (str "call-" step)
                                          :type "function"
                                          :function {:name (:tool-name response)
                                                     :arguments (js/JSON.stringify
                                                                  (clj->js (:arguments response)))}}]}
                  :finish_reason "tool_calls"}]
       :state {:step (inc step) :script script}}

      :message
      {:model "gpt-4.1"
       :choices [{:index 0
                  :message {:role "assistant"
                            :content (:content response)}
                  :finish_reason "stop"}]
       :state {:step (inc step) :script script}})))
