---
original_name: "2026.04.28.18.02.51.md"
title: "Idiomatic Clojure BST with Malli"
summary: "Shows an idiomatic Clojure binary search tree using plain data, Malli schemas, protocols, records, and instrumentation."
category: "dev"
created: "2026-04-28"
---


## Example of idomatic clojure to use in place of a class

An idiomatic algorithmic implementation of a Binary Search Tree (BST) in Clojure relies on plain data structures, pure functions, and the explicit separation of data definition (Malli schemas) from behavior (Protocols). [ssojet](https://ssojet.com/data-structures/implement-binary-search-tree-in-clojure)

Below is a complete implementation that defines the data model using Malli, specifies the algorithmic interface via a Clojure Protocol, implements the behavior using a `defrecord`, and instruments the functions with Malli.

### 1. Define the Protocol
A protocol defines the polymorphic contract for our tree. [reddit](https://www.reddit.com/r/Clojure/comments/1qb069b/announcing_deft_a_new_replacement_for_defprotocol/)

```clojure
(ns bst.core
  (:require [malli.core :as m]
            [malli.instrument :as mi]))

(defprotocol IBinarySearchTree
  (insert [this val] "Inserts a value into the BST, returning a new tree.")
  (search [this val] "Returns the node if the value exists, otherwise nil."))
```

### 2. Define the Malli Schemas
We define the shape of the data using Malli's registry to allow for the recursive structure of the tree nodes. [github](https://github.com/metosin/malli/issues/687)

```clojure
;; The base shape of a node
(def NodeSchema
  [:schema
   {:registry 
    {::node [:map
             [:val :int] 
             [:left  [:maybe [:ref ::node]]]
             [:right [:maybe [:ref ::node]]]]}}
   ::node])

;; The shape of our actual record, which wraps the root node
(def BSTSchema
  [:map 
   ;; The root can be nil (empty tree) or a valid node
   [:root [:maybe NodeSchema]]])
```

### 3. Implement the Algorithm using `defrecord`
We use `defrecord` to create a concrete type that implements our protocol. A record acts like a map but satisfies protocol dispatch. The implementation relies on functional recursion, constructing a *new* tree rather than mutating the existing one. [plumatic.github](https://plumatic.github.io/schema/schema.core.html)

```clojure
(defn- insert-node 
  "Helper: Recursively finds the correct insertion point and builds a new branch."
  [node new-val]
  (if (nil? node)
    {:val new-val :left nil :right nil}
    (cond
      (< new-val (:val node)) (assoc node :left  (insert-node (:left node) new-val))
      (> new-val (:val node)) (assoc node :right (insert-node (:right node) new-val))
      :else node))) ;; Value already exists; return unchanged.

(defn- search-node 
  "Helper: Recursively navigates the tree to find a value."
  [node search-val]
  (if (nil? node)
    nil
    (cond
      (< search-val (:val node)) (search-node (:left node) search-val)
      (> search-val (:val node)) (search-node (:right node) search-val)
      :else node)))

;; Define the Tree record that implements the protocol
(defrecord BST [root]
  IBinarySearchTree
  
  (insert [this val]
    ;; We use functional update, returning a new BST record
    (->BST (insert-node root val)))
    
  (search [this val]
    (search-node root val)))
```

### 4. Instrumenting the API
To enforce "Epistemic TDD" and create binding contracts at the system boundaries, we use Malli's function schemas (`=>`) to annotate the expected inputs and outputs. [blog.ambrosebs](https://blog.ambrosebs.com/2022/09/08/schema-defprotocol.html)

```clojure
;; We use Malli's `=>` registry to define the exact types for our protocol methods
(m/=> insert [:=> [:cat BSTSchema :int] BSTSchema])
(m/=> search [:=> [:cat BSTSchema :int] [:maybe NodeSchema]])

;; Enable instrumentation for development. 
;; Any call to `insert` or `search` that violates the schema will now throw a detailed error.
(mi/instrument!)
```

### Usage

Because `BST` is a record, you can instantiate it and interact with it using standard Clojure mechanics, while Malli watches the boundaries.

```clojure
;; Create an empty tree
(def empty-tree (->BST nil))

;; Insert values (returns a new tree each time)
(def tree 
  (-> empty-tree
      (insert 10)
      (insert 5)
      (insert 15)))

;; Search
(search tree 5) 
;; => {:val 5, :left nil, :right nil}

(search tree 99) 
;; => nil

;; Instrumentation Failure Example:
;; Trying to insert a string into a tree expecting an :int
(insert tree "hello")
;; => ExceptionInfo: :malli.core/invalid-input 
;; => In path [:cat 1] -> Expected :int, got "hello"
```

This pattern provides the speed and flexibility of dynamic, immutable Clojure maps internally, while heavily guarding the behavioral boundaries of the protocol using Malli schemas.
