# Presence Core — Extraction Spec

> *A presence is not a user. It is a position in the field, with its own will and budget.*

---

## Purpose

Extract the Presence System from `fork_tales` into a clean, independent `packages/presence-core/` that can be used by any substrate — Threat Radar, Eta-Mu web, Discord bots, or shuv's syndication feeds.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                         FIELD                                │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Presence │◄──►│ Presence │◄──►│ Presence │  ...         │
│  │  (主)    │    │  (汝)    │    │  (彼)    │              │
│  │  anchor  │    │  anchor  │    │  anchor  │              │
│  ├──────────┤    ├──────────┤    ├──────────┤              │
│  │ DAIMON   │    │ DAIMON   │    │ DAIMON   │              │
│  │ budget   │    │ budget   │    │ budget   │              │
│  │ role     │    │ role     │    │ role     │              │
│  │ context  │    │ context  │    │ context  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                              │
│  Each presence has:                                         │
│  - Unique ID in semantic space                              │
│  - Anchor position (x, y, zoom)                             │
│  - Operational role (security, geopolitical, scanner, etc)  │
│  - DAIMON budget allocation                                  │
│  - Handoff-capable ownership                                │
└─────────────────────────────────────────────────────────────┘
```

**Presence ≠ User.** A presence is a *role* in the system. The same person might control multiple presences. A single presence might be handed off between controllers.

**DAIMON = Distributed AI Monitor.** Each presence has a budget for AI operations — tokens, compute, attention.

---

## Source Vault Contracts

### `world_web/constants.py` — Presence Definitions

```python
PRESENCE_OPERATIONAL_ROLE_BY_ID = {
    "presence.core.cpu": "system",
    "presence.core.ram": "system",
    "presence.core.disk": "system",
    "presence.core.network": "system",
    "presence.core.gpu": "system",
    "presence.core.npu": "system",
    "receipt_river": "observer",
    "witness_thread": "security",
    "fork_tax_canticle": "audit",
    "mage_of_receipts": "media",
    "keeper_of_receipts": "archive",
    # ...
}
```

**Extract**: `PRESENCE_OPERATIONAL_ROLE_BY_ID` → `role-registry.ts`

### `world_web/presence_runtime.py` — Runtime State

```python
PRESENCE_RUNTIME_RECORD = "eta-mu.presence-runtime.snapshot.v1"
PRESENCE_RUNTIME_EVENT_RECORD = "eta-mu.presence-event.v1"

_LEASE_SCRIPT = """
local current = redis.call('GET', KEYS[1])
if (not current) or current == ARGV[1] then
  redis.call('PSETEX', KEYS[1], tonumber(ARGV[2]), ARGV[1])
  return {1, current or ''}
end
return {0, current}
"""

_PRESENCE_CAS_SCRIPT = """
local expected = tonumber(ARGV[1])
local next_ver = tonumber(ARGV[2])
-- ... CAS-style versioned update
"""
```

**Key patterns:**
- Redis-backed state with CAS (compare-and-swap)
- Lease-based locking for handoff
- Event streaming for presence changes

### `world_web/simulation_backend_particles.py` — Particle Role Mapping

```python
_PARTICLE_ROLE_BY_PRESENCE: dict[str, str] = {
    "presence.user.operator": "user",
    "witness_thread": "security",
    "chaos": "geopolitical",
    # ...
}
```

**Extract**: Particle role mapping → `particle-role-mapping.ts` (but keep in simulation, not presence-core)

---

## Extracted Package Structure

```
packages/presence-core/
├── src/
│   ├── index.ts               # Public API
│   ├── presence.ts            # Core presence type
│   ├── presence-id.ts         # ID parsing/validation
│   ├── anchor.ts               # Position types (x, y, zoom)
│   ├── role-registry.ts       # Operational role definitions
│   ├── daimon-budget.ts       # Budget allocation
│   ├── handoff.ts             # Ownership transfer protocol
│   ├── field-assignment.ts   # Field membership
│   ├── lease.ts               # Distributed locking
│   └── event.ts               # Presence events
├── test/
│   ├── presence.test.ts
│   ├── handoff.test.ts
│   └── budget.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types

### `presence.ts`

```typescript
export interface PresenceAnchor {
  x: number;      // 0.0 - 1.0 normalized position
  y: number;      // 0.0 - 1.0 normalized position
  zoom: number;   // Field zoom level
  kind: "bootstrap" | "threat-radar" | "user" | "system" | "observer";
}

export type OperationalRole =
  | "system"      // Infrastructure (cpu, ram, disk, network, gpu, npu)
  | "security"    // Threat monitoring
  | "geopolitical" // Global risk analysis
  | "scanner"     // Automated scanning
  | "observer"    // Passive observation
  | "audit"       // Compliance tracking
  | "media"       // Content processing
  | "archive";    // Knowledge storage

export interface Presence {
  id: string;                    // Unique presence ID
  label:LocalizedString;        // Display name (en/ja)
  anchor: PresenceAnchor;        // Field position
  role: OperationalRole;         // Functional role
  description: string;           // Human-readable purpose
  ownerId?: string;              // Current controller
  version: number;               // CAS version
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}

export interface LocalizedString {
  en: string;
  ja?: string;
}
```

### `daimon-budget.ts`

```typescript
export interface DaimonBudget {
  presenceId: string;
  baseTokens: number;        // Base allocation
  currentTokens: number;     // Available tokens
  maxBurst: number;          // Maximum burst allocation
  temperature: number;       // Temperature for AI calls (0.0 - 1.0)
  weight: number;            // Weight in reduction
}

export interface BudgetAllocation {
  presenceId: string;
  allocationId: string;
  tokens: number;
  reason: string;
  timestamp: string;
}

export interface DaimonBudgetManager {
  allocate(presenceId: string, tokens: number): Promise<BudgetAllocation>;
  release(allocationId: string): Promise<void>;
  available(presenceId: string): Promise<number>;
  burst(presenceId: string, max: number): Promise<BudgetAllocation>;
}
```

### `handoff.ts`

```typescript
export interface PresenceHandoff {
  presenceId: string;
  fromOwnerId: string;
  toOwnerId: string;
  version: number;           // Expected version for CAS
  timestamp: string;
  reason?: string;
}

export interface HandoffResult {
  success: boolean;
  newVersion: number;
  error?: "owner_conflict" | "version_conflict" | "not_found";
}

export interface HandoffProtocol {
  initiate(handoff: PresenceHandoff): Promise<HandoffResult>;
  confirm(presenceId: string, version: number): Promise<void>;
  rollback(presenceId: string, previousOwnerId: string): Promise<void>;
}
```

### `event.ts`

```typescript
export type PresenceEventType =
  | "presence.created"
  | "presence.updated"
  | "presence.handoff_initiated"
  | "presence.handoff_completed"
  | "presence.handoff_rejected"
  | "presence.budget_allocated"
  | "presence.budget_released";

export interface PresenceEvent {
  type: PresenceEventType;
  presenceId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  sourceId: string;          // Who initiated
}
```

---

## Integration Points

### Threat Radar Integration

```typescript
import { Presence, OperationalRole } from "@workspace/presence-core";

// Threat radar creates a presence for each monitored domain
const hormuzPresence: Presence = {
  id: "presence.hormuz.strait",
  label: { en: "Hormuz Strait Monitor", ja: "ホルムズ海峡監視" },
  anchor: { x: 0.5, y: 0.3, zoom: 1.0, kind: "threat-radar" },
  role: "geopolitical",
  description: "Monitors Strait of Hormuz transit flow and attack tempo.",
};
```

### Syndicussy (RSS) Integration

```typescript
import { Presence } from "@workspace/presence-core";

// Each RSS feed source becomes a presence
const feedPresence: Presence = {
  id: "presence.feed.arxiv-cs-ai",
  label: { en: "ArXiv CS.AI Feed" },
  anchor: { x: 0.2, y: 0.8, zoom: 1.0, kind: "observer" },
  role: "scanner",
  description: "ArXiv cs.AI RSS feed scanner.",
};
```

### Discord Channel Integration

```typescript
import { Presence } from "@workspace/presence-core";

// Discord channel as presence output
const discordPresence: Presence = {
  id: "presence.discord.threat-alerts",
  label: { en: "Threat Alerts Channel" },
  anchor: { x: 0.9, y: 0.5, zoom: 1.0, kind: "observer" },
  role: "observer",
  description: "Discord channel for threat alert broadcasts.",
};
```

---

## Storage Contract

### In-Memory (Development)

```typescript
export class InMemoryPresenceStore implements PresenceStore {
  private presences = new Map<string, Presence>();
  private versions = new Map<string, number>();

  async get(id: string): Promise<Presence | null>;
  async upsert(presence: Presence): Promise<Presence>;
  async list(): Promise<Presence[]>;
  async handoff(request: PresenceHandoff): Promise<HandoffResult>;
}
```

### Redis (Production)

```typescript
export class RedisPresenceStore implements PresenceStore {
  // Uses CAS-style versioned updates
  // Lease-based locks for handoff
  // Event streaming for presence changes

  async get(id: string): Promise<Presence | null>;
  async upsert(presence: Presence): Promise<Presence>;
  async list(): Promise<Presence[]>;
  async handoff(request: PresenceHandoff): Promise<HandoffResult>;
}
```

---

## Tests

```typescript
// test/presence.test.ts
describe("Presence", () => {
  it("creates a presence with valid anchor", () => {
    const presence = createPresence({
      id: "test.presence",
      label: { en: "Test" },
      role: "observer",
    });
    expect(presence.anchor.x).toBeGreaterThanOrEqual(0);
    expect(presence.anchor.x).toBeLessThanOrEqual(1);
  });

  it("rejects invalid anchor positions", () => {
    expect(() => createPresence({ anchor: { x: -1, y: 0.5, zoom: 1, kind: "user" }}))
      .toThrow("anchor.x must be between 0 and 1");
  });
});

// test/handoff.test.ts
describe("PresenceHandoff", () => {
  it("transfers ownership with CAS version check", async () => {
    const store = new InMemoryPresenceStore();
    await store.upsert({ id: "p1", ownerId: "user1", version: 1 });

    const result = await store.handoff({
      presenceId: "p1",
      fromOwnerId: "user1",
      toOwnerId: "user2",
      version: 1,
    });

    expect(result.success).toBe(true);
    expect(result.newVersion).toBe(2);
  });

  it("rejects handoff with stale version", async () => {
    const store = new InMemoryPresenceStore();
    await store.upsert({ id: "p1", ownerId: "user1", version: 2 });

    const result = await store.handoff({
      presenceId: "p1",
      fromOwnerId: "user1",
      toOwnerId: "user2",
      version: 1, // stale
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("version_conflict");
  });
});
```

---

## Migration Steps

1. **Create package structure** (`packages/presence-core/`)
2. **Extract types** from vault concepts → TypeScript
3. **Implement in-memory store** first
4. **Write tests** for core operations
5. **Implement Redis store** for production
6. **Integrate with Threat Radar MCP** as first consumer
7. **Integrate with syndicussy** for RSS presences

---

## Dependencies

- `zod` — Schema validation
- `@workspace/utils` — Shared utilities
- Redis (optional, for production store)

---

## Next

Create `specs/muse-core-spec.md` for agent runtime extraction.