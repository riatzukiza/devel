(ns eta-mu.runtime.domain.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.domain.message :as message]
            [eta-mu.runtime.domain.model :as model]
            [eta-mu.runtime.domain.session :as session]
            [eta-mu.runtime.domain.tool :as tool]))

(def timestamp 1780099200000)

(def cheap-text-model
  {:id "cheap-text"
   :name "Cheap Text"
   :api "openai-responses"
   :provider "openai"
   :base-url "https://api.openai.example/v1"
   :reasoning false
   :input [:text]
   :cost {:input 0.1 :output 0.2 :cache-read 0 :cache-write 0}
   :context-window 128000
   :max-tokens 4096})

(def reasoning-audio-model
  {:id "reasoning-audio"
   :name "Reasoning Audio"
   :api "anthropic-messages"
   :provider "anthropic"
   :base-url "https://api.anthropic.example"
   :reasoning true
   :input [:text :image :audio]
   :cost {:input 1.0 :output 2.0 :cache-read 0.1 :cache-write 0.2}
   :context-window 200000
   :max-tokens 8192})

(deftest select-compatible-models-test
  (testing "model selection is pure data filtering over provider/model descriptors"
    (let [selected (model/select-compatible-models
                    [reasoning-audio-model cheap-text-model]
                    {:inputs [:text :audio]
                     :reasoning-required true
                     :min-context-window 160000})]
      (is (= ["reasoning-audio"] (mapv :id selected))))))

(deftest compose-tool-descriptors-test
  (testing "tool composition concatenates descriptor groups and keeps first name owner"
    (let [tools (tool/compose-tool-descriptors
                 [[{:name "read" :description "Read files" :parameters {}}
                   {:name "bash" :description "Run command" :parameters {}}]
                  [{:name "read" :description "Duplicate" :parameters {}}
                   {:name "write" :description "Write files" :parameters {} :enabled false}]])]
      (is (= ["read" "bash" "write"] (mapv :name tools)))
      (is (= "Read files" (:description (first tools))))
      (is (false? (:enabled (last tools)))))))

(deftest session-context-test
  (testing "session context is pure data and validates message payloads"
    (let [user-message {:role :user
                        :content [(message/create-text-content "hello")]
                        :timestamp timestamp}
          ctx (session/create-session-context {:session-id "s1"
                                               :cwd "/repo"
                                               :messages [user-message]
                                               :active-tool-names ["read" "bash"]
                                               :metadata {:branch "main"}
                                               :created-at timestamp
                                               :updated-at timestamp})
          next-message (message/create-custom-message "notice" "hi" true nil timestamp)
          updated (session/append-message ctx next-message)]
      (is (= "s1" (:session-id ctx)))
      (is (= 2 (count (:messages updated))))
      (is (thrown? js/Error
                   (session/append-message ctx {:role :user
                                                :content []
                                                :timestamp timestamp})))
      (is (thrown? js/Error
                   (session/append-message ctx {:role :user
                                                :content [(message/create-text-content "valid")]
                                                :timestamp -1}))))))
