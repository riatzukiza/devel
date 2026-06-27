# Synthesis: The Axxium Thread

## The Common Thread

You are building **Axxium** — a unified actor-based identity, authorization, and capability system that spans all your projects. Every note points to this extraction.

## What You Actually Want

### 1. **Centralized Identity (Axxium)**

Stop duplicating auth/identity across proxx, knoxx, and openplanner. Extract it:

```
Axxium = Actor + Authentication + Authorization + Policy + Federation
```

**Actor kinds**: `org`, `user`, `relay`, `peer`, `client`  
**Services**: proxx (relay + peer), knoxx, openplanner  
**All behind DID-based auth**

### 2. **The Actor Is The Unit of Everything**

From your code (`spec/contracts-v1.edn`):

```clojure
:actor [:map {:closed false}
        [:actor/id           :id]
        [:actor/kind         :actor-kind]      ;; :human :agent :service :cron
        [:actor/roles        [:vector :namespaced]]
        [:actor/capabilities [:vector :namespaced]]
        [:actor/status       :actor-status]]   ;; :active :suspended :retired
```

An actor is:
- **Identity** (who)
- **Capabilities** (what they can do)
- **Roles** (behavioral context)
- **State** (their memory/position)

### 3. **Kill event_agents.cljs Forever**

Your pain is clear. The current system mixes:
- Discord stuff
- Cron stuff  
- Agent stuff
- Prompt synthesis stuff

**The separation you want**:

| Concept | Responsibility | Lives In |
|---------|---------------|----------|
| **Event** | Signal emitted during action | Trigger context |
| **Trigger** | When + predicate + action + optional agent | Trigger contract |
| **Action** | Function called on actor context | Actions registry |
| **Actor** | Identity + state + valid actions/events | Actor contract |
| **Agent** | Prompt + capabilities + roles | Agent contract |

> "There should be NO event or source related fields on agent contracts. They are the responsibility of the trigger."

### 4. **Capability-Based Security (Not Ambient Authority)**

From `capability-authorization-model.md`:

> "Possession of an ActorRef is not enough. A sender must also hold a capability that authorizes the event type for that target."

**Authorization layers**:
1. **Kind policy**: what actor kinds may send/receive
2. **Capability policy**: what a particular ref/session grants
3. **Envelope policy**: extra fields required for certain events

**Key rule**: Every reject goes to the receipt river. Authorization is audit, not hidden infrastructure.

### 5. **Location-Transparent Routing**

Actors should not know if they're talking to:
- A local thread (same process)
- A remote peer (network node)

```clojure
(send! runtime from-ref to-ref event)
;; Router decides: local mailbox or wire send
```

**Address classes**:
- `:local/ephemeral`
- `:node/stable`
- `:remote/peer`

### 6. **Contract Types (Your Data Model)**

From `knoxx-contract-types-ui-design.md`:

| Contract | Purpose |
|----------|---------|
| **Action** | Function valid for actor |
| **Task** | Input shape + done condition |
| **Agent** | Prompt + capabilities + roles |
| **Actor** | Identity + permissions |
| **Trigger** | Event → Action mapping |
| **Event Source** | Schedules, system events |

**The insight**: Contract fields should directly translate to UI elements. Data-oriented programming: get the shape right, shape everything around it.

### 7. **The Receipt River (Audit Everything)**

Every action, authorization decision, capability grant, goal state change — all recorded:

```clojure
:authorization/accepted
:authorization/rejected
:capability/issued
:capability/delegated
:capability/revoked
```

## Repository Mapping

| Repo | Role in Axxium |
|------|---------------|
| **eta-mu** | Core runtime: agent loop, event envelopes, contract schemas, receipt river |
| **openplanner** | Document/translation lakes, vector search, semantic compaction, event ingestion |
| **proxx** | Main app shell, relay/peer services, stealth deployment target |
| **knoxx** | Contract management UI, translation workflows, agent audit interface |

## The Architecture You Are Building

```
┌─────────────────────────────────────────────────────────────┐
│                        AXXIUM                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Identity   │  │ Authorization │  │    Policy Engine    │ │
│  │   (DID)     │  │ (Capabilities) │  │  (Rules + Contracts) │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌─────────┐          ┌─────────┐          ┌──────────┐
   │  proxx  │◄────────►│  knoxx  │◄────────►│openplanner│
   │(relay/  │          │(contract│          │ (lakes/   │
   │  peer)   │          │   UI)   │          │  search)  │
   └─────────┘          └─────────┘          └──────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────────────┐
                    │   eta-mu        │
                    │  (runtime +     │
                    │   agent loop)   │
                    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │  Receipt River  │
                    │  (audit trail)  │
                    └─────────────────┘
```

## What You Should Do Next

1. **Extract Axxium as a separate service/repo** — start with the actor contract schema and auth layer
2. **Refactor eta-mu** to remove event/source fields from agent contracts, move to triggers
3. **Build the capability authorization middleware** — every message gets checked before delivery
4. **Unify identity** — one DID-based auth for proxx, knoxx, openplanner
5. **Make contract fields UI-generative** — data shape drives interface

## The One Sentence

**Axxium is the actor-based identity and capability layer that makes all your projects share one understanding of who can do what, audited in the receipt river, with agents and triggers cleanly separated.**
