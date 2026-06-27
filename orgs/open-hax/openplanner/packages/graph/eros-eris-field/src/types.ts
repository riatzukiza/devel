export type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Mass participates in Barnes–Hut aggregation (defaults to 1). */
  mass: number;
};

export type SpringEdge = {
  source: string;
  target: string;
  kind?: string;
  strength: number;
  restLength: number;
};

export type SemanticEdge = {
  a: string;
  b: string;
  /** Cosine similarity in [-1,1]. */
  sim: number;
};

export type FieldConfig = {
  /** Barnes–Hut approximation parameter (0.4..1.2 typical). */
  theta: number;

  /** Weak long-range Barnes–Hut repulsion. Keep low; local repulsion should dominate. */
  repulsionStrength: number;

  /** Radius for strong node-local repulsion. */
  localRepulsionRadius: number;

  /** Strength of the node-local repulsion field. */
  localRepulsionStrength: number;

  /** Falloff exponent for node-local repulsion (higher = faster falloff). */
  localRepulsionPower: number;

  /** Softening term to avoid infinite forces at small distance. */
  softening: number;

  /** Velocity damping per step (0..1). */
  damping: number;

  /** Cap particle speed. */
  maxSpeed: number;

  /** Hard-core separation radius (world units). */
  minSeparation: number;

  /** Extra repulsion applied inside minSeparation. */
  separationStrength: number;

  /** Semantic force: attraction applies when sim >= this. */
  semanticAttractAbove: number;

  /** Semantic force: repulsion applies when sim <= this. */
  semanticRepelBelow: number;

  semanticAttractStrength: number;
  semanticRepelStrength: number;

  /** Only apply semantic repulsion inside this radius so dissimilar nodes do not globally explode apart. */
  semanticRepelRadius: number;

  /** Base spring rest length for semantic attraction. */
  semanticRestLength: number;

  /** Maximum distance before a semantic attraction edge "breaks" and stops pulling. Scales with similarity: weak edges break sooner. */
  semanticBreakDistance: number;

  /**
   * Target radius for a soft circular boundary.
   * The field applies inward pressure near this radius to keep nodes off the edge.
   */
  targetRadius: number;

  /** Thickness of the boundary pressure band (world units). */
  boundaryThickness: number;
  /** Inward pressure strength applied near the boundary (higher = more push). */
  boundaryPressure: number;

  /** Only the outermost fraction of nodes should feel boundary pressure. */
  boundaryEdgeFraction: number;
};

export type Force = { fx: number; fy: number };
