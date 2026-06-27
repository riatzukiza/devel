import type { FastifyPluginAsync } from "fastify";
import { deleteMongoVectorEntriesByFilter } from "../../lib/mongo-vectors.js";

type LakeSummary = {
  project: string;
  totalEvents: number;
  latestTs: string | null;
  kinds: Record<string, number>;
};

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function collateLakeRows(
  rows: Array<{ project?: unknown; kind?: unknown; count?: unknown; latestTs?: unknown }>,
): LakeSummary[] {
  const byProject = new Map<string, LakeSummary>();

  for (const row of rows) {
    const project = String(row.project ?? "").trim();
    if (!project) continue;

    const kind = String(row.kind ?? "unknown").trim() || "unknown";
    const count = typeof row.count === "number" ? row.count : 0;
    const latestTs = toIsoString(row.latestTs);

    const current = byProject.get(project) ?? {
      project,
      totalEvents: 0,
      latestTs: null,
      kinds: {},
    };

    current.totalEvents += count;
    current.kinds[kind] = (current.kinds[kind] ?? 0) + count;

    if (latestTs && (!current.latestTs || Date.parse(latestTs) > Date.parse(current.latestTs))) {
      current.latestTs = latestTs;
    }

    byProject.set(project, current);
  }

  return [...byProject.values()].sort((a, b) => a.project.localeCompare(b.project));
}

export const lakeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/lakes", async () => {
    const db = app.mongo;
    const rows = await db.events.aggregate([
      {
        $match: {
          project: { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: { project: "$project", kind: "$kind" },
          count: { $sum: 1 },
          latestTs: { $max: "$ts" },
        },
      },
      {
        $project: {
          _id: 0,
          project: "$_id.project",
          kind: "$_id.kind",
          count: 1,
          latestTs: 1,
        },
      },
      {
        $sort: { project: 1, kind: 1 },
      },
    ]).toArray();

    const lakes = collateLakeRows(rows);
    return { ok: true, count: lakes.length, lakes, storageBackend: "mongodb" };
  });

  app.post("/lakes/purge", async (req: any, reply) => {
    const projects = Array.isArray(req.body?.projects)
      ? req.body.projects.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)
      : [];
    const sources = Array.isArray(req.body?.sources)
      ? req.body.sources.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)
      : [];
    const kinds = Array.isArray(req.body?.kinds)
      ? req.body.kinds.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)
      : [];

    if (projects.length === 0 && sources.length === 0 && kinds.length === 0) {
      return reply.code(400).send({ ok: false, error: "at least one of projects[], sources[], or kinds[] is required" });
    }

    const db = app.mongo;
    const filter: Record<string, unknown> = {};
    if (projects.length > 0) filter.project = { $in: projects };
    if (sources.length > 0) filter.source = { $in: sources };
    if (kinds.length > 0) filter.kind = { $in: kinds };
    
    const eventsResult = await db.events.deleteMany(filter);
    const compactedResult = await db.compacted.deleteMany(filter);
    await deleteMongoVectorEntriesByFilter(db, "hot", filter);
    await deleteMongoVectorEntriesByFilter(db, "compact", filter);
    
    const deletedEvents = Number(eventsResult.deletedCount ?? 0);
    const deletedCompacted = Number(compactedResult.deletedCount ?? 0);

    return {
      ok: true,
      storageBackend: "mongodb",
      projects,
      sources,
      kinds,
      deletedEvents,
      deletedCompacted,
    };
  });
};
