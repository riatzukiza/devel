import type { FastifyPluginAsync } from "fastify";
import { all } from "../../lib/duckdb.js";
import type { FtsSearchRequest, VectorSearchRequest } from "../../lib/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: FtsSearchRequest }>("/search/fts", async (req, reply) => {
    const body = req.body;
    const q = body.q;
    const limit = body.limit ?? 20;
    if (!q || typeof q !== "string") return reply.status(400).send({ error: "q is required" });

    const lim = Math.max(1, Math.min(200, Number(limit)));

    const where: string[] = [];
    const params: any[] = [];

    if (body.source) { where.push("source = ?"); params.push(body.source); }
    if (body.kind) { where.push("kind = ?"); params.push(body.kind); }
    if (body.project) { where.push("project = ?"); params.push(body.project); }
    if (body.session) { where.push("session = ?"); params.push(body.session); }

    const filterSql = where.length ? `AND ${where.join(" AND ")}` : "";

    let rows: any[] = [];

    if (app.duck.ftsEnabled) {
      // FTS tables are created by PRAGMA create_fts_index, usually as fts_main_<table>.
      // We'll try an FTS query and fallback if it fails.
      try {
        rows = await all(app.duck.conn, `
          SELECT e.id, e.ts, e.source, e.kind, e.project, e.session, e.message, e.role, e.model,
                 substr(e.text, 1, 240) AS snippet
          FROM events e
          WHERE e.id IN (SELECT docid FROM fts_main_events WHERE fts_main_events MATCH ?)
          ${filterSql}
          ORDER BY e.ts DESC
          LIMIT ?
        `, [q, ...params, lim]);
      } catch {
        rows = await all(app.duck.conn, `
          SELECT id, ts, source, kind, project, session, message, role, model,
                 substr(text, 1, 240) AS snippet
          FROM events
          WHERE text ILIKE ?
          ${where.length ? `AND ${where.join(" AND ")}` : ""}
          ORDER BY ts DESC
          LIMIT ?
        `, [`%${q}%`, ...params, lim]);
      }
    } else {
      rows = await all(app.duck.conn, `
        SELECT id, ts, source, kind, project, session, message, role, model,
               substr(text, 1, 240) AS snippet
        FROM events
        WHERE text ILIKE ?
        ${where.length ? `AND ${where.join(" AND ")}` : ""}
        ORDER BY ts DESC
        LIMIT ?
      `, [`%${q}%`, ...params, lim]);
    }

    return { ok: true, ftsEnabled: app.duck.ftsEnabled, count: rows.length, rows };
  });

  app.post<{ Body: VectorSearchRequest }>("/search/vector", async (req, reply) => {
    const body = req.body;
    const q = body.q;
    const k = body.k ?? 20;

    if (!q || typeof q !== "string") return reply.status(400).send({ error: "q is required" });

    const whereFromBody = isRecord(body.where) ? { ...body.where } : {};
    if (body.source) whereFromBody.source = body.source;
    if (body.kind) whereFromBody.kind = body.kind;
    if (body.project) whereFromBody.project = body.project;

    const embeddingScope = {
      source: typeof whereFromBody.source === "string" ? whereFromBody.source : undefined,
      kind: typeof whereFromBody.kind === "string" ? whereFromBody.kind : undefined,
      project: typeof whereFromBody.project === "string" ? whereFromBody.project : undefined,
    };
    const embeddingFunction = app.chroma.embeddingFunctionFor?.(embeddingScope) ?? app.chroma.embeddingFunction;
    if (!embeddingFunction) return reply.status(500).send({ error: "embedding function unavailable" });

    const collection = await app.chroma.client.getCollection({
      name: app.chroma.collectionName,
      embeddingFunction
    });
    const whereClause = Object.keys(whereFromBody).length > 0 ? whereFromBody : undefined;
    const result = await collection.query({
      queryTexts: [q],
      nResults: Math.max(1, Math.min(200, Number(k))),
      where: whereClause
    });

    return { ok: true, result };
  });
};
