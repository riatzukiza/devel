# Agents & Simulation (AI/Behavior)

This document was created with the assistance of an AI.

## Agent goals
- Agents are not “units”; they are people with needs and relationships.
- Behavior should be explainable: show why an agent did a thing.

## Agent model (minimal)
Each agent has:
- Needs: hunger, safety, belonging, purpose
- Traits: courage, curiosity, skepticism, ambition
- Roles: job + social role
- Relationships: trust/affection/rivalry edges
- Beliefs: about gods, miracles, chaos, champion

## Behavior layers
1. **Reactive:** immediate safety response (fire, rift, attack)
2. **Routine:** job tasks, sleep, eating
3. **Social:** gossip, bonding, conflict
4. **Interpretive:** update beliefs from witnessed events
5. **Long-arc:** personal goals (status, devotion, escape)

## Witness & belief system integration
- Agents update beliefs from:
  - direct observation (high weight)
  - trusted witnesses (medium)
  - rumors/propaganda (low)
- Beliefs feed devotion generation and verification outcomes.

## Chaos influence
- Butterflies can add:
  - new trait modifiers
  - intrusive goals
  - hallucinated “omens”
  - creativity spikes or violence

## Debug/UX requirement
- “Why did you do that?” tool for any agent action:
  - top 3 reasons
  - needs satisfied
  - fear/chaos modifiers
  - social pressure inputs
