(ns voxx.handler
  "Ring HTTP handlers for all Voxx endpoints.
   Provides OpenAI-compatible and Voxx-specific API routes."
  (:require [clojure.string :as str]
            [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.cors :refer [wrap-cors]]
            [voxx.service :as svc]
            [voxx.formatters :as fmt]
            [voxx.audio-utils :as audio]))

;; ---------------------------------------------------------------------------
;; Error responses
;; ---------------------------------------------------------------------------

(defn- openai-error
  "Build an OpenAI-compatible error response."
  [status message & {:keys [param code]}]
  (-> (response/response
       {:error {:message message
                :type (or code "invalid_request_error")
                :param param
                :code (or code "invalid_request_error")}})
      (response/status status)
      (response/content-type "application/json")
      (cond-> (= status 401) (response/header "www-authenticate" "Bearer"))))

(defn- compat-error
  "Build a Voxx-compatible error response."
  [status message]
  (-> (response/response
       {:detail {:status "error" :message message}})
      (response/status status)
      (response/content-type "application/json")))

;; ---------------------------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------------------------

(defn- safe-float [value default]
  (try (Double/parseDouble (str value)) (catch Exception _ default)))

(defn- safe-bool [value default]
  (when value
    (let [normalized (str/lower-case (str/trim (str value)))]
      (cond
        (#{"1" "true" "yes" "on" "enabled" "enable"} normalized) true
        (#{"0" "false" "no" "off" "disabled" "disable" "none"} normalized) false
        :else default))))

(defn- first-payload-value [payload names]
  (first (filter #(not (nil? %)) (map #(get payload %) names))))

(defn- extract-api-key [request]
  (let [headers (:headers request)
        query (:params request)
        auth-header (str/trim (or (get headers "authorization") ""))
        bearer-key (when (.startsWith ^String (str/lower-case auth-header) "bearer ")
                     (str/trim (subs auth-header 7)))
        header-key (first (filter #(not (str/blank? %))
                                  (map #(str/trim (or (get headers %) ""))
                                       ["x-api-key" "api-key" "xi-api-key"])))
        query-key (str/trim (or (get query "token") ""))]
    (or bearer-key header-key query-key "")))

(defn- authorized? [request service]
  (svc/authorized? service request))

(defn- update-headers [resp headers-map]
  (reduce-kv (fn [r k v] (response/header r k v)) resp headers-map))

(defn- audio-response [audio-bytes format headers]
  (-> (response/response (java.io.ByteArrayInputStream. audio-bytes))
      (response/status 200)
      (response/content-type (audio/mime-for-audio-format format))
      (response/header "content-disposition" (str "inline; filename=\"speech." format "\""))
      (update-headers headers)))

;; ---------------------------------------------------------------------------
;; TTS request options extraction
;; ---------------------------------------------------------------------------

(defn- extract-tts-options [request payload]
  (let [params (:params request)
        raw-postprocess (or (get params "postprocess") (get payload :postprocess))
        postprocess-enabled (safe-bool raw-postprocess nil)
        explicit-postprocess (or (get params "postprocess_enabled")
                                 (get params "postprocessEnabled")
                                 (first-payload-value payload [:postprocess_enabled :postprocessEnabled]))
        postprocess-enabled (if explicit-postprocess
                              (safe-bool explicit-postprocess postprocess-enabled)
                              postprocess-enabled)
        postprocess-profile (or (get params "postprocess_profile")
                                (get params "postprocessProfile")
                                (first-payload-value payload [:postprocess_profile :postprocessProfile]))
        prompt-aware (or (get params "prompt_aware")
                         (get params "promptAware")
                         (first-payload-value payload [:prompt_aware :promptAware]))
        prompt-aware-style (or (get params "prompt_aware_style")
                               (get params "promptAwareStyle")
                               (first-payload-value payload [:prompt_aware_style :promptAwareStyle]))]
    {:postprocess-profile (when postprocess-profile (str/trim (str postprocess-profile)))
     :postprocess-enabled postprocess-enabled
     :prompt-aware (safe-bool prompt-aware nil)
     :prompt-aware-style (when prompt-aware-style (str/trim (str prompt-aware-style)))}))

;; ---------------------------------------------------------------------------
;; Health
;; ---------------------------------------------------------------------------

(defn healthz [service _request]
  (-> (response/response
       {:ok true
        :service "voxx"
        :requires_api_key (boolean (:api-key (:settings service)))
        :model_count (count (voxx.catalog/list-models))
        :stt_enabled (:stt-enabled (:settings service))
        :tts_queue (svc/tts-queue-payload service)})
      (response/content-type "application/json")))

;; ---------------------------------------------------------------------------
;; Models
;; ---------------------------------------------------------------------------

(defn models [service request]
  (if-not (authorized? request service)
    (openai-error 401 "Invalid API key")
    (-> (response/response (svc/openai-models-payload service))
        (response/content-type "application/json"))))

;; ---------------------------------------------------------------------------
;; Voices
;; ---------------------------------------------------------------------------

(defn voices [service request]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (let [params (:params request)
          voice-ids (let [raw (get params "voice_ids")]
                      (when (not (str/blank? raw))
                        (str/split raw #",")))
          search (or (get params "search") (get params "query"))]
      (-> (response/response (svc/voices-payload service :search search :voice-ids voice-ids))
          (response/content-type "application/json")))))

(defn openai-voices [service request]
  (if-not (authorized? request service)
    (openai-error 401 "Invalid API key")
    (-> (response/response (svc/openai-voice-payload service))
        (response/content-type "application/json"))))

(defn voice-by-id [service request voice-id]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (-> (response/response (svc/voice-payload service voice-id))
        (response/content-type "application/json"))))

(defn voice-settings [service request voice-id]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (-> (response/response (svc/voice-settings-payload service voice-id))
        (response/content-type "application/json"))))

;; ---------------------------------------------------------------------------
;; TTS
;; ---------------------------------------------------------------------------

(defn openai-audio-speech [service request]
  (if-not (authorized? request service)
    (openai-error 401 "Invalid API key")
    (let [payload (:body request)
          text (str/trim (str (or (get payload :input) "")))
          _ (when (str/blank? text)
              (throw (ex-info "Missing required field: input" {:param "input"})))
          voice-id (str/trim (str (or (get payload :voice) "")))
          model (str/trim (str (or (get payload :model) "")))
          response-format (audio/normalize-audio-format
                           (or (get payload :response_format)
                               (:default-audio-format (:settings service))))
          speed (safe-float (get payload :speed) (:tts-default-speed (:settings service)))
          language (str/trim (str (or (get payload :language) "")))
          tts-options (extract-tts-options request payload)
          result (svc/synthesize-openai service
                                        :text text
                                        :voice-id (when (not (str/blank? voice-id)) voice-id)
                                        :model (when (not (str/blank? model)) model)
                                        :response-format response-format
                                        :speed speed
                                        :language (when (not (str/blank? language)) language)
                                        :postprocess-profile (:postprocess-profile tts-options)
                                        :postprocess-enabled (:postprocess-enabled tts-options)
                                        :prompt-aware (:prompt-aware tts-options)
                                        :prompt-aware-style (:prompt-aware-style tts-options))]
      (audio-response (:audio-bytes result) (:format result) (:headers result)))))

(defn provider-tts [service request voice-id]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (let [payload (:body request)
          text (str/trim (str (or (get payload :text) "")))
          _ (when (str/blank? text)
              (throw (ex-info "Missing required field: text" {})))
          voice-settings (when (map? (get payload :voice_settings)) (get payload :voice_settings))
          speed (safe-float (or (get voice-settings :speed) (get payload :speed)) (:tts-default-speed (:settings service)))
          language (str/trim (str (or (get payload :language_code) (get payload :language) "")))
          params (:params request)
          output-format (audio/normalize-voice-output-format
                         (or (get params "output_format") (get payload :output_format)))
          tts-options (extract-tts-options request payload)
          result (svc/synthesize-openai service
                                        :text text
                                        :voice-id voice-id
                                        :response-format output-format
                                        :speed speed
                                        :language (when (not (str/blank? language)) language)
                                        :postprocess-profile (:postprocess-profile tts-options)
                                        :postprocess-enabled (:postprocess-enabled tts-options)
                                        :prompt-aware (:prompt-aware tts-options)
                                        :prompt-aware-style (:prompt-aware-style tts-options))]
      (audio-response (:audio-bytes result) (:format result) (:headers result)))))

;; ---------------------------------------------------------------------------
;; STT
;; ---------------------------------------------------------------------------

(defn- extract-audio-upload [request]
  (let [content-type (str/lower-case (str (get (:headers request) "content-type") ""))]
    (if (.contains content-type "multipart/form-data")
      ;; Multipart form
      (let [params (:params request)
            file (:file params)]
        (if file
          {:file-bytes (:bytes file)
           :file-name (or (:filename file) "audio.bin")
           :mime (or (:content-type file) "audio/webm")
           :form params}
          {:error "missing file"}))
      ;; JSON body with base64
      (let [payload (:body request)
            audio-b64 (str/trim (str (or (get payload :audio_base64) (get payload :base64) "")))]
        (if (str/blank? audio-b64)
          {:error "missing file"}
          (try
            {:file-bytes (.decode (java.util.Base64/getDecoder) audio-b64)
             :file-name (str (or (get payload :filename) (get payload :name) "audio.bin"))
             :mime (str (or (get payload :mime) "audio/webm"))
             :form payload}
            (catch Exception _
              {:error "invalid base64 audio"})))))))

(defn openai-transcriptions [service request]
  (if-not (authorized? request service)
    (openai-error 401 "Invalid API key")
    (let [upload (extract-audio-upload request)]
      (if (:error upload)
        (openai-error 400 (:error upload) :param "file")
        (let [form (or (:form upload) {})
              model (str (or (get form :model) "gpt-4o-transcribe"))
              language (str/trim (str (or (get form :language) "")))
              response-format (str (or (get form :response_format) "json"))
              result (svc/transcribe service
                                     :audio-bytes (:file-bytes upload)
                                     :mime (:mime upload)
                                     :language (when (not (str/blank? language)) language)
                                     :task "transcribe")
              record (when (:ok result)
                       (svc/store-transcript service
                                             :source-name (:file-name upload)
                                             :mime-type (:mime upload)
                                             :task "transcribe"
                                             :model-id model
                                             :result result))]
          (if (:ok result)
            (let [resp (fmt/openai-transcription-payload result
                                                         :response-format response-format
                                                         :model model)]
              (-> (response/response (:body resp))
                  (response/status (:status resp))
                  (response/content-type (:content-type resp))
                  (response/header "x-openhax-transcription-id" (:transcription_id record))))
            (openai-error (if (str/includes? (str/lower-case (str (:error result))) "backend active") 503 400)
                          (:error result)
                          :code "audio_processing_error")))))))

(defn provider-stt [service request]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (let [upload (extract-audio-upload request)]
      (if (:error upload)
        (compat-error 400 (:error upload))
        (let [form (or (:form upload) {})
              model-id (str (or (get form :model_id) "scribe_v1"))
              language (str/trim (str (or (get form :language_code) (get form :language) "")))
              result (svc/transcribe service
                                     :audio-bytes (:file-bytes upload)
                                     :mime (:mime upload)
                                     :language (when (not (str/blank? language)) language)
                                     :task "transcribe")
              record (when (:ok result)
                       (svc/store-transcript service
                                             :source-name (:file-name upload)
                                             :mime-type (:mime upload)
                                             :task "transcribe"
                                             :model-id model-id
                                             :result result))]
          (if (:ok result)
            (-> (response/response
                 (fmt/voice-transcription-payload result
                                                  :transcription-id (:transcription_id record)
                                                  :model-id model-id))
                (response/content-type "application/json")
                (response/header "x-openhax-transcription-id" (:transcription_id record)))
            (compat-error (if (str/includes? (str/lower-case (str (:error result))) "backend active") 503 400)
                          (:error result))))))))

(defn get-transcript [service request transcription-id]
  (if-not (authorized? request service)
    (compat-error 401 "Invalid API key")
    (if-let [record (svc/get-transcript service transcription-id)]
      (let [result (:result record)]
        (-> (response/response
             {:transcription_id transcription-id
              :text (:text result)
              :language_code (or (:language result) "")
              :model_id (:model_id record)
              :duration_seconds (or (:duration result) 0.0)
              :segments (:segments result)
              :words []
              :created_at (:created_at record)})
            (response/content-type "application/json")))
      (compat-error 404 "Transcript not found"))))

;; ---------------------------------------------------------------------------
;; Postprocess profiles
;; ---------------------------------------------------------------------------

(defn postprocess-profiles [service request]
  (if-not (authorized? request service)
    (openai-error 401 "Invalid API key")
    (-> (response/response (svc/tts-postprocess-profiles-payload service))
        (response/content-type "application/json"))))

;; ---------------------------------------------------------------------------
;; Error handler
;; ---------------------------------------------------------------------------

(defn wrap-error-handler
  "Ring middleware that catches exceptions and returns appropriate error responses."
  [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (let [message (.getMessage e)
              status (cond
                       (str/includes? message "Invalid API key") 401
                       (str/includes? message "Missing required field") 400
                       (str/includes? message "TTS queue is full") 503
                       (str/includes? message "is not configured") 503
                       (str/includes? message "All TTS backends failed") 503
                       :else 500)]
          (log/warn e "Request failed:" message)
          (if (str/includes? (:uri request) "/v1/audio/")
            (openai-error status message)
            (compat-error status message)))))))

;; ---------------------------------------------------------------------------
;; App creation
;; ---------------------------------------------------------------------------

(defn create-app
  "Create the Ring handler with all middleware and routes."
  [service]
  (let [routes
        ;; Health
        [["/healthz" {:get (fn [r] (healthz service r))}]
         ;; Models
         ["/v1/models" {:get (fn [r] (models service r))}]
         ["/models" {:get (fn [r] (models service r))}]
         ;; Voices
         ["/v1/voices" {:get (fn [r] (voices service r))}]
         ["/v1/voices/search" {:get (fn [r] (voices service r))}]
         ["/v1/voices/openai" {:get (fn [r] (openai-voices service r))}]
         ["/v1/voices/:voice-id" {:get (fn [r] (voice-by-id service r (get-in r [:params :voice-id])))}]
         ["/v1/voices/:voice-id/settings" {:get (fn [r] (voice-settings service r (get-in r [:params :voice-id])))}]
         ;; TTS
         ["/v1/audio/speech" {:post (fn [r] (openai-audio-speech service r))}]
         ["/v1/text-to-speech/:voice-id" {:post (fn [r] (provider-tts service r (get-in r [:params :voice-id])))}]
         ["/v1/text-to-speech/:voice-id/stream" {:post (fn [r] (provider-tts service r (get-in r [:params :voice-id])))}]
         ;; STT
         ["/v1/audio/transcriptions" {:post (fn [r] (openai-transcriptions service r))}]
         ["/v1/audio/translations" {:post (fn [r] (openai-transcriptions service r))}]
         ["/v1/speech-to-text" {:post (fn [r] (provider-stt service r))}]
         ["/v1/speech-to-text/transcripts/:transcription-id" {:get (fn [r] (get-transcript service r (get-in r [:params :transcription-id])))}]
         ;; Postprocess profiles
         ["/v1/audio/postprocess-profiles" {:get (fn [r] (postprocess-profiles service r))}]
         ["/v1/tts/postprocess-profiles" {:get (fn [r] (postprocess-profiles service r))}]]]

    (-> (fn [request]
          ;; Simple routing
          (let [uri (:uri request)
                method (:request-method request)]
            (cond
              ;; Health
              (and (= uri "/healthz") (= method :get))
              (healthz service request)

              ;; Models
              (and (#{"/v1/models" "/models"} uri) (= method :get))
              (models service request)

              ;; Voices list
              (and (= uri "/v1/voices") (= method :get))
              (voices service request)

              ;; Voices search
              (and (= uri "/v1/voices/search") (= method :get))
              (voices service request)

              ;; OpenAI voices
              (and (= uri "/v1/voices/openai") (= method :get))
              (openai-voices service request)

              ;; Voice by ID
              (and (.startsWith uri "/v1/voices/") (not (.contains uri "/settings")) (= method :get))
              (let [voice-id (last (str/split uri #"/"))]
                (voice-by-id service request voice-id))

              ;; Voice settings
              (and (.startsWith uri "/v1/voices/") (.endsWith uri "/settings") (= method :get))
              (let [parts (str/split uri #"/")
                    voice-id (nth parts 3)]
                (voice-settings service request voice-id))

              ;; TTS speech
              (and (= uri "/v1/audio/speech") (= method :post))
              (openai-audio-speech service request)

              ;; Provider TTS
              (and (.startsWith uri "/v1/text-to-speech/") (= method :post))
              (let [parts (str/split uri #"/")
                    voice-id (nth parts 3)]
                (provider-tts service request voice-id))

              ;; STT transcriptions
              (and (= uri "/v1/audio/transcriptions") (= method :post))
              (openai-transcriptions service request)

              ;; STT translations
              (and (= uri "/v1/audio/translations") (= method :post))
              (openai-transcriptions service request)

              ;; Provider STT
              (and (= uri "/v1/speech-to-text") (= method :post))
              (provider-stt service request)

              ;; Get transcript
              (and (.startsWith uri "/v1/speech-to-text/transcripts/") (= method :get))
              (let [transcription-id (last (str/split uri #"/"))]
                (get-transcript service request transcription-id))

              ;; Postprocess profiles
              (and (#{"/v1/audio/postprocess-profiles" "/v1/tts/postprocess-profiles"} uri) (= method :get))
              (postprocess-profiles service request)

              ;; 404
              :else
              (-> (response/response {:error "Not found"})
                  (response/status 404)))))
        wrap-error-handler
        wrap-keyword-params
        wrap-params
        (wrap-json-body {:keywords? true :bigdecimals? false})
        wrap-json-response
        (wrap-cors :access-control-allow-origin #".*"
                   :access-control-allow-methods [:get :post :put :delete :options]
                   :access-control-allow-headers [:authorization :content-type :x-api-key :api-key :xi-api-key]))))
