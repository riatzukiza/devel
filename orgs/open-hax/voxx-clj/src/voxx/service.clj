(ns voxx.service
  "VoiceGatewayService: the core service layer that wires everything together."
  (:require [clojure.tools.logging :as log]
            [voxx.config :as config]
            [voxx.catalog :as catalog]
            [voxx.auth :as auth]
            [voxx.tts :as tts]
            [voxx.stt :as stt]
            [voxx.transcripts :as transcripts]
            [voxx.queue :as queue]))

;; ---------------------------------------------------------------------------
;; Service record
;; ---------------------------------------------------------------------------

(defrecord VoiceGatewayService [settings tts-queue transcript-dir])

(defn create-service
  "Create a VoiceGatewayService with default configuration."
  []
  (let [settings (config/get-settings)]
    (->VoiceGatewayService
     settings
     (queue/create-tts-queue
      {:max-concurrent (:tts-queue-max-concurrent settings)
       :max-pending (:tts-queue-max-pending settings)
       :timeout-seconds (:tts-queue-timeout-seconds settings)})
     (config/transcript-dir settings))))

;; ---------------------------------------------------------------------------
;; Authorization
;; ---------------------------------------------------------------------------

(defn authorized? [service request]
  (auth/authorized? request (:settings service)))

;; ---------------------------------------------------------------------------
;; Models
;; ---------------------------------------------------------------------------

(defn openai-models-payload [service]
  {:object "list"
   :data   (catalog/list-models)})

;; ---------------------------------------------------------------------------
;; Voices
;; ---------------------------------------------------------------------------

(defn voices-payload [service & {:keys [search voice-ids]}]
  (catalog/voices-payload :search search :voice-ids voice-ids))

(defn voice-payload [service voice-id]
  (catalog/voice-to-catalog-json (catalog/resolve-voice voice-id)))

(defn voice-settings-payload [service voice-id]
  (catalog/voice-settings (catalog/resolve-voice voice-id)))

(defn openai-voice-payload [service]
  {:object "list"
   :data   (mapv catalog/voice-to-openai-json (catalog/list-voices))})

;; ---------------------------------------------------------------------------
;; TTS postprocess profiles
;; ---------------------------------------------------------------------------

(defn tts-postprocess-profiles-payload [service]
  (config/tts-postprocess-profiles-payload (:settings service)))

;; ---------------------------------------------------------------------------
;; TTS queue
;; ---------------------------------------------------------------------------

(defn tts-queue-payload [service]
  (queue/queue-payload (:tts-queue service)))

;; ---------------------------------------------------------------------------
;; Synthesize
;; ---------------------------------------------------------------------------

(defn synthesize-openai
  "Synthesize text to audio.
   Returns {:audio-bytes :format :headers}."
  [service & {:keys [text voice-id response-format speed language
                      postprocess-profile postprocess-enabled
                      prompt-aware prompt-aware-style requested-voice-id model]}]
  (let [voice (catalog/resolve-voice (or voice-id requested-voice-id) :language-hint language)
        settings (:settings service)]
    (queue/with-tts-slot (:tts-queue service) wait-seconds
      (let [[audio-bytes normalized-format synth-headers]
            (tts/synthesize settings text voice
                            :response-format (or response-format (:default-audio-format settings))
                            :speed (or speed (:tts-default-speed settings))
                            :language language
                            :requested-voice-id (or voice-id requested-voice-id)
                            :model model
                            :postprocess-profile postprocess-profile
                            :postprocess-enabled postprocess-enabled
                            :prompt-aware prompt-aware
                            :prompt-aware-style prompt-aware-style)
            headers (merge synth-headers
                           {"x-openhax-tts-queue-wait-ms" (str (int (* wait-seconds 1000)))
                            "x-openhax-tts-queue-max-concurrent" (str (:tts-queue-max-concurrent settings))})]
        {:audio-bytes audio-bytes
         :format      normalized-format
         :headers     headers}))))

;; ---------------------------------------------------------------------------
;; STT
;; ---------------------------------------------------------------------------

(defn transcribe
  "Transcribe audio bytes.
   Returns a transcript result map."
  [service & {:keys [audio-bytes mime language task]}]
  (stt/transcribe (:settings service) audio-bytes
                  :mime mime :language language :task task))

(defn store-transcript
  "Store a transcript result and return the record."
  [service & {:keys [source-name mime-type task model-id result]}]
  (transcripts/create-transcript (:transcript-dir service)
                                 :source-name source-name
                                 :mime-type mime-type
                                 :task task
                                 :model-id model-id
                                 :result result))

(defn get-transcript
  "Retrieve a transcript by ID."
  [service transcription-id]
  (transcripts/get-transcript (:transcript-dir service) transcription-id))
