(ns eta-mu.extensions.receipt-river.repo
  "Pure repo-detection and contract logic for receipt-river.
  All filesystem access is injected — no direct fs calls here.")

;; ── Git root detection ────────────────────────────────────────────────────────

(defn find-git-root
  "Walks up from `start-path` looking for a directory containing `.git`.
  Returns the directory path containing `.git`, or nil if not found.

  Args are injected for purity:
    join-fn    :: (parent child) -> path string
    dirname-fn :: path -> parent path (nil at filesystem root)
    exists-fn  :: path -> boolean"
  [join-fn dirname-fn exists-fn start-path]
  (when start-path
    (loop [dir start-path]
      (when dir
        (if (exists-fn (join-fn dir ".git"))
          dir
          (let [parent (dirname-fn dir)]
            (when (and parent (not= parent dir))
              (recur parent))))))))

;; ── Path param extraction ─────────────────────────────────────────────────────

(def ^:private path-param-keys
  ["path" "file" "dest" "destination" "target" "filename" "filepath"])

(defn- path-param-from-call [tool-call]
  (let [params (or (:tool/params tool-call) {})]
    (some (fn [k]
            (or (get params k)
                (get params (keyword k))))
          path-param-keys)))

;; ── Touched repos ─────────────────────────────────────────────────────────────

(defn touched-repos
  "Reduces a seq of tool-call maps to {repo-root -> call-count}.
  `find-git-root-fn` :: path -> repo-root-string|nil
  Tool calls without a resolvable path param are ignored."
  [find-git-root-fn tool-calls]
  (reduce (fn [acc call]
            (if-let [p (path-param-from-call call)]
              (if-let [root (find-git-root-fn p)]
                (update acc root (fnil inc 0))
                acc)
              acc))
          {}
          tool-calls))

;; ── Ledger activation ─────────────────────────────────────────────────────────

(def ^:private default-threshold 3)

(defn should-activate?
  "Returns true if the per-repo ledger should become active.
  A repo-state map has keys:
    :call-count  number of tool calls into this repo this turn
    :threshold   (optional) activation threshold, defaults to 3
    :active?     whether the ledger is already active"
  [{:keys [call-count threshold active?]}]
  (or active?
      (>= call-count (or threshold default-threshold))))

;; ── Contract violation detection ──────────────────────────────────────────────

(def ^:private read-only-threshold 1)

(defn contract-violations
  "Returns a sorted seq of repo roots that were touched substantively
  (call-count > read-only-threshold) but have no receipt this turn.

  touched-repos  :: {repo-root -> call-count}
  receipts-by-repo :: #{repo-root} (set of repos that got a receipt this turn)"
  [touched-repos receipts-by-repo]
  (->> touched-repos
       (keep (fn [[repo cnt]]
               (when (and (> cnt read-only-threshold)
                          (not (contains? receipts-by-repo repo)))
                 repo)))
       sort))
