import type { Particle, Force } from "./types.js";

const MIN_HALF = 1e-3;

class QuadNode {
  public mass = 0;
  public comX = 0;
  public comY = 0;

  /** Leaf: index of one particle (if not subdivided). */
  public body: number | null = null;

  /** Internal node children (NW, NE, SW, SE). */
  public children: [QuadNode, QuadNode, QuadNode, QuadNode] | null = null;

  constructor(
    public readonly cx: number,
    public readonly cy: number,
    public readonly half: number,
  ) {}

  insert(particles: Particle[], index: number): void {
    const p = particles[index]!;

    // Update mass + COM incrementally.
    const m0 = this.mass;
    const m1 = m0 + p.mass;
    if (m1 > 0) {
      this.comX = (this.comX * m0 + p.x * p.mass) / m1;
      this.comY = (this.comY * m0 + p.y * p.mass) / m1;
      this.mass = m1;
    }

    if (this.children) {
      this.childFor(p.x, p.y).insert(particles, index);
      return;
    }

    if (this.body === null) {
      this.body = index;
      return;
    }

    // Already occupied leaf → subdivide.
    if (this.half <= MIN_HALF) {
      // Too small to subdivide safely; treat as aggregate.
      this.body = null;
      return;
    }

    const existing = this.body;
    this.body = null;
    this.subdivide();

    // Reinsert existing + new.
    if (existing !== null) {
      const ep = particles[existing]!;
      this.childFor(ep.x, ep.y).insert(particles, existing);
    }
    this.childFor(p.x, p.y).insert(particles, index);
  }

  private subdivide(): void {
    const q = this.half / 2;
    this.children = [
      new QuadNode(this.cx - q, this.cy + q, q), // NW
      new QuadNode(this.cx + q, this.cy + q, q), // NE
      new QuadNode(this.cx - q, this.cy - q, q), // SW
      new QuadNode(this.cx + q, this.cy - q, q), // SE
    ];
  }

  private childFor(x: number, y: number): QuadNode {
    if (!this.children) throw new Error("no children");
    const east = x >= this.cx;
    const north = y >= this.cy;
    if (!east && north) return this.children[0];
    if (east && north) return this.children[1];
    if (!east && !north) return this.children[2];
    return this.children[3];
  }
}

export class BarnesHutQuadTree {
  private readonly root: QuadNode;

  constructor(private readonly particles: Particle[]) {
    const { cx, cy, half } = computeBounds(particles);
    this.root = new QuadNode(cx, cy, half);
    for (let i = 0; i < particles.length; i += 1) {
      this.root.insert(particles, i);
    }
  }

  repulsionOn(index: number, opts: { theta: number; strength: number; softening: number }): Force {
    const p = this.particles[index]!;
    const out: Force = { fx: 0, fy: 0 };
    accumulateRepulsion(this.root, this.particles, index, p.x, p.y, opts, out);
    return out;
  }
}

function computeBounds(particles: Particle[]): { cx: number; cy: number; half: number } {
  if (particles.length === 0) return { cx: 0, cy: 0, half: 1 };

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const p of particles) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const w = Math.max(1e-6, maxX - minX);
  const h = Math.max(1e-6, maxY - minY);
  const side = Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = side / 2 + 1e-3;
  return { cx, cy, half };
}

function accumulateRepulsion(
  node: QuadNode,
  particles: Particle[],
  selfIndex: number,
  x: number,
  y: number,
  opts: { theta: number; strength: number; softening: number },
  out: Force,
): void {
  if (node.mass <= 0) return;

  // Leaf with the same particle.
  if (!node.children && node.body === selfIndex) return;

  const dx = x - node.comX;
  const dy = y - node.comY;
  const dist2 = dx * dx + dy * dy + opts.softening;
  const dist = Math.sqrt(dist2);

  const size = node.half * 2;

  // Barnes–Hut criterion: far enough → approximate as one body.
  if (!node.children || size / dist < opts.theta) {
    const inv = 1 / dist;
    const inv3 = inv * inv * inv;
    const mag = opts.strength * node.mass * inv3;
    out.fx += dx * mag;
    out.fy += dy * mag;
    return;
  }

  // Recurse.
  const ch = node.children;
  if (!ch) return;
  for (const child of ch) {
    // Quick prune: child with no mass.
    if (child.mass <= 0) continue;
    accumulateRepulsion(child, particles, selfIndex, x, y, opts, out);
  }
}
