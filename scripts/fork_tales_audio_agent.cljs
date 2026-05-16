#!/usr/bin/env nbb

(ns fork-tales-audio-agent
  (:require [cljs.reader :as reader]
            [clojure.string :as str]
            [promesa.core :as p]
            ["node:fs" :as fs]
            ["node:path" :as path]
            ["node:child_process" :refer [execFileSync]]))

(def default-ollama-url "http://192.168.12.68:11434")
(def default-model "gemma4:e4b-128k")
(def default-stt-url "http://127.0.0.1:8010")
(def default-case-dir "/home/err/devel/Music/fork-tales/references/heresy-between/diagnostics/gemma-agent")
(def default-metrics-python "/home/err/devel/Music/fork-tales/references/mir-workbench/.venv/bin/python")
(def default-metrics-script "/home/err/devel/scripts/fork_tales_audio_metrics.py")
(def default-grade-script "/home/err/devel/scripts/fork_tales_audio_grade.py")
(def default-rubric-file "/home/err/devel/docs/fork-tales-audio-rubrics.json")
(def default-image-judge-script "/home/err/devel/scripts/fork_tales_spectrogram_image_judge.py")
(def default-handoff-validate-script "/home/err/devel/scripts/fork_tales_handoff_validate.py")

(defn now-iso [] (.toISOString (js/Date.)))
(defn exists? [p] (.existsSync fs p))
(defn ensure-dir! [p] (.mkdirSync fs p #js {:recursive true}))
(defn join-path [& xs] (apply (.-join path) xs))
(defn dirname [p] (.dirname path p))
(defn slurp-file [p] (.readFileSync fs p "utf8"))
(defn spit-file! [p text]
  (ensure-dir! (dirname p))
  (.writeFileSync fs p text "utf8"))

(defn json-stringify [value]
  (js/JSON.stringify (clj->js value) nil 2))

(defn read-json-file [p]
  (js->clj (js/JSON.parse (slurp-file p)) :keywordize-keys true))

(defn parse-args [args]
  (loop [xs args result {:_ []}]
    (if (empty? xs)
      result
      (let [[x y & more] xs]
        (cond
          (str/starts-with? x "--")
          (if (or (nil? y) (str/starts-with? y "--"))
            (recur (cons y more) (assoc result (keyword (subs x 2)) true))
            (recur more (assoc result (keyword (subs x 2)) y)))
          :else
          (recur (cons y more) (update result :_ conj x)))))))

(defn read-edn-file [p default]
  (if (exists? p)
    (reader/read-string (slurp-file p))
    default))

(defn write-edn-file! [p value]
  (ensure-dir! (dirname p))
  (spit-file! p (str (pr-str value) "\n")))

(defn append-edn! [p value]
  (ensure-dir! (dirname p))
  (.appendFileSync fs p (str (pr-str value) "\n") "utf8"))

(defn case-file [case-dir name] (join-path case-dir name))
(defn receipts-file [case-dir] (case-file case-dir "receipts.edn"))
(defn labels-file [case-dir] (case-file case-dir "labels.edn"))
(defn sessions-dir [case-dir] (case-file case-dir "sessions"))
(defn session-file [case-dir session-id] (join-path (sessions-dir case-dir) (str session-id ".edn")))

(defn receipt! [case-dir kind data]
  (append-edn! (receipts-file case-dir) (merge {:at (now-iso) :kind kind} data)))

(defn init-case! [case-dir]
  (ensure-dir! case-dir)
  (ensure-dir! (join-path case-dir "slices"))
  (ensure-dir! (join-path case-dir "responses"))
  (ensure-dir! (join-path case-dir "checks"))
  (ensure-dir! (sessions-dir case-dir))
  (when-not (exists? (labels-file case-dir))
    (write-edn-file! (labels-file case-dir) {:files {}}))
  (receipt! case-dir :case/init {:case-dir case-dir})
  {:ok true :case-dir case-dir})

(defn slice-audio! [{:keys [in start duration out case-dir sr ac]}]
  (ensure-dir! (dirname out))
  (execFileSync "ffmpeg"
                #js ["-y" "-hide_banner" "-nostats"
                     "-ss" (str start) "-t" (str duration) "-i" in
                     "-ac" (str (or ac "1")) "-ar" (str (or sr "16000")) "-c:a" "pcm_s16le" out]
                #js {:stdio "inherit"})
  (let [result {:in in :out out :start (js/parseFloat (str start)) :duration (js/parseFloat (str duration)) :sr (str (or sr "16000")) :ac (str (or ac "1"))}]
    (when case-dir (receipt! case-dir :tool/slice result))
    (assoc result :ok true)))

(defn filter-chain [kind]
  (case kind
    "speech" "highpass=f=90,lowpass=f=7600,afftdn=nf=-25,loudnorm=I=-20:TP=-2:LRA=11"
    "telephone" "highpass=f=250,lowpass=f=3400,loudnorm=I=-20:TP=-2:LRA=9"
    "loudnorm" "loudnorm=I=-20:TP=-2:LRA=11"
    (throw (js/Error. (str "Unknown filter kind: " kind)))))

(defn filter-audio! [{:keys [in kind out case-dir]}]
  (ensure-dir! (dirname out))
  (execFileSync "ffmpeg"
                #js ["-y" "-hide_banner" "-nostats" "-i" in
                     "-af" (filter-chain kind)
                     "-ac" "1" "-ar" "16000" "-c:a" "pcm_s16le" out]
                #js {:stdio "inherit"})
  (let [result {:in in :out out :kind kind}]
    (when case-dir (receipt! case-dir :tool/filter result))
    (assoc result :ok true)))

(defn ab-audio! [{:keys [a b out case-dir]}]
  (ensure-dir! (dirname out))
  (execFileSync "ffmpeg"
                #js ["-y" "-hide_banner" "-nostats"
                     "-i" a "-i" b
                     "-f" "lavfi" "-t" "0.35" "-i" "sine=frequency=880:sample_rate=16000"
                     "-f" "lavfi" "-t" "0.25" "-i" "anullsrc=r=16000:cl=mono"
                     "-filter_complex" "[0:a]aformat=sample_rates=16000:channel_layouts=mono[a0];[1:a]aformat=sample_rates=16000:channel_layouts=mono[a1];[2:a]volume=0.35[beep];[3:a][beep][3:a]concat=n=3:v=0:a=1[sep];[a0][sep][a1]concat=n=3:v=0:a=1[out]"
                     "-map" "[out]" "-c:a" "pcm_s16le" out]
                #js {:stdio "inherit"})
  (let [result {:a a :b b :out out :layout "A original, separator beep, B candidate"}]
    (when case-dir (receipt! case-dir :tool/ab-audio result))
    (assoc result :ok true)))

(defn split-labels [s]
  (->> (str/split (or s "") #",") (map str/trim) (remove str/blank?) vec))

(defn label-file! [{:keys [case-dir file labels note]}]
  (let [p (labels-file case-dir)
        db (read-edn-file p {:files {}})
        labels* (split-labels labels)
        entry (get-in db [:files file] {:labels [] :notes []})
        next-entry (-> entry
                       (update :labels #(vec (sort (set (concat (or % []) labels*)))))
                       (update :notes #(cond-> (or % [])
                                         (not (str/blank? (str note))) (conj {:at (now-iso) :text note}))))]
    (write-edn-file! p (assoc-in db [:files file] next-entry))
    (receipt! case-dir :tool/label {:file file :labels labels* :note note})
    {:ok true :file file :entry next-entry}))

(defn note! [{:keys [case-dir kind text]}]
  (let [record {:kind (keyword (or kind "note")) :text text}]
    (receipt! case-dir :tool/note record)
    {:ok true :record record}))

(defn base64-file [file] (.toString (.readFileSync fs file) "base64"))
(defn mime-for [file] (if (str/ends-with? (str/lower-case file) ".mp3") "audio/mpeg" "audio/wav"))
(defn format-for [file] (if (str/ends-with? (str/lower-case file) ".mp3") "mp3" "wav"))

;; Eta-mu SDK-shaped audio part. The direct wire call below converts this at the boundary.
(defn sdk-audio-part [file]
  {:type "audio" :data (base64-file file) :mimeType (mime-for file) :format (format-for file) :path file})

(defn wire-part [part]
  (case (:type part)
    "audio" {:type "input_audio" :input_audio {:data (:data part) :format (:format part)}}
    "text" {:type "text" :text (:text part)}
    part))

(defn text-part [text] {:type "text" :text text})
(defn ollama-chat-url [base-url] (str (str/replace (or base-url default-ollama-url) #"/$" "") "/v1/chat/completions"))

(defn post-json! [url payload]
  (p/let [resp (js/fetch url #js {:method "POST"
                                  :headers #js {"content-type" "application/json"}
                                  :body (js/JSON.stringify (clj->js payload))})
          text (.text resp)]
    (when-not (.-ok resp)
      (throw (js/Error. (str "HTTP " (.-status resp) ": " text))))
    (js->clj (js/JSON.parse text) :keywordize-keys true)))

(defn post-audio-bytes! [url file]
  (p/let [resp (js/fetch url #js {:method "POST"
                                  :headers #js {"content-type" "audio/wav"}
                                  :body (.readFileSync fs file)})
          text (.text resp)]
    (when-not (.-ok resp)
      (throw (js/Error. (str "HTTP " (.-status resp) ": " text))))
    (js->clj (js/JSON.parse text) :keywordize-keys true)))

(defn stt-timed-url [base-url]
  (str (str/replace (or base-url default-stt-url) #"/$" "") "/transcribe-timed"))

(declare normalize-id)

(defn run-metrics! [{:keys [case-dir command audio original candidate out-json out-prefix metrics-python metrics-script]}]
  (ensure-dir! (dirname out-json))
  (ensure-dir! (dirname out-prefix))
  (let [python (or metrics-python default-metrics-python)
        script (or metrics-script default-metrics-script)
        command* (or command (if (and original candidate) "compare" "analyze"))
        base-args (cond-> [script command* "--out-json" out-json "--out-prefix" out-prefix]
                    (= command* "analyze") (into ["--audio" audio])
                    (= command* "compare") (into ["--original" original "--candidate" candidate]))]
    (execFileSync python (clj->js base-args) #js {:stdio "inherit"})
    (let [result (read-json-file out-json)]
      (when case-dir
        (receipt! case-dir :tool/metrics {:command command*
                                          :audio audio
                                          :original original
                                          :candidate candidate
                                          :out-json out-json
                                          :out-prefix out-prefix}))
      (assoc result :ok true))))

(defn metrics! [{:keys [case-dir role audio original candidate metrics-python metrics-script]}]
  (let [role* (normalize-id (or role (if (and original candidate) "compare" "analyze")))
        metrics-dir (join-path case-dir "metrics")
        out-prefix (join-path metrics-dir role*)
        out-json (str out-prefix ".json")]
    (run-metrics! {:case-dir case-dir
                   :audio audio
                   :original original
                   :candidate candidate
                   :out-json out-json
                   :out-prefix out-prefix
                   :metrics-python metrics-python
                   :metrics-script metrics-script})))

(defn grade! [{:keys [case-dir evidence profile out-json metrics-python grade-script rubric judge-scores]}]
  (let [python (or metrics-python default-metrics-python)
        script (or grade-script default-grade-script)
        profile* (or profile "suno_reverse_accuracy")
        out-json* (or out-json
                      (if evidence
                        (join-path (dirname evidence) (str "grade-" profile* ".json"))
                        (join-path case-dir "grades" (str profile* ".json"))))
        base-args (cond-> [script
                           "--evidence" evidence
                           "--rubric" (or rubric default-rubric-file)
                           "--profile" profile*
                           "--out-json" out-json*]
                    judge-scores (into (mapcat (fn [p] ["--judge-scores" (str/trim p)])
                                               (str/split judge-scores #","))))]
    (ensure-dir! (dirname out-json*))
    (execFileSync python (clj->js base-args) #js {:stdio "inherit"})
    (let [result (read-json-file out-json*)]
      (when case-dir
        (receipt! case-dir :tool/grade {:evidence evidence
                                        :profile profile*
                                        :rubric (or rubric default-rubric-file)
                                        :out-json out-json*
                                        :overall (:overall result)}))
      (assoc result :ok true))))

(defn image-judge-prompt! [{:keys [case-dir evidence profile out-md out-json out-template metrics-python image-judge-script]}]
  (let [python (or metrics-python default-metrics-python)
        script (or image-judge-script default-image-judge-script)
        audit-dir (dirname evidence)
        out-md* (or out-md (join-path audit-dir "spectrogram-image-judge-prompt.md"))
        out-json* (or out-json (join-path audit-dir "spectrogram-image-judge-request.json"))
        out-template* (or out-template (join-path audit-dir "spectrogram-image-judge-response-template.json"))
        profile* (or profile "suno_reverse_accuracy")]
    (execFileSync python (clj->js [script "prompt"
                                   "--evidence" evidence
                                   "--profile" profile*
                                   "--out-md" out-md*
                                   "--out-json" out-json*
                                   "--out-template" out-template*])
                  #js {:stdio "inherit"})
    (let [result (read-json-file out-json*)]
      (when case-dir
        (receipt! case-dir :tool/image-judge-prompt {:evidence evidence
                                                     :profile profile*
                                                     :out-md out-md*
                                                     :out-json out-json*
                                                     :out-template out-template*}))
      (assoc result :ok true))))

(defn image-judge-import! [{:keys [case-dir response evidence out-json metrics-python image-judge-script]}]
  (let [python (or metrics-python default-metrics-python)
        script (or image-judge-script default-image-judge-script)
        out-json* (or out-json
                      (if evidence
                        (join-path (dirname evidence) "spectrogram-image-judge-scores.json")
                        (str response ".scores.json")))
        args (cond-> [script "scores" "--response" response "--out-json" out-json*]
               evidence (into ["--evidence" evidence]))]
    (execFileSync python (clj->js args) #js {:stdio "inherit"})
    (let [result (read-json-file out-json*)]
      (when case-dir
        (receipt! case-dir :tool/image-judge-import {:response response
                                                     :evidence evidence
                                                     :out-json out-json*
                                                     :judge-scores-count (count (:judge_scores result))}))
      (assoc result :ok true))))

(defn handoff-validate! [{:keys [case-dir packets packet schema catalog out-json metrics-python handoff-validate-script]}]
  (let [python (or metrics-python default-metrics-python)
        script (or handoff-validate-script default-handoff-validate-script)
        packet-list (->> (str/split (or packets packet "") #",")
                         (map str/trim)
                         (remove str/blank?)
                         vec)
        out-json* (or out-json (join-path case-dir "handoff-validation.json"))
        args (cond-> (vec (concat [script] packet-list ["--out-json" out-json*]))
               schema (into ["--schema" schema])
               catalog (into ["--catalog" catalog]))]
    (try
      (execFileSync python (clj->js args) #js {:stdio "inherit"})
      (let [result (read-json-file out-json*)]
        (when case-dir
          (receipt! case-dir :tool/handoff-validate {:packets packet-list
                                                     :schema schema
                                                     :catalog catalog
                                                     :out-json out-json*
                                                     :ok (:ok result)
                                                     :error-count (:error_count result)}))
        (assoc result :ok true))
      (catch js/Error error
        (let [result (if (exists? out-json*)
                       (read-json-file out-json*)
                       {:ok false :error (or (.-message error) (str error))})]
          (when case-dir
            (receipt! case-dir :tool/handoff-validate {:packets packet-list
                                                       :schema schema
                                                       :catalog catalog
                                                       :out-json out-json*
                                                       :ok false
                                                       :error (or (.-message error) (str error))
                                                       :error-count (:error_count result)}))
          (assoc result :ok false))))))

(defn stt-file! [{:keys [case-dir session-id role file stt-url]}]
  (let [sid (normalize-id session-id)
        role* (normalize-id (or role "audio"))
        response-dir (join-path case-dir "responses")
        response-file (join-path response-dir (str "stt-file-" sid "-" role* "-" (.getTime (js/Date.)) ".json"))]
    (-> (post-audio-bytes! (stt-timed-url stt-url) file)
        (p/then (fn [result]
                  (ensure-dir! response-dir)
                  (spit-file! response-file (json-stringify result))
                  (let [record {:session-id sid
                                :role role*
                                :audio file
                                :response-file response-file
                                :text (:text result)
                                :words (:words result)
                                :ok true}]
                    (receipt! case-dir :tool/stt-file record)
                    record))))))

(defn ask-gemma! [{:keys [case-dir audio prompt model ollama-url out-prefix]}]
  (let [audio-files (->> (str/split (or audio "") #",") (map str/trim) (remove str/blank?) vec)
        audio-labels (map-indexed (fn [idx file]
                                    (str "Audio " (char (+ 65 idx)) ": " file))
                                  audio-files)
        sdk-content (vec (concat (mapv sdk-audio-part audio-files)
                                 [(text-part (str (str/join "\n" audio-labels) "\n\n" prompt))]))
        payload {:model (or model default-model)
                 :stream false
                 :temperature 0
                 :messages [{:role "user" :content (mapv wire-part sdk-content)}]}
        response-dir (join-path case-dir "responses")
        response-file (join-path response-dir (str (or out-prefix "response") "-" (.getTime (js/Date.)) ".json"))]
    (-> (post-json! (ollama-chat-url ollama-url) payload)
        (p/then (fn [response]
                  (ensure-dir! response-dir)
                  (spit-file! response-file (js/JSON.stringify (clj->js {:request {:audio audio-files :prompt prompt :model (or model default-model)}
                                                                         :response response}) nil 2))
                  (receipt! case-dir :model/ask {:audio audio-files :prompt prompt :model (or model default-model) :response-file response-file})
                  {:ok true
                   :response-file response-file
                   :content (get-in response [:choices 0 :message :content])
                   :reasoning (get-in response [:choices 0 :message :reasoning])}))
        (p/catch (fn [error]
                   (let [message (or (.-message error) (str error))]
                     (receipt! case-dir :model/error {:audio audio-files :prompt prompt :model (or model default-model) :error message})
                     {:ok false :error message}))))))

(defn compare-prompt [task]
  (str "You are an audio reconstruction auditor. Audio inputs come before this instruction. "
       "Audio A is original. Audio B is candidate. Do not give generic critique. "
       "You must listen to both audio inputs. If you cannot perceive a syllable, write uncertain, not a placeholder. "
       "First transcribe syllables/phonetics in A and B separately. "
       "Then recommend concrete tool calls. "
       "Return JSON only with keys: a_phonetic, b_phonetic, lyric_mismatch, rhythm_mismatch, pitch_mismatch, delivery_mismatch, recommended_tool_calls. "
       "Available tools: label_file, note, slice_audio, filter_audio. Task: " task))

(defn compare! [{:keys [case-dir original candidate start duration task model ollama-url]}]
  (let [slice-dir (join-path case-dir "slices")
        start* (or start "0")
        duration* (or duration "10")
        original-slice (join-path slice-dir (str "original-" start* "-" duration* ".wav"))
        candidate-slice (join-path slice-dir (str "candidate-" start* "-" duration* ".wav"))
        ab-slice (join-path slice-dir (str "ab-" start* "-" duration* ".wav"))]
    (slice-audio! {:in original :start start* :duration duration* :out original-slice :case-dir case-dir})
    (slice-audio! {:in candidate :start start* :duration duration* :out candidate-slice :case-dir case-dir})
    (ab-audio! {:a original-slice :b candidate-slice :out ab-slice :case-dir case-dir})
    (ask-gemma! {:case-dir case-dir
                 :audio ab-slice
                 :prompt (str "The single audio file before this text contains: first A original, then a short separator beep, then B candidate. "
                              (compare-prompt (or task "Compare lyric/rhythm/pitch correctness.")))
                 :model model
                 :ollama-url ollama-url
                 :out-prefix "compare"})))

(defn normalize-id [s]
  (-> (or s (str "sess-" (.getTime (js/Date.))))
      str
      (str/replace #"[^A-Za-z0-9._-]+" "-")))

(defn read-session [case-dir session-id]
  (read-edn-file (session-file case-dir session-id) nil))

(defn write-session! [case-dir session]
  (let [session-id (:session/id session)]
    (write-edn-file! (session-file case-dir session-id) session)
    session))

(defn session-init! [{:keys [case-dir session-id goal original candidate lyrics]}]
  (init-case! case-dir)
  (let [sid (normalize-id session-id)
        session {:session/id sid
                 :created-at (now-iso)
                 :case-dir case-dir
                 :goal goal
                 :files {:original original :candidate candidate :lyrics lyrics}
                 :turns []}]
    (write-session! case-dir session)
    (receipt! case-dir :session/init {:session-id sid :goal goal :original original :candidate candidate :lyrics lyrics})
    {:ok true :session-id sid :session-file (session-file case-dir sid)}))

(defn single-hear-prompt [{:keys [role expected lyrics prompt start duration]}]
  (str "You are listening to exactly ONE audio segment. Audio content came before this text. "
       "Do not compare it to any other file and do not copy from prior examples. "
       "Task: identify what this one segment audibly sings. "
       "Segment role: " (or role "unknown") ". Start seconds: " (or start "0") ". Duration seconds: " (or duration "") ". "
       "Reference text/lyrics are a dictionary clue only, not timing truth. "
       (when-not (str/blank? (str expected)) (str "Expected/reference phrase, if audible: " expected ". "))
       (when-not (str/blank? (str lyrics)) (str "Lyrics/reference context: " lyrics "\n"))
       (or prompt "")
       "\nReturn JSON only with keys: heard_phonetic, heard_text_guess, starts_with_expected, missing_or_wrong_morae, timing_notes, pitch_notes, confidence, next_action."))

(defn session-hear! [{:keys [case-dir session-id audio role start duration expected lyrics prompt model ollama-url]}]
  (let [sid (normalize-id session-id)
        session (or (read-session case-dir sid)
                    {:session/id sid :created-at (now-iso) :case-dir case-dir :turns []})
        start* (or start "0")
        duration* (or duration "6")
        role* (or role "audio")
        slice-dir (join-path case-dir "slices")
        slice-path (join-path slice-dir (str sid "-" role* "-" start* "-" duration* ".wav"))
        turn-base {:session-id sid :role role* :audio audio :slice slice-path :start (js/parseFloat (str start*)) :duration (js/parseFloat (str duration*)) :expected expected}]
    (slice-audio! {:in audio :start start* :duration duration* :out slice-path :case-dir case-dir})
    (-> (ask-gemma! {:case-dir case-dir
                     :audio slice-path
                     :prompt (single-hear-prompt {:role role* :expected expected :lyrics lyrics :prompt prompt :start start* :duration duration*})
                     :model model
                     :ollama-url ollama-url
                     :out-prefix (str "hear-" sid "-" role*)})
        (p/then (fn [result]
                  (let [turn (merge turn-base
                                    {:at (now-iso)
                                     :ok (:ok result)
                                     :response-file (:response-file result)
                                     :content (:content result)
                                     :error (:error result)})
                        next-session (update session :turns #(conj (vec (or % [])) turn))]
                    (write-session! case-dir next-session)
                    (receipt! case-dir :session/hear turn)
                    {:ok (:ok result)
                     :session-id sid
                     :session-file (session-file case-dir sid)
                     :slice slice-path
                     :response-file (:response-file result)
                     :content (:content result)
                     :error (:error result)}))))))

(defn stt! [{:keys [case-dir session-id audio role start duration stt-url]}]
  (let [sid (normalize-id session-id)
        session (or (read-session case-dir sid)
                    {:session/id sid :created-at (now-iso) :case-dir case-dir :turns []})
        start* (or start "0")
        duration* (or duration "8")
        role* (or role "audio")
        slice-dir (join-path case-dir "slices")
        response-dir (join-path case-dir "responses")
        slice-path (join-path slice-dir (str sid "-" role* "-stt-" start* "-" duration* ".wav"))
        response-file (join-path response-dir (str "stt-" sid "-" role* "-" start* "-" duration* "-" (.getTime (js/Date.)) ".json"))]
    (slice-audio! {:in audio :start start* :duration duration* :out slice-path :case-dir case-dir})
    (-> (post-audio-bytes! (stt-timed-url stt-url) slice-path)
        (p/then (fn [result]
                  (ensure-dir! response-dir)
                  (spit-file! response-file (js/JSON.stringify (clj->js result) nil 2))
                  (let [turn {:at (now-iso)
                              :kind :session/stt
                              :session-id sid
                              :role role*
                              :audio audio
                              :slice slice-path
                              :start (js/parseFloat (str start*))
                              :duration (js/parseFloat (str duration*))
                              :response-file response-file
                              :text (:text result)
                              :words (:words result)
                              :ok true}
                        next-session (update session :turns #(conj (vec (or % [])) turn))]
                    (write-session! case-dir next-session)
                    (receipt! case-dir :session/stt turn)
                    {:ok true
                     :session-id sid
                     :session-file (session-file case-dir sid)
                     :slice slice-path
                     :response-file response-file
                     :text (:text result)})))
        (p/catch (fn [error]
                   (let [message (or (.-message error) (str error))]
                     (receipt! case-dir :session/stt-error {:session-id sid :role role* :audio audio :error message})
                     {:ok false :error message}))))))

(defn audit-gemma-prompt [{:keys [expected task start duration]} evidence]
  (str "You are Fork Tales audio reconstruction sub-agent. The single audio file before this text is an A/B comparison: "
       "first A original, then a short separator beep, then B candidate.\n\n"
       "You also receive deterministic tool evidence below. Treat it as tool output, not as ground truth. "
       "The local STT can be wrong, especially with Japanese homophones, but it is useful evidence. "
       "The pitch/spectrogram metrics are deterministic numeric evidence generated outside the model.\n\n"
       "Task: audit whether the candidate reproduces the original for this segment. "
       "Separate direct listening from tool evidence and from hypotheses. "
       "Do not claim pitch correctness from transcription alone. "
       "If pitch is wrong, name the likely contour direction or timing region and propose the next deterministic tool action.\n\n"
       "Expected/reference lyric clue: " (or expected "") "\n"
       "Segment start seconds: " (or start "0") "\n"
       "Segment duration seconds: " (or duration "") "\n"
       "User task: " (or task "Compare lyric, rhythm, pitch, and timbre. Recommend the next tool action.") "\n\n"
       "Evidence JSON:\n```json\n" (json-stringify evidence) "\n```\n\n"
       "Return JSON only with keys: "
       "audit_version, evidence_refs, direct_listening, transcription_analysis, pitch_analysis, spectrogram_analysis, "
       "lyric_mismatches, rhythm_mismatches, pitch_mismatches, timbre_mismatches, confidence, next_tool_actions. "
       "next_tool_actions must be concrete commands or edits an agent can perform."))

(defn audit! [{:keys [case-dir session-id role original candidate start duration expected task model ollama-url stt-url metrics-python metrics-script artifact-root evidence-schema response-prefix record-kind]}]
  (init-case! case-dir)
  (let [sid (normalize-id session-id)
        role* (normalize-id (or role "audit"))
        start* (or start "0")
        duration* (or duration "10")
        audit-id (str sid "-" role* "-" start* "-" duration*)
        check-id audit-id
        root-dir (or artifact-root "checks")
        audit-dir (join-path case-dir root-dir check-id)
        original-full (join-path audit-dir "original-fullband.wav")
        candidate-full (join-path audit-dir "candidate-fullband.wav")
        original-stt (join-path audit-dir "original-stt.wav")
        candidate-stt (join-path audit-dir "candidate-stt.wav")
        ab-slice (join-path audit-dir "ab-original-candidate.wav")
        metrics-json (join-path audit-dir "metrics.json")
        metrics-prefix (join-path audit-dir "metrics")
        evidence-file (join-path audit-dir "evidence.json")
        session (or (read-session case-dir sid)
                    {:session/id sid :created-at (now-iso) :case-dir case-dir :turns []})]
    (ensure-dir! audit-dir)
    (slice-audio! {:in original :start start* :duration duration* :out original-full :case-dir case-dir :sr "44100" :ac "1"})
    (slice-audio! {:in candidate :start start* :duration duration* :out candidate-full :case-dir case-dir :sr "44100" :ac "1"})
    (slice-audio! {:in original :start start* :duration duration* :out original-stt :case-dir case-dir :sr "16000" :ac "1"})
    (slice-audio! {:in candidate :start start* :duration duration* :out candidate-stt :case-dir case-dir :sr "16000" :ac "1"})
    (ab-audio! {:a original-full :b candidate-full :out ab-slice :case-dir case-dir})
    (p/let [original-stt-result (stt-file! {:case-dir case-dir :session-id sid :role (str role* "-original") :file original-stt :stt-url stt-url})
            candidate-stt-result (stt-file! {:case-dir case-dir :session-id sid :role (str role* "-candidate") :file candidate-stt :stt-url stt-url})]
      (let [metrics-result (run-metrics! {:case-dir case-dir
                                          :command "compare"
                                          :original original-full
                                          :candidate candidate-full
                                          :out-json metrics-json
                                          :out-prefix metrics-prefix
                                          :metrics-python metrics-python
                                          :metrics-script metrics-script})
            evidence {:schema_version (or evidence-schema "fork-tales-audio-check-evidence/v1")
                      :audit_id audit-id
                      :check_id check-id
                      :artifact_root root-dir
                      :created_at (now-iso)
                      :segment {:start_seconds (js/parseFloat (str start*))
                                :duration_seconds (js/parseFloat (str duration*))
                                :expected expected
                                :task task}
                      :files {:original original
                              :candidate candidate
                              :original_fullband_slice original-full
                              :candidate_fullband_slice candidate-full
                              :original_stt_slice original-stt
                              :candidate_stt_slice candidate-stt
                              :ab_audio ab-slice}
                      :transcription {:tool "local-stt/transcribe-timed"
                                      :original {:text (:text original-stt-result)
                                                 :response_file (:response-file original-stt-result)}
                                      :candidate {:text (:text candidate-stt-result)
                                                  :response_file (:response-file candidate-stt-result)}}
                      :metrics {:tool default-metrics-script
                                :json metrics-json
                                :outputs (:outputs metrics-result)
                                :pitch (:pitch metrics-result)
                                :spectrogram (:spectrogram metrics-result)
                                :waveform (:waveform metrics-result)}}]
        (spit-file! evidence-file (json-stringify evidence))
        (p/let [gemma-result (ask-gemma! {:case-dir case-dir
                                          :audio ab-slice
                                          :prompt (audit-gemma-prompt {:expected expected :task task :start start* :duration duration*} evidence)
                                          :model model
                                          :ollama-url ollama-url
                                          :out-prefix (str (or response-prefix "gemma-check") "-" check-id)})]
          (let [turn {:at (now-iso)
                      :kind (or record-kind :session/gemma-check)
                      :session-id sid
                      :role role*
                      :audit-id audit-id
                      :check-id check-id
                      :artifact-root root-dir
                      :original original
                      :candidate candidate
                      :start (js/parseFloat (str start*))
                      :duration (js/parseFloat (str duration*))
                      :expected expected
                      :evidence-file evidence-file
                      :gemma-response-file (:response-file gemma-result)
                      :gemma-content (:content gemma-result)
                      :error (:error gemma-result)
                      :ok (:ok gemma-result)}
                next-session (update session :turns #(conj (vec (or % [])) turn))]
            (write-session! case-dir next-session)
            (receipt! case-dir (or record-kind :session/gemma-check) turn)
            {:ok (:ok gemma-result)
             :session-id sid
             :audit-id audit-id
             :check-id check-id
             :artifact-root root-dir
             :audit-dir audit-dir
             :check-dir audit-dir
             :evidence-file evidence-file
             :ab-audio ab-slice
             :metrics-file metrics-json
             :gemma-response-file (:response-file gemma-result)
             :gemma-content (:content gemma-result)
             :error (:error gemma-result)
             :stt {:original (:text original-stt-result)
                   :candidate (:text candidate-stt-result)}}))))))

(defn usage! []
  (println "Usage: nbb scripts/fork_tales_audio_agent.cljs <init|session-init|hear|stt|slice|filter|label|note|ask|compare|ab|metrics|gemma-check|audit|grade|image-judge-prompt|image-judge-import|handoff-validate> [--key value]")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs hear --case-dir /tmp/case --session-id opening --role original --audio a.wav --start 0 --duration 6 --expected 'げんき...'")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs stt --case-dir /tmp/case --session-id opening --role candidate --audio b.wav --start 0 --duration 8")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs metrics --case-dir /tmp/case --role opening --original original.wav --candidate candidate.wav")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs gemma-check --case-dir /tmp/case --session-id opening --role opening --original vocals.wav --candidate render.wav --start 0 --duration 8 --expected '元気だよって一行だけのメッセージ'")
  (println "Note: audit is retained as a legacy alias for gemma-check; it is a cheap local pre-review check, not the final QC reviewer.")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs grade --case-dir /tmp/case --evidence /tmp/case/checks/opening/evidence.json --profile suno_reverse_accuracy")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs image-judge-prompt --case-dir /tmp/case --evidence /tmp/case/checks/opening/evidence.json")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs image-judge-import --case-dir /tmp/case --evidence /tmp/case/checks/opening/evidence.json --response /tmp/case/checks/opening/spectrogram-image-judge-response.json")
  (println "Example: nbb scripts/fork_tales_audio_agent.cljs handoff-validate --case-dir /tmp/case --packets plan.json,qc-review.json --catalog approved-reference-catalog.json"))

(defn -main []
  (let [argv (vec (js->clj (.-argv js/process)))
        commands #{"init" "session-init" "hear" "stt" "slice" "filter" "label" "note" "ask" "compare" "ab" "metrics" "gemma-check" "audit" "grade" "image-judge-prompt" "image-judge-import" "handoff-validate"}
        command-index (first (keep-indexed (fn [idx value] (when (contains? commands value) idx)) argv))
        command (when command-index (nth argv command-index))
        opts (parse-args (if command-index (subvec argv (inc command-index)) []))
        case-dir (or (:case-dir opts) default-case-dir)]
    (p/let [result (case command
                     "init" (init-case! case-dir)
                     "session-init" (session-init! (assoc opts :case-dir case-dir))
                     "hear" (session-hear! (assoc opts :case-dir case-dir))
                     "stt" (stt! (assoc opts :case-dir case-dir))
                     "slice" (slice-audio! (assoc opts :case-dir case-dir))
                     "filter" (filter-audio! (assoc opts :case-dir case-dir))
                     "ab" (ab-audio! (assoc opts :case-dir case-dir))
                     "label" (label-file! (assoc opts :case-dir case-dir))
                     "note" (note! (assoc opts :case-dir case-dir))
                     "ask" (ask-gemma! (assoc opts :case-dir case-dir))
                     "compare" (compare! (assoc opts :case-dir case-dir))
                     "metrics" (metrics! (assoc opts :case-dir case-dir))
                     "gemma-check" (audit! (assoc opts
                                                  :case-dir case-dir
                                                  :artifact-root "checks"
                                                  :evidence-schema "fork-tales-audio-check-evidence/v1"
                                                  :response-prefix "gemma-check"
                                                  :record-kind :session/gemma-check))
                     "audit" (audit! (assoc opts
                                             :case-dir case-dir
                                             :artifact-root "audits"
                                             :evidence-schema "fork-tales-audio-audit-evidence/v1"
                                             :response-prefix "audit"
                                             :record-kind :session/audit))
                     "grade" (grade! (assoc opts :case-dir case-dir))
                     "image-judge-prompt" (image-judge-prompt! (assoc opts :case-dir case-dir))
                     "image-judge-import" (image-judge-import! (assoc opts :case-dir case-dir))
                     "handoff-validate" (handoff-validate! (assoc opts :case-dir case-dir))
                     (do (usage!) {:ok false :error "unknown command"}))]
      (println (pr-str result)))))

(-main)
