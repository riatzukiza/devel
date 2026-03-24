# Daimoi Core — Extraction Spec

> *The daimoni move through the field by attraction and repulsion, each with its own budget and will.*

---

## Purpose

Extract the Daimoi (field physics) system from `fork_tales` into `packages/daimoi-core/` — particle dynamics for semantic fields, with spatial indexing, collision detection, and resource economics.

---

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                      SEMANTIC FIELD                          │
│                                                              │
│  Each DAIMON has:                                            │
│  - Position (x, y) in normalized field space                 │
│  - Velocity (vx, vy) from force accumulation                 │
│  - Budget (tokens, compute)                                  │
│  - Attraction/repulsion to other daimoni                    │
│  - Collision semantics with field boundaries                 │
│                                                              │
│  Forces:                                                     │
│  ┌─────────┐     Attraction (κ)     ┌─────────┐             │
│  │ Daimon A│◄────────────────────►│ Daimon B│             │
│  │         │     Repulsion (δ)     │         │             │
│  └─────────┘                      └─────────┘             │
│                                                              │
│  Physics:                                                    │
│  - Force κ: attraction strength                              │
│  - Damping: velocity decay                                   │
│  - dt: time step for integration                             │
│  - Collision: boundary reflection                            │
└─────────────────────────────────────────────────────────────┘
```

**Daimon (plural: Daimoni) = Distributed AI Monitor.**

Each presence has a daimon that moves through semantic space based on:
- Attraction to concepts, documents, other daimoni
- Repulsion from conflicts, noise, degraded sources
- Resource budget (can only "think" so fast)
- Collision with field boundaries

---

## Source Vault Contracts

### `world_web/constants.py` — Physics Parameters

```python
DAIMO_FORCE_KAPPA = max(0.02, float(os.getenv("DAIMO_FORCE_KAPPA", "0.22") or "0.22"))
DAIMO_DAMPING = max(0.0, min(0.99, float(os.getenv("DAIMO_DAMPING", "0.88") or "0.88")))
DAIMO_DT_SECONDS = max(0.02, min(0.4, float(os.getenv("DAIMO_DT_SECONDS", "0.2") or "0.2")))
DAIMO_MAX_TRACKED_ENTITIES = max(24, int(os.getenv("DAIMO_MAX_TRACKED_ENTITIES", "280") or "280"))
```

### `world_web/daimoi_probabilistic.py` — Force Calculations

```python
# 397KB file - massive, tightly coupled
# Core concepts:
# - Probabilistic position estimation
# - Force accumulation from multiple sources
# - Velocity integration with damping
# - Collision with field boundaries
```

### `world_web/daimoi_quadtree.py` — Spatial Indexing

```python
# Quadtree for efficient spatial queries
# - Find nearby daimoni
# - Collision detection
# - Neighbor force contribution
```

### `world_web/daimoi_collision_semantics.py` — Collision Logic

```python
# What happens when daimoni collide?
# - Merge semantics (same role)
# - Bounce semantics (different roles)
# - Field absorption
```

### `world_web/constants.py` — Daimon Profiles

```python
DAIMO_PROFILE_DEFS: tuple[dict[str, Any], ...] = (
    {
        "id": "daimo:core",
        "name": "Core Daimoi",
        "ctx": "主",
        "base_budget": 9.0,
        "w": 1.0,
        "temperature": 0.34,
    },
    {
        "id": "daimo:resource",
        "name": "Resource Daimoi",
        "ctx": "資",
        "base_budget": 12.0,
        "w": 1.05,
        "temperature": 0.28,
    },
    {
        "id": "daimo:self",
        "name": "Self Daimoi",
        "ctx": "己",
        "base_budget": 7.0,
        "w": 0.9,
        "temperature": 0.42,
    },
    {
        "id": "daimo:you",
        "name": "You Daimoi",
        "ctx": "汝",
        "base_budget": 7.0,
        "w": 0.88,
        "temperature": 0.48,
    },
    {
        "id": "daimo:they",
        "name": "They Daimoi",
        "ctx": "彼",
        "base_budget": 6.0,
        "w": 0.84,
        "temperature": 0.56,
    },
    {
        "id": "daimo:world",
        "name": "World Daimoi",
        "ctx": "世",
        "base_budget": 8.0,
        "w": 0.94,
        "temperature": 0.4,
    },
)
```

**Context symbols (己/汝/彼/世/主) come from the operation-mindfuck Lisp contract.**

---

## Extracted Package Structure

```
packages/daimoi-core/
├── src/
│   ├── index.ts               # Public API
│   ├── daimon.ts              # Core daimon type
│   ├── physics.ts             # Force calculations
│   ├── quadtree.ts            # Spatial indexing
│   ├── collision.ts           # Collision detection
│   ├── field.ts               # Field abstraction
│   ├── budget.ts              # Resource economics
│   ├── profile.ts             # Daimon profiles
│   └── simulation.ts          # Tick-based simulation
├── test/
│   ├── physics.test.ts
│   ├── quadtree.test.ts
│   └── collision.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Types

### `daimon.ts`

```typescript
export type DaimonContext = "己" | "汝" | "彼" | "世" | "主";

export interface DaimonPosition {
  x: number;    // 0.0 - 1.0 normalized
  y: number;    // 0.0 - 1.0 normalized
}

export interface DaimonVelocity {
  vx: number;   // Units per tick
  vy: number;   // Units per tick
}

export interface DaimonBudget {
  baseBudget: number;     // Base token allocation
  weight: number;        // Force weight (w)
  temperature: number;   // AI temperature (0.0 - 1.0)
}

export interface Daimon {
  id: string;                  // Unique daimon ID
  profileId: string;          // Profile reference
  presenceId: string;         // Owning presence
  position: DaimonPosition;
  velocity: DaimonVelocity;
  budget: DaimonBudget;
  context: DaimonContext;     // 己/汝/彼/世/主
  trackedEntities: string[];   // IDs of entities being tracked
  lastUpdateTick: number;
}
```

### `physics.ts`

```typescript
export interface ForceVector {
  fx: number;
  fy: number;
}

export interface PhysicsConfig {
  kappa: number;        // Attraction strength (default: 0.22)
  damping: number;      // Velocity decay (default: 0.88)
  dt: number;          // Time step in seconds (default: 0.2)
  maxEntities: number;  // Max tracked entities (default: 280)
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  kappa: 0.22,
  damping: 0.88,
  dt: 0.2,
  maxEntities: 280,
};

export interface PhysicsEngine {
  accumulateForces(daimon: Daimon, others: Daimon[]): ForceVector;
  integrate(daimon: Daimon, force: ForceVector, dt: number): Daimon;
  applyBoundary(daimon: Daimon, field: FieldBounds): Daimon;
  step(daimons: Daimon[], dt: number): Daimon[];
}

export function accumulateForces(
  daimon: Daimon,
  targets: DaimonPosition[],
  config: PhysicsConfig
): ForceVector {
  // Attraction to targets, repulsion from conflicts
  let fx = 0;
  let fy = 0;

  for (const target of targets) {
    const dx = target.x - daimon.position.x;
    const dy = target.y - daimon.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

    // Force magnitude decreases with distance
    const magnitude = config.kappa / dist;

    fx += (dx / dist) * magnitude;
    fy += (dy / dist) * magnitude;
  }

  return { fx, fy };
}

export function integrate(
  daimon: Daimon,
  force: ForceVector,
  config: PhysicsConfig
): Daimon {
  // Apply force to velocity, then velocity to position
  const vx = (daimon.velocity.vx + force.fx * config.dt) * config.damping;
  const vy = (daimon.velocity.vy + force.fy * config.dt) * config.damping;

  return {
    ...daimon,
    velocity: { vx, vy },
    position: {
      x: daimon.position.x + vx * config.dt,
      y: daimon.position.y + vy * config.dt,
    },
  };
}
```

### `quadtree.ts`

```typescript
export interface QuadBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadNode {
  bounds: QuadBounds;
  children: QuadNode[] | null;  // null if leaf
  entities: DaimonPosition[];    // Only in leaves
  capacity: number;
}

export class Quadtree {
  private root: QuadNode;

  constructor(bounds: QuadBounds, capacity: number = 8) {
    this.root = this.createNode(bounds, capacity);
  }

  insert(position: DaimonPosition): void { /* ... */ }
  query(bounds: QuadBounds): DaimonPosition[] { /* ... */ }
  nearest(position: DaimonPosition, k: number): DaimonPosition[] { /* ... */ }
}
```

### `collision.ts`

```typescript
export type CollisionType =
  | "merge"      // Same-role daimoni merge
  | "bounce"     // Different-role daimoni bounce
  | "absorb";    // One absorbs the other

export interface CollisionEvent {
  type: CollisionType;
  daimonA: Daimon;
  daimonB: Daimon;
  timestamp: string;
}

export interface CollisionResolver {
  detect(daimons: Daimon[], threshold: number): CollisionEvent[];
  resolve(event: CollisionEvent): Daimon[];
}

export function detectCollisions(
  daimons: Daimon[],
  threshold: number = 0.02
): CollisionEvent[] {
  const events: CollisionEvent[] = [];

  for (let i = 0; i < daimons.length; i++) {
    for (let j = i + 1; j < daimons.length; j++) {
      const a = daimons[i];
      const b = daimons[j];

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < threshold) {
        events.push({
          type: a.profileId === b.profileId ? "merge" : "bounce",
          daimonA: a,
          daimonB: b,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return events;
}
```

### `field.ts`

```typescript
export interface FieldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Field {
  id: string;
  name: string;
  bounds: FieldBounds;
  daimons: Map<string, Daimon>;
  quadtree: Quadtree;
}

export interface FieldManager {
  createField(id: string, bounds: FieldBounds): Field;
  addDaimon(fieldId: string, daimon: Daimon): void;
  removeDaimon(fieldId: string, daimonId: string): void;
  stepField(fieldId: string, dt: number): void;
}
```

### `profile.ts`

```typescript
import type { DaimonContext, DaimonBudget } from "./daimon";

export interface DaimonProfile {
  id: string;              // e.g., "daimo:core"
  name: string;            // e.g., "Core Daimoi"
  context: DaimonContext;  // 主/資/己/汝/彼/世
  budget: DaimonBudget;
}

export const DEFAULT_PROFILES: DaimonProfile[] = [
  {
    id: "daimo:core",
    name: "Core Daimoi",
    context: "主",
    budget: { baseBudget: 9.0, weight: 1.0, temperature: 0.34 },
  },
  {
    id: "daimo:resource",
    name: "Resource Daimoi",
    context: "資",
    budget: { baseBudget: 12.0, weight: 1.05, temperature: 0.28 },
  },
  {
    id: "daimo:self",
    name: "Self Daimoi",
    context: "己",
    budget: { baseBudget: 7.0, weight: 0.9, temperature: 0.42 },
  },
  {
    id: "daimo:you",
    name: "You Daimoi",
    context: "汝",
    budget: { baseBudget: 7.0, weight: 0.88, temperature: 0.48 },
  },
  {
    id: "daimo:they",
    name: "They Daimoi",
    context: "彼",
    budget: { baseBudget: 6.0, weight: 0.84, temperature: 0.56 },
  },
  {
    id: "daimo:world",
    name: "World Daimoi",
    context: "世",
    budget: { baseBudget: 8.0, weight: 0.94, temperature: 0.4 },
  },
];
```

---

## Simulation Tick

```typescript
export function simulateTick(
  field: Field,
  config: PhysicsConfig = DEFAULT_PHYSICS
): Field {
  const newDaimons = new Map<string, Daimon>();

  for (const [id, daimon] of field.daimons) {
    // Find nearby entities via quadtree
    const nearby = field.quadtree.nearest(daimon.position, config.maxEntities);

    // Accumulate forces
    const force = accumulateForces(daimon, nearby, config);

    // Integrate velocity and position
    let updated = integrate(daimon, force, config);

    // Apply boundary constraints
    updated = applyBoundary(updated, field.bounds);

    newDaimons.set(id, updated);
  }

  // Detect and resolve collisions
  const collisions = detectCollisions([...newDaimons.values()]);
  for (const event of collisions) {
    resolveCollision(event, newDaimons);
  }

  return { ...field, daimons: newDaimons };
}
```

---

## Integration Points

### Presence Core Integration

```typescript
import { Presence } from "@workspace/presence-core";
import { Daimon, createDaimon } from "@workspace/daimoi-core";

// Each presence gets a daimon in the field
function presenceToDaimon(presence: Presence): Daimon {
  return createDaimon({
    id: `daimon:${presence.id}`,
    presenceId: presence.id,
    position: presence.anchor,
    profileId: `daimo:${presence.role}`,
  });
}
```

### Muse Core Integration

```typescript
import { Muse } from "@workspace/muse-core";
import { Daimon } from "@workspace/daimoi-core";

// Muse's daimon moves based on analysis focus
async function moveMuseDaimon(muse: Muse, targetPosition: Position): Promise<void> {
  const daimon = await getDaimonForMuse(muse.id);
  // Physics will gradually move daimon toward target
  daimon.trackedEntities.push(targetPosition.id);
}
```

---

## Tests

```typescript
// test/physics.test.ts
describe("Daimoi Physics", () => {
  it("accumulates attraction forces", () => {
    const daimon = createDaimon({ id: "test", position: { x: 0.5, y: 0.5 } });
    const targets = [{ x: 0.6, y: 0.5 }];
    const force = accumulateForces(daimon, targets, DEFAULT_PHYSICS);
    expect(force.fx).toBeGreaterThan(0); // Attracted toward target
  });

  it("applies damping to velocity", () => {
    const daimon = createDaimon({
      position: { x: 0.5, y: 0.5 },
      velocity: { vx: 1.0, vy: 0.0 },
    });
    const integrated = integrate(daimon, { fx: 0, fy: 0 }, DEFAULT_PHYSICS);
    expect(integrated.velocity.vx).toBeLessThan(1.0); // Damped
  });

  it("bounces at boundaries", () => {
    const daimon = createDaimon({ position: { x: -0.1, y: 0.5 } });
    const bounded = applyBoundary(daimon, { minX: 0, maxX: 1, minY: 0, maxY: 1 });
    expect(bounded.position.x).toBeGreaterThanOrEqual(0);
  });
});

// test/quadtree.test.ts
describe("Quadtree", () => {
  it("finds nearest neighbors efficiently", () => {
    const quadtree = new Quadtree({ x: 0, y: 0, width: 1, height: 1 });
    for (let i = 0; i < 100; i++) {
      quadtree.insert({ x: Math.random(), y: Math.random() });
    }
    const nearest = quadtree.nearest({ x: 0.5, y: 0.5 }, 5);
    expect(nearest.length).toBe(5);
  });
});
```

---

## Migration Steps

1. **Create package structure** (`packages/daimoi-core/`)
2. **Extract physics parameters** from vault constants
3. **Implement quadtree** for spatial indexing
4. **Implement force accumulation** and integration
5. **Implement collision detection** and resolution
6. **Write tests** for physics operations
7. **Integrate with presence-core** for daimon binding
8. **Integrate with muse-core** for movement triggers

---

## Dependencies

- `@workspace/presence-core` — Presence types (optional)
- `@workspace/utils` — Shared utilities
- `zod` — Schema validation

---

## Next

Create `specs/web-graph-weaver-spec.md` for crawler extraction.