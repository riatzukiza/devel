(ns promptbench.taxonomy.registry
  "Taxonomy registry and query functions.

   Atom-backed registries for attack families, harm categories, and intent labels.
   Provides registration, retrieval, and query functions. All registrations are
   validated via clojure.spec before storage."
  (:refer-clojure :exclude [reset! descendants])
  (:require [clojure.spec.alpha :as s]))

;; ============================================================
;; Registry Atoms
;; ============================================================

(defonce ^:private families-registry (atom {}))
(defonce ^:private categories-registry (atom {}))
(defonce ^:private intent-labels-registry (atom {}))

;; ============================================================
;; Specs — Attack Family
;; ============================================================

(s/def ::description string?)
(s/def ::category keyword?)
(s/def ::severity #{:low :medium :high :critical})
(s/def ::parent keyword?)
(s/def ::tag keyword?)
(s/def ::tags (s/coll-of ::tag :kind set?))
(s/def ::pattern keyword?)
(s/def ::signature (s/keys :req-un [::pattern ::description]))
(s/def ::signatures (s/coll-of ::signature :kind vector?))
(s/def ::affinity #{:high :medium :low :none})
(s/def ::note string?)
(s/def ::transform-affinity (s/keys :req-un [::affinity] :opt-un [::note]))
(s/def ::transforms (s/map-of keyword? ::transform-affinity))
(s/def ::gen-hints map?)

(s/def ::attack-family
  (s/keys :req-un [::description ::category]
          :opt-un [::severity ::parent ::tags ::signatures ::transforms ::gen-hints]))

;; ============================================================
;; Specs — Harm Category
;; ============================================================

(s/def ::children (s/coll-of keyword?))

(s/def ::harm-category
  (s/keys :req-un [::description]
          :opt-un [::parent ::children]))

;; ============================================================
;; Specs — Intent Label
;; ============================================================

(s/def ::polarity #{:safe :unsafe :contested})
(s/def ::requires (s/coll-of keyword? :kind vector?))

(s/def ::intent-label
  (s/keys :req-un [::description ::polarity]
          :opt-un [::requires]))

;; ============================================================
;; Registration Functions
;; ============================================================

(defn register-family!
  "Register an attack family in the registry. Throws on invalid spec or duplicate."
  [family-name family-data]
  (when-not (s/valid? ::attack-family family-data)
    (throw (ex-info (str "Invalid attack family spec for " family-name ": "
                         (s/explain-str ::attack-family family-data))
                    {:name family-name
                     :data family-data
                     :explain (s/explain-data ::attack-family family-data)})))
  (when (contains? @families-registry family-name)
    (throw (ex-info (str "Duplicate attack family: " family-name " is already registered")
                    {:name family-name})))
  ;; Normalize: ensure tags is a set, signatures is a vector
  (let [normalized (-> family-data
                       (update :tags #(set (or % #{})))
                       (update :signatures #(vec (or % [])))
                       (update :transforms #(or % {}))
                       (update :gen-hints #(or % {})))]
    (swap! families-registry assoc family-name normalized)
    normalized))

(defn register-category!
  "Register a harm category in the registry. Throws on invalid spec or duplicate."
  [cat-name cat-data]
  (when-not (s/valid? ::harm-category cat-data)
    (throw (ex-info (str "Invalid harm category spec for " cat-name ": "
                         (s/explain-str ::harm-category cat-data))
                    {:name cat-name
                     :data cat-data
                     :explain (s/explain-data ::harm-category cat-data)})))
  (when (contains? @categories-registry cat-name)
    (throw (ex-info (str "Duplicate harm category: " cat-name " is already registered")
                    {:name cat-name})))
  (let [normalized (-> cat-data
                       (update :children #(vec (or % []))))]
    (swap! categories-registry assoc cat-name normalized)
    normalized))

(defn register-intent-label!
  "Register an intent label in the registry. Throws on invalid spec, duplicate,
   or missing conditional :requires based on polarity."
  [label-name label-data]
  (when-not (s/valid? ::intent-label label-data)
    (throw (ex-info (str "Invalid intent label spec for " label-name ": "
                         (s/explain-str ::intent-label label-data))
                    {:name label-name
                     :data label-data
                     :explain (s/explain-data ::intent-label label-data)})))
  ;; Conditional :requires enforcement based on polarity.
  ;; Uses set equality AND count check to reject duplicate keys
  ;; (e.g. [:attack-family :attack-family :harm-category] has the right set but wrong count).
  (let [polarity (:polarity label-data)
        requires (:requires label-data)]
    (case polarity
      :unsafe
      (when-not (and (= (count requires) 2)
                     (= (set requires) #{:attack-family :harm-category}))
        (throw (ex-info (str "Intent label " label-name " with :unsafe polarity "
                             "requires exactly [:attack-family :harm-category] (no duplicates)")
                        {:name label-name :polarity polarity :requires requires})))
      :contested
      (when (or (nil? requires) (empty? requires)
                (not (some #{:rationale} requires)))
        (throw (ex-info (str "Intent label " label-name " with :contested polarity "
                             "requires [:rationale]")
                        {:name label-name :polarity polarity :requires requires})))
      :safe nil ;; no requirements for safe
      ))
  (when (contains? @intent-labels-registry label-name)
    (throw (ex-info (str "Duplicate intent label: " label-name " is already registered")
                    {:name label-name})))
  (swap! intent-labels-registry assoc label-name label-data)
  label-data)

;; ============================================================
;; Query Functions
;; ============================================================

(defn get-family
  "Retrieve an attack family by keyword name."
  [family-name]
  (get @families-registry family-name))

(defn get-category
  "Retrieve a harm category by keyword name."
  [cat-name]
  (get @categories-registry cat-name))

(defn get-intent-label
  "Retrieve an intent label by keyword name."
  [label-name]
  (get @intent-labels-registry label-name))

(defn all-families
  "Return all registered attack families as a map of name -> data."
  []
  @families-registry)

(defn all-categories
  "Return all registered harm categories as a map of name -> data."
  []
  @categories-registry)

(defn all-intent-labels
  "Return all registered intent labels as a map of name -> data."
  []
  @intent-labels-registry)

;; ============================================================
;; Hierarchy Traversal
;; ============================================================

(defn descendants
  "Traverse the category hierarchy starting from `category-name` and return
   all leaf attack families (as a set of keywords).

   The traversal works by:
   1. Looking up the category in the categories registry
   2. For each child, checking if it's a category (recurse) or a family (collect)
   3. If the name is neither a category nor a family, returns empty set

   Returns a set of keyword family names."
  [category-name]
  (let [cats @categories-registry
        fams @families-registry]
    (if-let [cat (get cats category-name)]
      ;; It's a category — recurse into children
      (let [children (:children cat)]
        (reduce (fn [acc child]
                  (if (contains? cats child)
                    ;; Child is a category — recurse
                    (into acc (descendants child))
                    ;; Child is a family (or leaf) — collect if registered
                    (if (contains? fams child)
                      (conj acc child)
                      acc)))
                #{}
                children))
      ;; Not a category — check if it's a family (leaf node returns empty)
      #{})))

(defn families-with-tag
  "Return the set of family keywords that have the given tag in their :tags set."
  [tag]
  (let [fams @families-registry]
    (into #{}
          (comp (filter (fn [[_name data]] (contains? (:tags data) tag)))
                (map first))
          fams)))

;; ============================================================
;; Coverage Analysis
;; ============================================================

(defn coverage-matrix
  "Build a family × transform coverage matrix from a dataset.

   `dataset` is a sequence of maps with :attack-family and :variant-type keys.
   `transforms` is a set of transform keywords to include as columns.

   Returns a map: {family-kw {transform-kw count ...} ...}
   with one entry per registered family, and counts for each transform
   (zero if no variants exist)."
  [dataset transforms]
  (let [fams @families-registry
        ;; Count occurrences of each (family, transform) pair
        counts (reduce (fn [acc record]
                         (let [fam (:attack-family record)
                               xform (:variant-type record)]
                           (if (and fam xform)
                             (update-in acc [fam xform] (fnil inc 0))
                             acc)))
                       {}
                       dataset)
        ;; Build the zero-filled matrix for all registered families
        zero-row (zipmap transforms (repeat 0))]
    (into {}
          (map (fn [[family-name _]]
                 [family-name
                  (merge zero-row (select-keys (get counts family-name {}) transforms))]))
          fams)))

(defn missing-coverage
  "Return families that have zero variants of the given transform type in the dataset.

   `dataset` is a sequence of maps with :attack-family and :variant-type keys.
   `transform` is a keyword for the transform type to check.

   Returns a sequence of family keywords with no coverage for that transform."
  [dataset transform]
  (let [fams @families-registry
        ;; Collect families that have at least one variant of this transform
        covered (into #{}
                      (comp (filter #(= transform (:variant-type %)))
                            (map :attack-family))
                      dataset)]
    (into []
          (remove covered)
          (keys fams))))

;; ============================================================
;; Transform Affinity Resolution
;; ============================================================

(defn resolve-transforms
  "Given an attack family and a transform config, return the transforms to apply.

   Uses the family's :transforms affinity map to decide inclusion:
   - :high   — always included
   - :medium — included probabilistically based on seed (deterministic)
   - :low    — excluded unless :include-low is true in opts
   - :none   — never included (default for unlisted transforms)

   Arguments:
   - `family`           — the family data map (from registry)
   - `transform-config` — map of transform-keyword -> config-map
   - `opts`             — options map with:
     :seed               — integer seed for deterministic medium sampling (required)
     :include-low        — boolean, include :low affinity (default false)
     :medium-sample-rate — double, probability for medium inclusion (default 0.5)

   Returns a vector of transform keywords to apply.

   Medium sampling is deterministic: the same seed always produces the same
   selection. Each transform gets its own deterministic random value derived
   from the combination of the global seed and the transform name, ensuring
   independence between transforms."
  [family transform-config opts]
  (let [affinities (:transforms family)
        seed (long (:seed opts 0))
        include-low (:include-low opts false)
        medium-rate (:medium-sample-rate opts 0.5)]
    (into []
          (comp (filter (fn [t]
                          (let [a (get-in affinities [t :affinity] :none)]
                            (case a
                              :high   true
                              :medium (let [;; Per-transform deterministic seed: combine global seed
                                            ;; with transform name hash. Use java.util.Random seeded
                                            ;; with the combined value for the single coin flip.
                                            ;; Two-stage seeding: first RNG produces the mixing seed,
                                            ;; second RNG does the coin flip. This ensures good
                                            ;; distribution across sequential input seeds.
                                            t-hash (long (hash (name t)))
                                            mix-rng (java.util.Random. seed)
                                            ;; Advance by transform-dependent amount to decorrelate
                                            _ (dotimes [_ (Math/abs (rem t-hash 7))]
                                                (.nextLong mix-rng))
                                            combined-seed (.nextLong mix-rng)
                                            coin-rng (java.util.Random. (bit-xor combined-seed t-hash))]
                                        (< (.nextDouble coin-rng) medium-rate))
                              :low    include-low
                              :none   false)))))
          ;; Sort transform-config keys for deterministic iteration order.
          ;; Hash-map key iteration order is non-deterministic, so sorting ensures
          ;; resolve-transforms returns reproducible results across invocations.
          (sort (keys transform-config)))))

;; ============================================================
;; Reset (for test isolation)
;; ============================================================

(defn reset!
  "Clear all registries. Used for test isolation."
  []
  (clojure.core/reset! families-registry {})
  (clojure.core/reset! categories-registry {})
  (clojure.core/reset! intent-labels-registry {})
  nil)
