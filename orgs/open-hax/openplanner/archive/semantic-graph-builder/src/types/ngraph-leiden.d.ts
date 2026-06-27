declare module "ngraph.leiden" {
  import type { Graph, NodeId } from "ngraph.graph";

  export interface DetectClustersOptions {
    quality?: "modularity" | "cpm";
    resolution?: number;
    directed?: boolean;
    randomSeed?: number;
    refine?: boolean;
    candidateStrategy?: "neighbors" | "all" | "random" | "random-neighbor";
    maxCommunitySize?: number;
    allowNewCommunity?: boolean;
  }

  export interface ClustersResult {
    getClass(nodeId: NodeId): number;
    getCommunities(): Map<number, string[]>;
    quality(): number;
    toJSON(): {
      membership: Record<string, number>;
      meta: {
        levels: number;
        quality: number;
        options: Record<string, unknown>;
      };
    };
  }

  export function detectClusters(graph: Graph<any, any>, options?: DetectClustersOptions): ClustersResult;
}
