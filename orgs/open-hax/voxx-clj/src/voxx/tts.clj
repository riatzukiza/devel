(ns voxx.tts
  "TTS engine with multiple backend support.
   Supports: kokoro, xiaomi_mimo, requesty, openai, espeak backends."
  (:require [clojure.string :as str]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [voxx.config :as config]
            [voxx.catalog :as catalog]
            [voxx.audio-utils :as audio]
            [voxx.prompt-aware :as pa])
  (:import [java.io File]
           [java.nio.file Files]
           [java.security MessageDigest]
           [java.util Base64]))

;; ---------------------------------------------------------------------------
;; HTTP helpers
;; ---------------------------------------------------------------------------

(defn- http-post-json
  "POST JSON to a URL and return the response body as bytes."
  [url body & {:keys [headers timeout-seconds]}]
  (let [client (-> (java.net.http.HttpClient/newBuilder)
                     (.version java.net.http.HttpClient$Version/HTTP_1_1)
                     (.build))
        builder (java.net.http.HttpRequest/newBuilder (java.net.URI. url))
        builder (reduce-kv (fn [b k v] (.header b k v)) builder (or headers {}))
        request (-> builder
                    (.header "Content-Type" "application/json")
                    (.timeout (java.time.Duration/ofSeconds (long (or timeout-seconds 45))))
                    (.POST (java.net.http.HttpRequest$BodyPublishers/ofString
                            (json/generate-string body)))
                    (.build))
        response (.send client request (java.net.http.HttpResponse$BodyHandlers/ofByteArray))]
    (if (< (.statusCode response) 300)
      {:status (.statusCode response) :body (.body response)}
      (throw (ex-info (str "HTTP status=" (.statusCode response))
                      {:status (.statusCode response) :body (String. ^bytes (.body response) "UTF-8")})))))

;; ---------------------------------------------------------------------------
;; Candidate iteration helper
;; ---------------------------------------------------------------------------

(defn- try-candidates
  "Try a function for each candidate. f should return result or throw.
   Returns the first successful result, or throws with combined errors."
  [candidates f]
  (loop [remaining candidates errors []]
    (if (empty? remaining)
      (throw (ex-info (str "All candidates failed (" (str/join "; " errors) ")") {}))
      (let [candidate (first remaining)]
        (let [[success result] (try
                                 [true (f candidate)]
                                 (catch Exception e
                                   [false e]))]
          (if success
            result
            (let [err-msg (.getMessage ^Exception result)
                  errors (conj errors (str "candidate=" candidate " error=" err-msg))
                  retriable? (and (.contains ^String err-msg "status=")
                                  (re-find #"(400|404|422)" err-msg)
                                  (> (count remaining) 1))]
              (if retriable?
                (recur (rest remaining) errors)
                (throw (ex-info (str "Failed (" (str/join "; " errors) ")") {}))))))))))

;; ---------------------------------------------------------------------------
;; Language/script segmentation for Kokoro multilingual voices
;; ---------------------------------------------------------------------------

(defn- language-hint-kind
  [language]
  (let [value (str/lower-case (str/trim (or language "")))]
    (cond
      (or (str/starts-with? value "ja") (= value "jp") (= value "japanese")) "ja"
      (or (str/starts-with? value "zh") (= value "cn") (= value "chinese") (= value "mandarin")) "zh"
      :else nil)))

(defn- japanese-codepoint?
  [cp]
  (or (<= 0x3040 cp 0x30ff)   ;; Hiragana + Katakana
      (<= 0x31f0 cp 0x31ff)   ;; Katakana extensions
      (<= 0xff66 cp 0xff9f))) ;; Half-width Katakana

(defn- cjk-codepoint?
  [cp]
  (or (<= 0x3400 cp 0x4dbf)
      (<= 0x4e00 cp 0x9fff)
      (<= 0xf900 cp 0xfaff)))

(defn- latin-codepoint?
  [cp]
  (or (<= 0x0041 cp 0x005a)
      (<= 0x0061 cp 0x007a)
      (<= 0x00c0 cp 0x024f)))

(def ^:private simplified-chinese-signal-chars
  "Common simplified Chinese characters that are strong signals for zh when no explicit language hint is supplied. Han-only Japanese remains ambiguous, so this is intentionally conservative."
  (set "们这说语汉吗么过时会来个对开关书见听气爱车门电脑话欢请谢哪为国广东风后发样让读写长无边测语音声实压连远进选欢测试中文今天"))

(defn- inferred-cjk-language
  [text language]
  (or (language-hint-kind language)
      (let [chars (seq (str text))]
        (cond
          (some #(japanese-codepoint? (int %)) chars) "ja"
          (some simplified-chinese-signal-chars chars) "zh"
          :else "ja"))))

(defn- segment-language-for-char
  [ch language cjk-language]
  (let [cp (int ch)
        hint (language-hint-kind language)]
    (cond
      (japanese-codepoint? cp) "ja"
      (cjk-codepoint? cp) (or hint cjk-language "ja")
      (latin-codepoint? cp) "en"
      (Character/isDigit ch) "en"
      (Character/isWhitespace ch) nil
      :else nil)))

(defn- append-language-segment
  [segments language text]
  (let [cleaned (str/trim (str text))]
    (if (str/blank? cleaned)
      segments
      (conj segments {:language (or language "en") :text cleaned}))))

(defn- language-segments
  "Split mixed EN/JP/CJK text into synthesis segments.
   Neutral punctuation/space stays attached to the current segment. CJK defaults
   to the caller's ja/zh hint; without a hint, kana forces Japanese and a small
   set of simplified-Chinese signal characters routes Han text to Chinese."
  [text language]
  (let [default-lang (or (language-hint-kind language) "en")
        cjk-language (inferred-cjk-language text language)]
    (loop [chars (seq (str text))
           current-lang nil
           buf ""
           segments []]
      (if-not chars
        (append-language-segment segments (or current-lang default-lang) buf)
        (let [ch (first chars)
              ch-lang (segment-language-for-char ch language cjk-language)]
          (cond
            (nil? ch-lang)
            (recur (next chars) current-lang (str buf ch) segments)

            (nil? current-lang)
            (recur (next chars) ch-lang (str buf ch) segments)

            (= ch-lang current-lang)
            (recur (next chars) current-lang (str buf ch) segments)

            :else
            (recur (next chars)
                   ch-lang
                   (str ch)
                   (append-language-segment segments current-lang buf))))))))

(defn- non-english-kokoro-voice
  [settings language]
  (case language
    "ja" (str/trim (or (:kokoro-tts-ja-voice settings) "jf_alpha"))
    "zh" (str/trim (or (:kokoro-tts-zh-voice settings) "zf_xiaoxiao"))
    nil))

(defn- english-kokoro-voice-id?
  [voice-id]
  (let [v (str/lower-case (str/trim (or voice-id "")))]
    (or (str/starts-with? v "af_")
        (str/starts-with? v "am_")
        (str/starts-with? v "bf_")
        (str/starts-with? v "bm_")
        (#{"alloy" "echo" "fable" "onyx" "nova" "shimmer" "ash" "coral" "sage" "verse"} v))))

(defn- segment-kokoro-voice
  [settings requested-voice-id language]
  (or (non-english-kokoro-voice settings language)
      (when (english-kokoro-voice-id? requested-voice-id) (str/trim requested-voice-id))
      (:kokoro-tts-voice settings)
      "af_jessica"))

(defn- language-segments-summary
  [segments]
  (->> segments
       (map (fn [{:keys [language text]}]
              (str language ":" (count text))))
       (str/join ",")))

;; ---------------------------------------------------------------------------
;; Backends
;; ---------------------------------------------------------------------------

(defn- synthesize-with-openai-compatible
  "Synthesize using an OpenAI-compatible TTS API (kokoro, requesty, openai)."
  [settings backend text voice & {:keys [requested-voice-id response-format speed prompt-aware-style]}]
  (let [{:keys [api-key base-url model default-voice]}
        (case backend
          "kokoro"   {:api-key (:kokoro-api-key settings)
                      :base-url (:kokoro-tts-base-url settings)
                      :model (:kokoro-tts-model settings)
                      :default-voice (:kokoro-tts-voice settings)}
          "requesty" {:api-key (:requesty-api-token settings)
                      :base-url (:requesty-tts-base-url settings)
                      :model (:requesty-tts-model settings)
                      :default-voice (:requesty-tts-voice settings)}
          "openai"   {:api-key (:openai-api-key settings)
                      :base-url (:openai-tts-base-url settings)
                      :model (:openai-tts-model settings)
                      :default-voice (:openai-tts-voice settings)}
          (throw (ex-info (str "Unknown compatible backend: " backend) {})))
        request-format (if (#{"mp3" "wav" "flac" "opus" "pcm"} response-format) response-format "mp3")
        candidates (let [raw (str/trim (or requested-voice-id ""))
                         mapped (catalog/provider-voice voice backend)
                         base (cond-> []
                                (not (str/blank? raw)) (conj raw)
                                (not (str/blank? mapped)) (conj mapped)
                                (not (str/blank? default-voice)) (conj default-voice)
                                (#{"requesty" "openai"} backend) (conj (:id voice)))]
                     (vec (distinct (filter #(not (str/blank? %)) base))))]
    (when (empty? candidates)
      (throw (ex-info (str backend " has no usable voice candidate") {})))
    (try-candidates
     candidates
     (fn [voice-id]
       (let [payload (cond-> {:model model :input text :voice voice-id
                              :response_format request-format :speed (double speed)}
                       (and (not (str/blank? prompt-aware-style))
                            (#{"requesty" "openai"} backend))
                       (assoc :instructions prompt-aware-style))
             headers (cond-> {}
                       (not (str/blank? api-key))
                       (assoc "Authorization" (str "Bearer " api-key)))
             resp (http-post-json base-url payload {:headers headers :timeout-seconds (:tts-remote-timeout-seconds settings)})]
         [(:body resp) request-format])))))

(defn- synthesize-with-kokoro
  "Synthesize with Kokoro, routing mixed EN/JP/CJK text to Kokoro language voices.
   This prevents Japanese text from being phonemized by an English af_* voice."
  [settings text voice & {:keys [requested-voice-id response-format speed language prompt-aware-style]}]
  (let [segments (language-segments text language)
        segmented? (or (> (count segments) 1)
                       (some #(not= "en" (:language %)) segments))]
    (if-not segmented?
      (synthesize-with-openai-compatible settings "kokoro" text voice
                                         :requested-voice-id requested-voice-id
                                         :response-format response-format
                                         :speed speed
                                         :prompt-aware-style prompt-aware-style)
      (let [audio-segments
            (mapv (fn [{:keys [language text]}]
                    (let [segment-voice (segment-kokoro-voice settings requested-voice-id language)
                          [bytes fmt] (synthesize-with-openai-compatible settings "kokoro" text voice
                                                                          :requested-voice-id segment-voice
                                                                          :response-format response-format
                                                                          :speed speed
                                                                          :prompt-aware-style prompt-aware-style)]
                      {:bytes bytes :format fmt :language language :voice segment-voice}))
                  segments)
            output-bytes (audio/concatenate-audio-bytes audio-segments
                                                        :target-format response-format
                                                        :ffmpeg-bin (:ffmpeg-bin settings))]
        (log/info "Kokoro multilingual routing"
                  {:segments (mapv #(select-keys % [:language :voice]) audio-segments)})
        [output-bytes response-format]))))

(defn- synthesize-with-xiaomi-mimo
  "Synthesize using Xiaomi MiMo's TTS API."
  [settings text voice & {:keys [requested-voice-id response-format prompt-aware-style]}]
  (when (or (str/blank? (:xiaomi-mimo-api-key settings))
            (str/blank? (:xiaomi-mimo-api-base-url settings)))
    (throw (ex-info "xiaomi_mimo is not configured" {})))
  (let [request-format (if (#{"mp3" "wav"} response-format) response-format "mp3")
        candidates (let [raw (str/trim (or requested-voice-id ""))
                         mapped (catalog/provider-voice voice "xiaomi_mimo")
                         base (cond-> []
                                (not (str/blank? raw)) (conj raw)
                                (not (str/blank? mapped)) (conj mapped)
                                (not (str/blank? (:xiaomi-mimo-tts-voice settings))) (conj (:xiaomi-mimo-tts-voice settings)))]
                     (vec (distinct (filter #(not (str/blank? %)) base))))
        chat-url (str (:xiaomi-mimo-api-base-url settings) "/chat/completions")
        style-parts (cond-> [(:xiaomi-mimo-tts-style settings)]
                      (not (str/blank? prompt-aware-style)) (conj prompt-aware-style))
        style (str/join "\n\n" (filter #(not (str/blank? %)) style-parts))]
    (when (empty? candidates)
      (throw (ex-info "xiaomi_mimo has no usable voice candidate" {})))
    (try-candidates
     candidates
     (fn [voice-id]
       (let [payload {:model (:xiaomi-mimo-tts-model settings)
                      :messages [{:role "user" :content style}
                                 {:role "assistant" :content text}]
                      :audio {:voice voice-id :format request-format}}
             resp (http-post-json chat-url payload
                                  {:headers {"Authorization" (str "Bearer " (:xiaomi-mimo-api-key settings))
                                             "api-key" (:xiaomi-mimo-api-key settings)}
                                   :timeout-seconds (:tts-remote-timeout-seconds settings)})
             body (json/parse-string (String. ^bytes (:body resp) "UTF-8") true)
             audio-data (get-in body [:choices 0 :message :audio :data])]
         (when (str/blank? audio-data)
           (throw (ex-info "missing audio data" {})))
         [(.decode (Base64/getDecoder) ^String audio-data) request-format])))))

(defn- synthesize-with-espeak
  "Synthesize using espeak-ng as a fallback."
  [settings text & {:keys [speed]}]
  (let [wpm (int (max 90 (min 320 (* 170 (max 0.6 (min 1.6 (double (or speed 1.0))))))))
        temp-dir (Files/createTempDirectory "voxx_espeak_" (into-array java.nio.file.attribute.FileAttribute []))
        output-path (.resolve temp-dir "fallback.wav")]
    (try
      (let [commands [["espeak-ng"] ["espeak"]]
            result (some (fn [cmd]
                           (let [command (into (vec cmd) ["-s" (str wpm) "-w" (str output-path) (subs text 0 (min 600 (count text)))])
                                 process (.start (ProcessBuilder. ^java.util.List command))
                                 exit (.waitFor process)]
                             (when (and (= exit 0)
                                        (.exists ^File (.toFile output-path))
                                        (> (.length ^File (.toFile output-path)) 44))
                               (Files/readAllBytes output-path))))
                         commands)]
        (when result [result "wav"]))
      (finally
        (try (Files/deleteIfExists output-path) (catch Exception _))
        (try (Files/deleteIfExists temp-dir) (catch Exception _))))))

;; ---------------------------------------------------------------------------
;; Backend dispatch
;; ---------------------------------------------------------------------------

(defn- synthesize-backend
  "Dispatch to the appropriate backend."
  [settings backend text voice & {:keys [normalized-format speed language requested-voice-id prompt-aware-style]}]
  (case backend
    "kokoro"
    (synthesize-with-kokoro settings text voice
                            :requested-voice-id requested-voice-id
                            :response-format normalized-format
                            :speed speed
                            :language language
                            :prompt-aware-style prompt-aware-style)

    "xiaomi_mimo"
    (synthesize-with-xiaomi-mimo settings text voice
                                 :requested-voice-id requested-voice-id
                                 :response-format normalized-format
                                 :prompt-aware-style prompt-aware-style)

    "requesty"
    (synthesize-with-openai-compatible settings "requesty" text voice
                                       :requested-voice-id requested-voice-id
                                       :response-format normalized-format
                                       :speed speed
                                       :prompt-aware-style prompt-aware-style)

    "openai"
    (synthesize-with-openai-compatible settings "openai" text voice
                                       :requested-voice-id requested-voice-id
                                       :response-format normalized-format
                                       :speed speed
                                       :prompt-aware-style prompt-aware-style)

    "espeak"
    (synthesize-with-espeak settings text :speed speed)

    ;; Default
    (throw (ex-info (str backend ": unsupported backend") {}))))

;; ---------------------------------------------------------------------------
;; Postprocess filter chains
;; ---------------------------------------------------------------------------

(defn- build-output-postprocess-filter-chain
  "Build the output postprocess ffmpeg filter chain."
  [settings & {:keys [requested-profile enabled]}]
  (let [profile (config/active-tts-postprocess-profile settings
                                                        :requested-profile requested-profile
                                                        :enabled enabled)]
    (case profile
      "sutured-autotune-v1"
      (str/join ","
                ["highpass=f=85" "lowpass=f=12800"
                 "rubberband=pitch=1.055000" "vibrato=f=5.400:d=0.045"
                 "aecho=0.62:0.36:58:0.20"
                 "equalizer=f=180:t=q:w=0.8:g=1.0" "equalizer=f=2600:t=q:w=1.0:g=3.2"
                 "equalizer=f=5200:t=q:w=1.1:g=2.0"
                 "acompressor=threshold=0.17:ratio=3.2:attack=5:release=90:makeup=1.8:knee=2.5:link=average:detection=rms"
                 "alimiter=limit=0.92" "volume=1.4dB"])

      "sports-commentator-v1"
      (str/join ","
                ["highpass=f=90" "lowpass=f=13500"
                 "equalizer=f=180:t=q:w=0.8:g=1.5" "equalizer=f=2600:t=q:w=1.1:g=3.8"
                 "equalizer=f=4200:t=q:w=1.0:g=4.2" "equalizer=f=7800:t=q:w=1.2:g=1.2"
                 "acompressor=threshold=0.18:ratio=3.5:attack=5:release=80:makeup=2.0:knee=2.5:link=average:detection=rms"
                 "alimiter=limit=0.93" "volume=1.8dB"])

      "broadcast-warm-v1"
      (str/join ","
                ["highpass=f=75" "lowpass=f=14000"
                 "equalizer=f=180:t=q:w=0.9:g=1.2" "equalizer=f=950:t=q:w=1.2:g=0.8"
                 "equalizer=f=3200:t=q:w=1.0:g=2.4"
                 "acompressor=threshold=0.20:ratio=2.6:attack=8:release=120:makeup=1.5:knee=3.0:link=average:detection=rms"
                 "alimiter=limit=0.94" "volume=1.0dB"])

      "narrator-polish-v1"
      (str/join ","
                ["highpass=f=65" "lowpass=f=15000"
                 "equalizer=f=220:t=q:w=0.9:g=-0.7" "equalizer=f=2800:t=q:w=1.1:g=1.8"
                 "equalizer=f=6500:t=q:w=1.2:g=0.9"
                 "acompressor=threshold=0.24:ratio=2.0:attack=12:release=160:makeup=1.0:knee=4.0:link=average:detection=rms"
                 "alimiter=limit=0.95"])

      "crisp-radio-v1"
      (str/join ","
                ["highpass=f=120" "lowpass=f=11000"
                 "equalizer=f=300:t=q:w=0.8:g=-1.2" "equalizer=f=2500:t=q:w=1.0:g=3.2"
                 "equalizer=f=5200:t=q:w=1.0:g=3.0"
                 "acompressor=threshold=0.16:ratio=4.0:attack=4:release=70:makeup=2.2:knee=2.0:link=average:detection=rms"
                 "alimiter=limit=0.92" "volume=1.5dB"])

      "soft-studio-v1"
      (str/join ","
                ["highpass=f=60" "lowpass=f=16000"
                 "equalizer=f=240:t=q:w=1.0:g=0.8" "equalizer=f=3600:t=q:w=1.2:g=1.2"
                 "acompressor=threshold=0.28:ratio=1.8:attack=18:release=180:makeup=0.8:knee=5.0:link=average:detection=rms"
                 "alimiter=limit=0.96" "volume=0.5dB"])

      "")))

;; ---------------------------------------------------------------------------
;; Public synthesize function
;; ---------------------------------------------------------------------------

(defn synthesize
  "Synthesize text to audio.
   Returns [audio-bytes normalized-format headers-map]."
  [settings text voice & {:keys [response-format speed language requested-voice-id
                                  postprocess-profile postprocess-enabled
                                  prompt-aware prompt-aware-style model]
                          :or {response-format "mp3" speed 1.0}}]
  (let [normalized-format (audio/normalize-audio-format response-format)
        failures (atom [])
        active-profile (config/active-tts-postprocess-profile settings
                                                               :requested-profile postprocess-profile
                                                               :enabled postprocess-enabled)
        prompt-aware-style (let [active? (if (some? prompt-aware) prompt-aware (:tts-prompt-aware-default settings))]
                             (if active?
                               (str/trim (or prompt-aware-style (:tts-prompt-aware-style settings)))
                               ""))
        output-filters (build-output-postprocess-filter-chain settings
                                                               :requested-profile postprocess-profile
                                                               :enabled postprocess-enabled)
        ;; Parse prompt-aware segments
        pa-result (when (not (str/blank? prompt-aware-style))
                    (pa/parse-prompt-aware-segments text))
        pa-segments (first pa-result)
        pa-consumed (second pa-result)
        kokoro-language-segments (language-segments text language)
        kokoro-segmented? (or (> (count kokoro-language-segments) 1)
                              (some #(not= "en" (:language %)) kokoro-language-segments))
        ;; If model is a recognized backend, put it first
        preferred-backends (let [all-backends (config/preferred-tts-backends settings)
                                 model-backend (when (not (str/blank? (str/trim (or model ""))))
                                                 (get config/backend-aliases (str/lower-case (str/trim model)) nil))]
                             (if (and model-backend (some #{model-backend} all-backends))
                               (cons model-backend (remove #{model-backend} all-backends))
                               all-backends))]
    ;; Try backends in order
    (loop [backends preferred-backends]
      (if (empty? backends)
        (throw (ex-info (str "All TTS backends failed: " (str/join ", " @failures)) {}))
        (let [backend (first backends)]
          (let [[success result] (try
                                   (let [[source-bytes source-format]
                                         (if pa-consumed
                                           ;; Prompt-aware: flatten and synthesize
                                           (let [text (pa/sanitize-for-non-prompt-backend
                                                       (str/join " " (for [seg pa-segments
                                                                           :when (= (:kind seg) "text")]
                                                                       (:text seg))))]
                                             (synthesize-backend settings backend text voice
                                                                 :normalized-format normalized-format
                                                                 :speed speed
                                                                 :language language
                                                                 :requested-voice-id requested-voice-id
                                                                 :prompt-aware-style ""))
                                           ;; Normal synthesis
                                           (synthesize-backend settings backend text voice
                                                               :normalized-format normalized-format
                                                               :speed speed
                                                               :language language
                                                               :requested-voice-id requested-voice-id
                                                               :prompt-aware-style ""))
                                         ;; Convert to target format with postprocess
                                         output-bytes (audio/convert-audio-bytes source-bytes
                                                                                 :source-format source-format
                                                                                 :target-format normalized-format
                                                                                 :ffmpeg-bin (:ffmpeg-bin settings)
                                                                                 :audio-filters output-filters)
                                         headers (cond-> {"x-openhax-voice-id" (:id voice)
                                                          "x-openhax-audio-format" normalized-format
                                                          "x-openhax-tts-backend" backend
                                                          "x-openhax-tts-postprocess-profile" (or active-profile "none")
                                                          "x-openhax-tts-prompt-aware" (if (not (str/blank? prompt-aware-style)) "1" "0")}
                                                   requested-voice-id
                                                   (assoc "x-openhax-requested-voice-id" requested-voice-id)

                                                   (and (= backend "kokoro") kokoro-segmented?)
                                                   (assoc "x-openhax-tts-language-segments" (language-segments-summary kokoro-language-segments)))]
                                     [true [output-bytes normalized-format headers]])
                                   (catch Exception e
                                     [false e]))]
            (if success
              result
              (do
                (swap! failures conj (str backend ": " (.getMessage ^Exception result)))
                (recur (rest backends))))))))))
