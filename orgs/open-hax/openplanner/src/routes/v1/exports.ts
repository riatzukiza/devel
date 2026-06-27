/**
 * Export API — Native OpenPlanner implementation replacing Python km_labels.
 *
 * Exports label records as SFT/RLHF training datasets in JSONL format.
 * API shape matches the legacy Python /api/export/ contract.
 */

import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

// ── Types ────────────────────────────────────────────────────────────

interface ExportManifest {
  export_id: string;
  tenant_id: string;
  domain_id?: string | null;
  format: string;
  filters: Record<string, any>;
  created_at: string;
  example_count: number;
  checksums: Record<string, string>;
  datasheet?: string;
}

function labelsCollection(app: FastifyInstance) {
  return app.mongo.db.collection("km_labels");
}

function buildContextText(context: any[]): string {
  if (!context?.length) return "";
  const chunks = context.map((c: any) => c.text).filter(Boolean);
  if (!chunks.length) return "";
  return "\n\nContext:\n" + chunks.join("\n\n---\n\n");
}

// ── Routes ───────────────────────────────────────────────────────────

export async function exportRoutes(app: FastifyInstance) {
  // Export SFT format
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id/sft", async (req, reply) => {
    const { tenant_id } = req.params;
    const { domain_id, overall = "approve", include_gold = "true", min_groundedness } =
      req.query as any;

    const filter: any = { tenant_id, "labels.overall": overall };
    if (domain_id) filter.domain_id = domain_id;
    if (min_groundedness) {
      filter["labels.groundedness"] = { $in: ["fully-grounded", min_groundedness] };
    }

    const rows = await labelsCollection(app)
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    const useGold = include_gold !== "false";
    const lines: string[] = [];

    for (const row of rows) {
      const contextText = buildContextText(row.context ?? []);
      const prompt = `Question:${contextText}\n\n${row.question}\n\nAnswer:`;
      const target = useGold && row.gold_answer ? row.gold_answer : row.answer;

      lines.push(
        JSON.stringify({
          prompt,
          target,
          metadata: {
            example_id: row.example_id,
            domain_id: row.domain_id,
            model: row.model,
            labels: row.labels,
          },
        }),
      );
    }

    const export_id = crypto.randomUUID();
    const content = lines.join("\n");
    const checksum = createHash("sha256").update(content).digest("hex");

    reply.header("X-Export-Id", export_id);
    reply.header("X-Example-Count", String(rows.length));
    reply.header("X-Checksum", `sha256:${checksum}`);
    reply.header("Content-Type", "application/jsonl");
    return reply.send(content);
  });

  // Export RLHF format
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id/rlhf", async (req, reply) => {
    const { tenant_id } = req.params;
    const { domain_id, include_negative = "false" } = req.query as any;

    const filter: any = { tenant_id };
    if (domain_id) filter.domain_id = domain_id;

    const rows = await labelsCollection(app)
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    const approved = rows.filter((r) => r.labels?.overall === "approve");
    const rejected = rows.filter((r) => r.labels?.overall === "reject");
    const lines: string[] = [];

    // Positive examples
    for (const row of approved) {
      const contextText = buildContextText(row.context ?? []);
      const prompt = `Question:${contextText}\n\n${row.question}\n\nAnswer:`;
      const target = row.gold_answer || row.answer;

      lines.push(
        JSON.stringify({
          prompt,
          chosen: target,
          rejected: null,
          metadata: {
            example_id: row.example_id,
            domain_id: row.domain_id,
            labels: row.labels,
          },
        }),
      );
    }

    // Preference pairs (approved vs rejected)
    if (include_negative !== "false" && rejected.length) {
      for (let i = 0; i < Math.min(approved.length, rejected.length); i++) {
        const aRow = approved[i];
        const rRow = rejected[i];
        const contextText = buildContextText(aRow.context ?? []);
        const prompt = `Question:${contextText}\n\n${aRow.question}\n\nAnswer:`;

        lines.push(
          JSON.stringify({
            prompt,
            chosen: aRow.gold_answer || aRow.answer,
            rejected: rRow.answer,
            metadata: {
              approved_id: aRow.example_id,
              rejected_id: rRow.example_id,
              domain_id: aRow.domain_id,
            },
          }),
        );
      }
    }

    const export_id = crypto.randomUUID();
    const content = lines.join("\n");
    const checksum = createHash("sha256").update(content).digest("hex");

    reply.header("X-Export-Id", export_id);
    reply.header("X-Example-Count", String(lines.length));
    reply.header("X-Checksum", `sha256:${checksum}`);
    reply.header("Content-Type", "application/jsonl");
    return reply.send(content);
  });

  // Export manifest
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id/manifest", async (req, reply) => {
    const { tenant_id } = req.params;
    const { format = "sft", domain_id } = req.query as any;

    const filter: any = { tenant_id };
    if (domain_id) filter.domain_id = domain_id;

    const rows = await labelsCollection(app).find(filter).toArray();
    const approved = rows.filter((r) => r.labels?.overall === "approve").length;
    const needsEdit = rows.filter((r) => r.labels?.overall === "needs-edit").length;
    const rejected = rows.filter((r) => r.labels?.overall === "reject").length;

    return {
      export_id: crypto.randomUUID(),
      tenant_id,
      domain_id: domain_id ?? null,
      format,
      filters: domain_id ? { domain_id } : {},
      created_at: new Date().toISOString(),
      example_count: rows.length,
      checksums: {},
      datasheet: `Generated from ${approved} approved, ${needsEdit} needs-edit, ${rejected} rejected examples.`,
    };
  });
}
