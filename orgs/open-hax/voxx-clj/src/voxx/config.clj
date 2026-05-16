(ns voxx.config
  "Environment-based settings for the Voxx voice gateway.
   Mirrors the Python Settings dataclass with identical env var names."
  (:require [clojure.string :as str]
            [clojure.java.io :as io])
  (:import [java.io File]))

;; ---------------------------------------------------------------------------
;; Helpers
;; ---------------------------------------------------------------------------

(defn- env-bool
  "Parse a boolean from env var `name`, returning `default` if unset."
  [name default]
  (let [raw (str/lower-case (str/trim (or (System/getenv name) (if default "1" "0"))))]
    (cond
      (#{"1" "true" "yes" "on" "enabled" "enable"} raw)  true
      (#{"0" "false" "no" "off" "disabled" "disable" "none"} raw) false
      :else default)))

(defn- env-float
  "Parse a float from env var `name`, clamped to [minimum, maximum]."
  [name default minimum maximum]
  (let [raw (str/trim (or (System/getenv name) (str default)))
        value (try (Double/parseDouble raw) (catch Exception _ default))]
    (max minimum (min maximum value))))

(defn- env-int
  "Parse an int from env var `name`, clamped to [minimum, maximum]."
  [name default minimum maximum]
  (let [raw (str/trim (or (System/getenv name) (str default)))
        value (try (Integer/parseInt raw) (catch Exception _ default))]
    (max minimum (min maximum value))))

(defn- env-csv
  "Parse a comma-separated env var into a vector of trimmed strings."
  [name]
  (let [raw (str/trim (or (System/getenv name) ""))]
    (if (str/blank? raw)
      []
      (into [] (filter #(not (str/blank? %)) (map str/trim (str/split raw #",")))))))

(defn- env-first
  "Return the first non-blank value from a sequence of env var names."
  ([names] (env-first names ""))
  ([names default]
   (or (first (filter #(not (str/blank? %))
                      (map #(str/trim (or (System/getenv %) "")) names)))
       default)))

;; ---------------------------------------------------------------------------
;; TTS backend normalization
;; ---------------------------------------------------------------------------

(def backend-aliases
  {"requesty"      "requesty"
   "openai"        "openai"
   "melo"          "melo"
   "local"         "melo"
   "local_melo"    "melo"
   "espeak"        "espeak"
   "kokoro"        "kokoro"
   "mimo"          "xiaomi_mimo"
   "mimo_tts"      "xiaomi_mimo"
   "xiaomi"        "xiaomi_mimo"
   "xiaomi_mimo"   "xiaomi_mimo"
   "xiaomi-mimo"   "xiaomi_mimo"})

(defn normalize-tts-backend-name
  "Normalize a backend name string to canonical form."
  [name]
  (let [v (str/lower-case (str/trim (or name "")))]
    (get backend-aliases v v)))

;; ---------------------------------------------------------------------------
;; TTS postprocess profiles
;; ---------------------------------------------------------------------------

(def tts-postprocess-profiles
  {"sutured-autotune-v1"
   {:name "Sutured autotune"
    :description "Expressive Voxx performance mode: deliberate pitch lift, vibrato, short echo, compression, and prompt-aware segment contours."
    :labels {:lineage "openplanner-sovereign-suture"
             :transform_intensity "high"
             :uses_pitch_transform true
             :uses_time_transform true
             :best_for ["short social drops" "musical robot speech" "high-energy Discord voice"]}}
   "sports-commentator-v1"
   {:name "Sports commentator"
    :description "High-energy broadcast presence with speech-safe EQ, compression, limiter, and gain."
    :labels {:transform_intensity "medium" :uses_pitch_transform false :uses_time_transform false}}
   "broadcast-warm-v1"
   {:name "Broadcast warm"
    :description "Warmer, less aggressive broadcast polish for conversational narration."
    :labels {:transform_intensity "low" :uses_pitch_transform false :uses_time_transform false}}
   "narrator-polish-v1"
   {:name "Narrator polish"
    :description "Clean audiobook-style leveling and presence without a hype-voice push."
    :labels {:transform_intensity "low" :uses_pitch_transform false :uses_time_transform false}}
   "crisp-radio-v1"
   {:name "Crisp radio"
    :description "Tighter radio/dispatch intelligibility with stronger presence and bandwidth control."
    :labels {:transform_intensity "medium" :uses_pitch_transform false :uses_time_transform false}}
   "soft-studio-v1"
   {:name "Soft studio"
    :description "Gentle studio cleanup for softer voices and longer listening sessions."
    :labels {:transform_intensity "low" :uses_pitch_transform false :uses_time_transform false}}})

(def ^:private postprocess-profile-aliases
  {""                    ""
   "off"                 ""
   "none"                ""
   "disabled"            ""
   "sutured"             "sutured-autotune-v1"
   "suture"              "sutured-autotune-v1"
   "autotune"            "sutured-autotune-v1"
   "sutured-autotune"    "sutured-autotune-v1"
   "sutured-autotune-v1" "sutured-autotune-v1"
   "sovereign-suture"    "sutured-autotune-v1"
   "sports"              "sports-commentator-v1"
   "commentator"         "sports-commentator-v1"
   "broadcast"           "broadcast-warm-v1"
   "warm"                "broadcast-warm-v1"
   "broadcast-warm"      "broadcast-warm-v1"
   "broadcast-warm-v1"   "broadcast-warm-v1"
   "narrator"            "narrator-polish-v1"
   "polish"              "narrator-polish-v1"
   "narrator-polish"     "narrator-polish-v1"
   "narrator-polish-v1"  "narrator-polish-v1"
   "radio"               "crisp-radio-v1"
   "crisp"               "crisp-radio-v1"
   "crisp-radio"         "crisp-radio-v1"
   "crisp-radio-v1"      "crisp-radio-v1"
   "soft"                "soft-studio-v1"
   "studio"              "soft-studio-v1"
   "soft-studio"         "soft-studio-v1"
   "soft-studio-v1"      "soft-studio-v1"
   "sports-commentator"  "sports-commentator-v1"
   "sports-commentary"   "sports-commentator-v1"
   "broadcast-sports"    "sports-commentator-v1"
   "sports-commentator-v1" "sports-commentator-v1"})

(defn normalize-postprocess-profile-name
  "Normalize a postprocess profile name to canonical form."
  [name]
  (let [v (-> (str/trim (or name ""))
              (str/lower-case)
              (str/replace #"[_ ]" "-"))]
    (get postprocess-profile-aliases v v)))

(def ^:private prompt-aware-style-default
  (str "Prompt-aware performance mode is enabled. Voxx consumes bracketed or XML-like tags such as "
       "[excited], [whisper], [laugh], [pause], [dramatic], [sing], [stretch], [glitch], [suture], "
       "or <break time=\"500ms\" /> as voice postprocessing directions. Do not speak the tags themselves; "
       "use them only for timing, energy, emotion, and inflection."))

;; ---------------------------------------------------------------------------
;; Settings record
;; ---------------------------------------------------------------------------

(defn make-settings
  "Build a settings map from environment variables.
   Call once at startup; the result is immutable."
  []
  (let [ffmpeg-bin (or (some-> (ProcessBuilder. ["which" "ffmpeg"])
                               .start .getInputStream slurp str/trim)
                       "")]
    {;; Server
     :host                          (or (System/getenv "VOICE_GATEWAY_HOST") "0.0.0.0")
     :port                          (env-int "VOICE_GATEWAY_PORT" 8788 1 65535)
     :api-key                       (str/trim (or (System/getenv "VOICE_GATEWAY_API_KEY") ""))
     :data-dir                      (str/trim (or (System/getenv "VOICE_GATEWAY_DATA_DIR") "data"))
     :ffmpeg-bin                    ffmpeg-bin
     :default-audio-format          (str/lower-case (str/trim (or (System/getenv "VOICE_GATEWAY_DEFAULT_AUDIO_FORMAT") "mp3")))
     :default-language              (str/lower-case (str/trim (or (System/getenv "VOICE_GATEWAY_DEFAULT_LANGUAGE") "en")))

     ;; TTS device
     :tts-device                    (str/trim (or (System/getenv "VOICE_GATEWAY_TTS_DEVICE") "auto"))
     :tts-eager-load                (env-bool "VOICE_GATEWAY_TTS_EAGER_LOAD" false)
     :tts-backend-order             (env-csv "VOICE_GATEWAY_TTS_BACKEND_ORDER")
     :tts-remote-timeout-seconds    (env-float "VOICE_GATEWAY_TTS_REMOTE_TIMEOUT_SECONDS" 45.0 1.0 300.0)
     :tts-default-speed             (env-float "VOICE_GATEWAY_TTS_DEFAULT_SPEED" 1.15 0.25 4.0)

     ;; TTS queue
     :tts-queue-max-concurrent      (env-int "TTS_QUEUE_MAX_CONCURRENT" 1 1 64)
     :tts-queue-max-pending         (env-int "TTS_QUEUE_MAX_PENDING" 32 0 10000)
     :tts-queue-timeout-seconds     (env-float "TTS_QUEUE_TIMEOUT_SECONDS" 120.0 0.1 3600.0)

     ;; Requesty
     :requesty-api-token            (str/trim (or (System/getenv "REQUESTY_API_TOKEN") ""))
     :requesty-tts-base-url         (str/trim (or (System/getenv "REQUESTY_TTS_BASE_URL") "https://router.requesty.ai/v1/audio/speech"))
     :requesty-tts-model            (str/trim (or (System/getenv "REQUESTY_TTS_MODEL") "openai/gpt-4o-mini-tts"))
     :requesty-tts-voice            (str/trim (or (System/getenv "REQUESTY_TTS_VOICE") "ash"))

     ;; OpenAI
     :openai-api-key                (str/trim (or (System/getenv "OPENAI_API_KEY") ""))
     :openai-tts-base-url           (str/trim (or (System/getenv "OPENAI_TTS_BASE_URL") "https://api.openai.com/v1/audio/speech"))
     :openai-tts-model              (str/trim (or (System/getenv "OPENAI_TTS_MODEL") "gpt-4o-mini-tts"))
     :openai-tts-voice              (str/trim (or (System/getenv "OPENAI_TTS_VOICE") "ash"))

     ;; Xiaomi MiMo
     :xiaomi-mimo-api-key           (env-first ["XIAOMI_MIMO_API_KEY" "XAIOMI_MIMO_API_KEY"])
     :xiaomi-mimo-api-base-url      (str/replace (env-first ["XIAOMI_MIMO_API_BASE_URL" "XAIOMI_MIMO_API_BASE_URL"] "https://api.xiaomimimo.com/v1") #"/$" "")
     :xiaomi-mimo-tts-model         (str/trim (or (System/getenv "XIAOMI_MIMO_TTS_MODEL") "mimo-v2.5-tts"))
     :xiaomi-mimo-tts-voice         (str/trim (or (System/getenv "XIAOMI_MIMO_TTS_VOICE") "mimo_default"))
     :xiaomi-mimo-tts-style         (str/trim (or (System/getenv "XIAOMI_MIMO_TTS_STYLE") "Speak naturally and clearly."))

     ;; Kokoro
     :kokoro-api-key                (str/trim (or (System/getenv "KOKORO_API_KEY") ""))
     :kokoro-tts-base-url           (str/replace (str/trim (or (System/getenv "KOKORO_TTS_BASE_URL") "http://kokoro:8880/v1/audio/speech")) #"/$" "")
     :kokoro-tts-model              (str/trim (or (System/getenv "KOKORO_TTS_MODEL") "kokoro"))
     :kokoro-tts-voice              (str/trim (or (System/getenv "KOKORO_TTS_VOICE") "af_jessica"))
     :kokoro-tts-ja-voice           (str/trim (or (System/getenv "KOKORO_TTS_JA_VOICE") "jf_alpha"))
     :kokoro-tts-zh-voice           (str/trim (or (System/getenv "KOKORO_TTS_ZH_VOICE") "zf_xiaoxiao"))

     ;; TTS postprocess
     :tts-postprocess-enabled       (env-bool "TTS_POSTPROCESS_ENABLED" true)
     :tts-postprocess-profile       (normalize-postprocess-profile-name (or (System/getenv "TTS_POSTPROCESS_PROFILE") "sports-commentator-v1"))
     :tts-prompt-aware-default      (env-bool "TTS_PROMPT_AWARE_DEFAULT" true)
     :tts-prompt-aware-style        (str/trim (or (System/getenv "TTS_PROMPT_AWARE_STYLE") prompt-aware-style-default))

     ;; Narrator unifier
     :tts-narrator-unifier-enabled  (env-bool "TTS_NARRATOR_UNIFIER_ENABLED" true)
     :tts-narrator-target-dbfs      (env-float "TTS_NARRATOR_TARGET_DBFS" -18.0 -30.0 -8.0)
     :tts-narrator-en-pitch         (env-float "TTS_NARRATOR_EN_PITCH" 1.02 0.9 1.1)
     :tts-narrator-jp-pitch         (env-float "TTS_NARRATOR_JP_PITCH" 0.97 0.9 1.1)
     :tts-narrator-en-variance-depth (env-float "TTS_NARRATOR_EN_VARIANCE_DEPTH" 0.02 0.0 0.2)
     :tts-narrator-variance-freq-hz (env-float "TTS_NARRATOR_VARIANCE_FREQ_HZ" 4.5 0.1 12.0)
     :tts-narrator-switch-fade-out-ms (env-int "TTS_NARRATOR_SWITCH_FADE_OUT_MS" 50 0 250)
     :tts-narrator-switch-fade-in-ms  (env-int "TTS_NARRATOR_SWITCH_FADE_IN_MS" 50 0 250)
     :tts-narrator-switch-gap-ms    (env-int "TTS_NARRATOR_SWITCH_GAP_MS" 100 0 400)
     :tts-narrator-envelope-window-ms (env-int "TTS_NARRATOR_ENVELOPE_WINDOW_MS" 60 20 400)
     :tts-narrator-envelope-strength  (env-float "TTS_NARRATOR_ENVELOPE_STRENGTH" 0.12 0.0 0.5)
     :tts-narrator-envelope-max-gain-db (env-float "TTS_NARRATOR_ENVELOPE_MAX_GAIN_DB" 1.2 0.2 8.0)

     ;; STT
     :stt-enabled                   (env-bool "VOICE_GATEWAY_STT_ENABLED" false)
     :stt-faster-whisper-model      (str/trim (or (System/getenv "FASTER_WHISPER_MODEL") "small"))
     :stt-faster-whisper-device     (str/trim (or (System/getenv "FASTER_WHISPER_DEVICE") "auto"))
     :stt-faster-whisper-compute-type (str/trim (or (System/getenv "FASTER_WHISPER_COMPUTE_TYPE") "int8"))
     :whisper-cpp-bin               (str/trim (or (System/getenv "WHISPER_CPP_BIN") "whisper-cli"))
     :whisper-cpp-model             (str/trim (or (System/getenv "WHISPER_CPP_MODEL") ""))}))

;; ---------------------------------------------------------------------------
;; Derived paths
;; ---------------------------------------------------------------------------

(defn cache-dir ^File [settings]
  (doto (io/file (:data-dir settings) "tts_cache") .mkdirs))

(defn transcript-dir ^File [settings]
  (doto (io/file (:data-dir settings) "transcripts") .mkdirs))

;; ---------------------------------------------------------------------------
;; Backend preference logic
;; ---------------------------------------------------------------------------

(defn preferred-tts-backends
  "Return the ordered vector of TTS backend names to try."
  [settings]
  (let [configured (into []
                     (comp (map normalize-tts-backend-name)
                           (filter #(not (str/blank? %))))
                     (:tts-backend-order settings))
        ordered (if (seq configured)
                  configured
                  (let [ordered-list (transient [])]
                    ;; Primary: Xiaomi MiMo if configured
                    (when (and (not (str/blank? (:xiaomi-mimo-api-key settings)))
                               (not (str/blank? (:xiaomi-mimo-api-base-url settings))))
                      (conj! ordered-list "xiaomi_mimo"))
                    ;; Fallback: Kokoro local voice
                    (when (or (not (str/blank? (:kokoro-api-key settings)))
                              (not (str/blank? (:kokoro-tts-base-url settings))))
                      (conj! ordered-list "kokoro"))
                    ;; Other remote providers
                    (when (not (str/blank? (:requesty-api-token settings)))
                      (conj! ordered-list "requesty"))
                    (when (not (str/blank? (:openai-api-key settings)))
                      (conj! ordered-list "openai"))
                    ;; Last-resort local fallbacks
                    (conj! ordered-list "melo")
                    (conj! ordered-list "espeak")
                    (persistent! ordered-list)))]
    ;; deduplicate
    (let [seen (volatile! #{})]
      (into [] (filter (fn [b] (if (@seen b) false (do (vswap! seen conj b) true)))) ordered))))

;; ---------------------------------------------------------------------------
;; Postprocess profile resolution
;; ---------------------------------------------------------------------------

(defn active-tts-postprocess-profile
  "Return the active postprocess profile name, or empty string if disabled."
  [settings & {:keys [requested-profile enabled]}]
  (let [enabled? (if (some? enabled) enabled (:tts-postprocess-enabled settings))]
    (if (false? enabled?)
      ""
      (normalize-postprocess-profile-name
       (if (some? requested-profile) requested-profile (:tts-postprocess-profile settings))))))

(defn tts-postprocess-profiles-payload
  "Build the profiles response payload."
  [settings]
  {:default_profile (active-tts-postprocess-profile settings)
   :profiles (mapv (fn [[id metadata]] (assoc metadata :id id)) tts-postprocess-profiles)
   :aliases {"off" "" "sutured" "sutured-autotune-v1" "suture" "sutured-autotune-v1"
             "autotune" "sutured-autotune-v1" "sovereign-suture" "sutured-autotune-v1"
             "sports" "sports-commentator-v1" "commentator" "sports-commentator-v1"
             "broadcast" "broadcast-warm-v1" "narrator" "narrator-polish-v1"
             "radio" "crisp-radio-v1" "soft" "soft-studio-v1"}})

;; ---------------------------------------------------------------------------
;; Singleton
;; ---------------------------------------------------------------------------

(def ^:private settings-atom (atom nil))

(defn get-settings
  "Return the singleton settings map, creating it on first call."
  []
  (or @settings-atom
      (reset! settings-atom (make-settings))))

(defn reset-settings-for-tests!
  "Reset the singleton for testing."
  []
  (reset! settings-atom nil))
