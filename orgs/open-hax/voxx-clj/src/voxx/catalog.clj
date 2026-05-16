(ns voxx.catalog
  "Voice profiles and model catalog for the Voxx voice gateway."
  (:require [clojure.string :as str]))

;; ---------------------------------------------------------------------------
;; Voice profile
;; ---------------------------------------------------------------------------

(defrecord VoiceProfile
  [id name melo-language category description
   pitch-multiplier speed-multiplier stability
   similarity-boost style use-speaker-boost
   labels aliases provider-voice-ids])

(defn make-voice-profile
  "Create a voice profile with sensible defaults."
  [{:keys [id name melo-language category description
           pitch-multiplier speed-multiplier stability
           similarity-boost style use-speaker-boost
           labels aliases provider-voice-ids]
    :or {melo-language "EN" category "premade"
         description "OpenHax compatibility voice"
         pitch-multiplier 1.0 speed-multiplier 1.0
         stability 0.55 similarity-boost 0.78
         style 0.12 use-speaker-boost true
         labels {} aliases [] provider-voice-ids {}}}]
  {:id                (str id)
   :name              (str (or name id))
   :melo-language     (str melo-language)
   :category          (str category)
   :description       (str description)
   :pitch-multiplier  (double pitch-multiplier)
   :speed-multiplier  (double speed-multiplier)
   :stability         (double stability)
   :similarity-boost  (double similarity-boost)
   :style             (double style)
   :use-speaker-boost (boolean use-speaker-boost)
   :labels            (into {} labels)
   :aliases           (mapv str aliases)
   :provider-voice-ids (into {} provider-voice-ids)})

;; ---------------------------------------------------------------------------
;; Voice profiles catalog
;; ---------------------------------------------------------------------------

(def voice-profiles
  [(make-voice-profile
    {:id "alloy" :name "Alloy" :melo-language "EN"
     :description "Neutral OpenAI-compatible default voice"
     :aliases ["rachel" "bella"]
     :labels {:accent "neutral" :provider "voxx-openai-compatible"}
     :provider-voice-ids {"openai" "alloy" "requesty" "alloy" "xiaomi_mimo" "mimo_default" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "nova" :name "Nova" :melo-language "EN"
     :pitch-multiplier 1.04 :speed-multiplier 1.03
     :stability 0.62 :style 0.18
     :aliases ["aria" "serena" "ash"]
     :labels {:accent "bright" :provider "voxx-openai-compatible"}
     :provider-voice-ids {"openai" "ash" "requesty" "ash" "xiaomi_mimo" "Mia" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "onyx" :name "Onyx" :melo-language "EN"
     :pitch-multiplier 0.96 :speed-multiplier 0.98
     :stability 0.68 :style 0.08
     :aliases ["adam" "antoni"]
     :labels {:accent "low" :provider "voxx-openai-compatible"}
     :provider-voice-ids {"openai" "echo" "requesty" "echo" "xiaomi_mimo" "Dean" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "shimmer" :name "Shimmer" :melo-language "EN"
     :pitch-multiplier 1.06 :speed-multiplier 1.01
     :stability 0.58 :style 0.24
     :aliases ["elli" "dorothy"]
     :labels {:accent "airy" :provider "voxx-openai-compatible"}
     :provider-voice-ids {"openai" "shimmer" "requesty" "shimmer" "xiaomi_mimo" "Chloe" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "echo" :name "Echo" :melo-language "EN"
     :pitch-multiplier 0.99 :speed-multiplier 0.97
     :stability 0.7 :style 0.06
     :aliases ["sam" "josh"]
     :labels {:accent "steady" :provider "voxx-openai-compatible"}
     :provider-voice-ids {"openai" "echo" "requesty" "echo" "xiaomi_mimo" "Milo" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "sage" :name "Sage" :melo-language "EN"
     :speed-multiplier 0.95 :stability 0.74 :style 0.05
     :aliases ["george"]
     :labels {:accent "measured" :provider "openai-compatible"}
     :provider-voice-ids {"openai" "sage" "requesty" "sage" "xiaomi_mimo" "白桦" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "kaede" :name "Kaede" :melo-language "JP"
     :stability 0.61 :style 0.16
     :aliases ["ja_default" "sakura"]
     :labels {:accent "jp" :provider "openhax"}
     :provider-voice-ids {"openai" "alloy" "requesty" "alloy" "xiaomi_mimo" "茉莉" "kokoro" "jf_alpha"}})

   (make-voice-profile
    {:id "mimo_default" :name "MiMo Default" :melo-language "EN"
     :description "Xiaomi MiMo default TTS voice"
     :aliases ["mimo" "xiaomi_mimo"]
     :labels {:accent "neutral" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "mimo_default" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "mia" :name "Mia" :melo-language "EN"
     :description "Xiaomi MiMo English voice"
     :labels {:accent "en" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "Mia" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "chloe" :name "Chloe" :melo-language "EN"
     :description "Xiaomi MiMo English voice"
     :labels {:accent "en" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "Chloe" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "milo" :name "Milo" :melo-language "EN"
     :description "Xiaomi MiMo English voice"
     :labels {:accent "en" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "Milo" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "dean" :name "Dean" :melo-language "EN"
     :description "Xiaomi MiMo English voice"
     :labels {:accent "en" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "Dean" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "bingtang" :name "冰糖" :melo-language "EN"
     :description "Xiaomi MiMo voice"
     :labels {:accent "zh" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "冰糖" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "moli" :name "茉莉" :melo-language "EN"
     :description "Xiaomi MiMo voice"
     :labels {:accent "zh" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "茉莉" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "suda" :name "苏打" :melo-language "EN"
     :description "Xiaomi MiMo voice"
     :labels {:accent "zh" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "苏打" "kokoro" "af_jessica"}})

   (make-voice-profile
    {:id "baihua" :name "白桦" :melo-language "EN"
     :description "Xiaomi MiMo voice"
     :labels {:accent "zh" :provider "xiaomi_mimo"}
     :provider-voice-ids {"xiaomi_mimo" "白桦" "kokoro" "af_jessica"}})])

;; ---------------------------------------------------------------------------
;; Model catalog
;; ---------------------------------------------------------------------------

(def model-catalog
  [{:id "gpt-4o-mini-tts"        :object "model" :created 0 :owned_by "openhax"
    :modalities ["text" "audio"]  :family "tts"}
   {:id "tts-1"                   :object "model" :created 0 :owned_by "openhax"
    :modalities ["text" "audio"]  :family "tts"}
   {:id "tts-1-hd"                :object "model" :created 0 :owned_by "openhax"
    :modalities ["text" "audio"]  :family "tts"}
   {:id "mimo-v2.5-tts"           :object "model" :created 0 :owned_by "xiaomi_mimo"
    :modalities ["text" "audio"]  :family "tts"}
   {:id "gpt-4o-transcribe"       :object "model" :created 0 :owned_by "openhax"
    :modalities ["audio" "text"]  :family "stt"}
   {:id "gpt-4o-mini-transcribe"  :object "model" :created 0 :owned_by "openhax"
    :modalities ["audio" "text"]  :family "stt"}
   {:id "gpt-4o-transcribe-diarize" :object "model" :created 0 :owned_by "openhax"
    :modalities ["audio" "text"]  :family "stt"}
   {:id "whisper-1"               :object "model" :created 0 :owned_by "openhax"
    :modalities ["audio" "text"]  :family "stt"}
   {:id "scribe_v1"               :object "model" :created 0 :owned_by "openhax"
    :modalities ["audio" "text"]  :family "stt"}])

(def default-openai-voice "alloy")

;; ---------------------------------------------------------------------------
;; Lookup functions
;; ---------------------------------------------------------------------------

(defn voice-matches?
  "Check if a voice profile matches a voice ID."
  [profile voice-id]
  (let [target (str/lower-case (str/trim (or voice-id "")))]
    (or (= target (str/lower-case (:id profile)))
        (some #(= target (str/lower-case %)) (:aliases profile)))))

(defn resolve-voice
  "Resolve a voice ID to a profile, with optional language hint."
  [voice-id & {:keys [language-hint]}]
  (or
   ;; Try exact match first
   (when (and voice-id (not (str/blank? voice-id)))
     (first (filter #(voice-matches? % voice-id) voice-profiles)))
   ;; Try language hint
   (when (and language-hint (.startsWith ^String (str/lower-case language-hint) "ja"))
     (first (filter #(= "JP" (:melo-language %)) voice-profiles)))
   ;; Default
   (first (filter #(= default-openai-voice (:id %)) voice-profiles))
   (first voice-profiles)))

(defn provider-voice
  "Get the provider-specific voice ID for a given backend."
  [profile provider]
  (get (:provider-voice-ids profile) (str/lower-case (str/trim (or provider "")))))

(defn voice-settings
  "Get the voice settings map for a profile."
  [profile]
  {:stability         (:stability profile)
   :similarity_boost  (:similarity-boost profile)
   :style             (:style profile)
   :use_speaker_boost (:use-speaker-boost profile)
   :speed             (:speed-multiplier profile)})

;; ---------------------------------------------------------------------------
;; Serialization
;; ---------------------------------------------------------------------------

(defn voice-to-catalog-json
  "Convert a voice profile to the catalog JSON representation."
  [profile]
  {:voice_id             (:id profile)
   :name                 (:name profile)
   :category             (:category profile)
   :description          (:description profile)
   :labels               (into {} (:labels profile))
   :preview_url          nil
   :available_for_tiers  ["free" "starter" "creator" "pro"]
   :settings             (voice-settings profile)})

(defn voice-to-openai-json
  "Convert a voice profile to the OpenAI-compatible JSON representation."
  [profile]
  {:id       (:id profile)
   :object   "voice"
   :name     (:name profile)
   :language (str/lower-case (:melo-language profile))
   :provider "openhax"})

(defn list-models
  "Return the model catalog as a vector."
  []
  (mapv identity model-catalog))

(defn list-voices
  "Return all voice profiles."
  []
  voice-profiles)

(defn voices-payload
  "Build the voices list payload with optional search and voice_ids filtering."
  [& {:keys [search voice-ids]}]
  (let [voice-id-set (when (seq voice-ids)
                       (into #{} (map str/lower-case) voice-ids))
        needle (when (and search (not (str/blank? search)))
                 (str/lower-case (str/trim search)))
        filtered (cond->> voice-profiles
                   voice-id-set
                   (filter (fn [v]
                             (or (voice-id-set (str/lower-case (:id v)))
                                 (some voice-id-set (map str/lower-case (:aliases v))))))
                   needle
                   (filter (fn [v]
                             (or (str/includes? (str/lower-case (:id v)) needle)
                                 (str/includes? (str/lower-case (:name v)) needle)
                                 (some #(str/includes? (str/lower-case %) needle) (:aliases v))))))]
    {:voices        (mapv voice-to-catalog-json filtered)
     :has_more      false
     :next_page_token nil
     :total_count   (count filtered)}))
