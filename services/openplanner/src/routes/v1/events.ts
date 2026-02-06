import type { FastifyPluginAsync } from "fastify";
import { run } from "../../lib/duckdb.js";
import type { EventIngestRequest, EventEnvelopeV1 } from "../../lib/types.js";

function norm(v: any): string | null {
  if (v === undefined || v === null) return null;
  return String(v);
}

function toJson(v: any): string | null {
  if (v === undefined || v === null) return null;
  try { return JSON.stringify(v); } catch { return null; }
}

function validateEvent(ev: EventEnvelopeV1) {
  if (!ev || ev.schema !== "openplanner.event.v1") throw new Error("event.schema must be openplanner.event.v1");
  if (!ev.id) throw new Error("event.id required");
  if (!ev.ts) throw new Error("event.ts required (ISO)");
  if (!ev.source) throw new Error("event.source required");
  if (!ev.kind) throw new Error("event.kind required");
}

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: EventIngestRequest }>("/events", async (req, reply) => {
    const body = req.body;
    if (!body || !Array.isArray(body.events)) return reply.badRequest("expected { events: [...] }");

    const ids: string[] = [];

    for (const ev of body.events) {
      validateEvent(ev);

      const sr = ev.source_ref ?? {};
      const meta = ev.meta ?? {};
      const role = norm((meta as any).role);
      const author = norm((meta as any).author);
      const model = norm((meta as any).model);
      const tags = (meta as any).tags;

      await run(app.duck.conn, `
        INSERT INTO events (
          id, ts, source, kind, project, session, message, role, author, model, tags, text, attachments, extra
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          ts=excluded.ts,
          source=excluded.source,
          kind=excluded.kind,
          project=excluded.project,
          session=excluded.session,
          message=excluded.message,
          role=excluded.role,
          author=excluded.author,
          model=excluded.model,
          tags=excluded.tags,
          text=excluded.text,
          attachments=excluded.attachments,
          extra=excluded.extra
      `, [
        ev.id,
        ev.ts,
        ev.source,
        ev.kind,
        norm((sr as any).project),
        norm((sr as any).session),
        norm((sr as any).message),
        role,
        author,
        model,
        toJson(tags),
        norm(ev.text ?? ""),
        toJson(ev.attachments ?? []),
        toJson(ev.extra ?? {})
      ]);

      ids.push(ev.id);
    }

    return { ok: true, count: ids.length, ids, ftsEnabled: app.duck.ftsEnabled };
  });
};
