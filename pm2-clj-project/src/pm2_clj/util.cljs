(ns pm2-clj.util
  (:require ["fs" :as fs]
            ["path" :as path]
            ["os" :as os]))

(defn exists? [p]
  (try
    (fs/existsSync p)
    (catch :default _ false)))

(defn ext [p]
  (let [e (path/extname p)]
    (if (and e (not= e "")) e "")))

(defn resolve-path [cwd p]
  (if (path/isAbsolute p)
    p
    (path/resolve cwd p)))

(defn dirname [p] (path/dirname p))

(defn read-file [p] (fs/readFileSync p "utf8"))

(defn write-file! [p s] (fs/writeFileSync p s "utf8"))

(defn mkdtemp! [prefix]
  (fs/mkdtempSync (path/join (os/tmpdir) prefix)))

(defn join [& parts]
  (apply path/join parts))