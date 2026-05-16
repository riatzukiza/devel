#!/usr/bin/env nbb
(ns song-audio-smoke
  (:require [clojure.string :as str]
            [clojure.set :as set]
            ["node:child_process" :as cp]
            ["node:fs" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]
            ["node:process" :as process]))

(def style-system-prompts
  [nil
   "You are a careful music analyst. Listen to the supplied audio and answer with musical style, instrumentation, production, tempo/feel, mood, and vocal delivery."
   "You analyze songs from audio evidence only. Focus on genre blend, arrangement, timbre, rhythm, mix, and emotional palette."])

(def lyrics-system-prompts
  [nil
   "You are a meticulous lyric transcription assistant. Listen to the supplied song audio and transcribe the sung words as lines."
   "You transcribe sung lyrics from audio evidence only. Preserve repeated hooks and outro lines when audible."])

(defn argv []
  (->> (js->clj (.slice (.-argv process) 2))
       (drop-while #(not (str/starts-with? % "--")))))

(defn parse-args [args]
  (loop [xs args opts {}]
    (if (empty? xs)
      opts
      (let [[x y & more] xs]
        (case x
          "--mode" (recur more (assoc opts :mode y))
          "--file" (recur more (assoc opts :file y))
          "--lyrics" (recur more (assoc opts :lyrics y))
          "--base-url" (recur more (assoc opts :base-url y))
          "--model" (recur more (assoc opts :model y))
          "--api-key" (recur more (assoc opts :api-key y))
          "--clip-seconds" (recur more (assoc opts :clip-seconds (js/parseFloat y)))
          "--out" (recur more (assoc opts :out y))
          "--max-tokens" (recur more (assoc opts :max-tokens (js/parseInt y 10)))
          "--help" (assoc opts :help true)
          (throw (js/Error. (str "Unknown argument: " x))))))))

(def usage
  (str "Usage:\n"
       "  nbb services/llamacpp-stack/bin/song-audio-smoke.cljs --mode style --file ~/Music/song.mp3 [--base-url http://127.0.0.1:8082/v1] [--model gemma4-e4b]\n"
       "  nbb services/llamacpp-stack/bin/song-audio-smoke.cljs --mode lyrics --file ~/Music/song.mp3 --lyrics ~/Music/song.txt [--base-url http://127.0.0.1:8082/v1]\n"))

(defn expand-home [p]
  (if (and p (str/starts-with? p "~/"))
    (path/join (.-HOME (.-env process)) (subs p 2))
    p))

(defn sh [& args]
  (str (cp/execFileSync (first args) (clj->js (rest args)) #js {:encoding "utf8"})))

(defn ffprobe-duration [file]
  (js/parseFloat
    (str/trim
      (sh "ffprobe" "-v" "error" "-show_entries" "format=duration" "-of" "default=noprint_wrappers=1:nokey=1" file))))

(defn temp-path [suffix]
  (path/join (os/tmpdir) (str "song-audio-smoke-" (.toString (random-uuid)) suffix)))

(defn transcode-audio! [file mode clip-seconds]
  (let [duration (ffprobe-duration file)]
    (when (or (js/isNaN duration) (<= duration 60.0))
      (throw (js/Error. (str "Audio file must be greater than 60 seconds; duration=" duration))))
    (let [actual-clip (cond
                        (number? clip-seconds) (max 61.0 (min duration clip-seconds))
                        (= mode "style") (min duration 90.0)
                        :else duration)
          out (temp-path ".mp3")
          args (cond-> ["-hide_banner" "-loglevel" "error" "-y" "-i" file "-vn" "-ac" "1" "-ar" "16000" "-b:a" "64k"]
                 (< actual-clip duration) (into ["-t" (str actual-clip)])
                 true (conj out))]
      (apply sh "ffmpeg" args)
      {:path out :duration duration :sent-duration actual-clip :format "mp3"})))

(defn read-base64 [file]
  (.toString (fs/readFileSync file) "base64"))

(defn chat-url [base-url]
  (let [trimmed (str/replace (or base-url "http://127.0.0.1:8082/v1") #"/+$" "")]
    (if (str/ends-with? trimmed "/chat/completions")
      trimmed
      (str trimmed "/chat/completions"))))

(defn build-messages [system-prompt user-task audio-b64 audio-format]
  (let [user-message {:role "user"
                      :content [{:type "input_audio"
                                 :input_audio {:data audio-b64
                                               :format audio-format}}
                                {:type "text"
                                 :text user-task}]}]
    (if system-prompt
      [{:role "system" :content system-prompt}
       user-message]
      [user-message])))

(defn curl-post-json [url api-key body]
  (let [payload-path (temp-path ".json")
        _ (fs/writeFileSync payload-path (js/JSON.stringify (clj->js body)))
        args (cond-> ["-sS" "-w" "\n__HTTP_STATUS__:%{http_code}" "-X" "POST" url
                      "-H" "content-type: application/json"
                      "--data-binary" (str "@" payload-path)]
               (and api-key (not (str/blank? api-key))) (into ["-H" (str "authorization: Bearer " api-key)]))]
    (try
      (let [raw (str (cp/execFileSync "curl" (clj->js args) #js {:encoding "utf8" :maxBuffer (* 128 1024 1024)}))
            marker "\n__HTTP_STATUS__:"
            idx (.lastIndexOf raw marker)
            body-text (if (neg? idx) raw (subs raw 0 idx))
            status (if (neg? idx) 0 (js/parseInt (subs raw (+ idx (count marker))) 10))]
        (when (or (< status 200) (>= status 300))
          (throw (ex-info (str "HTTP " status) {:status status :body body-text})))
        (js->clj (js/JSON.parse body-text) :keywordize-keys true))
      (finally
        (try (fs/unlinkSync payload-path) (catch js/Error _ nil))))))

(defn completion-text [response]
  (or (get-in response [:choices 0 :message :content])
      (get-in response [:choices 0 :text])
      (str response)))

(defn clean-line [s]
  (-> s
      (str/replace #"^\s*[-*•>\d.)\]]+\s*" "")
      (str/replace #"\[[^\]]+\]" "")
      (str/replace #"\([^)]*(intro|verse|chorus|bridge|outro|repeat)[^)]*\)" "")
      (str/replace #"\s+" " ")
      str/trim))

(defn normalize-line [s]
  (-> (clean-line s)
      str/lower-case
      (str/replace #"[^a-z0-9' ]+" " ")
      (str/replace #"\s+" " ")
      str/trim))

(defn lyric-lines-from-text [text]
  (->> (str/split-lines text)
       (map clean-line)
       (remove str/blank?)
       (remove #(re-matches #"(?i)^\s*(intro|verse|chorus|bridge|outro|pre[- ]?chorus|hook|instrumental|solo).*" %))
       vec))

(defn outro-lines-from-text [text]
  (let [raw (->> (str/split-lines text) (map str/trim) vec)
        outro-idx (last (keep-indexed (fn [idx line]
                                        (when (re-find #"(?i)\boutro\b" line) idx))
                                      raw))]
    (if outro-idx
      (->> (subvec raw (inc outro-idx))
           (take-while #(not (re-find #"(?i)^\s*\[(intro|verse|chorus|bridge|outro|hook|pre[- ]?chorus)" %)))
           (map clean-line)
           (remove str/blank?)
           vec)
      (let [lines (lyric-lines-from-text text)
            n (count lines)
            start (max 0 (- n (max 4 (js/Math.ceil (* n 0.2)))))]
        (subvec lines start n)))))

(defn tokens [s]
  (set (re-seq #"[a-z0-9']+" (normalize-line s))))

(defn line-score [a b]
  (let [na (normalize-line a)
        nb (normalize-line b)
        ta (tokens na)
        tb (tokens nb)]
    (cond
      (or (str/blank? na) (str/blank? nb)) 0
      (or (str/includes? na nb) (str/includes? nb na)) 1
      (or (< (count ta) 3) (< (count tb) 3)) 0
      :else (/ (count (set/intersection ta tb)) (max 1 (min (count ta) (count tb)))))))

(defn output-candidate-lines [text]
  (let [lines (->> (str/split-lines text)
                   (mapcat #(str/split % #"\s*/\s*"))
                   (map clean-line)
                   (remove str/blank?)
                   (filter #(>= (count (normalize-line %)) 8))
                   vec)]
    (if (> (count lines) 1)
      lines
      (->> (str/split text #"(?<=[.!?])\s+")
           (map clean-line)
           (remove str/blank?)
           vec))))

(defn validate-lyrics [text lyrics-text]
  (let [expected-lines (lyric-lines-from-text lyrics-text)
        outro-lines (outro-lines-from-text lyrics-text)
        output-lines (output-candidate-lines text)
        matches (for [out output-lines
                      :let [best (apply max 0 (map #(line-score out %) expected-lines))]
                      :when (>= best 0.55)]
                  {:line out :score best})
        outro-matches (for [out output-lines
                            :let [best (apply max 0 (map #(line-score out %) outro-lines))]
                            :when (>= best 0.55)]
                        {:line out :score best})]
    {:valid (and (>= (count matches) 2) (pos? (count outro-matches)))
     :matched-lines (count matches)
     :outro-matched-lines (count outro-matches)
     :sample-matches (take 5 matches)
     :sample-outro-matches (take 3 outro-matches)}))

(def style-terms
  ["genre" "style" "instrument" "instrumentation" "guitar" "synth" "bass" "drum" "percussion"
   "vocal" "tempo" "rhythm" "groove" "mood" "production" "mix" "texture" "arrangement"
   "melody" "harmony" "chorus" "verse" "dynamic" "timbre" "atmosphere"])

(defn validate-style [text]
  (let [lower (str/lower-case text)
        hits (filter #(str/includes? lower %) style-terms)
        lyricish-lines (count (filter #(re-find #"(?i)^\s*(\[.*\]|verse|chorus|outro|lyrics?|transcript)" %)
                                      (str/split-lines text)))]
    {:valid (and (>= (count hits) 5)
                 (or (str/includes? lower "style") (str/includes? lower "genre"))
                 (< lyricish-lines 4))
     :style-term-hits (vec hits)
     :lyricish-lines lyricish-lines}))

(defn task-text [mode]
  (case mode
    "style" "Describe the musical style of this song from the audio."
    "lyrics" "Transcribe the song lyrics as multiple lines."
    (throw (js/Error. (str "Unsupported mode: " mode)))))

(defn prompt-variants [mode]
  (case mode
    "style" style-system-prompts
    "lyrics" lyrics-system-prompts))

(defn validate-result [mode text lyrics-text]
  (case mode
    "style" (validate-style text)
    "lyrics" (validate-lyrics text lyrics-text)))

(defn find-lyrics-file [audio-file]
  (let [dir (path/dirname audio-file)
        base (path/basename audio-file (path/extname audio-file))
        exact (map #(path/join dir (str base %)) [".txt" ".lrc" ".lyrics.txt"])
        existing-exact (first (filter #(fs/existsSync %) exact))]
    (or existing-exact
        (first (filter #(re-find #"(?i)\.(txt|lrc)$" %)
                       (map #(path/join dir %)
                            (js->clj (fs/readdirSync dir))))))))

(defn run-attempt [opts audio]
  (let [mode (:mode opts)
        api-key (or (:api-key opts) (aget (.-env process) "PROXX_API_KEY") (aget (.-env process) "OPENAI_API_KEY"))
        url (chat-url (:base-url opts))
        model (or (:model opts) "gemma4-e4b")
        audio-b64 (read-base64 (:path audio))
        lyrics-path (when (= mode "lyrics") (expand-home (or (:lyrics opts) (find-lyrics-file (:file opts)))))
        lyrics-text (when lyrics-path (str (fs/readFileSync lyrics-path "utf8")))
        prompts (prompt-variants mode)]
    (when (and (= mode "lyrics") (not lyrics-text))
      (throw (js/Error. "--lyrics is required for lyrics mode when no sibling lyric file is found")))
    (loop [idx 0 attempts []]
      (if (>= idx (count prompts))
        {:ok false :attempts attempts :lyrics-path lyrics-path}
        (let [system-prompt (nth prompts idx)
              messages (build-messages system-prompt (task-text mode) audio-b64 (:format audio))
              payload {:model model
                       :messages messages
                       :temperature 0.0
                       :max_tokens (or (:max-tokens opts) (if (= mode "lyrics") 1024 700))
                       :reasoning_effort "none"
                       :chat_template_kwargs {:enable_thinking false}
                       :stream false}
              started (.now js/Date)
              response (curl-post-json url api-key payload)
              text (completion-text response)
              validation (validate-result mode text lyrics-text)
              attempt {:idx idx
                       :system-prompt? (boolean system-prompt)
                       :latency-ms (- (.now js/Date) started)
                       :valid (:valid validation)
                       :validation validation
                       :text text}]
          (if (:valid validation)
            {:ok true :attempt attempt :attempts (conj attempts attempt) :lyrics-path lyrics-path}
            (recur (inc idx) (conj attempts attempt))))))))

(defn redact-attempt [attempt]
  (-> attempt
      (update :text #(if % (subs % 0 (min (count %) 1200)) %))))

(defn -main []
  (let [opts (parse-args (argv))]
    (when (:help opts)
      (println usage)
      (process/exit 0))
    (when-not (:mode opts)
      (throw (js/Error. "--mode is required")))
    (when-not (:file opts)
      (throw (js/Error. "--file is required")))
    (let [file (expand-home (:file opts))
          opts (assoc opts :file file)
          audio (transcode-audio! file (:mode opts) (:clip-seconds opts))
          result (run-attempt opts audio)
          report {:ok (:ok result)
                  :mode (:mode opts)
                  :model (or (:model opts) "gemma4-e4b")
                  :base-url (or (:base-url opts) "http://127.0.0.1:8082/v1")
                  :audio {:duration-s (:duration audio)
                          :sent-duration-s (:sent-duration audio)
                          :format (:format audio)}
                  :lyrics-path (:lyrics-path result)
                  :attempt (some-> (:attempt result) redact-attempt)
                  :attempt-count (count (:attempts result))
                  :attempts (mapv redact-attempt (:attempts result))}
          out (or (:out opts) (temp-path ".report.json"))]
      (try (fs/unlinkSync (:path audio)) (catch js/Error _ nil))
      (fs/writeFileSync out (js/JSON.stringify (clj->js report) nil 2))
      (println (js/JSON.stringify (clj->js (assoc report :report-path out)) nil 2))
      (process/exit (if (:ok result) 0 2)))))

(try
  (-main)
  (catch js/Error e
    (let [data (ex-data e)]
      (println (js/JSON.stringify (clj->js {:ok false
                                            :error (.-message e)
                                            :data data}) nil 2))
      (process/exit 1))))
