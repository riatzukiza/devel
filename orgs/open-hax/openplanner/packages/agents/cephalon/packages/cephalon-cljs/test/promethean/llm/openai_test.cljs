(ns promethean.llm.openai-test
  (:require [cljs.test :refer-macros [deftest is async]]
            [promethean.llm.openai :as openai]
            [promethean.test-utils :as test-utils]))

(deftest chat-builds-payload-with-optional-fields
  (async done
    (let [{:keys [client calls]} (test-utils/make-fake-openai-client)]
      (-> (openai/chat! client {:model "gpt-test"
                               :messages [{:role "user" :content "hi"}]
                               :temperature 0.2
                               :max-tokens 42
                               :tools [{:type "function"}]
                               :tool-choice {:type "function"}})
          (.then (fn [_]
                   (let [call (first @calls)
                         payload (js->clj (:payload call) :keywordize-keys true)]
                     (is (= "gpt-test" (:model payload)))
                     (is (= [{:role "user" :content "hi"}] (:messages payload)))
                     (is (= 0.2 (:temperature payload)))
                     (is (= 42 (:max_tokens payload)))
                     (is (= [{:type "function"}] (:tools payload)))
                     (is (= {:type "function"} (:tool_choice payload)))
                     (done))))))))

(deftest embed-builds-payload
  (async done
    (let [{:keys [client calls]} (test-utils/make-fake-openai-client)]
      (-> (openai/embed! client {:model "text-embed" :input "hello"})
          (.then (fn [_]
                   (let [call (first @calls)
                         payload (js->clj (:payload call) :keywordize-keys true)]
                     (is (= "text-embed" (:model payload)))
                     (is (= "hello" (:input payload)))
                     (done))))))))
