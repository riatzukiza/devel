(ns my.opencode.delims)

(def open->close
  {"(" ")"
   "[" "]"
   "{" "}"})

(def close->open
  {")" "("
   "]" "["
   "}" "{"})

(defn ^:private push-issue
  [issues kind detail pos]
  (conj issues {:kind kind :detail detail :at pos}))

(defn ^:private new-pos
  [line col ch]
  (if (= ch "\n")
    {:line (inc line) :col 1}
    {:line line :col (inc col)}))

(defn ^:private scan
  [code]
  (let [len (.-length code)]
    (loop [idx 0
           line 1
           col 1
           stack []
           issues []
           in-str? false
           in-esc? false
           in-line? false
           in-block? false]
      (if (>= idx len)
        {:stack stack :issues issues}
        (let [ch (.charAt code idx)
              next (if (< (inc idx) len) (.charAt code (inc idx)) "")
              pos {:line line :col col :index idx}
              pos* (new-pos line col ch)
              next-line (:line pos*)
              next-col (:col pos*)]
          (cond
            in-line?
            (if (= ch "\n")
              (recur (inc idx) next-line next-col stack issues in-str? in-esc? false in-block?)
              (recur (inc idx) next-line next-col stack issues in-str? in-esc? in-line? in-block?))

            in-block?
            (if (and (= ch "*") (= next "/"))
              (let [pos2 (new-pos next-line next-col next)]
                (recur (+ idx 2) (:line pos2) (:col pos2) stack issues in-str? false in-line? false))
              (recur (inc idx) next-line next-col stack issues in-str? false in-line? in-block?))

            in-str?
            (cond
              (and (not in-esc?) (= ch "\\"))
              (recur (inc idx) next-line next-col stack issues in-str? true in-line? in-block?)

              (and (not in-esc?) (= ch "\""))
              (recur (inc idx) next-line next-col stack issues false false in-line? in-block?)

              :else
              (recur (inc idx) next-line next-col stack issues in-str? false in-line? in-block?))

            (= ch ";")
            (recur (inc idx) next-line next-col stack issues in-str? in-esc? true in-block?)

            (and (= ch "#") (= next "_"))
            (let [pos2 (new-pos next-line next-col next)]
              (recur (+ idx 2) (:line pos2) (:col pos2) stack issues in-str? false in-line? in-block?))

            (and (= ch "#") (= next "|"))
            (let [pos2 (new-pos next-line next-col next)]
              (recur (+ idx 2) (:line pos2) (:col pos2) stack issues in-str? false in-line? true))

            (= ch "\"")
            (recur (inc idx) next-line next-col stack issues true false in-line? in-block?)

            (contains? open->close ch)
            (recur (inc idx) next-line next-col (conj stack {:ch ch :pos pos}) issues in-str? false in-line? in-block?)

            (contains? close->open ch)
            (if (seq stack)
              (let [top (peek stack)
                    open-ch (:ch top)
                    open-pos (:pos top)
                    expected (get open->close open-ch)]
                (if (= expected ch)
                  (recur (inc idx) next-line next-col (pop stack) issues in-str? false in-line? in-block?)
                  (recur (inc idx) next-line next-col (pop stack)
                         (push-issue issues :mismatch {:found ch :expected expected :open open-ch :openAt open-pos} pos)
                         in-str? false in-line? in-block?)))
              (recur (inc idx) next-line next-col stack
                     (push-issue issues :extra-close {:found ch} pos)
                     in-str? false in-line? in-block?))

            :else
            (recur (inc idx) next-line next-col stack issues in-str? false in-line? in-block?)))))))

(defn diagnose
  [code]
  (let [{:keys [stack issues]} (scan code)
        unmatched (map (fn [{:keys [ch pos]}]
                         {:kind :unclosed-open
                          :detail {:open ch :expected (get open->close ch)}
                          :at pos})
                       (reverse stack))]
    (vec (concat issues unmatched))))

(defn ^:private apply-edits
  [code edits]
  (let [sorted (sort-by (comp - :index) edits)]
    (reduce
     (fn [acc {:keys [index delete insert]}]
       (let [before (.slice acc 0 index)
             after (.slice acc (+ index delete))]
         (str before insert after)))
     code
     sorted)))

(defn auto-fix
  [code max-fixes]
  (let [issues (diagnose code)
        max-fixes (or max-fixes 5)
        fixes (atom [])
        edits (atom [])
        append-index (.-length code)
        apply-fix! (fn [issue]
                     (when (< (count @fixes) max-fixes)
                       (case (:kind issue)
                         :unclosed-open
                         (let [close (get-in issue [:detail :expected])]
                           (swap! edits conj {:index append-index :delete 0 :insert close})
                           (swap! fixes conj {:kind :append-close
                                              :detail {:insert close}
                                              :at (:at issue)}))

                         :extra-close
                         (let [index (:index (:at issue))]
                           (swap! edits conj {:index index :delete 1 :insert ""})
                           (swap! fixes conj {:kind :remove-extra-close
                                              :detail {:remove (:found (:detail issue))}
                                              :at (:at issue)}))

                         :mismatch
                         (let [index (:index (:at issue))
                               expected (get-in issue [:detail :expected])]
                           (swap! edits conj {:index index :delete 1 :insert expected})
                           (swap! fixes conj {:kind :replace-close
                                              :detail {:replace expected}
                                              :at (:at issue)}))

                         nil)))]
    (doseq [issue issues]
      (apply-fix! issue))
    (let [fixed (apply-edits code @edits)
          summary (if (seq @fixes)
                    (str "Applied " (count @fixes) " delimiter fixes")
                    "No delimiter fixes needed")]
      {:fixedCode fixed
       :fixes (vec @fixes)
       :summary summary
       :issues issues})))
