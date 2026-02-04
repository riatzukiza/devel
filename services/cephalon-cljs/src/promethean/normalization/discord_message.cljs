(ns promethean.normalization.discord-message
  "Discord message normalization based on cephalon-concrete-specs.md")

;; ============================================================================
;; Unicode Normalization
;; ============================================================================

(defn normalize-unicode
  "NFKC normalize text (mock implementation)"
  [text]
  text)

;; ============================================================================
;; Whitespace Normalization
;; ============================================================================

(defn normalize-whitespace
  [text]
  (-> text
      (str/replace "\r\n" "\n")
      (str/replace #"[ \t]+" " ")
      (str/trim)))

;; ============================================================================
;; Volatile Token Rewrites
;; ============================================================================

(defn apply-volatile-rewrites
  [text volatile-rewrites]
  (reduce (fn [t [pattern replacement]]
            (str/replace t (js/RegExp. pattern "g") replacement))
          text
          volatile-rewrites))

;; ============================================================================
;; Mention Canonicalization
;; ============================================================================

(defn canonicalize-mentions
  [text]
  (-> text
      (str/replace #"<@!?(\d+)>" "<@user>")
      (str/replace #"<@&(\d+)>" "<@role>")
      (str/replace #"<#(\d+)>" "<#channel>")))

;; ============================================================================
;; URL Canonicalization
;; ============================================================================

(defn canonicalize-url
  [url]
  (let [url-obj (js/URL. url)
        params-to-remove #{"utm_source" "utm_medium" "utm_campaign" "utm_term" "utm_content"
                          "fbclid" "gclid" "ref" "si" "mc_cid" "mc_eid"}]
    (str "https://"
         (.-hostname url-obj)
         (.-pathname url-obj)
         (when-let [search (not-empty (.-search url-obj))]
           (let [params (str/split (subs search 1) #"&")]
             (when-let [kept-params (seq (remove (fn [p]
                                                    (contains? params-to-remove
                                                              (first (str/split p #"="))))
                                                  params))]
               (str "?" (str/join "&" kept-params))))))))

(defn extract-urls
  [text]
  (re-seq #"https?://[^\s<>\"{}|\\^`\\[\\]]+" text))

(defn canonicalize-all-urls
  [text]
  (let [urls (extract-urls text)]
    (reduce (fn [t url]
              (str/replace t url (canonicalize-url url)))
            text
            urls)))

;; ============================================================================
;; Attachment/Embed Signatures
;; ============================================================================

(defn compute-attachment-sig
  [attachments]
  {:count (count attachments)
   :types (mapv :type attachments)
   :size-buckets (mapv (fn [a]
                         (cond
                           (< (:size a) 1024) "tiny"
                           (< (:size a) 102400) "small"
                           (< (:size a) 1048576) "medium"
                           :else "large"))
                       attachments)})

(defn compute-embed-sig
  [embeds]
  {:count (count embeds)
   :primary-url-token (first (mapv (fn [e]
                                     (when-let [url (:url e)]
                                       (canonicalize-url url)))
                                   embeds))
   :title-hash (first (mapv (fn [e]
                              (when-let [title (:title e)]
                                (hash title)))
                            embeds))
   :description-hash (first (mapv (fn [e]
                                    (when-let [desc (:description e)]
                                      (hash desc)))
                                  embeds))})

;; ============================================================================
;; Main Normalization Function
;; ============================================================================

(defn normalize-discord-message
  "Normalize a discord message for dedupe and retrieval"
  [event policy]
  (let [content (get-in event [:event/payload :content] "")
        {:keys [volatile-rewrites strip-tracking-params]} policy]
    (-> content
        normalize-unicode
        normalize-whitespace
        (apply-volatile-rewrites volatile-rewrites)
        canonicalize-mentions
        (canonicalize-all-urls))))

;; ============================================================================
;; SimHash (from spec section 2)
;; ============================================================================

(defn- tokenize
  [text]
  (-> text
      str/lower-case
      (str/replace #"[^a-z0-9]+" " ")
      str/trim
      (str/split #"\s+")))

(defn- hash-token
  [token]
  (let [h (hash token)]
    (if (neg? h) (- 0 h) h)))

(defn simhash64
  [text]
  (let [tokens (tokenize text)
        h (js/Uint32Array. 64)]
    (doseq [token tokens]
      (let [token-hash (hash-token token)]
        (dotimes [i 64]
          (let [bit (bit-and (bit-shift-right token-hash i) 1)]
            (aset h i (+ (aget h i) (if (= bit 1) 1 -1)))))))
    (loop [i 0 result 0]
      (if (= i 64)
        result
        (recur (inc i)
               (if (pos? (aget h i))
                 (bit-or result (bit-shift-left 1 i))
                 result))))))

(defn hamming64
  [a b]
  (let [x (- a b)]
    (loop [c 0 x x]
      (if (zero? x)
        c
        (recur (inc c) (bit-and x (dec x)))))))
