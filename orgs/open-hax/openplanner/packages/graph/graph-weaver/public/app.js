import { WebGLGraphView, rgba } from "/vendor/webgl-graph-view/index.js";

const canvas = document.getElementById("canvas");
const canvasWrap = document.querySelector(".canvasWrap");
const labelLayer = document.getElementById("labelLayer");
const statusEl = document.getElementById("status");
const nodeEl = document.getElementById("node");
const legendEl = document.getElementById("legend");
const filtersEl = document.getElementById("filters");
const daimoiSummaryEl = document.getElementById("daimoiSummary");
const daimoiListEl = document.getElementById("daimoiList");
const semanticFieldSummaryEl = document.getElementById("semanticFieldSummary");
const semanticFieldListEl = document.getElementById("semanticFieldList");

const fitBtn = document.getElementById("fit");
const reloadBtn = document.getElementById("reload");
const applyBtn = document.getElementById("apply");
const rescanNowBtn = document.getElementById("rescanNow");
const refreshDaimoiBtn = document.getElementById("refreshDaimoi");
const refreshSemanticFieldBtn = document.getElementById("refreshSemanticField");

const ui = {
  renderNodes: /** @type {HTMLInputElement} */ (document.getElementById("renderNodes")),
  renderEdges: /** @type {HTMLInputElement} */ (document.getElementById("renderEdges")),
  ants: /** @type {HTMLInputElement} */ (document.getElementById("ants")),
  dispatch: /** @type {HTMLInputElement} */ (document.getElementById("dispatch")),
  concurrency: /** @type {HTMLInputElement} */ (document.getElementById("concurrency")),
  perHost: /** @type {HTMLInputElement} */ (document.getElementById("perHost")),
  revisit: /** @type {HTMLInputElement} */ (document.getElementById("revisit")),
  rescan: /** @type {HTMLInputElement} */ (document.getElementById("rescan")),
  showDaimoi: /** @type {HTMLInputElement} */ (document.getElementById("showDaimoi")),
  daimoiLimit: /** @type {HTMLInputElement} */ (document.getElementById("daimoiLimit")),
  daimoiActivation: /** @type {HTMLInputElement} */ (document.getElementById("daimoiActivation")),
  daimoiLookback: /** @type {HTMLInputElement} */ (document.getElementById("daimoiLookback")),
  daimoiQuery: /** @type {HTMLInputElement} */ (document.getElementById("daimoiQuery")),
  showSemanticField: /** @type {HTMLInputElement} */ (document.getElementById("showSemanticField")),
  semanticFieldProfile: /** @type {HTMLInputElement} */ (document.getElementById("semanticFieldProfile")),
  semanticFieldCellLimit: /** @type {HTMLInputElement} */ (document.getElementById("semanticFieldCellLimit")),
  semanticFieldSampleLimit: /** @type {HTMLInputElement} */ (document.getElementById("semanticFieldSampleLimit")),

  vRenderNodes: document.getElementById("v-renderNodes"),
  vRenderEdges: document.getElementById("v-renderEdges"),
  vAnts: document.getElementById("v-ants"),
  vDispatch: document.getElementById("v-dispatch"),
  vConcurrency: document.getElementById("v-concurrency"),
  vPerHost: document.getElementById("v-perHost"),
  vRevisit: document.getElementById("v-revisit"),
  vRescan: document.getElementById("v-rescan"),
  vDaimoiLimit: document.getElementById("v-daimoiLimit"),
  vDaimoiActivation: document.getElementById("v-daimoiActivation"),
  vDaimoiLookback: document.getElementById("v-daimoiLookback"),
  vSemanticFieldCellLimit: document.getElementById("v-semanticFieldCellLimit"),
  vSemanticFieldSampleLimit: document.getElementById("v-semanticFieldSampleLimit"),
};

const LAYER_COLORS = {
  local: [0.42, 0.82, 0.98, 0.95],
  web: [0.36, 0.94, 0.72, 0.94],
  user: [0.98, 0.56, 0.42, 0.94],
  semantic: [1.0, 0.38, 0.9, 0.9],
  presence: [1.0, 0.92, 0.36, 0.96],
  transient: [0.98, 0.72, 1.0, 0.88],
  daimoi: [0.58, 0.48, 1.0, 0.94],
  field: [0.34, 1.0, 0.88, 0.9],
  unknown: [0.68, 0.78, 0.92, 0.88],
};

const NODE_STYLES = {
  file: { sizePx: 6.6, color: [0.42, 0.84, 1.0, 0.98] },
  url: { sizePx: 7.6, color: [1.0, 0.46, 0.9, 0.98] },
  dep: { sizePx: 6.5, color: [1.0, 0.78, 0.36, 0.98] },
  presence: { sizePx: 12.5, color: [1.0, 0.92, 0.26, 1.0] },
  resource: { sizePx: 11.5, color: [0.36, 1.0, 0.72, 1.0] },
  muse: { sizePx: 13.5, color: [1.0, 0.46, 1.0, 1.0] },
  transient: { sizePx: 9.5, color: [0.98, 0.72, 1.0, 0.96] },
  daimoi: { sizePx: 14.5, color: [0.64, 0.52, 1.0, 1.0] },
  daimoi_anchor: { sizePx: 6.8, color: [0.58, 0.74, 1.0, 0.9] },
  semantic_field_cell: { sizePx: 10.5, color: [0.34, 1.0, 0.88, 0.96] },
  default: { sizePx: 6.1, color: [0.68, 0.9, 0.98, 0.95] },
};

const EDGE_COLORS = {
  import: [0.74, 0.58, 0.98, 0.34],
  dep: [1.0, 0.76, 0.34, 0.28],
  ref: [0.42, 0.9, 0.98, 0.26],
  link: [0.32, 0.96, 0.7, 0.22],
  web: [0.36, 0.94, 0.72, 0.18],
  user: [1.0, 0.56, 0.46, 0.24],
  observes: [1.0, 0.92, 0.58, 0.26],
  semantic_knn: [1.0, 0.38, 0.9, 0.18],
  semantic_similarity: [1.0, 0.38, 0.9, 0.32],
  semantic_transient: [1.0, 0.72, 0.28, 0.38],
  daimoi_origin: [0.88, 0.72, 1.0, 0.5],
  daimoi_current: [0.62, 0.52, 1.0, 0.74],
  daimoi_trail: [0.48, 0.72, 1.0, 0.44],
  semantic_field_child: [0.34, 1.0, 0.88, 0.26],
  semantic_field_multipole: [0.32, 1.0, 0.78, 0.36],
  code_dependency: [0.52, 0.82, 1.0, 0.28],
  local_markdown_link: [0.6, 0.96, 0.84, 0.22],
  external_web_link: [1.0, 0.68, 0.46, 0.24],
  default: [0.72, 0.84, 1.0, 0.12],
};

const filterState = {
  layers: null,
  nodeKinds: null,
  edgeKinds: null,
};
let filterOptionsSignature = "";

let fullGraph = null;
let renderedGraph = { nodes: [], edges: [] };
let baseGraph = null;
let daimoiSnapshots = [];
let semanticFieldOverlay = { cells: [], samples: [] };

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(input) {
  // same as escapeHtml; explicit name so it reads clearly in templates
  return escapeHtml(input);
}

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseDataJson(maybeJson) {
  if (!maybeJson) return null;
  try {
    return JSON.parse(maybeJson);
  } catch {
    return { note: "invalid json", raw: maybeJson };
  }
}

function rgbaCss(color) {
  const [r, g, b, a] = color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function inferLayer(item) {
  return item?.layer || item?.data?.layer || "unknown";
}

function inferNodeKind(node) {
  const kind = node?.kind || "node";
  if (kind === "presence") return node?.data?.presence_class || "presence";
  return kind;
}

function inferEdgeKind(edge) {
  return edge?.kind || "relation";
}

function nodeStyleForKind(kind) {
  return NODE_STYLES[kind] || NODE_STYLES.default;
}

function edgeColorForKind(kind, alphaScale = 1, edge = null) {
  const [r, g, b, a] = EDGE_COLORS[kind] || EDGE_COLORS.default;
  const conductance = Number(edge?.data?.conductance ?? edge?.data?.similarity ?? 0);
  const semanticBoost = kind?.startsWith?.("semantic") ? Math.max(0.25, Math.min(1.6, 0.45 + conductance)) : 1;
  return [r, g, b, Math.min(0.95, a * alphaScale * semanticBoost)];
}

function shortNode(id) {
  if (!id) return "";
  if (id.startsWith("file:")) {
    const rel = id.slice("file:".length);
    return rel.split("/").slice(-1)[0] || rel;
  }
  if (id.startsWith("dep:")) return id.slice("dep:".length);
  if (id.startsWith("url:")) {
    const url = id.slice("url:".length);
    try {
      const u = new URL(url);
      return u.host;
    } catch {
      return url;
    }
  }
  return id;
}

function highlightAll(container) {
  const hljs = window.hljs;
  if (!hljs) return;
  container.querySelectorAll("pre code").forEach((el) => {
    try {
      hljs.highlightElement(el);
    } catch {
      // ignore
    }
  });
}

function markdownToHtml(md) {
  const marked = window.marked;
  const html = marked && typeof marked.parse === "function" ? marked.parse(md, { mangle: false, headerIds: false }) : `<pre>${escapeHtml(md)}</pre>`;
  const purify = window.DOMPurify;
  return purify && typeof purify.sanitize === "function" ? purify.sanitize(html) : html;
}

function htmlToMarkdown(html, baseUrl) {
  const TurndownService = window.TurndownService;
  if (!TurndownService) return "";

  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");

  // remove noisy / unsafe blocks before conversion
  doc.querySelectorAll("script,style,noscript").forEach((el) => {
    el.remove();
  });

  // normalize relative links so markdown is useful
  try {
    const base = baseUrl ? new URL(baseUrl) : null;
    if (base) {
      doc.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (!href) return;
        try {
          a.setAttribute("href", new URL(href, base).toString());
        } catch {
          // ignore
        }
      });

      doc.querySelectorAll("img[src]").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (!src) return;
        try {
          img.setAttribute("src", new URL(src, base).toString());
        } catch {
          // ignore
        }
      });
    }
  } catch {
    // ignore
  }

  const td = new TurndownService({
    codeBlockStyle: "fenced",
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
  });

  const gfm = window.turndownPluginGfm;
  // plugin shape varies by bundler; handle a couple common patterns
  if (gfm) {
    if (typeof gfm.gfm === "function") td.use(gfm.gfm);
    else if (typeof gfm === "function") td.use(gfm);
  }

  return td.turndown(doc.body);
}

async function gql(query, variables) {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await res.json();
  if (payload.errors && payload.errors.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }
  return payload.data;
}

const view = new WebGLGraphView(canvas, {
  background: rgba(0.03, 0.06, 0.11, 0.98),
  onNodeClick: (node) => {
    void selectNodeById(node.id);
  },
  nodeStyle: (node) => {
    const style = nodeStyleForKind(inferNodeKind(node));
    return { sizePx: style.sizePx, color: rgba(...style.color) };
  },
  haloStyle: (node) => {
    const style = nodeStyleForKind(inferNodeKind(node));
    return { sizePx: style.sizePx + 13, color: rgba(style.color[0], style.color[1], style.color[2], 0.22) };
  },
  edgeStyle: (edge) => {
    // Auto-dim edges when you crank up render edges.
    // (Without this, 100k+ edges becomes a bright wall and hides the nodes.)
    const aMul = edgeAlphaScale;
    const color = edgeColorForKind(inferEdgeKind(edge), aMul, edge);
    return { color: rgba(...color) };
  },
});

let edgeAlphaScale = 1;

function edgeAlphaScaleForCount(edgeCount) {
  const base = 12000;
  if (edgeCount <= base) return 1;
  return Math.max(0.06, Math.sqrt(base / Math.max(1, edgeCount)));
}

let lastMeta = null;
let lastRenderCounts = { nodes: 0, edges: 0 };
let lastGraphNodesById = new Map();

function renderLegend(graph) {
  if (!legendEl) return;

  const layers = [...new Set([
    ...graph.nodes.map((node) => inferLayer(node)),
    ...graph.edges.map((edge) => inferLayer(edge)),
  ])].sort();
  const nodeKinds = [...new Set(graph.nodes.map((node) => inferNodeKind(node)))].sort();
  const edgeKinds = [...new Set(graph.edges.map((edge) => inferEdgeKind(edge)))].sort();

  const section = (title, rows) => `
    <div class="legendSection">
      <div class="legendTitle">${escapeHtml(title)}</div>
      <div class="legendItems">${rows.join("\n")}</div>
    </div>
  `;

  legendEl.innerHTML = [
    section(
      "layers",
      layers.map((layer) => {
        const color = rgbaCss(LAYER_COLORS[layer] || LAYER_COLORS.unknown);
        return `<div class="legendItem"><span class="swatch" style="background:${escapeAttr(color)}"></span><span>${escapeHtml(layer)}</span></div>`;
      }),
    ),
    section(
      "node kinds",
      nodeKinds.map((kind) => {
        const color = rgbaCss(nodeStyleForKind(kind).color);
        return `<div class="legendItem"><span class="swatch" style="background:${escapeAttr(color)}"></span><span>${escapeHtml(kind)}</span></div>`;
      }),
    ),
    section(
      "edge kinds",
      edgeKinds.map((kind) => {
        const color = rgbaCss(edgeColorForKind(kind));
        return `<div class="legendItem"><span class="swatch swatchEdge" style="background:${escapeAttr(color)}"></span><span>${escapeHtml(kind)}</span></div>`;
      }),
    ),
    `<div class="legendNote">Legend reflects the current OpenPlanner graph model: layers, node kinds, and edge kinds.</div>`,
  ].join("\n");
}

function graphFilterOptions(graph) {
  return {
    layers: [...new Set([
      ...graph.nodes.map((node) => inferLayer(node)),
      ...graph.edges.map((edge) => inferLayer(edge)),
    ])].sort(),
    nodeKinds: [...new Set(graph.nodes.map((node) => inferNodeKind(node)))].sort(),
    edgeKinds: [...new Set(graph.edges.map((edge) => inferEdgeKind(edge)))].sort(),
  };
}

function ensureFilterSelections(options) {
  // Initialize once from the first graph. After that, websocket ticks must not
  // silently re-check filters that the operator deliberately turned off.
  if (!filterState.layers) filterState.layers = new Set(options.layers);
  if (!filterState.nodeKinds) filterState.nodeKinds = new Set(options.nodeKinds);
  if (!filterState.edgeKinds) filterState.edgeKinds = new Set(options.edgeKinds);
}

function renderFilters(graph) {
  if (!filtersEl) return;
  const options = graphFilterOptions(graph);
  ensureFilterSelections(options);

  const signature = JSON.stringify(options);
  if (signature === filterOptionsSignature) return;
  filterOptionsSignature = signature;

  const { layers, nodeKinds, edgeKinds } = options;

  const checkbox = (group, value, checked) => `
    <label class="filterOption">
      <input type="checkbox" data-filter-group="${escapeAttr(group)}" data-filter-value="${escapeAttr(value)}" ${checked ? "checked" : ""} />
      <span>${escapeHtml(value)}</span>
    </label>
  `;

  filtersEl.innerHTML = `
    <div class="legendSection">
      <div class="legendTitle">layers</div>
      <div class="filterGroup">${layers.map((value) => checkbox("layer", value, filterState.layers.has(value))).join("\n")}</div>
    </div>
    <div class="legendSection">
      <div class="legendTitle">node kinds</div>
      <div class="filterGroup">${nodeKinds.map((value) => checkbox("nodeKind", value, filterState.nodeKinds.has(value))).join("\n")}</div>
    </div>
    <div class="legendSection">
      <div class="legendTitle">edge kinds</div>
      <div class="filterGroup">${edgeKinds.map((value) => checkbox("edgeKind", value, filterState.edgeKinds.has(value))).join("\n")}</div>
    </div>
  `;
}

function stableUnit(id) {
  let h = 2166136261;
  for (let i = 0; i < String(id).length; i += 1) {
    h ^= String(id).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function vectorNear(base, id, radius = 72) {
  const a = stableUnit(`${id}:a`) * Math.PI * 2;
  const r = radius * (0.35 + stableUnit(`${id}:r`) * 0.65);
  return { x: Number(base?.x ?? 0) + Math.cos(a) * r, y: Number(base?.y ?? 0) + Math.sin(a) * r };
}

function snapshotLabel(snapshot) {
  const query = String(snapshot.queryText || "").trim();
  if (query) return query.length > 52 ? `${query.slice(0, 49)}…` : query;
  return snapshot.daimoiId || snapshot.id;
}

function renderDaimoiAuditPanel() {
  if (!daimoiSummaryEl || !daimoiListEl) return;
  if (!ui.showDaimoi.checked) {
    daimoiSummaryEl.textContent = "snapshots hidden";
    daimoiListEl.innerHTML = "";
    return;
  }

  const avgActivation = daimoiSnapshots.length
    ? daimoiSnapshots.reduce((sum, row) => sum + Number(row.activation || 0), 0) / daimoiSnapshots.length
    : 0;
  daimoiSummaryEl.textContent = `${daimoiSnapshots.length.toLocaleString()} snapshots · avg activation ${avgActivation.toFixed(3)}`;
  daimoiListEl.innerHTML = daimoiSnapshots.slice(0, 40).map((snapshot) => {
    const id = `daimoi-snapshot:${snapshot.id}`;
    const time = snapshot.emittedAt ? new Date(snapshot.emittedAt).toLocaleTimeString() : "unknown time";
    return `
      <button class="auditItem" data-node-id="${escapeAttr(id)}">
        <span class="auditTitle">${escapeHtml(snapshotLabel(snapshot))}</span>
        <span class="auditMeta">act ${Number(snapshot.activation || 0).toFixed(3)} · cost ${Number(snapshot.traversalCost || 0).toFixed(3)} · ${escapeHtml(time)}</span>
      </button>
    `;
  }).join("\n");
}

function renderSemanticFieldAuditPanel() {
  if (!semanticFieldSummaryEl || !semanticFieldListEl) return;
  if (!ui.showSemanticField.checked) {
    semanticFieldSummaryEl.textContent = "field hidden";
    semanticFieldListEl.innerHTML = "";
    return;
  }

  const cells = semanticFieldOverlay.cells || [];
  const samples = semanticFieldOverlay.samples || [];
  const totalMass = cells.reduce((sum, row) => sum + Number(row.mass || row.nodeCount || 0), 0);
  const profile = cells[0]?.fieldProfile || samples[0]?.fieldProfile || String(ui.semanticFieldProfile.value || "latest").trim() || "latest";
  semanticFieldSummaryEl.textContent = `${cells.length.toLocaleString()} cells · ${samples.length.toLocaleString()} multipoles · mass ${totalMass.toLocaleString()} · ${profile}`;
  semanticFieldListEl.innerHTML = cells.slice(0, 48).map((cell) => {
    const time = cell.updatedAt ? new Date(cell.updatedAt).toLocaleTimeString() : "unknown time";
    return `
      <button class="auditItem" data-node-id="${escapeAttr(cell.id)}">
        <span class="auditTitle">${escapeHtml(shortNode(cell.id))}</span>
        <span class="auditMeta">level ${Number(cell.level || 0)} · nodes ${Number(cell.nodeCount || 0).toLocaleString()} · charge ${Number(cell.charge || 0).toFixed(3)} · ${escapeHtml(time)}</span>
      </button>
    `;
  }).join("\n");
}

function overlayDaimoiSnapshots(graph, snapshots) {
  if (!ui.showDaimoi.checked || snapshots.length === 0) return graph;

  const nodes = [...graph.nodes];
  const edges = [...graph.edges];
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const addNode = (node) => {
    if (nodesById.has(node.id)) return nodesById.get(node.id);
    nodes.push(node);
    nodesById.set(node.id, node);
    return node;
  };
  const addAnchor = (id, near, role) => {
    if (!id) return null;
    const existing = nodesById.get(id);
    if (existing) return existing;
    const pos = vectorNear(near || { x: 0, y: 0 }, `${id}:${role}`, 96);
    return addNode({
      id,
      kind: "daimoi_anchor",
      label: shortNode(id),
      x: pos.x,
      y: pos.y,
      external: true,
      loadedByDefault: false,
      layer: "daimoi",
      data: { layer: "daimoi", role, unresolved_anchor: true },
    });
  };

  snapshots.forEach((snapshot, index) => {
    const origin = addAnchor(snapshot.originNodeId, null, "origin");
    const current = addAnchor(snapshot.currentNodeId, origin, "current");
    const base = current || origin || { x: 0, y: 0 };
    const pos = vectorNear(base, `${snapshot.id}:${index}`, 58);
    const snapshotId = `daimoi-snapshot:${snapshot.id}`;
    const snapshotNode = addNode({
      id: snapshotId,
      kind: "daimoi",
      label: snapshotLabel(snapshot),
      x: pos.x,
      y: pos.y,
      external: false,
      loadedByDefault: true,
      layer: "daimoi",
      data: {
        layer: "daimoi",
        snapshot,
        query_text: snapshot.queryText,
        daimoi_id: snapshot.daimoiId,
        activation: snapshot.activation,
        traversal_cost: snapshot.traversalCost,
        emitted_at: snapshot.emittedAt,
      },
    });
    if (origin) {
      edges.push({ source: origin.id, target: snapshotNode.id, kind: "daimoi_origin", layer: "daimoi", data: { snapshot_id: snapshot.id } });
    }
    if (current) {
      edges.push({ source: snapshotNode.id, target: current.id, kind: "daimoi_current", layer: "daimoi", data: { snapshot_id: snapshot.id, activation: snapshot.activation } });
    }

    const trail = Array.isArray(snapshot.trail) && snapshot.trail.length > 0 ? snapshot.trail : snapshot.nodeIds;
    for (let i = 0; i < trail.length - 1; i += 1) {
      const a = addAnchor(trail[i], snapshotNode, "trail");
      const b = addAnchor(trail[i + 1], a || snapshotNode, "trail");
      if (a && b) {
        edges.push({ source: a.id, target: b.id, kind: "daimoi_trail", layer: "daimoi", data: { snapshot_id: snapshot.id, step: i } });
      }
    }
  });

  return {
    nodes,
    edges,
    meta: {
      ...graph.meta,
      totalNodes: Number(graph.meta?.totalNodes ?? graph.nodes.length) + (nodes.length - graph.nodes.length),
      totalEdges: Number(graph.meta?.totalEdges ?? graph.edges.length) + (edges.length - graph.edges.length),
    },
  };
}

function overlaySemanticField(graph, overlay) {
  if (!ui.showSemanticField.checked || !overlay || !Array.isArray(overlay.cells) || overlay.cells.length === 0) return graph;

  const nodes = [...graph.nodes];
  const edges = [...graph.edges];
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const addNode = (node) => {
    if (nodesById.has(node.id)) return nodesById.get(node.id);
    nodes.push(node);
    nodesById.set(node.id, node);
    return node;
  };

  const cells = overlay.cells || [];
  cells.forEach((cell) => {
    const mass = Math.max(1, Number(cell.mass || cell.nodeCount || 1));
    addNode({
      id: cell.id,
      kind: "semantic_field_cell",
      label: `field L${Number(cell.level || 0)} · ${Number(cell.nodeCount || 0)} nodes`,
      x: Number(cell.centerX || 0),
      y: Number(cell.centerY || 0),
      external: false,
      loadedByDefault: true,
      layer: "field",
      data: {
        layer: "field",
        cell,
        field_profile: cell.fieldProfile,
        mass,
        node_count: cell.nodeCount,
        charge: cell.charge,
        half_extent: cell.halfExtent,
      },
    });
  });

  const cellIds = new Set(cells.map((cell) => cell.id));
  cells.forEach((cell) => {
    (cell.childCellIds || []).forEach((childId) => {
      if (cellIds.has(childId)) {
        edges.push({
          source: cell.id,
          target: childId,
          kind: "semantic_field_child",
          layer: "field",
          data: { field_profile: cell.fieldProfile, parent_level: cell.level },
        });
      }
    });
  });

  (overlay.samples || []).forEach((sample) => {
    if (!cellIds.has(sample.source) || !cellIds.has(sample.target)) return;
    edges.push({
      source: sample.source,
      target: sample.target,
      kind: "semantic_field_multipole",
      layer: "field",
      data: {
        similarity: sample.similarity,
        charge: sample.charge,
        field_profile: sample.fieldProfile,
        force_kind: sample.forceKind,
        updated_at: sample.updatedAt,
      },
    });
  });

  return {
    nodes,
    edges,
    meta: {
      ...graph.meta,
      totalNodes: Number(graph.meta?.totalNodes ?? graph.nodes.length) + (nodes.length - graph.nodes.length),
      totalEdges: Number(graph.meta?.totalEdges ?? graph.edges.length) + (edges.length - graph.edges.length),
    },
  };
}

async function loadDaimoiSnapshots() {
  if (!ui.showDaimoi.checked) {
    daimoiSnapshots = [];
    renderDaimoiAuditPanel();
    return;
  }
  const data = await gql(
    `query DaimoiSnapshots($limit: Int, $minActivation: Float, $lookbackSeconds: Int, $query: String) {
      daimoiSnapshots(limit: $limit, minActivation: $minActivation, lookbackSeconds: $lookbackSeconds, query: $query) {
        id queryHash queryText daimoiId originNodeId currentNodeId nodeIds edgeKeys trail activation traversalCost emittedAt decayHalfLifeSeconds dataJson
      }
    }`,
    {
      limit: Number(ui.daimoiLimit.value || 100),
      minActivation: Number(ui.daimoiActivation.value || 0),
      lookbackSeconds: Math.max(60, Number(ui.daimoiLookback.value || 60) * 60),
      query: String(ui.daimoiQuery.value || "").trim() || null,
    },
  );
  daimoiSnapshots = (data.daimoiSnapshots || []).map((snapshot) => ({
    ...snapshot,
    data: parseDataJson(snapshot.dataJson) ?? {},
  }));
  renderDaimoiAuditPanel();
}

async function loadSemanticFieldOverlay() {
  if (!ui.showSemanticField.checked) {
    semanticFieldOverlay = { cells: [], samples: [] };
    renderSemanticFieldAuditPanel();
    return;
  }
  const profile = String(ui.semanticFieldProfile.value || "").trim();
  const data = await gql(
    `query SemanticFieldOverlay($fieldProfile: String, $cellLimit: Int, $sampleLimit: Int) {
      semanticFieldOverlay(fieldProfile: $fieldProfile, cellLimit: $cellLimit, sampleLimit: $sampleLimit) {
        cells { id fieldProfile project embeddingModel embeddingDimensions level ix iy centerX centerY halfExtent mass nodeCount nodeIds childCellIds charge updatedAt dataJson }
        samples { source target similarity charge forceKind fieldProfile project embeddingModel embeddingDimensions sourceSystem updatedAt dataJson }
      }
    }`,
    {
      fieldProfile: profile || null,
      cellLimit: Number(ui.semanticFieldCellLimit.value || 500),
      sampleLimit: Number(ui.semanticFieldSampleLimit.value || 1000),
    },
  );
  semanticFieldOverlay = {
    cells: (data.semanticFieldOverlay?.cells || []).map((cell) => ({
      ...cell,
      data: parseDataJson(cell.dataJson) ?? {},
    })),
    samples: (data.semanticFieldOverlay?.samples || []).map((sample) => ({
      ...sample,
      data: parseDataJson(sample.dataJson) ?? {},
    })),
  };
  renderSemanticFieldAuditPanel();
}

async function renderGraphWithDaimoiOverlay() {
  if (!baseGraph) return;
  await loadDaimoiSnapshots();
  await loadSemanticFieldOverlay();
  fullGraph = overlaySemanticField(overlayDaimoiSnapshots(baseGraph, daimoiSnapshots), semanticFieldOverlay);
  renderLegend(fullGraph);
  renderFilters(fullGraph);
  applyGraphFilters();
}

function applyGraphFilters() {
  if (!fullGraph) return;

  const nodes = fullGraph.nodes.filter((node) => {
    return filterState.layers.has(inferLayer(node)) && filterState.nodeKinds.has(inferNodeKind(node));
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = fullGraph.edges.filter((edge) => {
    if (!filterState.layers.has(inferLayer(edge))) return false;
    if (!filterState.edgeKinds.has(inferEdgeKind(edge))) return false;
    return nodeIds.has(edge.source) && nodeIds.has(edge.target);
  });

  lastGraphNodesById = new Map(nodes.map((node) => [node.id, node]));
  renderedGraph = { nodes, edges };
  lastRenderCounts = { nodes: nodes.length, edges: edges.length };
  edgeAlphaScale = edgeAlphaScaleForCount(lastRenderCounts.edges);
  view.setGraph({ nodes, edges, meta: fullGraph.meta });
}

function nodeScreenPosition(node) {
  const rect = canvas.getBoundingClientRect();
  const viewState = view.getView();
  return {
    x: node.x * viewState.scale + viewState.offsetX + rect.width * 0.5,
    y: node.y * viewState.scale + viewState.offsetY + rect.height * 0.5,
  };
}

function degreeMapForRenderedGraph() {
  const degree = new Map();
  for (const edge of renderedGraph.edges || []) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }
  return degree;
}

function renderLabels() {
  if (!labelLayer || !canvasWrap || !renderedGraph?.nodes?.length) {
    if (labelLayer) labelLayer.innerHTML = "";
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const degree = degreeMapForRenderedGraph();
  const selected = renderedGraph.nodes.find((node) => node.id === selectedNodeId) || null;
  const ranked = [...renderedGraph.nodes]
    .sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))
    .slice(0, 90);
  const chosen = selected ? [selected, ...ranked.filter((node) => node.id !== selected.id).slice(0, 89)] : ranked;

  labelLayer.innerHTML = chosen.map((node, idx) => {
    const pos = nodeScreenPosition(node);
    if (pos.x < -120 || pos.y < -40 || pos.x > rect.width + 120 || pos.y > rect.height + 40) return "";
    const kind = inferNodeKind(node);
    const text = node.label || shortNode(node.id);
    const degreeScore = degree.get(node.id) || 0;
    const opacity = Math.max(0.36, Math.min(0.98, 0.34 + degreeScore / 12));

    // Offset labels above-right of the node dot so they don't obscure the node.
    // Use a small index-based jitter to prevent labels from perfectly overlapping when nodes cluster.
    const offsetX = 10 + (idx % 3) * 2;
    const offsetY = -14 + Math.floor(idx / 3) * -3;
    const labelX = pos.x + offsetX;
    const labelY = pos.y + offsetY;

    return `<div class="graphLabel${selected && selected.id === node.id ? " selected" : ""}" style="left:${labelX.toFixed(1)}px;top:${labelY.toFixed(1)}px;opacity:${opacity.toFixed(2)}">${escapeHtml(text)} <span class="k">${escapeHtml(kind)}</span></div>`;
  }).join("\n");
}

function labelLoop() {
  renderLabels();
  requestAnimationFrame(labelLoop);
}

filtersEl?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const group = target.getAttribute("data-filter-group");
  const value = target.getAttribute("data-filter-value");
  if (!value) return;

  const toggle = (set) => {
    if (target.checked) set.add(value);
    else set.delete(value);
    applyGraphFilters();
    void loadStatus();
  };

  if (group === "layer") {
    toggle(filterState.layers);
    return;
  }

  if (group === "nodeKind") {
    toggle(filterState.nodeKinds);
    return;
  }

  if (group === "edgeKind") {
    toggle(filterState.edgeKinds);
  }
});

async function loadGraph() {
  const data = await gql(
    `query GraphView {
      graphView {
        nodes { id kind label x y external loadedByDefault layer dataJson }
        edges { source target kind layer dataJson }
        meta { totalNodes totalEdges sampledNodes sampledEdges }
      }
    }`,
  );

  const g = data.graphView;
  lastMeta = g.meta || null;
  baseGraph = {
    nodes: g.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      label: n.label,
      x: n.x,
      y: n.y,
      external: n.external,
      loadedByDefault: n.loadedByDefault,
      layer: n.layer,
      data: parseDataJson(n.dataJson) ?? n,
    })),
    edges: g.edges.map((e) => ({
      source: e.source,
      target: e.target,
      kind: e.kind,
      layer: e.layer,
      data: parseDataJson(e.dataJson) ?? {},
    })),
    meta: g.meta,
  };

  await renderGraphWithDaimoiOverlay();
}

async function loadStatus() {
  const data = await gql(
    `query Status {
      status {
        nodes
        edges
        seeds
        weaver { frontier inFlight }
        localSync { ok error mode lastAttemptAt }
        render { maxRenderNodes maxRenderEdges }
        scan { maxFileBytes rescanIntervalMs }
      }
    }`,
  );

  const s = data.status;
  const sampled =
    lastMeta && (lastMeta.sampledNodes || lastMeta.sampledEdges)
      ? ` · render ${lastRenderCounts.nodes}/${lastMeta.totalNodes} nodes ${lastRenderCounts.edges}/${lastMeta.totalEdges} edges`
      : "";
  const syncWarning =
    s.localSync && s.localSync.ok === false
      ? ` · ⚠ STALE: OpenPlanner sync failed${s.localSync.error ? ` (${s.localSync.error})` : ""}`
      : "";
  statusEl.textContent = `nodes ${s.nodes} · edges ${s.edges} · seeds ${s.seeds} · weaver frontier ${s.weaver.frontier} · inflight ${s.weaver.inFlight}${sampled}${syncWarning}`;
  statusEl.classList.toggle("sync-failed", !!(s.localSync && s.localSync.ok === false));
}

function bindRange(input, labelEl, format = (v) => String(v)) {
  const sync = () => {
    labelEl.textContent = format(Number(input.value));
  };
  input.addEventListener("input", sync);
  sync();
  return sync;
}

async function loadConfigIntoControls() {
  const data = await gql(
    `query Config {
      config {
        render { maxRenderNodes maxRenderEdges }
        weaver {
          ants dispatchIntervalMs maxConcurrency perHostMinIntervalMs revisitAfterMs
          alpha beta evaporation deposit requestTimeoutMs
        }
        scan { maxFileBytes rescanIntervalMs }
      }
    }`,
  );

  const cfg = data.config;

  ui.renderNodes.value = String(cfg.render.maxRenderNodes);
  ui.renderEdges.value = String(cfg.render.maxRenderEdges);

  ui.ants.value = String(cfg.weaver.ants);
  ui.dispatch.value = String(Math.round(cfg.weaver.dispatchIntervalMs / 1000));
  ui.concurrency.value = String(cfg.weaver.maxConcurrency);
  ui.perHost.value = String(Math.round(cfg.weaver.perHostMinIntervalMs / 1000));
  ui.revisit.value = String(Math.round(cfg.weaver.revisitAfterMs / (1000 * 60 * 60)));

  ui.rescan.value = String(Math.round(cfg.scan.rescanIntervalMs / (1000 * 60)));

  ui.showDaimoi.checked = false;
  ui.daimoiLimit.value = "100";
  ui.daimoiActivation.value = "0";
  ui.daimoiLookback.value = "240";
  ui.showSemanticField.checked = false;
  ui.semanticFieldProfile.value = "";
  ui.semanticFieldCellLimit.value = "500";
  ui.semanticFieldSampleLimit.value = "1000";

  bindRange(ui.renderNodes, ui.vRenderNodes, (v) => v.toLocaleString());
  bindRange(ui.renderEdges, ui.vRenderEdges, (v) => v.toLocaleString());
  bindRange(ui.ants, ui.vAnts);
  bindRange(ui.dispatch, ui.vDispatch, (v) => `${v}s`);
  bindRange(ui.concurrency, ui.vConcurrency);
  bindRange(ui.perHost, ui.vPerHost, (v) => `${v}s`);
  bindRange(ui.revisit, ui.vRevisit, (v) => `${v}h`);
  bindRange(ui.rescan, ui.vRescan, (v) => `${v}m`);
  bindRange(ui.daimoiLimit, ui.vDaimoiLimit, (v) => v.toLocaleString());
  bindRange(ui.daimoiActivation, ui.vDaimoiActivation, (v) => v.toFixed(2));
  bindRange(ui.daimoiLookback, ui.vDaimoiLookback, (v) => `${v}m`);
  bindRange(ui.semanticFieldCellLimit, ui.vSemanticFieldCellLimit, (v) => v.toLocaleString());
  bindRange(ui.semanticFieldSampleLimit, ui.vSemanticFieldSampleLimit, (v) => v.toLocaleString());
  renderDaimoiAuditPanel();
  renderSemanticFieldAuditPanel();
}

async function applyControls() {
  const patch = {
    render: {
      maxRenderNodes: Number(ui.renderNodes.value),
      maxRenderEdges: Number(ui.renderEdges.value),
    },
    weaver: {
      ants: Number(ui.ants.value),
      dispatchIntervalMs: Number(ui.dispatch.value) * 1000,
      maxConcurrency: Number(ui.concurrency.value),
      perHostMinIntervalMs: Number(ui.perHost.value) * 1000,
      revisitAfterMs: Number(ui.revisit.value) * 60 * 60 * 1000,
    },
    scan: {
      rescanIntervalMs: Number(ui.rescan.value) * 60 * 1000,
    },
  };

  await gql(
    `mutation Update($patch: ConfigPatchInput!) {
      configUpdate(patch: $patch) {
        render { maxRenderNodes maxRenderEdges }
        weaver { ants dispatchIntervalMs maxConcurrency perHostMinIntervalMs revisitAfterMs }
        scan { rescanIntervalMs }
      }
    }`,
    { patch },
  );
}

// --- node inspector

let selectedNodeId = null;
let selectionSeq = 0;
const nodePaneCache = new Map();

nodeEl.addEventListener("click", (ev) => {
  const target = ev.target.closest?.("[data-nodeid]");
  if (!target) return;
  const nodeId = target.getAttribute("data-nodeid");
  if (!nodeId) return;
  ev.preventDefault();
  void selectNodeById(nodeId);
});

function renderNodeLoading(id) {
  const quick = lastGraphNodesById.get(id);
  const label = quick?.label || shortNode(id) || id;
  nodeEl.innerHTML = `
    <div class="nodeHeader">
      <div class="nodeTitle">${escapeHtml(label)}</div>
      <div class="nodeMeta">${escapeHtml(id)}</div>
      <div class="badges"><span class="badge">loading…</span></div>
    </div>
    <div class="nodeEmpty">fetching preview…</div>
  `;
}

function edgeChipHtml(edge, label) {
  return `<a class="chip" href="#" data-nodeid="${escapeAttr(edge.target)}"><span class="k">${escapeHtml(edge.kind)}</span><span>${escapeHtml(label)}</span></a>`;
}

function renderCodeHtml(code, language) {
  const cls = language ? `language-${language}` : "";
  return `<pre><code class="${cls}">${escapeHtml(code || "")}</code></pre>`;
}

function renderNodePane(pane) {
  const node = pane.node;
  const edges = pane.edges || [];
  const preview = pane.nodePreview;

  if (!node) {
    nodeEl.innerHTML = `<div class="nodeEmpty">node not found</div>`;
    return;
  }

  const nodeData = parseDataJson(node.dataJson) ?? null;

  const badges = [
    `<span class="badge">${escapeHtml(node.kind)}</span>`,
    `<span class="badge">${escapeHtml(node.layer || "unknown")}</span>`,
    node.external ? `<span class="badge">external</span>` : "",
  ].join("");

  const actions = [];
  if (node.kind === "url") {
    const url = nodeData?.url || node.label || node.id.slice("url:".length);
    actions.push(`<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">open url</a>`);
  }

  const importEdges = node.kind === "file" ? edges.filter((e) => e.kind === "import") : [];
  const depEdges = node.kind === "file" ? edges.filter((e) => e.kind === "dep") : [];

  const importsHtml =
    importEdges.length > 0
      ? `
        <div class="nodeSectionTitle">imports</div>
        <div class="chips">
          ${importEdges
            .slice(0, 200)
            .map((e) => {
              const d = parseDataJson(e.dataJson) || {};
              const spec = typeof d.spec === "string" ? d.spec : "";
              const label = spec ? `${spec} → ${shortNode(e.target)}` : shortNode(e.target);
              return edgeChipHtml(e, label);
            })
            .join("\n")}
        </div>
      `
      : "";

  const depsHtml =
    depEdges.length > 0
      ? `
        <div class="nodeSectionTitle">deps</div>
        <div class="chips">
          ${depEdges
            .slice(0, 200)
            .map((e) => {
              const d = parseDataJson(e.dataJson) || {};
              const spec = typeof d.spec === "string" ? d.spec : "";
              const label = spec || shortNode(e.target);
              return edgeChipHtml(e, label);
            })
            .join("\n")}
        </div>
      `
      : "";

  let bodyHtml = "";
  let previewBadge = "";

  if (!preview) {
    bodyHtml = `<div class="nodeEmpty">no preview available</div>`;
  } else if (preview.format === "binary") {
    bodyHtml = `<div class="nodeEmpty">binary (${escapeHtml(preview.contentType || "application/octet-stream")})</div>`;
    previewBadge = `<span class="badge">binary</span>`;
  } else if (preview.format === "error") {
    bodyHtml = renderCodeHtml(preview.body || preview.error || "error", "text");
    previewBadge = `<span class="badge">error</span>`;
  } else if (preview.format === "markdown") {
    bodyHtml = `<div class="nodeBody">${markdownToHtml(preview.body || "")}</div>`;
    previewBadge = `<span class="badge">markdown</span>`;
  } else if (preview.format === "html") {
    const baseUrl = nodeData?.url || node.label;
    const md = htmlToMarkdown(preview.body || "", baseUrl);
    bodyHtml = `<div class="nodeBody">${markdownToHtml(md)}</div>`;
    previewBadge = `<span class="badge">web → md</span>`;
  } else {
    // code/text
    bodyHtml = `<div class="nodeBody">${renderCodeHtml(preview.body || "", preview.language || null)}</div>`;
    previewBadge = `<span class="badge">${escapeHtml(preview.language || "code")}</span>`;
  }

  const truncBadge = preview && preview.truncated ? `<span class="badge">truncated</span>` : "";
  const statusBadge = preview && typeof preview.status === "number" ? `<span class="badge">HTTP ${preview.status}</span>` : "";

  const raw = {
    node,
    nodeData,
    preview,
    edges: edges.slice(0, 30),
  };

  nodeEl.innerHTML = `
    <div class="nodeHeader">
      <div class="nodeTitle">${escapeHtml(node.label || node.id)}</div>
      <div class="nodeMeta">${escapeHtml(node.id)}</div>
      <div class="badges">${badges}${previewBadge}${statusBadge}${truncBadge}</div>
    </div>

    ${actions.length ? `<div class="nodeActions">${actions.join("\n")}</div>` : ""}

    ${importsHtml}
    ${depsHtml}

    ${bodyHtml}

    <div class="nodeBody">
      <details>
        <summary>raw</summary>
        ${renderCodeHtml(safeJson(raw), "json")}
      </details>
    </div>
  `;

  highlightAll(nodeEl);
}

async function loadNodePane(id) {
  return await gql(
    `query NodePane($id: ID!, $max: Int!) {
      node(id: $id) { id kind label external loadedByDefault layer dataJson }
      edges(source: $id, limit: 800) { id kind target layer dataJson }
      nodePreview(id: $id, maxBytes: $max) { id kind format contentType language body truncated bytes status error }
    }`,
    { id, max: 200_000 },
  );
}

function localNodePane(id) {
  const node = fullGraph?.nodes?.find((row) => row.id === id);
  if (!node || (node.kind !== "daimoi" && node.kind !== "daimoi_anchor" && node.kind !== "semantic_field_cell")) return null;
  return {
    node: {
      id: node.id,
      kind: node.kind,
      label: node.label,
      external: node.external,
      loadedByDefault: node.loadedByDefault,
      layer: node.layer,
      dataJson: safeJson(node.data ?? {}),
    },
    edges: (fullGraph.edges || [])
      .filter((edge) => edge.source === id)
      .slice(0, 800)
      .map((edge) => ({
        id: `${edge.source}->${edge.target}:${edge.kind}`,
        kind: edge.kind,
        target: edge.target,
        layer: edge.layer,
        dataJson: safeJson(edge.data ?? {}),
      })),
    nodePreview: null,
  };
}

async function selectNodeById(id) {
  selectedNodeId = id;
  view.setSelectedNode(id);

  const seq = ++selectionSeq;
  renderNodeLoading(id);

  try {
    const localPane = localNodePane(id);
    if (localPane) {
      renderNodePane(localPane);
      return;
    }
    let pane = nodePaneCache.get(id);
    if (!pane) {
      pane = await loadNodePane(id);
      nodePaneCache.set(id, pane);
    }
    if (seq !== selectionSeq) return;
    renderNodePane(pane);
  } catch (err) {
    if (seq !== selectionSeq) return;
    const message = err instanceof Error ? err.message : String(err);
    nodeEl.innerHTML = `<div class="nodeEmpty">${escapeHtml(message)}</div>`;
  }
}

// --- buttons

fitBtn.addEventListener("click", () => view.fitToGraph());
reloadBtn.addEventListener("click", async () => {
  nodePaneCache.clear();
  await loadGraph();
  await loadStatus();
  if (selectedNodeId) void selectNodeById(selectedNodeId);
});
applyBtn.addEventListener("click", async () => {
  applyBtn.disabled = true;
  try {
    await applyControls();
    nodePaneCache.clear();
    await loadGraph();
    await loadStatus();
    if (selectedNodeId) void selectNodeById(selectedNodeId);
  } finally {
    applyBtn.disabled = false;
  }
});
rescanNowBtn.addEventListener("click", async () => {
  rescanNowBtn.disabled = true;
  try {
    await gql(
      `mutation Rescan {
        rescanNow { nodes edges seeds }
      }`,
    );
    nodePaneCache.clear();
    await loadGraph();
    await loadStatus();
    if (selectedNodeId) void selectNodeById(selectedNodeId);
  } finally {
    rescanNowBtn.disabled = false;
  }
});

async function refreshAuditOverlays(button = null) {
  if (button) button.disabled = true;
  try {
    await renderGraphWithDaimoiOverlay();
    await loadStatus();
    if (selectedNodeId) void selectNodeById(selectedNodeId);
  } finally {
    if (button) button.disabled = false;
  }
}

refreshDaimoiBtn?.addEventListener("click", () => {
  void refreshAuditOverlays(refreshDaimoiBtn);
});
refreshSemanticFieldBtn?.addEventListener("click", () => {
  void refreshAuditOverlays(refreshSemanticFieldBtn);
});
ui.showDaimoi?.addEventListener("change", () => {
  void refreshAuditOverlays();
});
ui.showSemanticField?.addEventListener("change", () => {
  void refreshAuditOverlays();
});
[ui.daimoiLimit, ui.daimoiActivation, ui.daimoiLookback, ui.semanticFieldCellLimit, ui.semanticFieldSampleLimit].forEach((input) => {
  input?.addEventListener("change", () => void refreshAuditOverlays());
});
ui.daimoiQuery?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void refreshAuditOverlays();
});
ui.semanticFieldProfile?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void refreshAuditOverlays();
});
daimoiListEl?.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-node-id]") : null;
  const id = button?.getAttribute("data-node-id");
  if (id) void selectNodeById(id);
});
semanticFieldListEl?.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-node-id]") : null;
  const id = button?.getAttribute("data-node-id");
  if (id) void selectNodeById(id);
});

await loadConfigIntoControls();
await loadGraph();
view.fitToGraph();
labelLoop();
await loadStatus();

const ws = new WebSocket(`ws://${location.host}/ws`);
ws.onmessage = async () => {
  nodePaneCache.clear();
  await loadGraph();
  await loadStatus();
  if (selectedNodeId) void selectNodeById(selectedNodeId);
};
