# Devel's workflow

A running instance of [[promethean]], with debugging enbabled

## Description

### Agent runtimes

- opencode - The bootstraps, hacks we put together to get the job done when needed.
- cephalon - Always running brain loops, named agent instances with persistent personalities
- sentinel - reactive agents that trigger in response to an event, and stop their work when end conditions are met.
- olympia - benchmarker, keeps track of stats on other agents for future optimization tools, generates benchmark reports for human analysis
- eidolon - A semantic agent system floating agent, traverses the nooi, binding to and modifying Nexus (represents a resource on the knowledge graph, and it's location in the nooi see [promethean/docs/design/overview.md])


#### Cephalon

Cephalon are agents that are always running.
They are a simulation of a mind, always running, always ticking.
Instead of a chat log with the agent, this is an ever running loop.
It isn't just executing a task it was given, these agents are more autonomous.
These are the ones who interact with you, and the rest of the world.
They are executing on complex contracts, and an interest in self improvement, using information
gathered from olympia to modify it's state to perform better.

Cephalons use chat calls to llm providers where the messages list has this structure:
```
[...related,...persistent,...recent]
```

We're going to refer to the messages as `memories`, `messages`, `events`.
A memory is any llm message object + meta data that has been indexed for vector ANN search
`user`, `assistant`, `system`, `developer`, `tool_call`, `think`, `image`,


where `related` is past memories sorted based on similarity, weighted to favor more recent entries, all time stamped.
`persistent` are some memories chosen by the systems tools
and `recent` are the last n events that have been encountered in a given session.

The agent has some control over what is in recent, in that it can generate tool call blocks, emit reasoning traces, and create assistant messages
It can create system messages, and so can the user. It has partial control over this.
it can't control user messages, messages, each of which are associated with an event

The events that show up depend on what the agent is subscribed to.
The admin of the agent can hard lock events, and the system hard locks system critical events

Otherwise the agent is free to subscribe to any events it wants to, with any filters it wants to.

Our MVP cephalon will always be subscribed to these discord channels new message events:
bots
343299242963763200
duck-bots
450688080542695436
general
343179912196128792
memes
367156652140658699

Each cephalon can have multiple sessions running at once
What makes them the same cephalon, so they have the same proper name like Duck, or OpenSkull,
So each session will share that persistent state, influence, and be influenced,
other sessions, because of Eidolon.

Each of these sessions can be named, think of them like aspects of the cephalons consciousness
you could choose to model the Id, the Ego, and the Super Ego, if you wanted to. give the ego all the tools to send messages, and etc prompt away.

Each session is different, but they are much more related to each other than in other LLM agent systems.

We ideally have many tiny baby models running various facets of an inteligence we are creating.


#### Eidolon

[[promethean/docs/design/overview.md]]

These are meta-semantic agents
categorizing concepts by working as a hive mind to move representations of them in various idea spaces
in ways that are statistically meaningful.

As a nexus floats through this space, and these agents interact with it, it will cause events that sentinels will respond to
and cephalon can observe and indirectly interact with by taking "real world actions" based on their observations of how
these agents have organzied this simulation
over the course of their operation to integrate into their decisions if they feel like they need to.

Nexus, meta-physical semantic representations of memories and resources.
Eidolon is how the cephalon accesses semantic search.

When texts are added to Eidolon (all memories are added as soon as they are created)


### Sentinel

Contract driven agent, tied to an event loop.
It begins when a condition is met, usually an event has occurred.
It ends when a condition is met.

#### Olympia
This is a benchmarking run time.
Over time we collect data about models solutions to benchmarks in olympia,
and we create new labeled training data to create new models to meet more specific needs.

##### FUTURE
It can also accept and create Linear A traces.
#lineara

## Example workflow

I place sentinels in folders that are way points in the graph
sentinels are agents who respond to predefined events
a file changes
a timer goes off
a message is recieved


## `docs/notes`

Let's start from where I dump all of my notes. My planning log.

A sentinel is defined to watch `docs/notes` (where I have emacs macros to quickly dump notes like this one with a dated name.)
It's tasked with categorizing the notes with front-matter tags, adding a title, slug (to use for a file or url name), a description.

The sentinel is defined with an input, and an output schema.
It's input is a markdown file in `docs/notes`
it's output is the original note with frontmatter fields:
-  `tags` is a list of strings that obsidian treats the same as #tags
- `description` is a summary of the document
- `title` A natural language title that clearly describes the document
- `slug` A string to in file names, urls, database entries, etc

A sentinel is retried until the desired output state is reached

Once this first sentinel is run successfully and met it's contract,
another event is triggered for a new sentinel with a different contract.

This document is now initially tagged, so it can be integrated into Eidolon.


`tagged_at` is given now's timestamp automatically after the agent is done.

