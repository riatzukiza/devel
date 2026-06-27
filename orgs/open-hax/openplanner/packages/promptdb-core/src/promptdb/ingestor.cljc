(ns promptdb.ingestor
  "Special-purpose ingestor driver for promptdb EDN files.

   Rationale:
   If promptdb files live in the devel/packages tree, the Knoxx ingestor
   can pick them up automatically — but it needs to treat them differently
   from arbitrary text documents:
     - parse as EDN (not chunk-and-embed)
     - validate via Malli schemas
     - emit :promptdb/fact and :promptdb/obs records directly into the
       epistemic/Datalog store rather than the vector index.

   source-kind: :promptdb"
  (:require [promptdb.core :as core]))

(defn ingest-file
  "Given a seq of raw EDN maps from a promptdb file, validate and
   return a seq of {:kind k :value v} records ready for the epistemic store.
   Throws on validation failure."
  [edn-records]
  (mapv (fn [{:keys [kind value] :as record}]
          (core/validate! kind value)
          record)
        edn-records))

(defn source-kind [] :promptdb)
