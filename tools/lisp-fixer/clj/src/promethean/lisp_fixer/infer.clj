(ns promethean.lisp-fixer.infer
(:require
[clojure.string :as str]
[clojure.tools.cli :refer [parse-opts]]
[babashka.fs :as fs]
[libpython-clj2.python :as py]
[clojure.java.shell :refer [sh]]))

(def cli-opts
[["-m" "--model PATH" "HF dir or model id" :required true]
["-f" "--file PATH"  "target source file" :required true]
["-r" "--repo PATH"  "repo root (for build)" :default "."]
["-p" "--prompt S"   "opencode build prompt" :default "build"]
["--mode MODE"       "diff|whole" :default "whole"]
["-h" "--help"]])

;; tiny S-expr guard
(defn balanced? [s]
(loop [i 0 d 0]
(if (>= i (count s)) (zero? d)
(let [c (.charAt s i)]
(cond
(= c \") (let [j (loop [k (inc i)]
(if (>= k (count s)) (dec k)
(let [ck (.charAt s k)]
(if (and (= ck \\) (< (inc k) (count s))) (recur (+ k 2))
(if (= ck \") k (recur (inc k)))))))]
(recur (inc j) d))
(= c \;) (recur (inc (.indexOf s \newline i)) d)
(= c \() (recur (inc i) (inc d))
(= c \)) (recur (inc i) (max 0 (dec d)))
:else    (recur (inc i) d))))))

(defn build! [repo prompt]
(zero? (:exit (sh "opencode" "run" prompt :dir repo))))

(defn py-init! [model]
(py/initialize!)
(def transformers (py/import-module "transformers"))
(def tok (py/call-attr (py/get-attr transformers "AutoTokenizer")
"from_pretrained" model :use_fast true))
(def m   (py/call-attr (py/get-attr transformers "AutoModelForCausalLM")
"from_pretrained" model :device_map "auto")))

(defn generate [prompt]
;; minimal greedy generate for demo; swap in vLLM/grammar later if needed
(let [ids (py/call-attr tok "encode" prompt :return_tensors "pt")
out (py/call-attr m "generate" ids :max_new_tokens 512 :do_sample false)
txt (py/call-attr tok "decode" (py/get-item out 0) :skip_special_tokens true)]
    txt))

(defn -main [& argv]
  (let [{:keys [options summary errors]} (parse-opts argv cli-opts)]
    (when (:help options) (println "Lisp-Fixer inference") (println summary) (System/exit 0))
    (when errors (binding [*out* *err*] (doseq [e errors] (println e))) (System/exit 1))

   (py-init! (:model options))

   (let [abs (fs/absolutize (:file options))
          broken (slurp abs)]
      (loop [attempt 0 best broken]
        (if (>= attempt 3)
          (do (spit abs best) (println "still red ❌ (kept best attempt)") (System/exit 2))
          (let [prompt (if (= "whole" (:mode options))
                         broken
                         (str "<DIFF>" broken "\n"))
                cand   (generate prompt)
                guarded (if (balanced? cand) cand broken)]
            (spit abs guarded)
            (if (build! (:repo options) (:prompt options))
              (do (println "green ✅") (System/exit 0))
              (recur (inc attempt) guarded))))))))