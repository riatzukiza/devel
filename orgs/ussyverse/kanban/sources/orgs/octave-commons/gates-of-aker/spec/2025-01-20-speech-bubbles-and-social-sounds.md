# Speech Bubbles and Social Sounds Implementation

## Overview
Added visual speech bubbles and audio feedback when agents socialize in the simulation.

## Backend Changes

### backend/src/fantasia/sim/tick/core.clj
- Modified `talk-step` reducer to collect social interactions from each pair
- Added `:social-interactions` to track and return all interactions that occurred during a tick
- Updated `tick-once` return value to include social interactions in output

### backend/src/fantasia/server.clj
- Modified `start-runner!` to broadcast social interaction events during auto-run
- Modified manual tick handler to broadcast social interaction events
- Broadcasts `{:op "social_interaction" :data interaction}` for each social interaction

## Frontend Changes

### web/src/App.tsx
- Added `SpeechBubble` type with agentId, text, interactionType, and timestamp
- Added `speechBubbles` state to track active speech bubbles
- Added cleanup effect to remove bubbles older than 3 seconds (checks every 500ms)
- Added `SOCIAL_TONE_SEQUENCES` mapping interaction types to tone sequences:
  - Small talk: [0, 2, 4]
  - Gossip: [1, 3, 5]
  - Debate: [4, 2, 0, 2, 4]
  - Ritual: [0, 2, 4, 2, 0]
  - Teaching: [2, 4, 2]
- Added `handleSocialSound` callback to play tone sequences for interactions
- Added handler for `social_interaction` WebSocket messages
- Clears speech bubbles on simulation reset

### web/src/components/SimulationCanvas.tsx
- Added `SpeechBubble` type to props
- Added `speechBubbles` prop to component interface
- Implemented `drawSpeechBubble` function:
  - Renders rounded rectangle with text above agent position
  - Includes small tail pointing down to agent
  - Fades out over 3 seconds based on bubble age
  - Scales text size based on zoom level
- Integrated speech bubble rendering into agent draw loop

## Features

### Speech Bubbles
- Display interaction type name above agents during socialization
- Last 3 seconds before fading out
- Both agents in conversation show bubbles
- Bubbles are cleaned up automatically

### Audio Feedback
- Different tone sequences for each interaction type
- Small talk: Gentle rising tones
- Gossip: Mid-range playful tones
- Debate: Sharp, back-and-forth tones
- Ritual: ceremonial, ascending-descending pattern
- Teaching: Learning-oriented pattern
- Sound plays immediately when social interaction occurs

## Usage

When agents socialize (automatically when in proximity):
1. Backend detects social interaction
2. WebSocket sends `social_interaction` message
3. Frontend plays appropriate tone sequence
4. Speech bubbles appear above both agents
5. Bubbles fade out after 3 seconds

## Testing

- Backend code compiles successfully
- Frontend builds successfully
- Speech bubble rendering integrated into agent display loop
- Audio system integrated with existing tone sequence infrastructure
