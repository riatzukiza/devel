(ns eta-mu.runtime.domain.message
  (:require [clojure.string :as str]
            [eta-mu.runtime.law.content-part :as content-law]
            [eta-mu.runtime.law.core :as law]
            [eta-mu.runtime.law.message :as message-law]))

(def compaction-summary-prefix
  "The conversation history before this point was compacted into the following summary:\n\n<summary>\n")

(def compaction-summary-suffix
  "\n</summary>")

(def branch-summary-prefix
  "The following is a summary of a branch that this conversation came back from:\n\n<summary>\n")

(def branch-summary-suffix "</summary>")

(defn create-text-content
  [text]
  (law/validate! content-law/text-content-schema
                 {:type :text :text (or text "")}
                 "text content"))

(defn create-image-content
  [data mime-type]
  (law/validate! content-law/image-content-schema
                 {:type :image :data data :mime-type mime-type}
                 "image content"))

(defn create-audio-content
  ([data mime-type]
   (create-audio-content data mime-type nil))
  ([data mime-type format]
   (law/validate! content-law/audio-content-schema
                  (cond-> {:type :audio :data data :mime-type mime-type}
                    format (assoc :format format))
                  "audio content")))

(defn input-content-vector
  [content]
  (let [normalized (if (string? content)
                     [(create-text-content content)]
                     (vec content))]
    (doseq [part normalized]
      (law/validate! content-law/input-content-schema part "input content"))
    normalized))

(defn- safe-fence-text
  [text]
  (str/replace text "```" "`​``"))

(defn bash-execution->text
  [msg]
  (let [text (str "Ran `" (:command msg) "`\n"
                  (if (seq (:output msg))
                    (str "```\n" (safe-fence-text (:output msg)) "\n```")
                    "(no output)"))
        text (cond
               (:cancelled msg)
               (str text "\n\n(command cancelled)")

               (and (some? (:exit-code msg)) (not= 0 (:exit-code msg)))
               (str text "\n\nCommand exited with code " (:exit-code msg))

               :else text)]
    (if (and (:truncated msg) (:full-output-path msg))
      (str text "\n\n[Output truncated. Full output: " (:full-output-path msg) "]")
      text)))

(defn create-bash-execution-message
  [message]
  (law/validate! message-law/bash-execution-message-schema
                 (merge {:role :bash-execution
                         :output ""
                         :exit-code nil
                         :cancelled false
                         :truncated false
                         :exclude-from-context false}
                        message)
                 "bash execution message"))

(defn create-custom-message
  [custom-type content display details timestamp]
  (law/validate! message-law/custom-message-schema
                 (cond-> {:role :custom
                          :custom-type custom-type
                          :content content
                          :display display
                          :timestamp timestamp}
                   (some? details) (assoc :details details))
                 "custom message"))

(defn create-branch-summary-message
  [summary from-id timestamp]
  (law/validate! message-law/branch-summary-message-schema
                 {:role :branch-summary
                  :summary summary
                  :from-id from-id
                  :timestamp timestamp}
                 "branch summary message"))

(defn create-compaction-summary-message
  [summary tokens-before timestamp]
  (law/validate! message-law/compaction-summary-message-schema
                 {:role :compaction-summary
                  :summary summary
                  :tokens-before tokens-before
                  :timestamp timestamp}
                 "compaction summary message"))

(defn- custom->llm
  [message]
  {:role :user
   :content (input-content-vector (:content message))
   :timestamp (:timestamp message)})

(defn- summary->llm
  [message prefix suffix]
  {:role :user
   :content [(create-text-content (str prefix (:summary message) suffix))]
   :timestamp (:timestamp message)})

(defn message->llm
  [message]
  (case (:role message)
    :bash-execution
    (when-not (:exclude-from-context message)
      {:role :user
       :content [(create-text-content (bash-execution->text message))]
       :timestamp (:timestamp message)})

    :custom
    (custom->llm message)

    :branch-summary
    (summary->llm message branch-summary-prefix branch-summary-suffix)

    :compaction-summary
    (summary->llm message compaction-summary-prefix compaction-summary-suffix)

    (:user :assistant :tool-result)
    message

    nil))

(defn convert-to-llm
  [messages]
  (->> messages
       (map #(law/validate! message-law/agent-message-schema % "agent message"))
       (keep message->llm)
       (mapv #(law/validate! message-law/llm-message-schema % "llm message"))))
