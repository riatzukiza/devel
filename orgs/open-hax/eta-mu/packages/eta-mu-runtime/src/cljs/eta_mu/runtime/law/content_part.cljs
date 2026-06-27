(ns eta-mu.runtime.law.content-part)

(def audio-format-schema
  [:enum :wav :mp3 :flac :ogg :webm :m4a :aac])

(def input-modality-schema
  [:enum :text :image :audio])

(def text-content-schema
  [:map
   [:type [:= :text]]
   [:text string?]
   [:text-signature {:optional true} [:string {:min 1}]]])

(def image-content-schema
  [:map
   [:type [:= :image]]
   [:data [:string {:min 1}]]
   [:mime-type [:string {:min 1}]]])

(def audio-content-schema
  [:map
   [:type [:= :audio]]
   [:data [:string {:min 1}]]
   [:mime-type [:string {:min 1}]]
   [:format {:optional true} audio-format-schema]])

(def input-content-schema
  [:or text-content-schema image-content-schema audio-content-schema])

(def thinking-content-schema
  [:map
   [:type [:= :thinking]]
   [:thinking string?]
   [:thinking-signature {:optional true} [:string {:min 1}]]
   [:redacted {:optional true} boolean?]])

(def tool-call-content-schema
  [:map
   [:type [:= :tool-call]]
   [:id [:string {:min 1}]]
   [:name [:string {:min 1}]]
   [:arguments map?]
   [:thought-signature {:optional true} [:string {:min 1}]]])

(def assistant-content-schema
  [:or text-content-schema thinking-content-schema tool-call-content-schema])
