export type EdgeClaimStatus =
  | "proposed"
  | "supported"
  | "active"
  | "refuted"
  | "rejected"
  | "superseded"
  | "expired"
  | "withdrawn";

export type EdgeClaimDirection = "directed" | "undirected";

export type EdgeClaimIdInput = {
  sourceNodeId?: string;
  source_node_id?: string;
  source?: string;
  targetNodeId?: string;
  target_node_id?: string;
  target?: string;
  relationKind?: string;
  relation_kind?: string;
  kind?: string;
  direction?: unknown;
  scope?: Record<string, unknown> | null;
};

export type EdgeClaimProjectionInput = EdgeClaimIdInput & {
  claimId?: string;
  claim_id?: string;
  status?: unknown;
  confidence?: unknown;
  validUntil?: unknown;
  valid_until?: unknown;
};

export type NormalizedEdgeClaimInput = {
  claim_id?: string;
  source_node_id?: string;
  target_node_id?: string;
  relation_kind: string;
  direction: EdgeClaimDirection;
  scope: Record<string, unknown>;
  status: EdgeClaimStatus;
  confidence: number;
  valid_until_ms?: number;
};

export type EdgeClaimProjectionOptions = {
  statuses?: unknown[];
  includeExpired?: boolean;
  now?: unknown;
};

export type EdgeClaimDecisionKind = "accept" | "reject" | "defer" | "supersede";

export type EdgeClaimExplainResult = {
  "valid?": boolean;
  errors: Array<{ path: unknown[]; error: string; value?: unknown }>;
};

export type EdgeClaimDecision = {
  kind: EdgeClaimDecisionKind;
  reason: string;
  data: Record<string, unknown>;
};

export type EdgeClaimLifecycleAction = "support" | "refute" | "withdraw";

export type EdgeClaimTransitionPlan = {
  action: EdgeClaimLifecycleAction;
  status: EdgeClaimStatus;
  confidence?: number | null;
  eventField?: "support_event_ids" | "refute_event_ids" | null;
  eventIds: string[];
};

export type ProjectedEdgeClaim = {
  source: string;
  target: string;
  kind: string;
  claim_id: string;
  confidence: number;
  direction: EdgeClaimDirection;
  scope: Record<string, unknown>;
  status: EdgeClaimStatus;
};

export function normalizeEdgeClaimStatus(value: unknown, fallback?: EdgeClaimStatus): EdgeClaimStatus;
export function normalizeEdgeClaimDirection(value: unknown): EdgeClaimDirection;
export function normalizeEdgeClaimScope(value: unknown): Record<string, unknown> | null;
export function buildEdgeClaimId(input: EdgeClaimIdInput): string;
export function normalizeEdgeClaimInput(input: EdgeClaimProjectionInput): NormalizedEdgeClaimInput;
export function claimProjectable(claim: EdgeClaimProjectionInput, options?: EdgeClaimProjectionOptions): boolean;
export function projectEdgeClaim(claim: EdgeClaimProjectionInput, options?: EdgeClaimProjectionOptions): ProjectedEdgeClaim | null;
export function projectEdgeClaims(claims: EdgeClaimProjectionInput[], options?: EdgeClaimProjectionOptions): {
  edges: ProjectedEdgeClaim[];
  stats: { claims: number; edges: number };
};
export function projectMongoEdgeClaims(claims: EdgeClaimProjectionInput[], options?: EdgeClaimProjectionOptions): {
  edges: ProjectedEdgeClaim[];
  stats: { claims: number; edges: number };
};
export function explainEdgeClaim(claim: EdgeClaimProjectionInput): EdgeClaimExplainResult;
export function evaluateEdgeClaim(claim: EdgeClaimProjectionInput): EdgeClaimDecision;
export function planEdgeClaimTransition(action: EdgeClaimLifecycleAction, body?: Record<string, unknown>): EdgeClaimTransitionPlan;
