(ns promethean.eidolon.nexus-keys-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.eidolon.nexus-keys :as nexus]))

(deftest nexus-keys-basic-structure
  (let [mem {:memory/meta {:discord/channel-id "C1"
                           :discord/author-id "A1"
                           :discord/message-id "M1"
                           :fs/path "path/to/file"}
             :memory/tags ["t1" "t2"]
             :memory/kind :note}]
    (is (= ["tag:t1" "tag:t2" "kind:note" "chan:C1" "author:A1" "msg:M1" "path:path/to/file"]
           (nexus/keys-for-memory mem)))))

(deftest nexus-keys-optional-fields
  (let [mem {:memory/meta {:fs/path "/root"}
             :memory/tags ["alpha"]
             :memory/kind :type}]
    (is (= ["tag:alpha" "kind:type" "path:/root"]
           (nexus/keys-for-memory mem)))))
