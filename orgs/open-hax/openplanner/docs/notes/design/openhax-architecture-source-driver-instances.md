---
original_name: "2026.04.17.22.37.28.md"
title: "OpenHax Architecture Source Driver Instances"
summary: "Maps OpenHax and octave-commons repositories to a categorical architecture and calls for concrete source driver instances."
category: "design"
created: "2026-04-17"
---

Aight, another pass:
https://github.com/open-hax/openplanner
https://github.com/open-hax/knoxx
https://github.com/open-hax/tooloxx
https://github.com/open-hax/eta-mu 

https://github.com/open-hax/eta-mu/tree/main/pi ->Everything in here must be extracted and generalized, the eta-mu runtime is still kinda stuck in pi, it's possible to run it in opencode I know that much, but having these pi specific references around doesn't help the clankers think that way.
 


https://github.com/octave-commons/fork_tales -> The chaotic prototype which contains every idea encoded in at least one way.

As a result though, it's a very... simultaneously dense, and noisy place to look through.
Agents tend to get amazed by it before they can dig all the way in.

So hold your breath

https://github.com/octave-commons/promethean

And the most disorganzed, but also most complete, record of documentation regarding the larger cognative categorical architecture


The giga repo that has everything, to zoom out and maybe find something I'm not thinking about right now:
https://github.com/riatzukiza/devel

I know that *everything* is in here. I can feel it is more consolidated and refined than ever but I can still feel we are missing parts of the system.

I think we have the core schema, but now we need examples of drivers.

The schema you made a moment ago is the categorical language that generalizes over all surfaces.

But we need at least 2 solid instances of each object and morphisim in something resembling an implementation.

For cannonical document source drivers:
local file
google drive
sharepoint
dropbox
s3 bucket
git

For cannonical event source Drivers:

twitter, rss https://github.com/shuv1337/shuvcrawl
github(commits, forks, events, prs, issues, etc)
discord
bluesky
web

Now... what I think we may be lacking is an actual event loop for the events that we ingest. No pubsub system.
That exists somewhere in promethen, either directly, or in one of it's git submodules.

We need subscribable event streams for seed triggers.

sinks:
openplanner (maybe mor  accurately, the sink is mongo or duckdb)
https://github.com/open-hax/openplanner/tree/main/packages/promptdb-core
datalog?

mycology == lesson == retrospection === memory of a mistake
receipt == record == observation == diary

---

https://github.com/octave-commons/fork_tales/blob/main/specs/schema.edn

What is missing from this structure is the actual use cases we have...
It describes broad classes of problems.

We need this.

---

from the context above, we need to clearly define:
at least two actor agents contracts
at least two jobs/instruction prompts for each actor agent we define
at least 2 policies for each actor agent
at least 2 fulfilment contracts for each actor agent

We've got some mildly overlapping, not nessisarily conflicting, but perhaps confusing with proximity, words
- hook
- event
- trigger
- signal
- receipt

We need these to be clearly defined in context of eachother

event: Something, anything, happened, with varying degrees in our ability to know what it really was. Raw influence of eta
signal: an event, or sequence of correlated events from which eta may be infered from
trigger: A signal we are watching that can initate an actor agent contract to activate?
    Maybe a specific world state or condition we are may take action upon it's occurance or perception
hook: an action taken in response to a specific trigger
receipt: A recorded observation of a perceived change in internal, or external state, of either ones will (mu (like an agent making a substantive change)) or a perceived to be meaningful correlation of several observations after an investigation of the world state.

## Words we need more rigid definitions of in the system

- findings
- correlation

It seems to me like receipts are involved in the concept of findings, and correlations.

- actor

the `fork_tales/specs/schema.edn` only refers to an actor-id.
the concept of an actor is not clearly defined.
In natural language, I would describe an actor as an entity that can take actions 

- sink

raggussy was a dead end, were no usin it cause the important part wasn't even in the repo.
openplanner...

sink could be openplanner, in which case we only really have 1 sink.

it could be any of our various data stores:
- postgresql
- redis
- mongodb/atlas
- duckdb
- chromadb
- datascript
- XTDB
- structured data file
- raw text file (logs)
- in memory cache
- lmdb

It could be any API that accepts input data:
- discord
- bluesky
- github


## Words we may want to introduce
- hose: the opposite of a sink
- action|verb: A kind of thing that can be done by various means in various situations.
- motivation|intent:
- causation|cause:
- observation:
- proof: A sound logical structure that plausibly connections an assumption with a conjecture?
- fact: a proovably true observation
- entities: In game programming, an entity is basicly an ID that uniquely identifies a an assortment of related components used by systems to find and update said components with relation to each other and their surrounding environment.
  There might be several kinds of entities:
  - named: A collection of related data that is Likely of importance, unique, meaningful, impactful
  - conceptual: A collection of related data that is intangible but signifigant
  - common: A specific manifestation of a pattern of data.
  - actor: An entity which Causes things to occur, dynamic, volatile
  - agent: A complex long running actor which can be said to make decisions and take actions based on some internal priorities.
- reference|link|connection:
- mention: A reference to a named entity 
- relationship:
- association
- interpretation
- action
- capability
- skill
- inference
- deduction
- reasoning
- classification
- category
- transformation
- instances/occurances/recurrance
