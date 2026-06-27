import type { GraphNode, GraphSnapshot } from "./graph.js";

function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function lakeKey(node: GraphNode): string {
  const lake = node.data?.lake;
  if (typeof lake === "string" && lake.trim()) return lake.trim();
  if (node.id.includes(":")) return node.id.split(":", 1)[0] || "misc";
  return "misc";
}

function subtypeKey(node: GraphNode): string {
  const nodeType = node.data?.node_type;
  if (typeof nodeType === "string" && nodeType.trim()) return nodeType.trim();
  if (node.kind) return node.kind;
  return "node";
}

function groupKey(node: GraphNode): string {
  return `${lakeKey(node)}::${subtypeKey(node)}`;
}

function lakeAnchor(lake: string, index: number, total: number): { x: number; y: number } {
  const canonical = ["devel", "web", "bluesky"];
  const canonicalIdx = canonical.indexOf(lake);
  if (canonicalIdx >= 0) {
    return {
      x: (canonicalIdx - 1) * 1100,
      y: 0,
    };
  }

  const radius = 1300;
  const angle = (Math.PI * 2 * index) / Math.max(1, total);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.75 };
}

export function layoutGraph(snapshot: GraphSnapshot): Map<string, { x: number; y: number }> {
  const nodes = snapshot.nodes;
  const groups = new Map<string, string[]>();
  const groupMeta = new Map<string, { lake: string; subtype: string }>();
  for (const n of nodes) {
    const key = groupKey(n);
    const arr = groups.get(key) ?? [];
    arr.push(n.id);
    groups.set(key, arr);
    groupMeta.set(key, { lake: lakeKey(n), subtype: subtypeKey(n) });
  }

  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const anchors = new Map<string, { x: number; y: number }>();

  const lakes = [...new Set(keys.map((key) => groupMeta.get(key)?.lake || "misc"))].sort((a, b) => a.localeCompare(b));
  const byLake = new Map<string, string[]>();
  for (const key of keys) {
    const lake = groupMeta.get(key)?.lake || "misc";
    const arr = byLake.get(lake) ?? [];
    arr.push(key);
    byLake.set(lake, arr);
  }

  lakes.forEach((lake, lakeIndex) => {
    const base = lakeAnchor(lake, lakeIndex, lakes.length);
    const lakeGroups = (byLake.get(lake) ?? []).sort((a, b) => a.localeCompare(b));
    const count = Math.max(1, lakeGroups.length);
    lakeGroups.forEach((key, index) => {
      const band = index - (count - 1) / 2;
      anchors.set(key, {
        x: base.x,
        y: base.y + band * 300,
      });
    });
  });

  const positions = new Map<string, { x: number; y: number }>();
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (const [key, ids] of groups) {
    ids.sort((a, b) => a.localeCompare(b));
    const base = anchors.get(key) ?? { x: 0, y: 0 };
    const keyPhase = ((hash32(key) % 628) / 100) * 0.85;

    // Spread within the group using a sunflower (Vogel) pattern.
    // This avoids the "clumpy rings" effect for large groups.
    const size = Math.max(1, ids.length);
    const rMax = 40 + Math.min(900, Math.sqrt(size) * 10);
    const spacing = rMax / Math.sqrt(size + 1);

    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i]!;
      const h = hash32(id);

      const depth = id.startsWith("file:") ? id.slice("file:".length).split("/").length : 2;
      const depthBias = Math.min(90, depth * 5);

      const angle = keyPhase + i * golden;
      const radial = spacing * Math.sqrt(i + 1) + depthBias;
      const jitter = (((h % 2000) / 2000) - 0.5) * spacing * 0.6;

      positions.set(id, {
        x: base.x + Math.cos(angle) * (radial + jitter),
        y: base.y + Math.sin(angle) * (radial + jitter) * 0.86,
      });
    }
  }

  return positions;
}
