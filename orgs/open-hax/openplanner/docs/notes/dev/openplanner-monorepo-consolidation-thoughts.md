---
original_name: "2026.04.17.10.48.12.md"
title: "OpenPlanner Monorepo Consolidation Thoughts"
summary: "Captures thoughts on consolidating OpenPlanner-related packages, graph-weaver, eros, and cephalon runtime dependencies."
category: "dev"
created: "2026-04-17"
---

but we're talking about openplanner.
the monorepo stuff in here was kinda hacked on at the end.
I wanted to get everything into one place because,
especially the graph weaver, and eros stuff,
agents were having a hard time understanding that they were
all related to openplanner.

I've moved these locally after thinkin about it cause a majority
of the packages were just... old dependencies to the cephalon,
which is probably getting rewritten

The cephalon runtime is what we ultimately want to be calling
the thing that is driving the agents in knoxx.

Bunch of that's already cljs.

openplanner should probably be pulled into packages/ properly? I'm not sure..
I don't like that it's got a root level src/ then the stuff that depends on it,
are all packages....

These are the most likely useful things:
  /home/err/devel/orgs/open-hax/openplanner/packages:
  drwxrwxr-x 22 err err 4096 Apr 17 11:10   .
  drwxrwxr-x 14 err err 4096 Apr 17 10:42   ..
  drwxrwxr-x  6 err err 4096 Apr 13 15:24   cephalon
  drwxrwxr-x  7 err err 4096 Apr 12 22:41   circuits-octave
* drwxrwxr-x  4 err err 4096 Apr 14 15:49   embedding
  drwxrwxr-x  5 err err 4096 Apr 14 15:49   eros-eris-field
  drwxrwxr-x  5 err err 4096 Apr 14 15:49   eros-eris-field-app
* drwxrwxr-x  4 err err 4096 Apr 17 11:10   event
  drwxrwxr-x  9 err err 4096 Apr 13 15:48   graph-weaver
  drwxrwxr-x  9 err err 4096 Apr 13 15:48   graph-weaver-aco
  drwxrwxr-x 13 err err 4096 Apr 17 09:46   knoxx
  drwxrwxr-x  7 err err 4096 Apr 14 15:49   myrmex
* drwxrwxr-x  6 err err 4096 Apr 13 15:24   persistence
  drwxrwxr-x  7 err err 4096 Apr 12 22:41   personality-system
  drwxrwxr-x  6 err err 4096 Apr 13 15:24   reconstituter
* drwxrwxr-x  5 err err 4096 Apr 17 10:42   semantic-graph-builder
  drwxrwxr-x  3 err err 4096 Apr  9 18:39   signal-contracts
  drwxrwxr-x  3 err err 4096 Apr  9 18:39   signal-radar-core
  drwxrwxr-x  5 err err 4096 Apr 14 15:49   sintel
  drwxrwxr-x 15 err err 4096 Apr 15 10:42   uxx
  drwxrwxr-x 12 err err 4096 Apr 13 19:50   vexx
  drwxrwxr-x  5 err err 4096 Apr 14 15:49   webgl-graph-view

---
These are mostly for code archeology, artifacts, pseudo code, ideas, scrap paper, all related to what we're don at som level or another. The kinds of things that get written when you are thinking about something for years, you're only one person, and it's a really big  idea.

  /home/err/devel/orgs/open-hax/openplanner/pseudo:
  drwxrwxr-x 16 err err 4096 Apr 17 11:10   .
  drwxrwxr-x 14 err err 4096 Apr 17 10:42   ..
  drwxrwxr-x  4 err err 4096 Apr 14 15:49   aether
  drwxrwxr-x  8 err err 4096 Apr 13 15:48   clients
  drwxrwxr-x  4 err err 4096 Apr 13 15:24   graph-runtime
  drwxrwxr-x  5 err err 4096 Apr 14 15:49   janus
  drwxrwxr-x  4 err err 4096 Apr 14 15:49   logger
  drwxrwxr-x 10 err err 4096 Apr 13 15:24   mcp-fs-oauth
  drwxrwxr-x  4 err err 4096 Apr 14 15:49   mcp-oauth
  drwxrwxr-x  2 err err 4096 Apr  9 18:46   ollama-queue
  drwxrwxr-x  8 err err 4096 Apr 14 15:49   opencode-cljs-client
  drwxrwxr-x  2 err err 4096 Apr  9 18:46   opencode-interface-plugin
  drwxrwxr-x  8 err err 4096 Apr 13 15:24   opencode-openplanner-plugin-cljs
  drwxrwxr-x  7 err err 4096 Apr 14 15:49   openplanner-cljs-client
  drwxrwxr-x  4 err err 4096 Apr 14 15:49   test-utils
  drwxrwxr-x 19 err err 4096 Apr 17 10:42   workbench

---

The project still installs, it might not build...
but the workspace dependencies are all found.

I was thinking about tryin to group the sub packages?
Like we have graph stuff:

eros-eris-field
eros-eris-field-app
graph-weaver
graph-weaver-aco
knoxx
myrmex
webgl-graph-view

the cephalon stuff was... it gave me a lot of ideas but the code is way all over
the place. When I make discord bots like these ones, I'm usually reaching for
a form of creative catharsis so the results matter more than the quality.

I know the cephalon works, but the quality of it's code is a different question... I dug into it, and the event and embeddings packages were dependencies of cephalon

It fits somewhere between production ready, and pseudo code.
We might call this experimental.

cephalon
circuits-octave
personality-system
embedding
event

---

All of the opencode stuff is to be considered pseudo code, ideas,
thoughts, notes.
scraps of paper I had to make to come up with the openplanner/knoxx/eta-mu
idea as it stands right now

opencode-cljs-client
opencode-interface-plugin
opencode-openplanner-plugin-cljs
clients

---
The reconsituter is maybe a solid idea,  I originally created openplanner *for that* but I've not looked at it since.

---

These are probably duplicated from another monorepo I set up around mcp servers?
mcp-fs-oauth
mcp-oauth

These are both represented here, and probably belong here:
https://github.com/open-hax/tooloxx

---

signal-contracts
signal-radar-core
sintel

These guys were from a phase I had right after the war with Iran started, I was noticing strange user behavior patterns, high levels of bot activities, and just some bad vibes stuff so I went to thinking how I could get real actionable signals, instead of letting myself get freaked out over feelings.

---

uxx

This one probably shouldn't be in here. It's a general purpose style library that stands on it's own.
It got pulled in during the spring because I was just tryin to make openplanner and knoxx work.

but other packages use it that are not a part of the openplanner monorepo:
https://github.com/open-hax/uxx
https://www.npmjs.com/package/@open-hax/uxx

I got the NPM package up to date so I could just use it from there.

I should get the github and the NPM connected, someone told me that it turns people away from an NPM package if there isn't a github link.

---

So what am I even trying to say...

Right, I wanted to break down the packages that we keep into categories. I was thinking about...

- packages/
    - graph/
    - agents
      - cephalon
      - circuits-octave
      - personality-system
      - embedding
      - knoxx
    - signals/
      - signal-contracts
      - signal-radar-core
      - sintel
      - event

- pseudo/
  - opencode/
    - opencode-cljs-client
    - opencode-interface-plugin
    - opencode-openplanner-plugin-cljs
    - clients
