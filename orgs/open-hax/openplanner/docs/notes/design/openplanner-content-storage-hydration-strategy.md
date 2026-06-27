---
original_name: "2026.04.28.15.06.02.md"
title: "OpenPlanner Content Storage and Hydration Strategy"
summary: "Outlines priorities for removing full text from OpenPlanner, retaining references, and hydrating source fragments through caches."
category: "design"
created: "2026-04-28"
---

## User thoughts
I'm leaning towards openplanner should not store full text contents of anything that we can reasonably be expected to have access to the original source of...

it should be primarily an event ledger, and graph/semantic search index that keeps references, that consumers can then hydrate from the original source...

But this is kinda a pickle...
knoxx stores pi sessions through the pi ingestion job, and it's own sessions, in openplanner,
And both are using proxx as a provider.

Then I am using proxx directly through pi, so those are getting mostly duplicated..

And we are storing full document content inside of mongodb as well...

We need to remove all the text content from openplanner.
We need to... since we keep the prompt cache keys,
yea we have the nessisary meta data to create correlations.

I think though... we chunk documents for the layered graph memory in mongo,
I think we only keep the offset and sentance length though so...

Web pages... I'm leaning towards we keep markdown generated from the website, and the link... but the markdown has a ttl, it can be kinda long, like 5 days.

We have a multi layered cacheing system for source content.
Redis is the fsat path, short TTLs, LRU


I am thinking that it's kinda crazy to embed entire documents, and we might benefit from... making the max chunk size smaller.... I'm thinking  that maybe we should also benchmark a few different embedding models in

I think what we could do for the layered graph system is...
The ingestion engine in knoxx is seperated from knoxx. it becomes a submodule of openplanner.
openplanner takes full owner ship of the ingestion engine.


## Priorities
- openplanner migration system
- remove all agent session text content from openplanner
- retain references to prompt cache keys so session text can be discovered from proxx event table
- We hydrate search queries from the original source
- we cache the source text fragments in redis mapping to mongodb objects with an LRU strategy
- remove all document text content from openplanner
- retain file paths and hostnames of documents in openplanner
- We remove all redis responsibilities from knoxx, and make the openplanner api the only thing
- knoxx is entirely decoupled from document ingestion
- Documents are ingested as a hierarchical event tree that mirror the underlying sources AST (in most cases, this is markdown, but often also code, or html)
- Prefer clojure for new code
  - use protocols, methods
  - prefer  clj for new services/projects
  - Prefer shadow-cljs for new node runtime code
  - rewrite typescript logic we must change to support new behaviors to clojurescript

  - itteratively continue this process in the long term until the typescript is gone.

## Migration 1

### Objectives

- for each document in openplanner's mongo instance with a prompt cache key or
So the first migration would be to itterate through both proxx's event store,
and openplanner's data, and for each entry with a prompt cache key, and
text content that matches between both services, we remove the text content from mongo.

### Status

In review, likely deferrable.
Proxx events are mostly streaming deltas
and the shape of receipts is an assembled stream.

We are going later revisit this,
since with the layered cacheing system,
commonly accessed sessions can be relatively
cheaply reassembled with the data stored
in proxx's sql event store.

Essentially blocked by Migration 3


## Migration 2

### Objectives

- We do the same thing with documents/files.
- There are some events we can keep the text of, anything we can't verify exists somewhere else.
- There are some events in knoxx which are a synthesis of individual events.
- We make those reconstructable through references. These are the receipts.


### Status

In review, likely mostly completed, maybe clean up is needed, maybe testing, and documentation.
Verification is required, check receipts and review claims

This is simpler than Migration 1, because documents are full blobs, chunked in various ways.

## Migration 3

### Objectives
- We define a cacheing protocol supporting the following methods:
  - cache-get
  - cache-put!
  - cache-evict!
  - cache-touch!
  - cache-cleanup!
  - cache-stats
- we implement lmdb, and redis drivers for that interface
- We add a multi layer cacheing strategy for source documents
  - redis LRU for fastest access to recent or common results
  - When source text fall out of the LRU, they are persisted to
    LMDB with a configurable TTL (5 hours by default)
- We move the embedding cacheing out of openplanner in memory and add it to
    redis (it keeps crashing)

### Status

In review, signifignat work has been done, tests may be needed ,documentation.
Mast mile integrations of for endpoint rehydration.



## Next steps

Review the state of migrations  2and 3, and assess the status of 1 given the states of 2 and 3.

