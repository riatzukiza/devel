# Muse Core — Extraction Spec

> *A muse runs on behalf of a presence. It has modes, resources, and its own memory.*

---

## Purpose

Extract the Muse System from `fork_tales` into `packages/muse-core/` — an agent runtime that can operate presences, manage contexts, and coordinate with other muses.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                      MUSE RUNTIME                            │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │    Mode     │    │   Context   │    │  Resources  │      │
│  │  Strategy   │    │   Manifest  │    │   Claims    │      │
│  │             │    │             │    │             │      │
│  │ witness     │    │ pinned      │    │ GPU: 0.3    │      │
│  │ chaos       │◄──►│ search      │◄──►│ MEM: 2GB    │      │
│  │ scanner     │    │ workspace   │    │ TOK: 4096   │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                   │                   │            │
│         └───────────────────┴───────────────────┘            │
│                             │                                │
│                    ┌────────┴────────┐                       │
│                    │   PRESENCE      │                       │
│                    │   (controller)  │                       │
│                    └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Muse ≠ Presence.** A presence is a position/role. A muse is an agent *running* on that presence's behalf, with allocated resources and context.

**One presence can have many muses** (different modes for different tasks).

**One muse can serve many presences** (shared context, distributed reasoning).

---

## Source Vault Contracts

### `world_web/muse_runtime.py` — Core Runtime

```python
MUSE_RUNTIME_RECORD = "eta-mu.muse-runtime.snapshot.v1"
MUSE_EVENT_RECORD = "eta-mu.muse-event.v1"
MUSE_CONTEXT_MANIFEST_RECORD = "eta-mu.muse-context-manifest.v1"
MUSE_RESOURCE_NODE_RECORD = "eta-mu.resource-node.v1"
MUSE_DAIMON_RECORD = "eta-mu.muse-daimon.v1"
MUSE_GPU_CLAIM_RECORD = "eta-mu.muse-gpu-claim.v1"

BOOTSTRAP_MUSE_SPECS: tuple[dict[str, Any], ...] = (
    {
        "id": "witness_thread",
        "label": "Witness Thread",
        "anchor": {"x": 0.5, "y": 0.5, "zoom": 1.0, "kind": "bootstrap"},
        "role": "security",
        "description": "GitHub security analyst. Monitors PR/issue threats, CVEs, supply chain risks.",
    },
    {
        "id": "chaos",
        "label": "Chaos",
        "anchor": {"x": 0.18, "y": 0.23, "zoom": 1.0, "kind": "bootstrap"},
        "role": "geopolitical",
        "description": "Geopolitical signal analyst. Monitors global threats, maritime security, domain risks.",
    },
    {
        "id": "github_security_review",
        "label": "GitHub Threat Radar",
        "anchor": {"x": 0.82, "y": 0.5, "zoom": 1.0, "kind": "threat-radar"},
        "role": "scanner",
        "description": "Automated threat scanner. Continuous GitHub security monitoring.",
    },
)
```

**Key concepts:**
- Bootstrap specs — default muses
- Context manifest — what the muse knows
- Resource node — GPU/memory claims
- Event streaming — state changes

### `world_web/muse_mode_strategy.py` — Mode Selection

```python
def normalize_muse_runtime_mode(mode: str) -> str:
    # Modes: idle, observe, analyze, respond, forge
    ...

def select_muse_surround_rows(muse_id: str, mode: str, context: dict) -> list:
    # Select surrounding rows based on mode and context
    ...
```

### `world_web/muse_media_strategy.py` — Media Handling

```python
def build_muse_media_candidates(query: str, context: dict) -> list:
    # Build candidate media for muse to analyze

def detect_muse_media_intent(message: str) -> dict:
    # Detect if muse should process audio/image
```

### `world_web/muse_threat_fallback_strategy.py` — Fallback Routing

```python
THREAT_FOCUSED_MUSE_IDS = {"witness_thread", "chaos", "github_security_review"}

def build_muse_threat_fallback_reply(muse_id: str, threat: dict) -> str:
    # Generate fallback reply for threat-focused muses
```

---

## Extracted Package Structure

```
packages/muse-core/
├── src/
│   ├── index.ts                # Public API
│   ├── muse.ts                 # Core muse type
│   ├── mode-strategy.ts        # Mode selection
│   ├── context-manifest.ts     # Context assembly
│   ├── resource-node.ts        # GPU/memory claims
│   ├── media-strategy.ts       # Audio/image handling
│   ├── threat-fallback.ts      # Fallback routing
│   ├── bootstrap.ts            # Default muses
│   ├── event.ts                # Muse events
│   └── runtime.ts              # Runtime manager
├── test/
│   ├── muse.test.ts
│   ├── mode-strategy.test.ts
│   ├── context.test.ts
│   └── runtime.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types

### `muse.ts`

```typescript
export type MuseMode =
  | "idle"      // Waiting for input
  | "observe"   // Passive monitoring
  | "analyze"   // Active analysis
  | "respond"   // Generating output
  | "forge";    // Creating/transforming

export type MuseRole =
  | "security"      // Threat detection
  | "geopolitical"  // Global risk analysis
  | "scanner"       // Automated scanning
  | "archive"       // Knowledge storage
  | "media"         // Content processing
  | "observer";     // Passive observation

export interface MuseAnchor {
  x: number;      // 0.0 - 1.0 normalized position
  y: number;      // 0.0 - 1.0 normalized position
  zoom: number;   // Field zoom level
  kind: "bootstrap" | "threat-radar" | "user" | "system";
}

export interface Muse {
  id: string;                  // Unique muse ID
  label: string;               // Display name
  anchor: MuseAnchor;           // Field position
  role: MuseRole;              // Functional role
  description: string;          // Purpose
  presenceIds: string[];       // Which presences this muse serves
  mode: MuseMode;              // Current operating mode
  contextManifestId?: string;  // Active context
  resourceNodeId?: string;     // Allocated resources
  version: number;             // CAS version
  createdAt: string;
  updatedAt: string;
}

export interface MuseRuntimeState {
  lastStatus: "idle" | "running" | "error" | "paused";
  lastTurnId?: string;
  lastError?: string;
  lastRunAt?: string;
  nextRunMonotonic?: number;
  lastSkippedReason?: string;
}
```

### `mode-strategy.ts`

```typescript
import type { MuseMode, MuseRole } from "./muse";

export interface ModeTransition {
  from: MuseMode;
  to: MuseMode;
  trigger: string;
  conditions: string[];
}

export interface ModeStrategy {
  selectMode(muse: Muse, context: MuseContext): Promise<MuseMode>;
  transition(muse: Muse, to: MuseMode): Promise<Muse>;
  availableTransitions(muse: Muse): ModeTransition[];
}

export function normalizeMuseMode(mode: string): MuseMode {
  const normalized = mode.toLowerCase().trim();
  if (["idle", "observe", "analyze", "respond", "forge"].includes(normalized)) {
    return normalized as MuseMode;
  }
  return "idle";
}

// Role-based default modes
export const ROLE_DEFAULT_MODES: Record<MuseRole, MuseMode> = {
  security: "observe",
  geopolitical: "observe",
  scanner: "analyze",
  archive: "idle",
  media: "analyze",
  observer: "observe",
};
```

### `context-manifest.ts`

```typescript
export interface PinnedFileNode {
  id: string;
  path: string;
  relevance: number;       // 0.0 - 1.0
}

export interface MuseWorkspaceContext {
  presenceId: string;
  pinnedFileNodeIds: string[];
  searchQuery: string;
  lastActiveAt: string;
}

export interface ContextManifest {
  id: string;
  museId: string;
  workspace: MuseWorkspaceContext;
  pinnedNodes: PinnedFileNode[];
  searchHistory: string[];
  relevantConcepts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextManifestManager {
  load(museId: string): Promise<ContextManifest | null>;
  save(manifest: ContextManifest): Promise<void>;
  addPinnedNode(museId: string, node: PinnedFileNode): Promise<void>;
  removePinnedNode(museId: string, nodeId: string): Promise<void>;
  updateSearchQuery(museId: string, query: string): Promise<void>;
}
```

### `resource-node.ts`

```typescript
export interface GpuClaim {
  museId: string;
  deviceId: number;
  memoryFraction: number;   // 0.0 - 1.0
  computeFraction: number;  // 0.0 - 1.0
  duration: number;        // Seconds
  claimedAt: string;
  expiresAt: string;
}

export interface ResourceNode {
  id: string;
  gpuClaims: GpuClaim[];
  totalMemory: number;      // Bytes
  usedMemory: number;       // Bytes
  totalTokens: number;      // Token budget
  usedTokens: number;       // Tokens used
}

export interface ResourceManager {
  allocateGpu(museId: string, fraction: number, duration: number): Promise<GpuClaim>;
  releaseGpu(claimId: string): Promise<void>;
  allocateTokens(museId: string, count: number): Promise<number>;
  releaseTokens(museId: string, count: number): Promise<void>;
  availableTokens(): Promise<number>;
  availableGpuFraction(): Promise<number>;
}

export const DEFAULT_RESOURCE_LIMITS = {
  maxGpuFractionPerMuse: 0.5,
  maxTokensPerMuse: 8192,
  defaultTokenBudget: 4096,
};
```

### `bootstrap.ts`

```typescript
import type { Muse } from "./muse";

export const BOOTSTRAP_MUSES: Muse[] = [
  {
    id: "witness_thread",
    label: "Witness Thread",
    anchor: { x: 0.5, y: 0.5, zoom: 1.0, kind: "bootstrap" },
    role: "security",
    description: "GitHub security analyst. Monitors PR/issue threats, CVEs, supply chain risks.",
    presenceIds: ["presence.security.github"],
    mode: "observe",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "chaos",
    label: "Chaos",
    anchor: { x: 0.18, y: 0.23, zoom: 1.0, kind: "bootstrap" },
    role: "geopolitical",
    description: "Geopolitical signal analyst. Monitors global threats, maritime security, domain risks.",
    presenceIds: ["presence.geopolitical.global"],
    mode: "observe",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "github_security_review",
    label: "GitHub Threat Radar",
    anchor: { x: 0.82, y: 0.5, zoom: 1.0, kind: "threat-radar" },
    role: "scanner",
    description: "Automated threat scanner. Continuous GitHub security monitoring.",
    presenceIds: ["presence.scanner.github"],
    mode: "analyze",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
```

---

## Muse Runtime API

### `runtime.ts`

```typescript
export interface MuseRuntimeManager {
  // Lifecycle
  start(museId: string): Promise<void>;
  pause(museId: string): Promise<void>;
  resume(museId: string): Promise<void>;
  stop(museId: string): Promise<void>;

  // State
  getState(museId: string): Promise<MuseRuntimeState>;
  getMode(museId: string): Promise<MuseMode>;
  setMode(museId: string, mode: MuseMode): Promise<void>;

  // Context
  getContext(museId: string): Promise<ContextManifest | null>;
  updateContext(museId: string, updates: Partial<ContextManifest>): Promise<void>;

  // Resources
  allocateResources(museId: string, claims: Partial<ResourceNode>): Promise<void>;
  releaseResources(museId: string): Promise<void>;

  // Events
  subscribe(eventType: MuseEventType, handler: (event: MuseEvent) => void): void;
  unsubscribe(eventType: MuseEventType, handler: (event: MuseEvent) => void): void;
}
```

---

## Integration Points

### Threat Radar Integration

```typescript
import { Muse, MuseMode, BOOTSTRAP_MUSES } from "@workspace/muse-core";

// Muse for Hormuz monitoring
const hormuzMuse: Muse = {
  id: "hormuz_clock",
  label: "Hormuz Clock",
  anchor: { x: 0.3, y: 0.4, zoom: 1.0, kind: "threat-radar" },
  role: "security",
  description: "Monitors Hormuz Strait transit flow and attack tempo.",
  presenceIds: ["presence.hormuz.strait"],
  mode: "observe",
  // ...
};

// When new signal arrives, transition to analyze
await runtime.setMode("hormuz_clock", "analyze");
```

### Presence Core Integration

```typescript
import { Presence } from "@workspace/presence-core";
import { Muse, MuseRuntimeManager } from "@workspace/muse-core";

// A muse operates on behalf of a presence
const presence: Presence = { id: "presence.security.github", /* ... */ };
const muse: Muse = {
  id: "github_scanner",
  presenceIds: [presence.id],
  // ...
};

// Context manifest knows which presence's workspace to use
const context = await runtime.getContext(muse.id);
console.log(context.workspace.presenceId); // "presence.security.github"
```

### Syndicussy Integration

```typescript
import { Muse } from "@workspace/muse-core";

// Muse for RSS feed monitoring
const feedMuse: Muse = {
  id: "arxiv_cs_ai_scanner",
  label: "ArXiv CS.AI Scanner",
  anchor: { x: 0.2, y: 0.8, zoom: 1.0, kind: "observer" },
  role: "scanner",
  presenceIds: ["presence.feed.arxiv-cs-ai"],
  mode: "analyze",
  // ...
};
```

---

## Tests

```typescript
// test/muse.test.ts
describe("Muse", () => {
  it("creates a muse with valid mode", () => {
    const muse = createMuse({
      id: "test.muse",
      role: "security",
      mode: "observe",
    });
    expect(muse.mode).toBe("observe");
  });

  it("defaults to idle mode", () => {
    const muse = createMuse({ id: "test", role: "observer" });
    expect(muse.mode).toBe("idle");
  });
});

// test/mode-strategy.test.ts
describe("ModeStrategy", () => {
  it("selects observe mode for security role", async () => {
    const strategy = new DefaultModeStrategy();
    const mode = await strategy.selectMode(
      { id: "test", role: "security" },
      {}
    );
    expect(mode).toBe("observe");
  });

  it("transitions from observe to analyze", async () => {
    const strategy = new DefaultModeStrategy();
    const transitions = strategy.availableTransitions({ mode: "observe" });
    expect(transitions.some(t => t.to === "analyze")).toBe(true);
  });
});
```

---

## Migration Steps

1. **Create package structure** (`packages/muse-core/`)
2. **Extract types** from vault concepts → TypeScript
3. **Define bootstrap muses** from `BOOTSTRAP_MUSE_SPECS`
4. **Implement mode strategy** with transitions
5. **Implement context manifest** manager
6. **Add resource management** (GPU/token claims)
7. **Write tests** for core operations
8. **Integrate with presence-core** for presence binding
9. **Integrate with Threat Radar MCP** as first consumer

---

## Dependencies

- `@workspace/presence-core` — Presence types
- `@workspace/utils` — Shared utilities
- `zod` — Schema validation

---

## Next

Create `specs/daimoi-core-spec.md` for field physics extraction.