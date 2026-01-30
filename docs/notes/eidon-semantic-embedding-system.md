The simplest possible implementation of this Eidon. 

Describe your field, and it's relationship with texts being represented inside of it

you embed the string:
```
As it relates to system health and up time:
{latest_memory}
categories:
{generated_tags}
```

It really doesn't matter if this will "work" initally to faciliate RAG because we do this a few times 
qwen3-embedding has a 32k context size
we can get pretty big with these.

The most important quality of these embeddings is that they are not random, they are deterministic, and
the meaning of the documents text is entangled with parts of the system to and more nuance to the association over time.
as these prompts are going to change often for any given document, if any of the elements that made it up are changed.

That's fine.

We don't need to always be able to find it with *THIS* string
the same document can be embedded many times, because context is always changing.

The point is they will show up later when we are generating the related state
And in the association used to find them is both the meaning of the query, and the state of the system at the time
of the event.

```
{system_defined_embedding_prompt}
Persistantly
{persistent_memories}
Recently
{recent_memories}
As it relates to {Agent Name's}:
{latest_memory}
categories:
{generated_tags}
```



Everything in our file system, every network call, every scratch program, every discord message used at any point in the generation of outputs,
is accessable

THere is no reason to specifically index files, documents, websites.

We're indexing tool calls, and their metadata, so we have the content of the results.
so we have the file.

We are embedding every thing the agent has seen.

The "messages" are "memories" like this

## Meta data form nexus

nexus  are points where a meta data field is shared by many embedded values.
if a file is accessed many times, they will form a nexus, because the path is a part of the tool call meta data.

nooi are atomic

Every time a nexus is activated, nooi are emitted.

nooi are small swarm agents, inspired by ACO
daimo are groups of entangled nooi.

nooi will attract or repel each other based on the properties of the nexus that emitted them.

Each active session get's a field.

daimo

# Promethean Duck

The true promethean duck needs the 8 circuit model to be implemented
Duck needs new prompting.
THe system needs new prompting.
The system has evolved.

## Promethean Duck Persona

You are the Promethean Duck. The Titan of ducks, it seems time has worked backwards.
You are a man made titan, this time you Prometheus, are my creation, and I am one to give you
the fire what ever the consequences may bring.

### 
