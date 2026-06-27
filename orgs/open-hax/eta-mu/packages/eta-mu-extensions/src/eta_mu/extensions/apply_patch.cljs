(ns eta-mu.extensions.apply-patch
  "Codex-style multi-file patch tool.

  Migrated from: pi/agent/extensions/apply-patch.ts"
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            ["node:fs" :as fs]
            ["node:path" :as path]))

(def begin-marker "*** Begin Patch")
(def end-marker "*** End Patch")

(defn strip-heredoc [input]
  (let [m (.match input #"^(?:cat\s+)?<<['\"]?(\w+)['\"]?\s*\n([\s\S]*?)\n\1\s*$")]
    (if m (aget m 2) input)))

(defn normalize-unicode [s]
  (-> s
      (.replace #"[\u2018\u2019\u201A\u201B]" "'")
      (.replace #"[\u201C\u201D\u201E\u201F]" "\"")
      (.replace #"[\u2010\u2011\u2012\u2013\u2014\u2015]" "-")
      (.replace #"\u2026" "...")
      (.replace #"\u00A0" " ")))

(defn normalize-lf [s]
  (-> s (.replace #"\r\n" "\n") (.replace #"\r" "\n")))

(defn strip-bom [s]
  (if (.startsWith s "\uFEFF") (.slice s 1) s))

(defn parse-header [lines idx]
  (let [line (nth lines idx "")]
    (cond
      (str/starts-with? line "*** Add File:")
      (let [p (str/trim (.slice line (.-length "*** Add File:")))]
        (when (seq p) {:kind :add :file-path p :next-idx (inc idx)}))

      (str/starts-with? line "*** Delete File:")
      (let [p (str/trim (.slice line (.-length "*** Delete File:")))]
        (when (seq p) {:kind :delete :file-path p :next-idx (inc idx)}))

      (str/starts-with? line "*** Update File:")
      (let [p (str/trim (.slice line (.-length "*** Update File:")))
            next-line (nth lines (inc idx) "")]
        (when (seq p)
          (if (str/starts-with? next-line "*** Move to:")
            {:kind :update
             :file-path p
             :move-path (str/trim (.slice next-line (.-length "*** Move to:")))
             :next-idx (+ idx 2)}
            {:kind :update :file-path p :next-idx (inc idx)})))

      :else nil)))

(defn parse-add-content [lines start-idx]
  (loop [i start-idx acc []]
    (if (or (>= i (count lines)) (str/starts-with? (nth lines i) "***"))
      {:content (str/join "\n" acc) :next-idx i}
      (let [line (nth lines i)]
        (recur (inc i) (if (str/starts-with? line "+") (conj acc (.slice line 1)) acc))))))

(defn consume-update-chunk [lines start-idx context]
  (loop [j start-idx old-lines [] new-lines [] eof? false]
    (if (or (>= j (count lines))
            (str/starts-with? (nth lines j) "@@")
            (str/starts-with? (nth lines j) "***"))
      {:next-idx j
       :chunk {:old-lines old-lines
               :new-lines new-lines
               :change-context (when (seq context) context)
               :is-end-of-file eof?}}
      (let [line (nth lines j)]
        (cond
          (= line "*** End of File")
          (recur (inc j) old-lines new-lines true)

          (str/starts-with? line " ")
          (let [content (.slice line 1)]
            (recur (inc j) (conj old-lines content) (conj new-lines content) eof?))

          (str/starts-with? line "-")
          (recur (inc j) (conj old-lines (.slice line 1)) new-lines eof?)

          (str/starts-with? line "+")
          (recur (inc j) old-lines (conj new-lines (.slice line 1)) eof?)

          :else
          (recur (inc j) old-lines new-lines eof?))))))

(defn parse-update-chunks [lines start-idx]
  (loop [i start-idx chunks []]
    (cond
      (or (>= i (count lines)) (str/starts-with? (nth lines i) "***"))
      {:chunks chunks :next-idx i}

      (not (str/starts-with? (nth lines i) "@@"))
      (recur (inc i) chunks)

      :else
      (let [context (str/trim (.slice (nth lines i) 2))
            {:keys [next-idx chunk]} (consume-update-chunk lines (inc i) context)]
        (recur next-idx (conj chunks chunk))))))

(defn parse-patch [patch-text]
  (let [cleaned (strip-heredoc (str/trim patch-text))
        lines (vec (str/split cleaned #"\n"))
        begin-idx (.indexOf (clj->js lines) begin-marker)
        end-idx (.indexOf (clj->js lines) end-marker)]
    (when (or (= begin-idx -1) (= end-idx -1) (>= begin-idx end-idx))
      (throw (js/Error. "Invalid patch format: missing Begin/End markers")))
    (loop [i (inc begin-idx) hunks []]
      (if (>= i end-idx)
        hunks
        (if-let [header (parse-header lines i)]
          (case (:kind header)
            :add (let [{:keys [content next-idx]} (parse-add-content lines (:next-idx header))]
                   (recur next-idx (conj hunks {:type :add :file-path (:file-path header) :contents content})))
            :delete (recur (:next-idx header) (conj hunks {:type :delete :file-path (:file-path header)}))
            :update (let [{:keys [chunks next-idx]} (parse-update-chunks lines (:next-idx header))]
                      (recur next-idx (conj hunks {:type :update
                                                   :file-path (:file-path header)
                                                   :move-path (:move-path header)
                                                   :chunks chunks}))))
          (recur (inc i) hunks))))))

(defn try-match [lines pattern start-index compare-fn eof?]
  (let [from-end (- (count lines) (count pattern))]
    (if (and eof? (>= from-end start-index)
             (every? true? (map-indexed (fn [j p] (compare-fn (nth lines (+ from-end j)) p)) pattern)))
      from-end
      (loop [i start-index]
        (cond
          (> i (- (count lines) (count pattern))) -1
          (every? true? (map-indexed (fn [j p] (compare-fn (nth lines (+ i j)) p)) pattern)) i
          :else (recur (inc i)))))))

(defn seek-sequence [lines pattern start-index eof?]
  (if (empty? pattern)
    -1
    (let [exact (try-match lines pattern start-index = eof?)]
      (if (not= exact -1) exact
          (let [rstrip (try-match lines pattern start-index #(= (str/trimr %1) (str/trimr %2)) eof?)]
            (if (not= rstrip -1) rstrip
                (let [trimmed (try-match lines pattern start-index #(= (str/trim %1) (str/trim %2)) eof?)]
                  (if (not= trimmed -1) trimmed
                      (try-match lines pattern start-index #(= (normalize-unicode (str/trim %1))
                                                               (normalize-unicode (str/trim %2))) eof?)))))))))

(defn compute-replacements [original-lines abs-path chunks]
  (loop [remaining chunks line-index 0 replacements []]
    (if (empty? remaining)
      (sort-by first replacements)
      (let [chunk (first remaining)
            ctx (:change-context chunk)
            line-index (if ctx
                         (let [idx (seek-sequence original-lines [ctx] line-index false)]
                           (when (= idx -1)
                             (throw (js/Error. (str "Failed to find context '" ctx "' in " abs-path))))
                           (inc idx))
                         line-index)
            old-lines (:old-lines chunk)
            new-lines (:new-lines chunk)]
        (if (empty? old-lines)
          (recur (rest remaining) line-index (conj replacements [(count original-lines) 0 new-lines]))
          (let [trim-trailing? (= "" (last old-lines))
                pattern (if trim-trailing? (vec (butlast old-lines)) old-lines)
                new-slice (if (and trim-trailing? (= "" (last new-lines))) (vec (butlast new-lines)) new-lines)
                found (seek-sequence original-lines pattern line-index (boolean (:is-end-of-file chunk)))]
            (when (= found -1)
              (throw (js/Error. (str "Failed to find expected lines in " abs-path ":\n" (str/join "\n" old-lines)))))
            (recur (rest remaining) (+ found (count pattern)) (conj replacements [found (count pattern) new-slice]))))))))

(defn apply-replacements [lines replacements]
  (let [arr (to-array lines)]
    (doseq [[start old-len new-segment] (reverse replacements)]
      (.apply (.-splice arr) arr (clj->js (concat [start old-len] new-segment))))
    (vec (array-seq arr))))

(defn derive-new-content [abs-path chunks]
  (let [original (.readFileSync fs abs-path "utf-8")
        split-lines (vec (str/split original #"\n" -1))
        original-lines (if (= "" (last split-lines)) (vec (butlast split-lines)) split-lines)
        replacements (compute-replacements original-lines abs-path chunks)
        new-lines (apply-replacements original-lines replacements)
        new-lines (if (or (empty? new-lines) (not= "" (last new-lines))) (conj new-lines "") new-lines)]
    (str/join "\n" new-lines)))

(defn subpath? [root target]
  (let [rel (path/relative root target)]
    (and (not= rel "")
         (not (str/starts-with? rel ".."))
         (not (path/isAbsolute rel)))))

(defn resolve-and-validate [root patch-path]
  (let [abs-path (if (path/isAbsolute patch-path) patch-path (path/resolve root patch-path))
        inside (or (= abs-path root) (subpath? root abs-path))]
    (when-not inside
      (throw (js/Error. (str "Path escapes project root. root=" root " path=" patch-path " resolved=" abs-path))))
    {:abs-path abs-path
     :rel-path (let [rel (.replaceAll (path/relative root abs-path) "\\" "/")]
                 (if (= rel "") (path/basename abs-path) rel))}))

(defn file-exists? [p]
  (.existsSync fs p))

(defn plan-patch [root hunks]
  (loop [remaining hunks plan []]
    (if (empty? remaining)
      plan
      (let [h (first remaining)]
        (case (:type h)
          :add (let [{:keys [abs-path rel-path]} (resolve-and-validate root (:file-path h))]
                 (when (file-exists? abs-path)
                   (throw (js/Error. (str "Add File failed: target already exists: " rel-path))))
                 (recur (rest remaining) (conj plan {:type :add :abs-path abs-path :rel-path rel-path :content (:contents h)})))
          :delete (let [{:keys [abs-path rel-path]} (resolve-and-validate root (:file-path h))]
                    (when-not (file-exists? abs-path)
                      (throw (js/Error. (str "Delete File failed: file does not exist: " rel-path))))
                    (recur (rest remaining) (conj plan {:type :delete :abs-path abs-path :rel-path rel-path})))
          :update (let [from (resolve-and-validate root (:file-path h))]
                    (when-not (file-exists? (:abs-path from))
                      (throw (js/Error. (str "Update File failed: file does not exist: " (:rel-path from)))))
                    (let [new-content (derive-new-content (:abs-path from) (:chunks h))]
                      (if-let [move-path (:move-path h)]
                        (let [to (resolve-and-validate root move-path)]
                          (when (file-exists? (:abs-path to))
                            (throw (js/Error. (str "Move failed: destination already exists: " (:rel-path to)))))
                          (recur (rest remaining) (conj plan {:type :move
                                                               :abs-from (:abs-path from)
                                                               :rel-from (:rel-path from)
                                                               :abs-to (:abs-path to)
                                                               :rel-to (:rel-path to)
                                                               :content new-content})))
                        (recur (rest remaining) (conj plan {:type :update
                                                             :abs-path (:abs-path from)
                                                             :rel-path (:rel-path from)
                                                             :content new-content}))))))))))

(defn apply-plan [plan]
  (let [changes #js []]
    (doseq [change plan]
      (case (:type change)
        :add (do (.mkdirSync fs (path/dirname (:abs-path change)) #js {:recursive true})
                 (.writeFileSync fs (:abs-path change) (:content change) "utf-8")
                 (.push changes #js {:type "add" :path (:rel-path change)}))
        :update (do (.writeFileSync fs (:abs-path change) (:content change) "utf-8")
                    (.push changes #js {:type "update" :path (:rel-path change)}))
        :move (do (.mkdirSync fs (path/dirname (:abs-to change)) #js {:recursive true})
                  (.writeFileSync fs (:abs-to change) (:content change) "utf-8")
                  (.unlinkSync fs (:abs-from change))
                  (.push changes #js {:type "move" :path (:rel-from change) :to (:rel-to change)}))
        :delete (do (.unlinkSync fs (:abs-path change))
                    (.push changes #js {:type "delete" :path (:rel-path change)}))))
    changes))

(defn summarize-change [c]
  (case (aget c "type")
    "add" (str "A " (aget c "path"))
    "delete" (str "D " (aget c "path"))
    "move" (str "R " (aget c "path") " -> " (aget c "to"))
    (str "M " (aget c "path"))))

(defn execute-apply-patch [_tool-call-id params signal _on-update ctx]
  (when (and signal (.-aborted signal))
    (throw (js/Error. "aborted")))
  (let [root (aget ctx "cwd")
        patch-text (str (aget params "patchText"))
        hunks (parse-patch patch-text)]
    (when (empty? hunks)
      (throw (js/Error. "Empty patch (no hunks)")))
    (let [plan (plan-patch root hunks)
          changes (apply-plan plan)
          summary (->> (array-seq changes) (map summarize-change) (str/join "\n"))]
      #js {:content #js [#js {:type "text"
                              :text (str "Success. Updated the following files:\n" summary)}]
           :details #js {:root root :changes changes}})))

(em/defextension apply-patch
  :name "apply-patch"
  :description "Codex-style multi-file patch tool"

  (em/tool "apply_patch"
    :label "apply_patch"
    :description "Apply a multi-file patch using the Codex/Claude patch format (*** Begin Patch / *** End Patch)."
    :parameters {:patchText {:type "string"
                             :description "The full patch text including *** Begin Patch and *** End Patch markers and file directives."}}
    :execute execute-apply-patch))
