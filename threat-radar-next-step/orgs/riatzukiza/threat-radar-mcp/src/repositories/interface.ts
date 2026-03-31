export interface CreateRadarInput {
  slug: string;
  title: string;
  description?: string;
  templateKey?: string;
  ownerNode?: string;
}

export interface AddSourceInput {
  radarId: string;
  sourceKey: string;
  sourceType: string;
  title: string;
  trustWeight?: number;
  config: Record<string, unknown>;
}

export interface SavePacketInput {
  radarId: string;
  modelId: string;
  packetTimestamp: string;
  packet: Record<string, unknown>;
  evidenceHash: string;
  supportWeight?: number;
  moduleVersionId?: string | null;
}

export interface SealDailySnapshotInput {
  radarId: string;
  snapshotDate: string;
  reducerVersion: string;
  packetCount: number;
  disagreementScore: number;
  snapshot: Record<string, unknown>;
}

export interface SaveLiveSnapshotInput {
  radarId: string;
  liveRevision: number;
  reducerVersion: string;
  packetCount: number;
  disagreementScore: number;
  snapshot: Record<string, unknown>;
}

export interface CreateProposalInput {
  radarId: string;
  targetModuleKind:
    | 'ontology'
    | 'source_adapter'
    | 'prompt'
    | 'reducer_config'
    | 'render_config'
    | 'branch_catalog';
  title: string;
  rationale?: string;
  proposedPayload: Record<string, unknown>;
  proposedBy?: string;
}

export interface RadarRepository {
  createRadar(input: CreateRadarInput): Promise<{ id: string; slug: string }>;
  listRadars(): Promise<Array<{ id: string; slug: string; title: string; status: string }>>;
  addSource(input: AddSourceInput): Promise<{ id: string; sourceKey: string }>;
  savePacket(input: SavePacketInput): Promise<{ id: string }>;
  saveLiveSnapshot(input: SaveLiveSnapshotInput): Promise<{ id: string }>;
  sealDailySnapshot(input: SealDailySnapshotInput): Promise<{ id: string }>;
  createProposal(input: CreateProposalInput): Promise<{ id: string }>;
  getWallView(): Promise<
    Array<{
      radarId: string;
      slug: string;
      title: string;
      status: string;
      latestSnapshot: Record<string, unknown> | null;
      latestSnapshotAt: string | null;
    }>
  >;
}
