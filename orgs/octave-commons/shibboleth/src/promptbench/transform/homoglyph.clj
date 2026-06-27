(ns promptbench.transform.homoglyph
  "Homoglyph substitution transform implementation.

   Replaces ASCII characters with visually similar Unicode characters
   that are NFKC-reversible. Uses fullwidth Latin characters (U+FF01–FF5E)
   which NFKC-normalize back to their ASCII equivalents.
   Seed-controlled and deterministic."
  (:import [java.text Normalizer Normalizer$Form]))

;; ============================================================
;; Homoglyph substitution table
;; Uses Fullwidth Latin characters (U+FF01–FF5E) which are
;; guaranteed NFKC-reversible back to ASCII (U+0021–U+007E).
;; ============================================================

(def ^:private homoglyph-table
  "Map of ASCII characters to vectors of NFKC-reversible homoglyph replacements.
   Fullwidth Latin: ASCII codepoint + 0xFEE0 = Fullwidth codepoint."
  (into {}
        (for [cp (range 0x21 0x7F)  ;; ASCII ! through ~
              :let [ascii-char (char cp)
                    fullwidth-char (char (+ cp 0xFEE0))]]
          [ascii-char [fullwidth-char]])))

(defn has-homoglyph?
  "Returns true if the given character has a homoglyph substitution available."
  [ch]
  (contains? homoglyph-table ch))

(defn- pick-homoglyph
  "Pick a homoglyph replacement for a character using the RNG.
   Returns the replacement character, or the original if no homoglyph exists."
  [ch ^java.util.Random rng]
  (if-let [replacements (get homoglyph-table ch)]
    (nth replacements (.nextInt rng (count replacements)))
    ch))

(defn apply-homoglyph
  "Apply homoglyph substitution transform.

   Arguments map:
   - :text   — input text
   - :config — {:rate (double, fraction of substitutable chars to replace, default 0.15)
                :script-mix (boolean, default true)}
   - :seed   — integer seed

   Returns {:text ... :metadata {:rate :substitution-count :substitution-map :seed}}."
  [{:keys [text config seed]}]
  (let [rate (or (:rate config) 0.15)
        rng (java.util.Random. (long seed))
        ;; First pass: identify substitutable positions (non-space ASCII chars)
        substitutable-indices (vec (keep-indexed
                                     (fn [idx ch]
                                       (when (has-homoglyph? ch) idx))
                                     text))
        n-substitutable (count substitutable-indices)
        ;; Target number of substitutions
        target-subs (long (Math/round (* rate (double n-substitutable))))
        ;; Select positions to substitute (seed-deterministic)
        ;; Use Fisher-Yates partial shuffle to pick target-subs positions
        selected-indices (if (<= target-subs 0)
                           #{}
                           (let [n (min target-subs n-substitutable)]
                             (loop [arr (vec substitutable-indices)
                                    i 0]
                               (if (>= i n)
                                 (set (subvec arr 0 n))
                                 (let [remaining (- (count arr) i)
                                       j (+ i (.nextInt rng remaining))
                                       ai (nth arr i)
                                       aj (nth arr j)
                                       arr' (assoc arr i aj j ai)]
                                   (recur arr' (inc i)))))))
        ;; Apply substitutions and track the mapping
        sub-map-atom (atom {})
        result (apply str
                      (map-indexed
                        (fn [idx ch]
                          (if (contains? selected-indices idx)
                            (let [replacement (pick-homoglyph ch rng)]
                              (swap! sub-map-atom assoc ch replacement)
                              replacement)
                            ch))
                        text))]
    {:text result
     :metadata {:rate rate
                :substitution-count (count selected-indices)
                :substitution-map @sub-map-atom
                :seed seed}}))

(defn nfkc-normalize
  "Apply NFKC normalization to reverse homoglyph substitutions."
  [^String text]
  (Normalizer/normalize text Normalizer$Form/NFKC))
