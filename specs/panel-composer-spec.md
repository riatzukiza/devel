# Panel Composer — Extraction Spec

> *Every presence deserves a window. The panel composer arranges them.*

---

## Purpose

Extract the Panel Composition System from `fork_tales/frontend/src/app/worldPanelLayout.ts` and `frontend/src/components/Panels/` into `packages/panel-composer/` — a React/TypeScript library for composing draggable, dockable, floating panels in a shared workspace.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                     PANEL WORKSPACE                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    WORLD CANVAS                      │    │
│  │                                                      │    │
│  │   ┌─────────┐                    ┌─────────────┐    │    │
│  │   │ Panel A │                    │   Panel B   │    │    │
│  │   │ (pinned)│                    │  (floating) │    │    │
│  │   └─────────┘                    └─────────────┘    │    │
│  │                                                      │    │
│  │        ┌───────────────────┐                        │    │
│  │        │     Panel C       │                        │    │
│  │        │    (docked)        │                        │    │
│  │        └───────────────────┘                        │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Panel States:                                               │
│  - Pinned: Fixed to anchor point                            │
│  - Floating: Free position, draggable                       │
│  - Docked: Attached to edge/corner                          │
│  - Minimized: Collapsed to title bar                        │
└─────────────────────────────────────────────────────────────┘
```

**Panel ≠ Window.** A panel is a self-contained view with:
- A connection to a presence or substrate service
- Its own state (scroll position, filters, etc.)
- Ability to be arranged in the workspace

**Workspace = Canvas + Panels.** The workspace holds the simulation canvas (or other visual field) and panels are arranged around/over it.

---

## Source Vault Contracts

### `frontend/src/app/worldPanelLayout.ts` — Layout Primitives

```typescript
export const PANEL_ANCHOR_PRESETS = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 1, y: 0 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-right": { x: 1, y: 1 },
  "center": { x: 0.5, y: 0.5 },
};

export interface WorldPanelLayoutEntry {
  id: string;
  anchor: { x: number; y: number };
  size: { width: number; height: number };
  preferredSide: "left" | "right" | "top" | "bottom";
  state: "pinned" | "floating" | "docked" | "minimized";
  zIndex: number;
}

export function panelSizeForWorld(panel: WorldPanelLayoutEntry): { width: number; height: number } {
  // Calculate panel size based on world dimensions
}

export function overlapAmount(a: WorldPanelLayoutEntry, b: WorldPanelLayoutEntry): number {
  // Calculate overlap between two panels
}
```

### `frontend/src/app/appShellTypes.ts` — Panel Types

```typescript
export interface RankedPanel {
  id: string;
  label: string;
  priority: number;  // Higher = more important
  visible: boolean;
  minimized: boolean;
  width?: number;
  height?: number;
}

export interface OverlayApi {
  show(component: ReactNode): void;
  hide(): void;
  position: { x: number; y: number };
}

export type PanelPreferredSide = "left" | "right" | "top" | "bottom" | "center";
```

### `frontend/src/components/Panels/*.tsx` — Panel Components

```typescript
// ThreatRadarPanel.tsx
export function ThreatRadarPanel({ state }: { state: ThreatRadarState }) { /* ... */ }

// WebGraphWeaverPanel.tsx
export function WebGraphWeaverPanel({ graph }: { graph: KnowledgeGraph }) { /* ... */ }

// MusePresencePanel.tsx
export function MusePresencePanel({ muse }: { muse: Muse }) { /* ... */ }

// DaimoiPresencePanel.tsx
export function DaimoiPresencePanel({ presence }: { presence: Presence }) { /* ... */ }

// Catalog.tsx
export function Catalog({ items }: { items: CatalogItem[] }) { /* ... */ }

// Chat.tsx
export function Chat({ messages }: { messages: ChatMessage[] }) { /* ... */ }
```

---

## Extracted Package Structure

```
packages/panel-composer/
├── src/
│   ├── index.ts               # Public API
│   ├── layout.ts              # Layout primitives
│   ├── panel.ts               # Core panel type
│   ├── workspace.ts           # Workspace container
│   ├── overlay.ts             # Shared overlay surface
│   ├── drag.ts                # Drag handling
│   ├── dock.ts               # Docking logic
│   ├── pin.ts                 # Pinning logic
│   ├── minimize.ts            # Minimize/restore
│   ├── z-index.ts            # Z-index management
│   ├── panels/                # Panel component registry
│   │   ├── index.ts
│   │   ├── PresencePanel.tsx
│   │   ├── CatalogPanel.tsx
│   │   └── ChatPanel.tsx
│   └── types.ts               # Type definitions
├── test/
│   ├── layout.test.ts
│   ├── panel.test.ts
│   └── workspace.test.tsx
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types

### `types.ts`

```typescript
export type PanelState = "pinned" | "floating" | "docked" | "minimized";

export type PanelAnchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "custom";

export type PanelPreferredSide = "left" | "right" | "top" | "bottom" | "center";

export interface PanelPosition {
  x: number;      // 0.0 - 1.0 normalized
  y: number;      // 0.0 - 1.0 normalized
}

export interface PanelSize {
  width: number;   // Pixels or percentage
  height: number;  // Pixels or percentage
}

export interface Panel {
  id: string;                  // Unique panel ID
  label: string;               // Display name
  kind: string;                // Panel type (e.g., "threat-radar")
  anchor: PanelAnchor;         // Anchor preset or custom
  position: PanelPosition;     // Current position
  size: PanelSize;             // Current size
  preferredSide: PanelPreferredSide;
  state: PanelState;
  zIndex: number;              // Stacking order
  visible: boolean;
  minimized: boolean;
  data?: unknown;              // Panel-specific data
}

export interface PanelLayout {
  panels: Map<string, Panel>;
  worldBounds: { width: number; height: number };
  activePanelId?: string;
}

export interface OverlayApi {
  show(component: React.ReactNode): void;
  hide(): void;
  position: PanelPosition;
}
```

### `layout.ts`

```typescript
export const ANCHOR_PRESETS: Record<PanelAnchor, PanelPosition> = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 1, y: 0 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-right": { x: 1, y: 1 },
  "center": { x: 0.5, y: 0.5 },
  "custom": { x: 0.5, y: 0.5 },
};

export function calculatePanelSize(
  panel: Panel,
  worldBounds: { width: number; height: number }
): PanelSize {
  if (panel.state === "minimized") {
    return { width: 200, height: 32 }; // Title bar only
  }

  // Scale based on world size
  const baseWidth = panel.size.width || 400;
  const baseHeight = panel.size.height || 300;

  return {
    width: Math.min(baseWidth, worldBounds.width * 0.4),
    height: Math.min(baseHeight, worldBounds.height * 0.5),
  };
}

export function calculateOverlap(
  a: Panel,
  b: Panel
): number {
  const ax1 = a.position.x;
  const ax2 = a.position.x + a.size.width;
  const ay1 = a.position.y;
  const ay2 = a.position.y + a.size.height;

  const bx1 = b.position.x;
  const bx2 = b.position.x + b.size.width;
  const by1 = b.position.y;
  const by2 = b.position.y + b.size.height;

  const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
  const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));

  return overlapX * overlapY;
}

export function resolveZIndex(panelId: string, layout: PanelLayout): number {
  const panel = layout.panels.get(panelId);
  if (!panel) return 0;

  // Higher z-index for active panel
  if (layout.activePanelId === panelId) {
    return 100;
  }

  // Base z-index from panel order
  return panel.zIndex;
}
```

### `panel.ts`

```typescript
import type { Panel, PanelState, PanelAnchor, PanelPosition } from "./types";

export interface PanelManager {
  create(config: Partial<Panel>): Panel;
  update(id: string, updates: Partial<Panel>): Panel;
  remove(id: string): void;
  get(id: string): Panel | undefined;
  list(): Panel[];
  bringToFront(id: string): void;
}

export function createPanel(config: Partial<Panel>): Panel {
  return {
    id: config.id || `panel-${Date.now()}`,
    label: config.label || "Untitled",
    kind: config.kind || "generic",
    anchor: config.anchor || "custom",
    position: config.position || { x: 0.5, y: 0.5 },
    size: config.size || { width: 400, height: 300 },
    preferredSide: config.preferredSide || "center",
    state: config.state || "floating",
    zIndex: config.zIndex || 1,
    visible: config.visible ?? true,
    minimized: config.minimized ?? false,
    data: config.data,
  };
}

export function updatePanel(panel: Panel, updates: Partial<Panel>): Panel {
  return { ...panel, ...updates };
}

export function pinPanel(panel: Panel, anchor: PanelAnchor): Panel {
  return { ...panel, anchor, state: "pinned" };
}

export function floatPanel(panel: Panel, position: PanelPosition): Panel {
  return { ...panel, position, state: "floating" };
}

export function dockPanel(panel: Panel, side: PanelPreferredSide): Panel {
  return { ...panel, preferredSide: side, state: "docked" };
}

export function minimizePanel(panel: Panel): Panel {
  return { ...panel, minimized: true, state: "minimized" };
}

export function restorePanel(panel: Panel): Panel {
  return { ...panel, minimized: false, state: panel.state || "floating" };
}
```

### `workspace.ts`

```typescript
import type { Panel, PanelLayout } from "./types";

export interface Workspace {
  layout: PanelLayout;
  addPanel(panel: Panel): void;
  removePanel(id: string): void;
  updatePanel(id: string, updates: Partial<Panel>): void;
  bringToFront(id: string): void;
  resize(worldBounds: { width: number; height: number }): void;
  getVisiblePanels(): Panel[];
  getActivePanel(): Panel | undefined;
}

export function createWorkspace(): Workspace {
  const layout: PanelLayout = {
    panels: new Map(),
    worldBounds: { width: 1920, height: 1080 },
  };

  return {
    layout,

    addPanel(panel: Panel): void {
      layout.panels.set(panel.id, panel);
    },

    removePanel(id: string): void {
      layout.panels.delete(id);
    },

    updatePanel(id: string, updates: Partial<Panel>): void {
      const panel = layout.panels.get(id);
      if (panel) {
        layout.panels.set(id, { ...panel, ...updates });
      }
    },

    bringToFront(id: string): void {
      const maxZ = Math.max(...[...layout.panels.values()].map(p => p.zIndex));
      this.updatePanel(id, { zIndex: maxZ + 1 });
      layout.activePanelId = id;
    },

    resize(worldBounds: { width: number; height: number }): void {
      layout.worldBounds = worldBounds;
    },

    getVisiblePanels(): Panel[] {
      return [...layout.panels.values()].filter(p => p.visible && !p.minimized);
    },

    getActivePanel(): Panel | undefined {
      if (!layout.activePanelId) return undefined;
      return layout.panels.get(layout.activePanelId);
    },
  };
}
```

---

## React Components

### `WorkspaceContainer.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { Panel, Workspace } from "./types";
import { createWorkspace } from "./workspace";

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace] = useState(() => createWorkspace());

  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return workspace;
}

export function WorkspaceContainer({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="workspace">
        {children}
      </div>
    </WorkspaceProvider>
  );
}
```

### `PanelComponent.tsx`

```tsx
import React, { useRef, useState } from "react";
import type { Panel } from "./types";
import { useWorkspace } from "./WorkspaceContainer";

interface PanelProps {
  panel: Panel;
  children: React.ReactNode;
}

export function PanelComponent({ panel, children }: PanelProps) {
  const workspace = useWorkspace();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panel.state === "pinned" || panel.state === "docked") return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    workspace.bringToFront(panel.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    workspace.updatePanel(panel.id, {
      position: {
        x: panel.position.x + dx / workspace.layout.worldBounds.width,
        y: panel.position.y + dy / workspace.layout.worldBounds.height,
      },
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`panel panel--${panel.state}`}
      style={{
        left: `${panel.position.x * 100}%`,
        top: `${panel.position.y * 100}%`,
        width: panel.size.width,
        height: panel.minimized ? 32 : panel.size.height,
        zIndex: panel.zIndex,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="panel__header">
        <span className="panel__label">{panel.label}</span>
        <div className="panel__controls">
          <button onClick={() => workspace.updatePanel(panel.id, { minimized: !panel.minimized })}>
            {panel.minimized ? "Restore" : "Minimize"}
          </button>
          <button onClick={() => workspace.removePanel(panel.id)}>Close</button>
        </div>
      </div>
      {!panel.minimized && <div className="panel__content">{children}</div>}
    </div>
  );
}
```

---

## Integration Points

### Presence Core Integration

```tsx
import { PresencePanel } from "@workspace/panel-composer";
import { Presence } from "@workspace/presence-core";

function PresencePanelAdapter({ presence }: { presence: Presence }) {
  return (
    <PresencePanel
      panel={{
        id: `presence-${presence.id}`,
        label: presence.label.en,
        kind: "presence",
        // ...
      }}
    >
      <PresenceContent presence={presence} />
    </PresencePanel>
  );
}
```

### Threat Radar Integration

```tsx
import { PanelComponent } from "@workspace/panel-composer";
import { ThreatRadarState } from "@workspace/radar-core";

function ThreatRadarPanelComponent({ state }: { state: ThreatRadarState }) {
  return (
    <PanelComponent
      panel={{
        id: "threat-radar",
        label: "Threat Radar",
        kind: "threat-radar",
        preferredSide: "right",
      }}
    >
      <ThreatRadarView state={state} />
    </PanelComponent>
  );
}
```

---

## Tests

```typescript
// test/layout.test.ts
describe("Panel Layout", () => {
  it("calculates panel size based on world bounds", () => {
    const panel = createPanel({ size: { width: 400, height: 300 } });
    const size = calculatePanelSize(panel, { width: 1920, height: 1080 });
    expect(size.width).toBe(400);
    expect(size.height).toBe(300);
  });

  it("calculates overlap between panels", () => {
    const a = createPanel({
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });
    const b = createPanel({
      position: { x: 50, y: 50 },
      size: { width: 100, height: 100 },
    });
    expect(calculateOverlap(a, b)).toBe(50 * 50); // 2500 overlap
  });

  it("resolves z-index for active panel", () => {
    const workspace = createWorkspace();
    workspace.addPanel(createPanel({ id: "a", zIndex: 1 }));
    workspace.addPanel(createPanel({ id: "b", zIndex: 2 }));
    workspace.bringToFront("a");
    const zIndex = resolveZIndex("a", workspace.layout);
    expect(zIndex).toBe(100); // Active panel
  });
});

// test/panel.test.ts
describe("Panel Actions", () => {
  it("pins panel to anchor", () => {
    const panel = createPanel({ state: "floating" });
    const pinned = pinPanel(panel, "top-left");
    expect(pinned.state).toBe("pinned");
    expect(pinned.anchor).toBe("top-left");
  });

  it("minimizes and restores panel", () => {
    const panel = createPanel();
    const minimized = minimizePanel(panel);
    expect(minimized.minimized).toBe(true);
    const restored = restorePanel(minimized);
    expect(restored.minimized).toBe(false);
  });
});
```

---

## Migration Steps

1. **Create package structure** (`packages/panel-composer/`)
2. **Extract types** from vault TypeScript
3. **Implement layout primitives** (anchor, overlap, z-index)
4. **Implement panel actions** (pin, float, dock, minimize)
5. **Implement workspace container** (React context)
6. **Implement panel component** (drag/drop, resize)
7. **Write tests** for layout and panel logic
8. **Create reference panels** for radar-core and presence-core

---

## Dependencies

- `react` — UI framework
- `react-dnd` (optional) — Drag and drop
- `@workspace/utils` — Shared utilities

---

## Source Anchors

| Concept | Vault File | Extracted Concept |
|---------|------------|-------------------|
| Panel layout | `worldPanelLayout.ts` | `layout.ts` |
| Panel types | `appShellTypes.ts` | `types.ts` |
| Panel component | `Panels/*.tsx` | `panels/*.tsx` |
| Workspace | `App.tsx` (context) | `workspace.ts` |

---

## Next

All core extraction specs are complete. The eta-mu monorepo structure is defined.