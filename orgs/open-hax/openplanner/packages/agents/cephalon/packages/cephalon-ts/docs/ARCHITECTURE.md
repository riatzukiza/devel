# Cephalon Architecture

**Version**: 1.0.0
**Status**: Draft
**Sources**: Synthesized from notes on message queue design, SIGINT perception layer, categorical loop formalization, and compositional pipeline.

---

## Overview

A Cephalon is a **recurrent functorial system** that maps perceived structure into action structure. It is not "a chatbot with memory" but a governed cognitive architecture with constitutional constraints, message queues, and differentiated role circuits.

```
J ───→ C ───→ A ───→ J'
↑                │
└────────────────┘
```

Where:
- **J** = Input/Perception category (what the system can recognize)
- **C** = Cognition category (internal semantic and normative transformations)
- **A** = Action category (enacted outputs and world-effects)
- **J'** = Altered perception field (how actions reshape what others experience)

---

## Core Loop

The operative cephalon loop is the composite:

```
L = E ∘ P : J → A
```

Where `P : J → C` is the **perception functor** and `E : C → A` is the **enactment functor**.

With feedback `F : A → J` (world-update functor), the full recurrent system becomes:

```
J ─→ P ─→ C ─→ E ─→ A ─→ F ─→ J
```

---

## Eta-Mu-Pi Mapping

The philosophical symbols map to category regions:

| Symbol | Region | Meaning |
|--------|--------|---------|
| **η** | Incoming region of J | Unresolved inputs, anomalies, pressures, signals that affect the system before stabilization |
| **μ** | Distinguished substructure of C | Embodied policy, demonstrated but not fully verbalized knowledge, constitutional commitments |
| **Π** | Image of L in A | Actual consequences of acting under μ, outputs that alter the η present in other agents |

The symbolic loop:

```
η ─→ μ ─→ Π ─→ η'
```

Where η' is the newly altered field of what others now feel but may not yet understand.

---

## Role Architecture

Cephalons are differentiated by factoring P, E, or subcategories of C.

### Duck (Senior Synthesizer)

- Long memory, historical continuity
- Final operational framing
- Stabilization and command functor
- Emphasizes synthesis from C into high-level action schemas in A

### Openhax (Explorer/Collector)

- Outward-facing perception
- Expands J by collecting novel external structure before interpretation
- Perception functor emphasis

### Openskull (Adversarial Analyst)

- Skepticism and red-team pressure
- Endofunctor on C that stress-tests internal mappings before enactment
- Looks for contradictions, threat patterns, failure modes

### Morality Layer (Circuit 4)

- Manages system prompts across all circuits
- Endofunctor `M : C → C` that rewrites or constrains internal norms
- Reads competing prompt suggestions and adjudicates based on constitution

---

## Message Queue Design

Each circuit (except C3) submits messages to an append-only queue. C3 acts as the **filter and information integrator**.

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Circuit │    │ Circuit │    │ Circuit │
│   C1    │    │   C2    │    │   C5    │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┼──────────────┘
                    ▼
              ┌──────────┐
              │  Queue   │
              └────┬─────┘
                   ▼
              ┌──────────┐
              │ C3 Eval  │
              │ (filter) │
              └────┬─────┘
                   ▼
              ┌──────────┐
              │ Speaker  │
              └──────────┘
```

### Queue Types

1. **Message Queue** - All circuits submit, C3 synthesizes
2. **Prompt Queue** - Circuits submit suggested system prompts, C4 adjudicates

### C3 Responsibilities

- Grab multiple messages at once
- Decide sequence of output
- Filter and integrate information
- Prevent contradictory messages from being spoken simultaneously

### C4 Responsibilities

- Read competing prompt suggestions
- Adjudicate based on constitutional constraints
- Update system prompts for other circuits

---

## SIGINT Perception Layer

The perception layer feeds the model council with changing world-state. It is **not** the cephalons themselves—it is their sensory apparatus.

### Dashboard Panes

| Pane | Purpose |
|------|---------|
| **Collection** | Raw observations from scans, feeds, environmental telemetry |
| **Fusion** | Deduplicated entities, relationships, anomalies, time-series changes |
| **Council** | What Duck, Openhax, Openskull currently think is happening |
| **Constitution** | Which rules/priorities are governing interpretation and response |

### Role Split

- **Duck**: History and command
- **Openhax**: Exploration and collection
- **Openskull**: Skepticism and red-team pressure

---

## Constitutional Layer

Philosophy lives at the constitutional layer, not as a vibe improvised differently by each bot. The constitution governs:

1. What counts as valid perception vs noise
2. What transformations are lawful in C
3. What actions are permissible in A
4. How competing concerns are adjudicated

### Meaningful Human Control

Automation can do sensing and preparation, but humans own the button on consequential decisions.

---

## TypeScript Interface Sketch

```typescript
// Categories
type Perception = J;   // Input: SignalEvent, Anomaly, Observation
type Cognition = C;   // Internal: Belief, Norm, Plan, Identity
type Action = A;       // Output: Message, Update, Intervention

// Functors
interface PerceptionFunctor {
  apply(input: Perception): Cognition;
}

interface EnactmentFunctor {
  apply(state: Cognition): Action[];
}

interface FeedbackFunctor {
  apply(actions: Action[]): Perception;
}

// Cephalon Loop
interface CephalonLoop {
  perception: PerceptionFunctor;
  enactment: EnactmentFunctor;
  feedback: FeedbackFunctor;
  
  // Recurrent execution
  tick(input: Perception): Action[];
}

// Queue Interface
interface MessageQueue {
  submit(circuit: number, message: Message): void;
  drain(): Message[];
}

interface PromptQueue {
  suggest(circuit: number, prompt: PromptSuggestion): void;
  adjudicate(): SystemPrompt;
}
```

---

## Verification Criteria

A cephalon is verified when:

1. **Loop closure**: The system can complete `J → C → A → J'` cycles
2. **Differentiation**: Distinct circuits produce measurably different outputs
3. **Constitutional compliance**: Actions pass constitutional constraint checks
4. **Non-self-reference**: The system does not stall in self-referential loops
5. **World-update**: Actions produce observable changes in J

---

## References

- `research/cephalon-loop-diagram-functor.md` - Categorical formalization
- `research/cephalon-loop-compositional-pipeline.md` - J→C→A pipeline
- `dev/cephalon-message-queue-design.md` - Queue coordination design
- `dev/sigint-perception-layer-cephalons.md` - SIGINT perception layer