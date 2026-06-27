(ns eta-mu.runtime.facade-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.facade :as facade]))

(defn- ->clj
  [value]
  (js->clj value :keywordize-keys true))

(def valid-context
  #js {:repo "open-hax/proxx"
       :trigger "scheduler.tick"
       :target "open-hax/proxx"
       :summary "cheap reconcile loop found no action"
       :belief #js {:urgency 0
                    :ambiguity 0.25
                    :socialFriction 0
                    :deployRisk 0
                    :reviewDebt 0
                    :drift 0
                    :crust 0
                    :bloomNeed 0.25
                    :userIntentConfidence 0.5}})

(deftest js-compat-roundtrip-test
  (testing "facade preserves camelCase public keys while using internal kebab-case maps"
    (let [belief (->clj (facade/create-eta-belief #js {:socialFriction 2
                                                       :deployRisk -1
                                                       :userIntentConfidence 0.8}))]
      (is (= 1 (:socialFriction belief)))
      (is (= 0 (:deployRisk belief)))
      (is (= 0.8 (:userIntentConfidence belief)))
      (is (not (contains? belief :social-friction))))))

(deftest facade-action-batch-test
  (testing "facade returns the current JS action batch shape"
    (let [batch (->clj (facade/create-action-batch valid-context))]
      (is (= "eta-mu-action-batch.v1" (:kind batch)))
      (is (= ["field" "movement"] (:panels batch)))
      (is (= "noop" (-> batch :actions first :kind)))
      (is (= false (get-in batch [:breath :shouldCommit]))))))

(deftest malformed-context-rejected-test
  (testing "facade rejects malformed public planning context payloads"
    ;; create-eta-belief is a permissive constructor that clamps belief scores;
    ;; create-action-batch is a strict public boundary and rejects malformed contexts.
    (is (thrown? js/Error
                 (facade/create-action-batch
                  #js {:repo "open-hax/proxx"
                       :trigger "scheduler.tick"
                       :target "open-hax/proxx"
                       :summary "bad context"
                       :belief #js {:urgency 2
                                    :ambiguity 0.25
                                    :socialFriction 0
                                    :deployRisk 0
                                    :reviewDebt 0
                                    :drift 0
                                    :crust 0
                                    :bloomNeed 0.25
                                    :userIntentConfidence 0.5}})))))

(deftest message-facade-roundtrip-test
  (testing "facade round-trips representative message payloads to LLM-compatible messages"
    (let [bash-message (facade/create-bash-execution-message
                        #js {:command "echo hi"
                             :output "hi"
                             :exitCode 0
                             :cancelled false
                             :truncated false
                             :timestamp "2026-05-30T00:00:00.000Z"})
          custom-message (facade/create-custom-message
                          "extension.notice"
                          #js [(facade/create-text-content "look")
                               (facade/create-image-content "aW1n" "image/png")
                               (facade/create-audio-content "YXVkaW8=" "audio/wav" "wav")]
                          true
                          #js {:source "test"}
                          "2026-05-30T00:00:01.000Z")
          bash-roundtrip (->clj bash-message)
          llm (->clj (facade/convert-to-llm-messages #js [bash-message custom-message]))]
      (is (false? (:excludeFromContext bash-roundtrip)))
      (is (= ["user" "user"] (mapv :role llm)))
      (is (re-find #"Ran `echo hi`" (-> llm first :content first :text)))
      (is (= ["text" "image" "audio"] (mapv :type (-> llm second :content)))))))

(deftest runtime-core-facade-test
  (testing "facade exposes pure tool/model/session runtime data contracts"
    (let [tools (->clj (facade/compose-tool-descriptors
                        #js [#js [(facade/create-tool-descriptor
                                   #js {:name "read"
                                        :description "Read files"
                                        :parameters #js {}})]
                             #js [(facade/create-tool-descriptor
                                   #js {:name "read"
                                        :description "Duplicate"
                                        :parameters #js {}})
                                  (facade/create-tool-descriptor
                                   #js {:name "write"
                                        :description "Write files"
                                        :parameters #js {}
                                        :enabled false})]]))
          models (->clj (facade/select-compatible-models
                         #js [#js {:id "cheap-text"
                                   :name "Cheap Text"
                                   :api "openai-responses"
                                   :provider "openai"
                                   :baseUrl "https://api.openai.example/v1"
                                   :reasoning false
                                   :input #js ["text"]
                                   :cost #js {:input 0.1 :output 0.2 :cacheRead 0 :cacheWrite 0}
                                   :contextWindow 128000
                                   :maxTokens 4096}
                              #js {:id "reasoning-audio"
                                   :name "Reasoning Audio"
                                   :api "anthropic-messages"
                                   :provider "anthropic"
                                   :baseUrl "https://api.anthropic.example"
                                   :reasoning true
                                   :input #js ["text" "image" "audio"]
                                   :cost #js {:input 1 :output 2 :cacheRead 0.1 :cacheWrite 0.2}
                                   :contextWindow 200000
                                   :maxTokens 8192}]
                         #js {:inputs #js ["text" "audio"]
                              :reasoningRequired true
                              :minContextWindow 160000}))
          session (->clj (facade/create-session-context
                          #js {:sessionId "s1"
                               :cwd "/repo"
                               :messages #js [#js {:role "user"
                                                   :content #js [(facade/create-text-content "hello")]
                                                   :timestamp 1780099200000}]
                               :activeToolNames #js ["read" "write"]
                               :metadata #js {:branch "main"}
                               :createdAt 1780099200000
                               :updatedAt 1780099200000}))]
      (is (= ["read" "write"] (mapv :name tools)))
      (is (false? (:enabled (first (filter #(= "write" (:name %)) tools)))))
      (is (= "reasoning-audio" (-> models first :id)))
      (is (= "s1" (:sessionId session)))
      (is (= "text" (-> session :messages first :content first :type)))
      (is (thrown? js/Error
                   (facade/select-compatible-models
                    #js [#js {:id "cheap-text"
                              :name "Cheap Text"
                              :api "openai-responses"
                              :provider "openai"
                              :baseUrl "https://api.openai.example/v1"
                              :reasoning false
                              :input #js ["text"]
                              :cost #js {:input 0.1 :output 0.2 :cacheRead 0 :cacheWrite 0}
                              :contextWindow 128000
                              :maxTokens 4096}]
                    #js {:inputs #js ["text"]
                         :reasoningRequired "false"}))))))

(deftest surface-command-facade-test
  (testing "facade creates JS-compatible command results for CLI parity paths"
    (let [result (->clj (facade/create-surface-command-result
                         #js {:command "version"
                              :value "0.70.15"}))]
      (is (= "version" (:command result)))
      (is (= "0.70.15" (:stdout result)))
      (is (= 0 (:exitCode result)))
      (is (thrown? js/Error
                   (facade/create-surface-command-result
                    #js {:command "unknown"
                         :value "0.70.15"}))))))

(deftest invalid-timestamp-rejected-test
  (testing "facade rejects invalid timestamp inputs before domain validation"
    (is (thrown? js/Error
                 (facade/create-branch-summary-message "summary" "from" "not-a-date")))))
