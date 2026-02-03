(ns promethean.contracts.markdown-frontmatter-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.contracts.markdown-frontmatter :as fm]))

(deftest parses-valid-frontmatter
  (let [md "---
title: Example Title
slug: example-title
description: A brief description
tags:
  - alpha
  - beta
---
\nBody text here.
"
        parsed (fm/parse-frontmatter md)]
    (is (= "Example Title" (:title parsed)))
    (is (= "example-title" (:slug parsed)))
    (is (= "A brief description" (:description parsed)))
    (is (= ["alpha" "beta"] (:tags parsed)))))

(deftest missing-frontmatter-returns-nil
  (let [md "No frontmatter here\nJust content."]
    (is (nil? (fm/parse-frontmatter md)))))

(deftest invalid-frontmatter-returns-nil
  (let [md "---
this is not valid yaml
---\n"]
    (is (nil? (fm/parse-frontmatter md)))))
