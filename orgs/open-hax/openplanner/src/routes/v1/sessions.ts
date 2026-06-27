import type { FastifyPluginAsync } from "fastify";

type SessionRow = {
  project: string;
  session: string;
  last_ts: string | number | null;
  event_count: number;
};

type SessionDetailMode = "full" | "resume" | "visibility";

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return Number(v);
      return v;
    })
  ) as T;
}

function normalizeTimestamp(value: unknown): string | number | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" || typeof value === "string") return value;
  return null;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSessionRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => ({
    ...row,
    ts: normalizeTimestamp(row.ts),
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
  }));
}

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.get("/sessions", async (req: any) => {
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : "";
    const limit = Math.min(parsePositiveInt(req.query?.limit, 50), 500);
    const offset = Math.max(0, Number.parseInt(String(req.query?.offset ?? "0"), 10) || 0);

    const match: Record<string, unknown> = { session: { $type: "string", $ne: "" } };
    if (project) match.project = project;

    const groupedStages = [
      { $match: match },
      {
        $group: {
          _id: { project: { $ifNull: ["$project", ""] }, session: { $ifNull: ["$session", ""] } },
          last_ts: { $max: "$ts" },
          event_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          project: "$_id.project",
          session: "$_id.session",
          last_ts: "$last_ts",
          event_count: "$event_count",
        },
      },
      { $sort: { last_ts: -1 } },
    ];

    const [rawRows, totalRows] = await Promise.all([
      app.mongo.events.aggregate([
        ...groupedStages,
        { $skip: offset },
        { $limit: limit },
      ]).toArray(),
      app.mongo.events.aggregate([
        ...groupedStages,
        { $count: "total" },
      ]).toArray(),
    ]);

    const rows = (rawRows as SessionRow[]).map((row) => ({
      ...row,
      last_ts: normalizeTimestamp(row.last_ts),
      event_count: typeof row.event_count === "bigint" ? Number(row.event_count) : row.event_count,
    }));

    const total = Number((totalRows[0] as { total?: number } | undefined)?.total ?? 0);

    return {
      ok: true,
      rows: jsonSafe(rows),
      total,
      offset,
      limit,
      has_more: offset + rows.length < total,
      storageBackend: "mongodb",
    };
  });

  app.get("/sessions/:sessionId", async (req: any, reply) => {
    const { sessionId } = req.params as any;
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : "";
    const mode = (typeof req.query?.mode === "string" ? req.query.mode.trim() : "resume") as SessionDetailMode;
    if (!sessionId) {
      return reply.code(400).send({ ok: false, error: "sessionId required" });
    }

    const filter: Record<string, unknown> = { session: sessionId };
    if (project) filter.project = project;

    if (mode === "visibility") {
      const rows = await app.mongo.events
        .find(filter, { projection: { _id: 0, extra: 1 } })
        .sort({ ts: -1 })
        .limit(parsePositiveInt(req.query?.limit, 32))
        .toArray();
      return { ok: true, session: sessionId, rows: jsonSafe(rows), storageBackend: "mongodb" };
    }

    if (mode === "resume") {
      const limit = Math.min(parsePositiveInt(req.query?.limit, 240), 1000);
      const rows = await app.mongo.events
        .find(
          { ...filter, kind: "knoxx.message" },
          {
            projection: {
              _id: 0,
              id: 1,
              ts: 1,
              source: 1,
              kind: 1,
              project: 1,
              session: 1,
              message: 1,
              role: 1,
              author: 1,
              model: 1,
              text: 1,
              attachments: 1,
              extra: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          }
        )
        .sort({ ts: -1 })
        .limit(limit)
        .toArray();
      rows.reverse();
      return { ok: true, session: sessionId, rows: jsonSafe(normalizeSessionRows(rows)), storageBackend: "mongodb" };
    }

    const rows = await app.mongo.events.find(filter).sort({ ts: 1 }).limit(100000).toArray();
    return { ok: true, session: sessionId, rows: jsonSafe(normalizeSessionRows(rows)), storageBackend: "mongodb" };
  });
};
