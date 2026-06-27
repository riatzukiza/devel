(ns promethean.memory.tags-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [promethean.memory.tags :as tags]))

(deftest test-discord_src_tag
  (is (some #(= % "src/discord") (tags/tags-for-event {:event/type :discord.message/new
                                                      :event/payload {:content ""}}))))

(deftest test_fs_created_tags
  (is (some #(= % "src/fs") (tags/tags-for-event {:event/type :fs.file/created
                                                  :event/payload {:content ""}})))
  (is (some #(= % "fs/created") (tags/tags-for-event {:event/type :fs.file/created
                                                        :event/payload {:content ""}}))))

(deftest test_fs_modified_tags
  (is (some #(= % "src/fs") (tags/tags-for-event {:event/type :fs.file/modified
                                                  :event/payload {:content ""}})))
  (is (some #(= % "fs/modified") (tags/tags-for-event {:event/type :fs.file/modified
                                                        :event/payload {:content ""}}))))

(deftest test_error_tag
  (is (some #(= % "ops/error") (tags/tags-for-event {:event/type :discord.message/new
                                                     :event/payload {:content "an error happened"}}))))

(deftest test_build_tag
  (is (some #(= % "dev/build") (tags/tags-for-event {:event/type :discord.message/new
                                                     :event/payload {:content "now building"}}))))
