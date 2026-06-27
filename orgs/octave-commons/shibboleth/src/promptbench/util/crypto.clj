(ns promptbench.util.crypto
  "Centralized SHA-256 hashing utilities.

   All SHA-256 operations across the pipeline and transform system
   should use functions from this namespace to avoid duplication.

   Provides:
   - sha256-bytes  — hex digest of a byte array
   - sha256-string — hex digest of a UTF-8 string
   - sha256-file   — hex digest of a file on disk
   - sha256-id     — hex digest with 'sha256:' prefix (for IDs)"
  (:import [java.security MessageDigest]
           [java.nio.file Files Paths]))

(defn sha256-bytes
  "Compute SHA-256 hex digest of a byte array."
  ^String [^bytes data]
  (let [md (MessageDigest/getInstance "SHA-256")]
    (.update md data)
    (let [digest (.digest md)]
      (apply str (map #(format "%02x" (bit-and % 0xff)) digest)))))

(defn sha256-string
  "Compute SHA-256 hex digest of a UTF-8 string."
  ^String [^String s]
  (sha256-bytes (.getBytes s "UTF-8")))

(defn sha256-file
  "Compute SHA-256 hex digest of a file on disk."
  ^String [^String path]
  (sha256-bytes (Files/readAllBytes (Paths/get path (into-array String [])))))

(defn sha256-id
  "Compute SHA-256 hex digest of a string with 'sha256:' prefix.
   Used for generating deterministic IDs (variant-id, source-id, etc.)."
  ^String [^String s]
  (str "sha256:" (sha256-string s)))
