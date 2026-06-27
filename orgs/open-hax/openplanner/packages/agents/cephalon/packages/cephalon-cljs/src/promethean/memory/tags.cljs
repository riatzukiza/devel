(ns promethean.memory.tags
  (:require [clojure.string :as str]))

(defn- has? [re s] (boolean (re-find re (or s ""))))

(defn tags-for-event [evt]
  (let [t (:event/type evt)
        p (:event/payload evt)
        s (or (:content p) "")
        base (cond-> []
               (= t :discord.message/new) (conj "src/discord")
               (= t :fs.file/created) (conj "src/fs" "fs/created")
               (= t :fs.file/modified) (conj "src/fs" "fs/modified")

               (true? (:author-bot p)) (conj "discord/bot")
               (has? #"(error|exception|stacktrace|traceback)" s) (conj "ops/error")
               (has? #"(timeout|timed out)" s) (conj "ops/timeout")
               (has? #"(build|compile|shadow-cljs)" s) (conj "dev/build")
               (has? #"(discord|guild|channel)" s) (conj "topic/discord")
               (has? #"(spam|duplicate|repost)" s) (conj "ops/spam"))]
    (vec (distinct base))))
