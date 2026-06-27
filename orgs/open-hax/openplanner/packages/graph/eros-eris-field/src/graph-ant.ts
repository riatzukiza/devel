export type GraphAntConfig = {
  antCount: number;
  stepsPerTick: number;
  depositRate: number;
  evaporationRate: number;
  alpha: number;
  beta: number;
  revisitPenalty: number;
  forceScale: number;
  maxPheromone: number;
};

export type AntTrailEdge = {
  source: string;
  target: string;
  pheromone: number;
  strength: number;
  restLength: number;
};

type Adjacency = Map<string, Map<string, { kind: string }>>;

type Ant = {
  at: string;
  visited: Set<string>;
  stepsTaken: number;
};

export class GraphAntSystem {
  private readonly config: GraphAntConfig;
  private readonly pheromone = new Map<string, number>();
  private readonly visitCount = new Map<string, number>();
  private ants: Ant[] = [];
  private adjacency: Adjacency = new Map();
  private tickCount = 0;

  constructor(config: GraphAntConfig) {
    this.config = config;
  }

  updateGraph(springs: Array<{ source: string; target: string; kind?: string; strength: number; restLength: number }>): void {
    const next = new Map<string, Map<string, { kind: string }>>();
    for (const e of springs) {
      let srcMap = next.get(e.source);
      if (!srcMap) {
        srcMap = new Map();
        next.set(e.source, srcMap);
      }
      srcMap.set(e.target, { kind: e.kind ?? "structural" });

      let tgtMap = next.get(e.target);
      if (!tgtMap) {
        tgtMap = new Map();
        next.set(e.target, tgtMap);
      }
      tgtMap.set(e.source, { kind: e.kind ?? "structural" });

      const key = edgeKey(e.source, e.target);
      if (!this.pheromone.has(key)) {
        this.pheromone.set(key, 0.5);
      }
    }
    this.adjacency = next;

    if (this.ants.length < this.config.antCount) {
      const nodes = [...this.adjacency.keys()];
      while (this.ants.length < this.config.antCount && nodes.length > 0) {
        const start = nodes[Math.floor(Math.random() * nodes.length)]!;
        this.ants.push({ at: start, visited: new Set([start]), stepsTaken: 0 });
      }
    }
  }

  tick(): AntTrailEdge[] {
    this.tickCount += 1;

    for (const [key, ph] of this.pheromone) {
      this.pheromone.set(key, Math.max(0.01, ph * (1 - this.config.evaporationRate)));
    }

    for (const ant of this.ants) {
      for (let step = 0; step < this.config.stepsPerTick; step++) {
        this.stepAnt(ant);
      }
      if (ant.stepsTaken > this.config.stepsPerTick * 3) {
        this.resetAnt(ant);
      }
    }

    return this.buildForceEdges();
  }

  private stepAnt(ant: Ant): void {
    const neighbors = this.adjacency.get(ant.at);
    if (!neighbors || neighbors.size === 0) {
      this.resetAnt(ant);
      return;
    }

    const candidates: string[] = [];
    const weights: number[] = [];

    for (const [neighborId, edge] of neighbors) {
      const key = edgeKey(ant.at, neighborId);
      const tau = Math.max(0.01, this.pheromone.get(key) ?? 0.5);
      const visits = this.visitCount.get(key) ?? 0;
      const novelty = 1 / (1 + visits * this.config.revisitPenalty);
      const eta = Math.max(0.001, novelty);
      const w = Math.pow(tau, this.config.alpha) * Math.pow(eta, this.config.beta);
      candidates.push(neighborId);
      weights.push(w);
    }

    if (candidates.length === 0) {
      this.resetAnt(ant);
      return;
    }

    const chosen = weightedChoice(candidates, weights);
    const key = edgeKey(ant.at, chosen);

    const novelty = 1 / (1 + (this.visitCount.get(key) ?? 0));
    this.pheromone.set(key, Math.min(
      this.config.maxPheromone,
      (this.pheromone.get(key) ?? 0.5) + this.config.depositRate * novelty,
    ));
    this.visitCount.set(key, (this.visitCount.get(key) ?? 0) + 1);

    ant.at = chosen;
    ant.visited.add(chosen);
    ant.stepsTaken += 1;
  }

  private resetAnt(ant: Ant): void {
    const nodes = [...this.adjacency.keys()];
    if (nodes.length === 0) return;
    const start = nodes[Math.floor(Math.random() * nodes.length)]!;
    ant.at = start;
    ant.visited = new Set([start]);
    ant.stepsTaken = 0;
  }

  private buildForceEdges(): AntTrailEdge[] {
    const edges: AntTrailEdge[] = [];
    for (const [key, ph] of this.pheromone) {
      if (ph < 0.1) continue;
      const [source, target] = parseEdgeKey(key);
      if (!source || !target) continue;
      const strength = this.config.forceScale * Math.min(1, ph / this.config.maxPheromone);
      if (strength < 0.001) continue;
      edges.push({
        source,
        target,
        pheromone: ph,
        strength,
        restLength: 80 + 120 * (1 - Math.min(1, ph / this.config.maxPheromone)),
      });
    }
    return edges;
  }

  stats(): { antCount: number; edgeCount: number; avgPheromone: number; tickCount: number } {
    let sum = 0;
    for (const ph of this.pheromone.values()) sum += ph;
    return {
      antCount: this.ants.length,
      edgeCount: this.pheromone.size,
      avgPheromone: this.pheromone.size > 0 ? sum / this.pheromone.size : 0,
      tickCount: this.tickCount,
    };
  }
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}||${b}` : `${b}||${a}`;
}

function parseEdgeKey(key: string): [string, string] {
  const idx = key.indexOf("||");
  if (idx < 0) return ["", ""];
  return [key.slice(0, idx), key.slice(idx + 2)];
}

function weightedChoice(items: string[], weights: number[]): string {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return items[0] ?? "";
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}
