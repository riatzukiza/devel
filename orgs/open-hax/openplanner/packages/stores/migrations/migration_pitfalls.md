# Migration Pitfalls & Lessons

## MongoDB `FindIterable` vs `Iterator`
**Date:** 2026-04-28
**Symptom:** MongoDB query results in Clojure interop fail to iterate using `.hasNext` and `.next`.
**Aha! Moment:** The result of `.find().sort().limit()` is a `com.mongodb.client.FindIterable`. While it implements `Iterable`, it is NOT an `Iterator`.
**Fix:** Explicitly call `.iterator()` on the `FindIterable` object to obtain the actual `MongoCursor`.

```clojure
;; WRONG
(let [cursor (-> coll (.find filter) (.sort sort-doc) (.limit limit))]
  (while (.hasNext cursor) 
    (.next cursor)))

;; CORRECT
(let [iterable (-> coll (.find filter) (.sort sort-doc) (.limit limit))
       it (.iterator iterable)]
  (while (.hasNext it) 
    (.next it)))
```
**Context:** Discovered during a live-streamed migration marathon.
