(ns promethean.contracts.markdown-frontmatter-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.contracts.markdown-frontmatter :as fm]))

(deftest parses-valid-frontmatter
  (let [md (str "---\n"
                "title: Example Title\n"
                "slug: example-title\n"
                "description: A brief description\n"
                "tags:\n"
                "- alpha\n"
                "- beta\n"
                "---\n"
                "\nBody text here.\n")
        parsed (fm/parse-frontmatter md)]
    (is (= "Example Title" (:title parsed)))
    (is (= "example-title" (:slug parsed)))
    (is (= "A brief description" (:description parsed)))
    (is (= ["alpha" "beta"] (:tags parsed)))))

(deftest missing-frontmatter-returns-nil
  (let [md "No frontmatter here\nJust content."]
    (is (nil? (fm/parse-frontmatter md)))))

(deftest invalid-frontmatter-returns-nil
  (let [md (str "---\n"
                "this is not valid yaml\n"
                "---\n")]
    (is (nil? (fm/parse-frontmatter md)))))
