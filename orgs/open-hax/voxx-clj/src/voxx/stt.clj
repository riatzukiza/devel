(ns voxx.stt
  "STT engine with faster-whisper and whisper.cpp backends.
   Note: In the Clojure rewrite, STT is a thin wrapper that calls
   external Python/whisper processes."
  (:require [clojure.string :as str]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [voxx.audio-utils :as audio]
            [voxx.types :as types])
  (:import [java.io File]
           [java.nio.file Files]))

;; ---------------------------------------------------------------------------
;; Transcript result builder
;; ---------------------------------------------------------------------------

(defn- make-error-result
  [engine error language task]
  (types/->transcript-result
   {:ok false :engine engine :text "" :error error :language language :task task}))

(defn- make-success-result
  [engine text language task duration segments]
  (types/->transcript-result
   {:ok true :engine engine :text text :language language :task task
    :duration duration :segments segments}))

;; ---------------------------------------------------------------------------
;; Whisper.cpp backend
;; ---------------------------------------------------------------------------

(defn- transcribe-with-whisper-cpp
  "Transcribe using whisper.cpp binary."
  [settings audio-bytes mime language task]
  (let [model-path (str/trim (:whisper-cpp-model settings))]
    (when (str/blank? model-path)
      (log/debug "whisper.cpp: no model configured")
      nil)
    (let [suffix (audio/audio-suffix-for-mime mime)
          temp-dir (Files/createTempDirectory "voxx_stt_" (into-array java.nio.file.attribute.FileAttribute []))
          source-path (.resolve temp-dir (str "input" suffix))
          wav-path (.resolve temp-dir "input.wav")
          out-base (.resolve temp-dir "input")]
      (try
        ;; Write audio to file
        (Files/write source-path audio-bytes (into-array java.nio.file.OpenOption []))
        ;; Convert to WAV if needed
        (let [prepared (if (= suffix ".wav")
                         source-path
                         (let [ffmpeg-bin (:ffmpeg-bin settings)]
                           (when (str/blank? ffmpeg-bin)
                             (throw (ex-info "ffmpeg not available" {})))
                           (let [process (.start (ProcessBuilder. [ffmpeg-bin "-y" "-loglevel" "error"
                                                                    "-i" (str source-path)
                                                                    "-ar" "16000" "-ac" "1"
                                                                    (str wav-path)]))
                                 exit (.waitFor process)]
                             (if (= exit 0) wav-path source-path))))
              ;; Run whisper.cpp
              bin (:whisper-cpp-bin settings)
              command (cond-> [bin "-m" model-path "-f" (str prepared) "-otxt" "-of" (str out-base)]
                        (not (str/blank? language)) (conj "-l" language)
                        (= task "translate") (conj "-tr"))
              process (.start (ProcessBuilder. ^java.util.List command))
              exit (.waitFor process)]
          (if (= exit 0)
            (let [txt-path (.toFile (.resolve temp-dir "input.txt"))]
              (if (.exists txt-path)
                (let [text (str/trim (slurp txt-path))]
                  (if (str/blank? text)
                    (make-error-result "whisper.cpp" "no-speech" language task)
                    (make-success-result "whisper.cpp" text language task nil [])))
                (make-error-result "whisper.cpp" "no-output" language task)))
            (make-error-result "whisper.cpp" "exec-failed" language task)))
        (catch Exception e
          (log/warn e "whisper.cpp transcription failed")
          (make-error-result "whisper.cpp" (str "error:" (.getMessage e)) language task))
        (finally
          ;; Cleanup
          (doseq [file (.listFiles (.toFile temp-dir))]
            (try (.delete file) (catch Exception _)))
          (try (Files/deleteIfExists temp-dir) (catch Exception _)))))))

;; ---------------------------------------------------------------------------
;; Public transcribe function
;; ---------------------------------------------------------------------------

(defn transcribe
  "Transcribe audio bytes using available STT backends.
   Returns a transcript result map."
  [settings audio-bytes & {:keys [mime language task]
                           :or {mime "audio/webm" task "transcribe"}}]
  (cond
    (not (:stt-enabled settings))
    (make-error-result "disabled"
                       "Voxx STT is disabled. Use the external Knoxx NPU STT service or set VOICE_GATEWAY_STT_ENABLED=1 to opt in."
                       language task)

    (empty? audio-bytes)
    (make-error-result "none" "empty audio payload" language task)

    :else
    ;; Try whisper.cpp
    (if-let [result (transcribe-with-whisper-cpp settings audio-bytes mime language task)]
      result
      (make-error-result "none" "No STT backend active. Install faster-whisper or set WHISPER_CPP_MODEL." language task))))

;; ---------------------------------------------------------------------------
;; Stub engine for testing
;; ---------------------------------------------------------------------------

(defn stub-transcribe
  "Stub transcribe function for testing."
  [text language task]
  (make-success-result "stub-stt"
                       (if (= task "translate") (str "translated:" text) text)
                       (or language "en")
                       task
                       1.25
                       [{:id 0 :start 0.0 :end 1.25
                         :text (if (= task "translate") (str "translated:" text) text)}]))
