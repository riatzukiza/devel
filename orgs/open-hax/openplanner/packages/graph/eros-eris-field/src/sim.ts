import type { FieldConfig, Force, Particle, SemanticEdge, SpringEdge } from "./types.js";
import { BarnesHutQuadTree } from "./quadtree.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function addForce(forces: Force[], i: number, fx: number, fy: number): void {
  forces[i]!.fx += fx;
  forces[i]!.fy += fy;
}

export function stepField(params: {
  particles: Particle[];
  dt: number;
  config: FieldConfig;
  springs?: SpringEdge[];
  semantic?: SemanticEdge[];
}): void {
  const { particles, dt, config, springs = [], semantic = [] } = params;
  if (particles.length === 0) return;

  // Keep integration stable even if callers pass a large wall-clock dt.
  const stepDt = clamp(dt, 0.001, 0.5);

  const forces: Force[] = particles.map(() => ({ fx: 0, fy: 0 }));
  const indexById = new Map<string, number>();
  for (let i = 0; i < particles.length; i += 1) indexById.set(particles[i]!.id, i);

  // --- weak long-range repulsion (Barnes–Hut)
  if (config.repulsionStrength > 0) {
    const tree = new BarnesHutQuadTree(particles);
    for (let i = 0; i < particles.length; i += 1) {
      const f = tree.repulsionOn(i, {
        theta: config.theta,
        strength: config.repulsionStrength,
        softening: config.softening,
      });
      addForce(forces, i, f.fx, f.fy);
    }
  }

  // --- strong node-local repulsion (grid-based, O(n))
  const localRadius = Math.max(config.minSeparation, config.localRepulsionRadius);
  if (localRadius > 0 && (config.localRepulsionStrength > 0 || config.separationStrength > 0)) {
    const cellSize = Math.max(1e-6, localRadius);
    const grid = new Map<string, number[]>();

    const keyFor = (x: number, y: number) => {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      return `${gx},${gy}`;
    };

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i]!;
      const k = keyFor(p.x, p.y);
      const rows = grid.get(k) ?? [];
      rows.push(i);
      grid.set(k, rows);
    }

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i]!;
      const gx = Math.floor(a.x / cellSize);
      const gy = Math.floor(a.y / cellSize);

      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const rows = grid.get(`${gx + ox},${gy + oy}`);
          if (!rows) continue;
          for (const j of rows) {
            if (j <= i) continue;
            const b = particles[j]!;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = hypot(dx, dy);
            if (d <= 1e-6 || d >= localRadius) continue;

            const ux = dx / d;
            const uy = dy / d;

            let push = 0;

            if (config.localRepulsionStrength > 0 && d < config.localRepulsionRadius) {
              const t = clamp(1 - d / Math.max(1e-6, config.localRepulsionRadius), 0, 1);
              push += config.localRepulsionStrength * Math.pow(t, config.localRepulsionPower);
            }

            if (config.minSeparation > 0 && config.separationStrength > 0 && d < config.minSeparation) {
              const t = clamp(1 - d / Math.max(1e-6, config.minSeparation), 0, 1);
              push += config.separationStrength * (1 + 24 * t * t * t);
            }

            if (push <= 0) continue;

            addForce(forces, i, ux * push, uy * push);
            addForce(forces, j, -ux * push, -uy * push);
          }
        }
      }
    }
  }

  // --- structural springs
  for (const e of springs) {
    const si = indexById.get(e.source);
    const ti = indexById.get(e.target);
    if (si === undefined || ti === undefined) continue;

    const a = particles[si]!;
    const b = particles[ti]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = hypot(dx, dy);
    if (d <= 1e-6) continue;

    const ux = dx / d;
    const uy = dy / d;
    const delta = d - e.restLength;
    // Hooke-style spring: stretched edges pull together, compressed edges push apart.
    const mag = e.strength * delta;

    addForce(forces, si, ux * mag, uy * mag);
    addForce(forces, ti, -ux * mag, -uy * mag);
  }

  // --- semantic charge
  for (const s of semantic) {
    const ai = indexById.get(s.a);
    const bi = indexById.get(s.b);
    if (ai === undefined || bi === undefined) continue;

    const a = particles[ai]!;
    const b = particles[bi]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = hypot(dx, dy);
    if (d <= 1e-6) continue;

    const ux = dx / d;
    const uy = dy / d;

    if (s.sim >= config.semanticAttractAbove) {
      // Strong attraction as similarity rises; highly similar nodes should dominate local structure.
      const simT = clamp((s.sim - config.semanticAttractAbove) / Math.max(1e-6, 1 - config.semanticAttractAbove), 0, 1);

      // --- distance-based edge breaking ---
      // Each similarity level gets a maximum bond length.
      // Weak similarities (simT near 0) break early; strong similarities (simT near 1) tolerate more stretch.
      // The maxBond scales from semanticRestLength (weak) up to semanticBreakDistance (strong).
      const maxBond = config.semanticRestLength + (config.semanticBreakDistance - config.semanticRestLength) * simT;
      if (d > maxBond) {
        // Edge is broken — nodes too far apart for this similarity level.
        // Apply a tiny damping force instead of full attraction to prevent jerky release.
        const dampMag = config.semanticAttractStrength * 0.04 * (d - maxBond);
        addForce(forces, ai, ux * dampMag, uy * dampMag);
        addForce(forces, bi, -ux * dampMag, -uy * dampMag);
        continue;
      }

      const rest = config.semanticRestLength * (0.28 + (1 - simT) * 1.35);
      const delta = d - rest;
      // Strong semantic neighbors should collapse inward when far apart and only push apart when over-compressed.
      const mag = config.semanticAttractStrength * (1 + 4 * simT) * delta;

      addForce(forces, ai, ux * mag, uy * mag);
      addForce(forces, bi, -ux * mag, -uy * mag);
      continue;
    }

    if (s.sim <= config.semanticRepelBelow && d < config.semanticRepelRadius) {
      // Dissimilar nodes only repel when too close; they should not globally explode the field.
      const simT = clamp((config.semanticRepelBelow - s.sim) / Math.max(1e-6, config.semanticRepelBelow + 1), 0, 1);
      const distT = clamp(1 - d / Math.max(1e-6, config.semanticRepelRadius), 0, 1);
      const mag = config.semanticRepelStrength * (0.5 + simT) * Math.pow(distT, 3);

      // Push apart.
      addForce(forces, ai, -ux * mag, -uy * mag);
      addForce(forces, bi, ux * mag, uy * mag);
    }
  }

  // --- boundary pressure (soft circular wall on outermost edge nodes only)
  if (config.targetRadius > 0 && config.boundaryThickness > 0 && config.boundaryPressure > 0) {
    const outer = config.targetRadius;
    const thickness = Math.max(1e-6, config.boundaryThickness);
    const inner = Math.max(0, outer - thickness);
    const k = config.boundaryPressure;
    const edgeCount = Math.max(1, Math.ceil(particles.length * clamp(config.boundaryEdgeFraction, 0.001, 1)));
    const radii = particles.map((p) => hypot(p.x, p.y)).sort((a, b) => a - b);
    const edgeCutoff = radii[Math.max(0, radii.length - edgeCount)] ?? inner;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i]!;
      const r = hypot(p.x, p.y);
      if (r <= inner || r < edgeCutoff || r <= 1e-6) continue;

      // t=0 at inner band edge; t=1 at outer radius.
      const t = clamp((r - inner) / thickness, 0, 4);
      const mag = k * t * t * t;

      const ux = p.x / r;
      const uy = p.y / r;
      addForce(forces, i, -ux * mag, -uy * mag);
    }
  }

  // --- integrate
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i]!;
    const f = forces[i]!;
    const invM = 1 / Math.max(1e-6, p.mass);

    p.vx = (p.vx + f.fx * invM * stepDt) * config.damping;
    p.vy = (p.vy + f.fy * invM * stepDt) * config.damping;

    const sp = hypot(p.vx, p.vy);
    if (sp > config.maxSpeed) {
      const s = config.maxSpeed / sp;
      p.vx *= s;
      p.vy *= s;
    }

    p.x += p.vx * stepDt;
    p.y += p.vy * stepDt;
  }

  // keep the cloud roughly centered
  let meanX = 0;
  let meanY = 0;
  for (const p of particles) {
    meanX += p.x;
    meanY += p.y;
  }
  meanX /= particles.length;
  meanY /= particles.length;

  for (const p of particles) {
    p.x -= meanX;
    p.y -= meanY;
  }

  // Emergency hard clamp (rare): rein in only the offenders instead of crunching the whole graph.
  if (config.targetRadius > 0) {
    const hard = config.targetRadius + Math.max(1, config.boundaryThickness * 0.35);
    for (const p of particles) {
      const r = hypot(p.x, p.y);
      if (r > hard && r > 0) {
        const s = hard / r;
        p.x *= s;
        p.y *= s;
        p.vx *= 0.35;
        p.vy *= 0.35;
      }
    }
  }
}
