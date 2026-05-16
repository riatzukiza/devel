(defn generate-nullity-beat []
  (let [note-plan [{:note 24 :start 0 :duration 4}]] ;; C1 for 4 seconds
    (spit (str "Nullity Beat Note Plan: " note-plan))))
