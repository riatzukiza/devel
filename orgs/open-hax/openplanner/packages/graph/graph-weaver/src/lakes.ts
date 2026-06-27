import { GraphStore } from "./store.js";

export type OpenPlannerLakeSummary = {
  project: string;
  totalEvents: number;
  latestTs: string | null;
  kinds: Record<string, number>;
};

export type OpenPlannerGarden = {
  garden_id: string;
  title: string;
  purpose: string;
  lakes: string[];
  views?: string[];
  actions?: string[];
  outputs?: string[];
};

type OpenPlannerLakesResponse = {
  ok: boolean;
  lakes?: OpenPlannerLakeSummary[];
};

type OpenPlannerGardensResponse = {
  ok: boolean;
  gardens?: OpenPlannerGarden[];
};

function trimBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

async function fetchJson<T>(url: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (apiKey && apiKey.trim()) {
    headers.authorization = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenPlanner request failed ${response.status} ${response.statusText}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenPlanner returned invalid JSON for ${url}: ${message}`);
  }
}

function lakeNodeId(project: string): string {
  return `lake:${project}`;
}

function gardenNodeId(gardenId: string): string {
  return `garden:${gardenId}`;
}

export async function rebuildLakeGraph(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey?: string;
  store: GraphStore;
}): Promise<{ seeds: string[] }> {
  const baseUrl = trimBaseUrl(params.openPlannerBaseUrl || "");
  if (!baseUrl) {
    throw new Error("GRAPH_WEAVER_LOCAL_SOURCE=openplanner-lakes requires OPENPLANNER_BASE_URL");
  }

  const [lakesPayload, gardensPayload] = await Promise.all([
    fetchJson<OpenPlannerLakesResponse>(`${baseUrl}/v1/lakes`, params.openPlannerApiKey),
    fetchJson<OpenPlannerGardensResponse>(`${baseUrl}/v1/gardens`, params.openPlannerApiKey),
  ]);

  const lakeRows = Array.isArray(lakesPayload.lakes) ? lakesPayload.lakes : [];
  const gardenRows = Array.isArray(gardensPayload.gardens) ? gardensPayload.gardens : [];
  const store = params.store;

  const rootId = "lake-root:openplanner";
  store.upsertNode({
    id: rootId,
    kind: "lake-root",
    label: "OpenPlanner lakes",
    external: false,
    loadedByDefault: true,
    layer: "local",
    data: {
      source: "openplanner",
      lakeCount: lakeRows.length,
      gardenCount: gardenRows.length,
    },
  });

  const knownLakes = new Map<string, OpenPlannerLakeSummary>();
  for (const row of lakeRows) {
    const project = String(row.project || "").trim();
    if (!project) continue;
    knownLakes.set(project, row);
  }

  for (const garden of gardenRows) {
    for (const project of garden.lakes ?? []) {
      const normalized = String(project || "").trim();
      if (!normalized || knownLakes.has(normalized)) continue;
      knownLakes.set(normalized, {
        project: normalized,
        totalEvents: 0,
        latestTs: null,
        kinds: {},
      });
    }
  }

  for (const lake of [...knownLakes.values()].sort((a, b) => a.project.localeCompare(b.project))) {
    const id = lakeNodeId(lake.project);
    store.upsertNode({
      id,
      kind: "lake",
      label: lake.project,
      external: false,
      loadedByDefault: true,
      layer: "local",
      data: {
        project: lake.project,
        totalEvents: lake.totalEvents,
        latestTs: lake.latestTs,
        kinds: lake.kinds,
      },
    });
    store.upsertEdge({
      id: `${rootId}=>${id}:contains`,
      source: rootId,
      target: id,
      kind: "contains",
      layer: "local",
      data: { source: "openplanner" },
    });
  }

  for (const garden of gardenRows) {
    const gardenId = String(garden.garden_id || "").trim();
    if (!gardenId) continue;

    const id = gardenNodeId(gardenId);
    store.upsertNode({
      id,
      kind: "garden",
      label: garden.title || gardenId,
      external: false,
      loadedByDefault: true,
      layer: "local",
      data: {
        gardenId,
        purpose: garden.purpose,
        lakes: garden.lakes ?? [],
        views: garden.views ?? [],
        actions: garden.actions ?? [],
        outputs: garden.outputs ?? [],
      },
    });
    store.upsertEdge({
      id: `${rootId}=>${id}:catalog`,
      source: rootId,
      target: id,
      kind: "catalog",
      layer: "local",
      data: { source: "openplanner" },
    });

    for (const project of garden.lakes ?? []) {
      const normalized = String(project || "").trim();
      if (!normalized) continue;
      store.upsertEdge({
        id: `${id}=>${lakeNodeId(normalized)}:uses`,
        source: id,
        target: lakeNodeId(normalized),
        kind: "uses",
        layer: "local",
        data: { gardenId, project: normalized },
      });
    }
  }

  return { seeds: [] };
}
