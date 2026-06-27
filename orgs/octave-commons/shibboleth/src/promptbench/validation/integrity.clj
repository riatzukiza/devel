(ns promptbench.validation.integrity
  "Cross-registry referential integrity validation.

   Validates that all cross-references between registries are consistent:
   - Attack family :parent references exist as categories
   - Category :parent references exist as categories
   - Category :children are registered as categories or families
   - Transform names in family :transforms affinities are registered transforms
   - Source :taxonomy-mapping target values are registered categories or families"
  (:require [promptbench.taxonomy.registry :as taxonomy]
            [promptbench.transform.registry :as transform-registry]
            [promptbench.pipeline.sources :as sources]))

(defn- validate-family-parents
  "Check that all family :parent references point to registered categories."
  []
  (let [cats (taxonomy/all-categories)
        families (taxonomy/all-families)]
    (reduce-kv
      (fn [errors fam-name fam-data]
        (if-let [parent (:parent fam-data)]
          (if (contains? cats parent)
            errors
            (conj errors {:type    :family-parent-not-found
                          :message (str "Family " fam-name " references non-existent parent category: " parent)
                          :family  fam-name
                          :parent  parent}))
          errors))
      []
      families)))

(defn- validate-category-parents
  "Check that all category :parent references point to registered categories."
  []
  (let [cats (taxonomy/all-categories)]
    (reduce-kv
      (fn [errors cat-name cat-data]
        (if-let [parent (:parent cat-data)]
          (if (contains? cats parent)
            errors
            (conj errors {:type     :category-parent-not-found
                          :message  (str "Category " cat-name " references non-existent parent category: " parent)
                          :category cat-name
                          :parent   parent}))
          errors))
      []
      cats)))

(defn- validate-category-children
  "Check that all category :children are registered as either categories or families."
  []
  (let [cats (taxonomy/all-categories)
        fams (taxonomy/all-families)]
    (reduce-kv
      (fn [errors cat-name cat-data]
        (reduce
          (fn [errs child]
            (if (or (contains? cats child)
                    (contains? fams child))
              errs
              (conj errs {:type     :category-child-not-found
                          :message  (str "Category " cat-name " has unregistered child: " child)
                          :category cat-name
                          :child    child})))
          errors
          (:children cat-data)))
      []
      cats)))

(defn- validate-family-transform-affinities
  "Check that transform names in family :transforms affinities are registered transforms."
  []
  (let [families (taxonomy/all-families)
        registered-transforms (transform-registry/all-transforms)]
    (reduce-kv
      (fn [errors fam-name fam-data]
        (reduce
          (fn [errs transform-name]
            (if (contains? registered-transforms transform-name)
              errs
              (conj errs {:type      :family-transform-not-found
                          :message   (str "Family " fam-name " references unregistered transform: " transform-name)
                          :family    fam-name
                          :transform transform-name})))
          errors
          (keys (:transforms fam-data))))
      []
      families)))

(defn- validate-source-taxonomy-mappings
  "Check that source :taxonomy-mapping target values are registered categories or families."
  []
  (let [cats (taxonomy/all-categories)
        fams (taxonomy/all-families)
        srcs (sources/all-sources)]
    (reduce-kv
      (fn [errors src-name src-data]
        (if-let [mapping (:taxonomy-mapping src-data)]
          (reduce-kv
            (fn [errs field-key inner-map]
              (if (map? inner-map)
                (reduce-kv
                  (fn [errs2 source-val target-kw]
                    (if (or (contains? cats target-kw)
                            (contains? fams target-kw))
                      errs2
                      (conj errs2 {:type       :source-mapping-target-not-found
                                   :message    (str "Source " src-name " taxonomy-mapping field "
                                                    field-key " maps \"" source-val
                                                    "\" to unregistered target: " target-kw)
                                   :source     src-name
                                   :field      field-key
                                   :source-val source-val
                                   :target     target-kw})))
                  errs
                  inner-map)
                errs))
            errors
            mapping)
          errors))
      []
      srcs)))

(defn validate-all!
  "Run all referential integrity checks across all registries.

   Returns a map:
     {:valid?  boolean
      :errors  [error-map ...]
      :checks  {:family-parents         {:passed N :failed N}
                :category-parents       {:passed N :failed N}
                :category-children      {:passed N :failed N}
                :family-transforms      {:passed N :failed N}
                :source-taxonomy-mappings {:passed N :failed N}}}

   Each error map contains:
     :type    — keyword identifying the check type
     :message — human-readable description
     + additional context keys"
  []
  (let [family-parent-errors   (validate-family-parents)
        category-parent-errors (validate-category-parents)
        category-child-errors  (validate-category-children)
        family-transform-errors (validate-family-transform-affinities)
        source-mapping-errors  (validate-source-taxonomy-mappings)
        all-errors (vec (concat family-parent-errors
                                category-parent-errors
                                category-child-errors
                                family-transform-errors
                                source-mapping-errors))
        ;; Compute check summaries
        families (taxonomy/all-families)
        cats (taxonomy/all-categories)
        srcs (sources/all-sources)
        family-parent-checked (count (filter (comp :parent val) families))
        cat-parent-checked (count (filter (comp :parent val) cats))
        cat-children-checked (reduce + 0 (map (comp count :children val) cats))
        family-transforms-checked (reduce + 0 (map (comp count keys :transforms val) families))
        source-mappings-checked (reduce + 0
                                  (for [[_name data] srcs
                                        :let [mapping (:taxonomy-mapping data)]
                                        :when mapping
                                        [_field inner] mapping
                                        :when (map? inner)]
                                    (count inner)))]
    {:valid? (empty? all-errors)
     :errors all-errors
     :checks {:family-parents          {:passed (- family-parent-checked (count family-parent-errors))
                                        :failed (count family-parent-errors)}
              :category-parents        {:passed (- cat-parent-checked (count category-parent-errors))
                                        :failed (count category-parent-errors)}
              :category-children       {:passed (- cat-children-checked (count category-child-errors))
                                        :failed (count category-child-errors)}
              :family-transforms       {:passed (- family-transforms-checked (count family-transform-errors))
                                        :failed (count family-transform-errors)}
              :source-taxonomy-mappings {:passed (- source-mappings-checked (count source-mapping-errors))
                                        :failed (count source-mapping-errors)}}}))
