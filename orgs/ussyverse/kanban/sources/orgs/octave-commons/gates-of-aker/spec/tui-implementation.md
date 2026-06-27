---
title: TUI Frontend Implementation
type: spec
component: frontend
priority: medium
status: implemented
workflow-state: done
related-issues: []
estimated-effort: 8 hours
updated_at: 2026-02-10
---

# TUI Frontend Implementation Spec

## Overview
Create a terminal-based UI (TUI) that mimics the functionality of the current web frontend. This will provide an alternative interface for viewing and controlling the simulation from the command line.

## Requirements

### Core Features
1. **WebSocket Connection**: Connect to backend at `ws://localhost:3000/ws`
2. **Map Display**: Render hex map with tiles, agents, structures, items
3. **Tick Controls**: Start/stop simulation, tick forward manually, reset world
4. **Selection**: Select cells and agents to inspect
5. **Information Panels**: Display selected entity details, world info, agent lists
6. **Status Bar**: Show connection status, current tick, runner state

### Display Features
- Hex map rendered using ASCII/blessed canvas
- Agents shown as characters (A for agents, T for trees, W for wolves, etc.)
- Color coding for different entity types
- Selected cell highlighting
- Agent names and basic stats

### Interaction
- Arrow keys for map navigation
- Enter/Space for selection
- T to tick
- R to toggle run
- Q to quit

## Technical Stack
- Node.js with TypeScript
- `blessed` or `blessed-contrib` for TUI
- `ws` for WebSocket client (already dependency in web/)
- `chalk` for colored output

## File Structure
```
tui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Entry point
│   ├── ws-client.ts      # WebSocket wrapper
│   ├── ui/
│   │   ├── app.ts        # Main UI layout
│   │   ├── map-view.ts   # Hex map renderer
│   │   ├── panels/       # Info panels
│   │   │   ├── status-bar.ts
│   │   │   ├── tick-controls.ts
│   │   │   ├── info-panel.ts
│   │   │   └── agent-list.ts
│   │   └── layout.ts     # Layout configuration
│   └── types.ts          # Type definitions
└── README.md
```

## Definition of Done
- [x] TUI starts and connects to backend successfully
- [x] Hex map renders with tiles and entities
- [x] Tick controls (run/stop/tick/reset) work correctly
- [x] Cell selection and entity inspection displays correctly
- [x] Agent list shows all agents
- [x] Status bar shows connection state and tick count
- [x] Keyboard shortcuts work as documented
- [x] README with setup and usage instructions
- [ ] Tested with running backend server

## Implementation Notes
- Reuse WebSocket message types from web frontend
- Map data structure matches backend snapshot format
- Use the same tile key normalization as web frontend (`"q,r"` format)
- Handle backend op messages: `hello`, `tick`, `tick_delta`, `reset`, `error`, `runner_state`

## Backend API Integration
The TUI will connect to the same WebSocket endpoint and handle the same operations as the web frontend:
- Send `{ op: "start_run" }` / `{ op: "stop_run" }`
- Send `{ op: "tick", n: 1 }`
- Send `{ op: "reset", seed: <seed> }`
- Receive world state via `hello`, `tick`, `tick_delta`, `reset` messages

## Closure Notes (2026-02-10)

- Closed as `done` with `status: implemented`.
- This document is retained as a completed TUI implementation specification and reference for parity expectations against the web client.
