import type { FastifyPluginAsync } from "fastify";

/**
 * Raw MongoDB collection browsing and querying.
 *
 * NOTE: This plugin is registered with prefix `/mongo` under `/v1`.
 * So these handlers are mounted as:
 *   GET  /v1/mongo/collections
 *   POST /v1/mongo/query
 */

const ALLOWED_SORT_DIRECTIONS = new Set([1, -1]);

function sanitizeCollectionName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  // MongoDB collection names: no empty, no system.*, no null bytes, max 120 chars
  if (!trimmed || trimmed.length > 120) return null;
  if (trimmed.startsWith("system.")) return null;
  if (trimmed.includes("\0")) return null;
  // Allow alphanumeric, dots, underscores, hyphens
  if (!/^[a-zA-Z0-9._\-]+$/.test(trimmed)) return null;
  return trimmed;
}

export const mongoRoutes: FastifyPluginAsync = async (app) => {
  /**
   * List all MongoDB collections with document counts.
   *
   * Uses estimatedDocumentCount() which reads collection metadata (O(1))
   * instead of countDocuments() which performs a full collection scan.
   */
  app.get("/collections", async () => {
    const db = app.mongo.db;
    const collections = await db.listCollections().toArray();

    const results = await Promise.all(
      collections.map(async (col) => {
        const name = col.name;
        try {
          const count = await db.collection(name).estimatedDocumentCount();
          return { name, count, type: col.type ?? "collection" };
        } catch {
          return { name, count: -1, type: col.type ?? "collection" };
        }
      }),
    );

    return {
      ok: true,
      collections: results.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });

  /**
   * Query a specific collection.
   *
   * Body:
   *   collection: string  — collection name
   *   filter: object      — MongoDB filter (default: {})
   *   limit: number       — max rows (default 50, max 500)
   *   skip: number        — offset (default 0)
   *   sort: object        — sort spec e.g. { ts: -1 } (default: { _id: -1 })
   *   projection: object  — field projection e.g. { title: 1, kind: 1 }
   *
   * Returns: { ok, collection, count, total, rows }
   */
  app.post("/query", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const collectionName = sanitizeCollectionName(body.collection);

    if (!collectionName) {
      return reply.status(400).send({ ok: false, error: "Invalid collection name" });
    }

    const db = app.mongo.db;
    const collection = db.collection(collectionName);

    // Parse filter
    let filter: Record<string, unknown> = {};
    if (body.filter && typeof body.filter === "object" && !Array.isArray(body.filter)) {
      filter = body.filter as Record<string, unknown>;
    }

    // Parse limit (cap at 500)
    const rawLimit = Number(body.limit);
    const limit = Math.max(1, Math.min(isNaN(rawLimit) ? 50 : rawLimit, 500));

    // Parse skip
    const rawSkip = Number(body.skip);
    const skip = Math.max(0, isNaN(rawSkip) ? 0 : rawSkip);

    // Parse sort (default: newest first by _id)
    let sort: Record<string, 1 | -1> = { _id: -1 };
    if (body.sort && typeof body.sort === "object" && !Array.isArray(body.sort)) {
      const rawSort = body.sort as Record<string, unknown>;
      const parsed: Record<string, 1 | -1> = {};
      for (const [k, v] of Object.entries(rawSort)) {
        const dir = Number(v);
        if (ALLOWED_SORT_DIRECTIONS.has(dir)) {
          parsed[k] = dir as 1 | -1;
        }
      }
      if (Object.keys(parsed).length > 0) sort = parsed;
    }

    // Parse projection
    let projection: Record<string, number> | undefined;
    if (body.projection && typeof body.projection === "object" && !Array.isArray(body.projection)) {
      projection = body.projection as Record<string, number>;
    }

    try {
      const total = await collection.countDocuments(filter);
      let cursor = collection.find(filter, { projection }).sort(sort).skip(skip).limit(limit);
      const rows = await cursor.toArray();

      return {
        ok: true,
        collection: collectionName,
        count: rows.length,
        total,
        skip,
        limit,
        rows,
      };
    } catch (err: any) {
      return reply.status(400).send({ ok: false, error: err.message });
    }
  });
};
