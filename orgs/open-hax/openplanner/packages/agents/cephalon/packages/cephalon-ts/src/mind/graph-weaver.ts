// Deprecated compatibility shim.
// The local Cephalon helper is now named LocalMindGraph.
// Reserve "GraphWeaver" for the external graph workbench service.

export {
  LocalMindGraph as GraphWeaver,
  type LocalMindGraphEdge as GraphEdge,
  type LocalMindGraphNode as GraphNode,
} from "./local-mind-graph.js";
