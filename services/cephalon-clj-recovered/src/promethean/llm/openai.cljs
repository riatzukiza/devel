(ns promethean.llm.openai)

(defn make-client [{:keys [api-key base-url]}]
  (let [OpenAI (.-default (js/require "openai"))]
    (new OpenAI (clj->js {:apiKey api-key
                          :baseURL base-url}))))

(defn chat! [client {:keys [model messages tools tool-choice temperature max-tokens]}]
  ;; OpenAI SDK v4: client.chat.completions.create({ ... })
  (let [payload (cond-> {:model model
                         :messages messages}
                  (some? temperature) (assoc :temperature temperature)
                  (some? max-tokens) (assoc :max_tokens max-tokens)
                  (seq tools) (assoc :tools tools)
                  (some? tool-choice) (assoc :tool_choice tool-choice))]
    (.create (.. client -chat -completions) (clj->js payload))))

(defn embed! [client {:keys [model input]}]
  ;; OpenAI SDK v4: client.embeddings.create({ model, input })
  (.create (.. client -embeddings) (clj->js {:model model :input input})))
