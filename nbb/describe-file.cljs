
#!/usr/bin/env nbb
(ns describe-file
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["path" :as path]
            [promesa.core :as p]
            [opencode :as oc]
            [clojure.string :as str]))

(defn md-file? [dirent]
  (and (.isFile dirent)
       (= ".md" (path/extname (.-name dirent)))))

(defn get-markdown-from-dir [dir]
  (p/let [dirents (.readdir fs dir #js{ :withFileTypes true})]
    (->> dirents
         (filter md-file?)
         (map #(path/join dir (.-name %))))))


(defn update-file-name [client file-name]
  (oc/spawn-agent client (str/join "Update file name of @"file-name)
               (str "Based on the content of the markdown file @"file-name
                    ", give the file a more descriptive and concise name that accurately reflects its content. "
                    )))
(defn update-frontmatter-property [client file-name property change-prompt]
  (oc/spawn-agent client (str/join "Update Frontmatter property:" property "of @"file-name)
               (str "Update the frontmatter of the markdown file @"file-name
                    " to set the property '"property"'based on the following instruction:  "
                    change-prompt
                    )))
(defn update-frontmatter-summary [file-name]
  (update-frontmatter-property file-name "summary"
                               "In a concise manner, summarize the content of the document in 2-3 sentences."))
(defn update-frontmatter-tags [file-name]
  (update-frontmatter-property file-name "tags"
                               "Based on the content of the document, suggest relevant tags that accurately represent its main topics or themes. Provide a list of tags separated by commas."))

(defn run []
  (p/let [opencode (oc/create #js {:config #js {:model "opencode/big-pickle"}})
          file-names (get-markdown-from-dir (Path.join (.cwd js/process) "docs/notes"))
          sessions []]
    (doseq [file-name file-names]
      (update-frontmatter-summary opencode file-name)
      (update-frontmatter-tags opencode file-name)

      )))
