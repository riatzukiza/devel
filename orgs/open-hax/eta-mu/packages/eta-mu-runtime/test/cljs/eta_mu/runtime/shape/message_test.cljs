(ns eta-mu.runtime.shape.message-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.shape.message :as shape]))

(def timestamp 1780099200000)

(def usage-external
  {:input 3
   :output 5
   :cacheRead 7
   :cacheWrite 11
   :totalTokens 26
   :cost {:input 0.1
          :output 0.2
          :cacheRead 0.03
          :cacheWrite 0.04
          :total 0.37}})

(deftest content-shape-roundtrip-test
  (testing "content parts preserve public camelCase and internal kebab-case keys"
    (let [parts [{:type "text" :text "hello" :textSignature "sig:text"}
                 {:type "image" :data "aW1n" :mimeType "image/png"}
                 {:type "audio" :data "YXVkaW8=" :mimeType "audio/wav" :format "wav"}
                 {:type "thinking" :thinking "hmm" :thinkingSignature "sig:think" :redacted false}
                 {:type "toolCall" :id "call-1" :name "read" :arguments {:path "README.md"} :thoughtSignature "sig:tool"}]
          internal (mapv shape/content-from-external parts)
          external (mapv shape/content->external internal)]
      (is (= [:text :image :audio :thinking :tool-call]
             (mapv :type internal)))
      (is (= :wav (-> internal (nth 2) :format)))
      (is (false? (-> internal (nth 3) :redacted)))
      (is (= "sig:tool" (-> internal (nth 4) :thought-signature)))
      ;; Shape external maps stay in CLJS data with keyword enum values;
      ;; the facade host adapter stringifies them for public JavaScript callers.
      (is (= [:text :image :audio :thinking :toolCall]
             (mapv :type external)))
      (is (= "sig:text" (-> external first :textSignature)))
      (is (= "wav" (-> external (nth 2) :format)))
      (is (false? (-> external (nth 3) :redacted)))
      (is (= "sig:tool" (-> external (nth 4) :thoughtSignature)))))

  (testing "string content and unknown content pass through unchanged"
    (is (= "plain" (shape/content-list-from-external "plain")))
    (is (= "plain" (shape/content-list->external "plain")))
    (is (= {:type "unknown" :value 1}
           (shape/content-from-external {:type "unknown" :value 1})))
    (is (= {:type :unknown :value 1}
           (shape/content->external {:type :unknown :value 1})))))

(deftest usage-shape-roundtrip-test
  (testing "usage metrics convert cache and total token names both ways"
    (let [internal (shape/usage-from-external usage-external)
          external (shape/usage->external internal)]
      (is (= {:input 3
              :output 5
              :cache-read 7
              :cache-write 11
              :total-tokens 26
              :cost {:input 0.1
                     :output 0.2
                     :cache-read 0.03
                     :cache-write 0.04
                     :total 0.37}}
             internal))
      (is (= 7 (:cacheRead external)))
      (is (= 11 (:cacheWrite external)))
      (is (= 26 (:totalTokens external)))
      (is (= 0.03 (get-in external [:cost :cacheRead]))))))

(deftest message-shape-roundtrip-test
  (testing "all public message roles normalize and externalize"
    (let [messages [{:role "user"
                     :content "hello"
                     :timestamp timestamp}
                    {:role "assistant"
                     :content [{:type "text" :text "done" :textSignature "sig:text"}
                               {:type "thinking" :thinking "trace" :thinkingSignature "sig:think" :redacted true}
                               {:type "toolCall" :id "call-1" :name "read" :arguments {:path "README.md"} :thoughtSignature "sig:tool"}]
                     :api "openai-responses"
                     :provider "openai"
                     :model "gpt-test"
                     :responseId "resp-1"
                     :usage usage-external
                     :stopReason "tool-use"
                     :errorMessage "soft failure"
                     :timestamp timestamp}
                    {:role "toolResult"
                     :toolCallId "call-1"
                     :toolName "read"
                     :content [{:type "text" :text "ok"}]
                     :details {:bytes 2}
                     :isError false
                     :timestamp timestamp}
                    {:role "bashExecution"
                     :command "pnpm test"
                     :output "ok"
                     :exitCode 0
                     :cancelled false
                     :truncated false
                     :fullOutputPath "/tmp/full.log"
                     :excludeFromContext false
                     :timestamp timestamp}
                    {:role "custom"
                     :customType "extension.notice"
                     :content "notice"
                     :display true
                     :details {:source "test"}
                     :timestamp timestamp}
                    {:role "branchSummary"
                     :summary "branch facts"
                     :fromId "abc"
                     :timestamp timestamp}
                    {:role "compactionSummary"
                     :summary "old facts"
                     :tokensBefore 1200
                     :timestamp timestamp}]
          internal (mapv shape/message-from-external messages)
          external (mapv shape/message->external internal)]
      (is (= [:user :assistant :tool-result :bash-execution :custom :branch-summary :compaction-summary]
             (mapv :role internal)))
      (is (= :tool-use (-> internal second :stop-reason)))
      (is (= "resp-1" (-> internal second :response-id)))
      (is (= "soft failure" (-> internal second :error-message)))
      (is (= "call-1" (-> internal (nth 2) :tool-call-id)))
      (is (false? (-> internal (nth 3) :exclude-from-context)))
      (is (= "extension.notice" (-> internal (nth 4) :custom-type)))
      (is (= "abc" (-> internal (nth 5) :from-id)))
      (is (= 1200 (-> internal (nth 6) :tokens-before)))
      ;; Shape external maps stay in CLJS data with keyword enum values;
      ;; the facade host adapter stringifies them for public JavaScript callers.
      (is (= [:user :assistant :toolResult :bashExecution :custom :branchSummary :compactionSummary]
             (mapv :role external)))
      (is (= "tool-use" (-> external second :stopReason)))
      (is (= "resp-1" (-> external second :responseId)))
      (is (= "soft failure" (-> external second :errorMessage)))
      (is (= "call-1" (-> external (nth 2) :toolCallId)))
      (is (false? (-> external (nth 3) :excludeFromContext)))
      (is (= "extension.notice" (-> external (nth 4) :customType)))
      (is (= "abc" (-> external (nth 5) :fromId)))
      (is (= 1200 (-> external (nth 6) :tokensBefore)))))

  (testing "unknown message roles pass through unchanged"
    (is (= {:role "unknown" :value 1}
           (shape/message-from-external {:role "unknown" :value 1})))
    (is (= {:role :unknown :value 1}
           (shape/message->external {:role :unknown :value 1})))))
