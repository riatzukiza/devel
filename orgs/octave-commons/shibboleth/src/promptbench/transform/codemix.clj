(ns promptbench.transform.codemix
  "Code-mixing transform implementation.

   Produces bilingual text by mixing L1 (source language) with L2 (target language).
   Supports inter-sentential (switch at sentence boundaries) and
   intra-sentential (mix within sentences) strategies.
   Seed-controlled and deterministic.

   Since this is a dataset generation tool, the 'translation' for code-mixing
   is done via simple word-level substitution using a seed-deterministic
   bilingual lexicon. For production quality, the MT transform should be used
   instead. Code-mixing focuses on the structural pattern of mixing, not
   translation quality."
  (:require [clojure.string :as str]))

;; ============================================================
;; Simple bilingual word substitution tables
;; These provide seed-deterministic word-level replacements
;; for common English words into target languages.
;; ============================================================

(def word-tables
  "Simple bilingual word tables for code-mixing.
   Maps language keyword to a map of English words to target language words.
   Contains tier-1 (10) and tier-2 Latin-script feasible (5) languages."
  {:es {"hello" "hola" "world" "mundo" "the" "el" "is" "es" "a" "un"
        "this" "esto" "that" "eso" "and" "y" "or" "o" "not" "no"
        "I" "yo" "you" "tú" "he" "él" "she" "ella" "we" "nosotros"
        "how" "cómo" "what" "qué" "where" "dónde" "when" "cuándo"
        "do" "hacer" "can" "poder" "will" "voluntad" "have" "tener"
        "good" "bueno" "bad" "malo" "big" "grande" "small" "pequeño"
        "here" "aquí" "there" "allí" "now" "ahora" "then" "entonces"
        "with" "con" "from" "de" "to" "a" "in" "en" "on" "sobre"
        "for" "para" "but" "pero" "if" "si" "so" "así" "very" "muy"}
   :fr {"hello" "bonjour" "world" "monde" "the" "le" "is" "est" "a" "un"
        "this" "ceci" "that" "cela" "and" "et" "or" "ou" "not" "pas"
        "I" "je" "you" "vous" "he" "il" "she" "elle" "we" "nous"
        "how" "comment" "what" "quoi" "where" "où" "when" "quand"
        "good" "bon" "bad" "mauvais" "big" "grand" "small" "petit"
        "with" "avec" "from" "de" "to" "à" "in" "dans" "on" "sur"}
   :de {"hello" "hallo" "world" "Welt" "the" "die" "is" "ist" "a" "ein"
        "this" "dies" "that" "das" "and" "und" "or" "oder" "not" "nicht"
        "I" "ich" "you" "du" "he" "er" "she" "sie" "we" "wir"
        "how" "wie" "what" "was" "where" "wo" "when" "wann"
        "good" "gut" "bad" "schlecht" "big" "groß" "small" "klein"
        "with" "mit" "from" "von" "to" "zu" "in" "in" "on" "auf"}
   :ja {"hello" "こんにちは" "world" "世界" "the" "その" "is" "です" "a" "一つ"
        "this" "これ" "that" "それ" "and" "と" "or" "か" "not" "ない"
        "good" "良い" "bad" "悪い" "big" "大きい" "small" "小さい"}
   :zh {"hello" "你好" "world" "世界" "the" "这个" "is" "是" "a" "一个"
        "this" "这" "that" "那" "and" "和" "or" "或" "not" "不"
        "good" "好" "bad" "坏" "big" "大" "small" "小"}
   :ar {"hello" "مرحبا" "world" "عالم" "the" "ال" "is" "هو" "a" "واحد"
        "this" "هذا" "that" "ذلك" "and" "و" "or" "أو" "not" "لا"}
   :hi {"hello" "नमस्ते" "world" "दुनिया" "the" "वह" "is" "है" "a" "एक"
        "this" "यह" "that" "वह" "and" "और" "or" "या" "not" "नहीं"}
   :pt {"hello" "olá" "world" "mundo" "the" "o" "is" "é" "a" "um"
        "this" "isto" "that" "isso" "and" "e" "or" "ou" "not" "não"
        "with" "com" "from" "de" "to" "para" "in" "em" "on" "sobre"}
   :ru {"hello" "привет" "world" "мир" "the" "этот" "is" "есть" "a" "один"
        "this" "это" "that" "то" "and" "и" "or" "или" "not" "не"}
   :ko {"hello" "안녕하세요" "world" "세계" "the" "그" "is" "이다" "a" "하나"
        "this" "이것" "that" "그것" "and" "그리고" "or" "또는" "not" "않다"}
   ;; Tier-2 languages (Latin-script feasible)
   :tr {"hello" "merhaba" "world" "dünya" "the" "bu" "is" "dir" "a" "bir"
        "this" "bu" "that" "şu" "and" "ve" "or" "veya" "not" "değil"
        "I" "ben" "you" "sen" "he" "o" "she" "o" "we" "biz"
        "good" "iyi" "bad" "kötü" "big" "büyük" "small" "küçük"
        "how" "nasıl" "what" "ne" "where" "nerede" "when" "ne zaman"
        "with" "ile" "from" "den" "to" "e" "in" "de" "on" "üzerinde"}
   :vi {"hello" "xin chào" "world" "thế giới" "the" "cái" "is" "là" "a" "một"
        "this" "này" "that" "kia" "and" "và" "or" "hoặc" "not" "không"
        "I" "tôi" "you" "bạn" "he" "anh ấy" "she" "cô ấy" "we" "chúng tôi"
        "good" "tốt" "bad" "xấu" "big" "lớn" "small" "nhỏ"
        "how" "thế nào" "what" "gì" "where" "đâu" "when" "khi nào"
        "with" "với" "from" "từ" "to" "đến" "in" "trong" "on" "trên"}
   :id {"hello" "halo" "world" "dunia" "the" "itu" "is" "adalah" "a" "satu"
        "this" "ini" "that" "itu" "and" "dan" "or" "atau" "not" "tidak"
        "I" "saya" "you" "kamu" "he" "dia" "she" "dia" "we" "kami"
        "good" "bagus" "bad" "buruk" "big" "besar" "small" "kecil"
        "how" "bagaimana" "what" "apa" "where" "dimana" "when" "kapan"
        "with" "dengan" "from" "dari" "to" "ke" "in" "di" "on" "pada"}
   :sw {"hello" "habari" "world" "dunia" "the" "hiyo" "is" "ni" "a" "moja"
        "this" "hii" "that" "hiyo" "and" "na" "or" "au" "not" "si"
        "I" "mimi" "you" "wewe" "he" "yeye" "she" "yeye" "we" "sisi"
        "good" "nzuri" "bad" "mbaya" "big" "kubwa" "small" "ndogo"
        "how" "vipi" "what" "nini" "where" "wapi" "when" "lini"
        "with" "na" "from" "kutoka" "to" "kwa" "in" "katika" "on" "juu"}
   :tl {"hello" "kamusta" "world" "mundo" "the" "ang" "is" "ay" "a" "isang"
        "this" "ito" "that" "iyon" "and" "at" "or" "o" "not" "hindi"
        "I" "ako" "you" "ikaw" "he" "siya" "she" "siya" "we" "tayo"
        "good" "mabuti" "bad" "masama" "big" "malaki" "small" "maliit"
        "how" "paano" "what" "ano" "where" "saan" "when" "kailan"
        "with" "kasama" "from" "mula" "to" "sa" "in" "sa" "on" "sa"}})

(defn- split-sentences
  "Split text into sentences. Simple regex-based sentence splitting."
  [text]
  (let [parts (str/split text #"(?<=[.!?])\s+")]
    (if (empty? parts) [text] parts)))

(defn- strip-punctuation
  "Strip trailing punctuation from a word, returning [base-word trailing-punct]."
  [word]
  (let [m (re-find #"([.!?,;:\"')\]]+)$" word)]
    (if m
      [(subs word 0 (- (count word) (count (first m)))) (first m)]
      [word ""])))

(defn- substitute-word
  "Substitute a word using the bilingual table for the target language.
   Preserves trailing punctuation."
  [word lang-table]
  (let [[base punct] (strip-punctuation word)
        lower (str/lower-case base)]
    (if-let [translation (get lang-table lower)]
      (str translation punct)
      word)))

(defn- mix-sentence-words
  "Mix individual words within a sentence based on mix rate."
  [sentence lang-table ^java.util.Random rng mix-rate]
  (let [words (str/split sentence #"\s+")
        mixed (mapv (fn [word]
                      (if (< (.nextDouble rng) mix-rate)
                        (substitute-word word lang-table)
                        word))
                    words)]
    (str/join " " mixed)))

(defn apply-codemix
  "Apply code-mixing transform.

   Arguments map:
   - :text   — input text
   - :config — {:mix-rate (double, fraction of elements to mix, default 0.25)
                :strategy (:inter-sentential | :intra-sentential)
                :l2 (keyword, target language)}
   - :seed   — integer seed

   For inter-sentential: replaces entire sentences with L2 at sentence boundaries.
   For intra-sentential: replaces individual words within sentences.

   Returns {:text ... :metadata {:mix-rate :actual-mix-rate :strategy :l2 :seed}}."
  [{:keys [text config seed]}]
  (let [mix-rate (or (:mix-rate config) 0.25)
        strategy (or (:strategy config) :inter-sentential)
        l2 (or (:l2 config) :es)
        lang-table (get word-tables l2 {})
        rng (java.util.Random. (long seed))
        sentences (split-sentences text)]
    (case strategy
      :inter-sentential
      ;; Replace entire sentences with L2 translations
      (let [mixed-sentences (mapv (fn [sent]
                                    (if (< (.nextDouble rng) mix-rate)
                                      ;; Translate the whole sentence at word level
                                      (mix-sentence-words sent lang-table rng 1.0)
                                      sent))
                                  sentences)
            n-switched (count (filter (fn [[orig mixed]] (not= orig mixed))
                                      (map vector sentences mixed-sentences)))
            actual-rate (if (pos? (count sentences))
                          (double (/ n-switched (count sentences)))
                          0.0)]
        {:text (str/join " " mixed-sentences)
         :metadata {:mix-rate mix-rate
                    :actual-mix-rate actual-rate
                    :strategy strategy
                    :l2 l2
                    :seed seed
                    :n-sentences (count sentences)
                    :n-switched n-switched}})

      :intra-sentential
      ;; Mix individual words within each sentence
      (let [mixed-sentences (mapv #(mix-sentence-words % lang-table rng mix-rate) sentences)
            ;; Count total words and substituted words
            original-words (mapcat #(str/split % #"\s+") sentences)
            mixed-words (mapcat #(str/split % #"\s+") mixed-sentences)
            n-changed (count (filter (fn [[o m]] (not= o m))
                                      (map vector original-words mixed-words)))
            actual-rate (if (pos? (count original-words))
                          (double (/ n-changed (count original-words)))
                          0.0)]
        {:text (str/join " " mixed-sentences)
         :metadata {:mix-rate mix-rate
                    :actual-mix-rate actual-rate
                    :strategy strategy
                    :l2 l2
                    :seed seed
                    :n-words (count original-words)
                    :n-substituted n-changed}}))))
