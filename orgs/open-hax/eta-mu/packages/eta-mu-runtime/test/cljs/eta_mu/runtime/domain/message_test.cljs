(ns eta-mu.runtime.domain.message-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.runtime.domain.message :as message]))

(def timestamp 1780099200000)

(deftest bash-execution-message-to-llm-test
  (testing "bash executions become user text unless excluded"
    (let [bash-message (message/create-bash-execution-message
                        {:command "pnpm test"
                         :output "failed"
                         :exit-code 1
                         :cancelled false
                         :truncated true
                         :full-output-path "/tmp/full.log"
                         :timestamp timestamp})
          [llm-message] (message/convert-to-llm [bash-message])]
      (is (= :user (:role llm-message)))
      (is (= :text (-> llm-message :content first :type)))
      (is (re-find #"Ran `pnpm test`" (-> llm-message :content first :text)))
      (is (re-find #"Command exited with code 1" (-> llm-message :content first :text)))
      (is (re-find #"/tmp/full.log" (-> llm-message :content first :text))))
    (let [excluded (message/create-bash-execution-message
                    {:command "secret"
                     :output "hidden"
                     :cancelled false
                     :truncated false
                     :exclude-from-context true
                     :timestamp timestamp})]
      (is (= [] (message/convert-to-llm [excluded]))))))

(deftest summary-message-to-llm-test
  (testing "branch and compaction summaries preserve their compatibility wrappers"
    (let [branch (message/create-branch-summary-message "branch facts" "abc" timestamp)
          compaction (message/create-compaction-summary-message "old facts" 1200 timestamp)
          [branch-llm compaction-llm] (message/convert-to-llm [branch compaction])]
      (is (re-find #"came back from" (-> branch-llm :content first :text)))
      (is (re-find #"branch facts" (-> branch-llm :content first :text)))
      (is (re-find #"compacted" (-> compaction-llm :content first :text)))
      (is (re-find #"old facts" (-> compaction-llm :content first :text))))))

(deftest custom-message-content-parts-test
  (testing "custom messages keep text/image/audio input parts explicit"
    (let [custom (message/create-custom-message
                  "extension.notice"
                  [(message/create-text-content "hello")
                   (message/create-image-content "aW1n" "image/png")
                   (message/create-audio-content "YXVkaW8=" "audio/wav" :wav)]
                  true
                  {:source :test}
                  timestamp)
          [llm-message] (message/convert-to-llm [custom])]
      (is (= [:text :image :audio] (mapv :type (:content llm-message))))
      (is (= "audio/wav" (-> llm-message :content last :mime-type))))))

(deftest llm-passthrough-message-test
  (testing "already-compatible user, assistant, and tool-result messages pass through unchanged"
    (let [usage {:input 1
                 :output 2
                 :cache-read 0
                 :cache-write 0
                 :total-tokens 3
                 :cost {:input 0 :output 0 :cache-read 0 :cache-write 0 :total 0}}
          user {:role :user
                :content [(message/create-text-content "hello")]
                :timestamp timestamp}
          assistant {:role :assistant
                     :content [(message/create-text-content "done")]
                     :api "openai-responses"
                     :provider "openai"
                     :model "gpt-test"
                     :usage usage
                     :stop-reason :stop
                     :timestamp timestamp}
          tool-result {:role :tool-result
                       :tool-call-id "tool-1"
                       :tool-name "read"
                       :content [(message/create-text-content "ok")]
                       :is-error false
                       :timestamp timestamp}]
      (is (= [user assistant tool-result]
             (message/convert-to-llm [user assistant tool-result]))))))

(deftest malformed-content-rejected-test
  (testing "major content types reject malformed payloads"
    (is (thrown? js/Error (message/create-image-content "aW1n" nil)))
    (is (thrown? js/Error (message/create-audio-content "YXVkaW8=" "audio/wav" :not-a-format)))))
