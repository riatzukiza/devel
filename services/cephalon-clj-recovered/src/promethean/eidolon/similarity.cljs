(ns promethean.eidolon.similarity)

(defn dot [a b]
  (reduce + (map * a b)))

(defn norm [v]
  (js/Math.sqrt (dot v v)))

(defn cosine [a b]
  (let [na (norm a)
        nb (norm b)]
    (if (or (zero? na) (zero? nb))
      0.0
      (/ (dot a b) (* na nb)))))

(defn recency-bonus [now-ms ts-ms]
  ;; bonus in [0, 0.25]
  (let [age-days (/ (max 0 (- now-ms ts-ms)) (* 1000 60 60 24))
        b (/ 0.25 (+ 1.0 age-days))]
    b))
