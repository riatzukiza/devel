export type TruthOpBase = {
  record: 'ημ.truth-op.v1';
  time: string;
  op: string;
  note?: string;
};

export type WikilinkResolveOp = TruthOpBase & {
  op: 'wikilink.resolve';
  target_key: string;
  dst_entity_id: string;
};

export type TruthOp = WikilinkResolveOp | (TruthOpBase & Record<string, any>);

export function truthOpsPath(vaultRoot: string): string;

export function appendTruthOp(opts: {
  vaultRoot: string;
  op: TruthOp;
}): void;

export function loadTruthOps(opts: { vaultRoot: string; limit?: number }): TruthOp[];

export function buildTruthView(opts: {
  docsIndexRows: any[];
  truthOps: TruthOp[];
  limitUnresolved?: number;
}): {
  resolutions: Record<string, string>;
  resolvedEdges: Array<{
    kind: 'wikilink';
    src_entity_id: string;
    dst_entity_id: string;
    target_key: string;
    line: number;
  }>;
  unresolved: Array<{
    target_key: string;
    count: number;
    examples: Array<{ src_entity_id: string; src_rel_path: string; line: number }>;
  }>;
};
