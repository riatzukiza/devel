import type { FastifyPluginAsync } from "fastify";
import { OPENPLANNER_SCHEMA_TARGETS } from "../../lib/schema-versions.js";

const DOCUMENT_KINDS = ["code", "docs", "config", "data", "document.chunk"];

const sourceRefClauses = [
  { "extra.source_path": { $type: "string", $ne: "" } },
  { "extra.path": { $type: "string", $ne: "" } },
  { "extra.url": { $type: "string", $ne: "" } },
  { "extra.hostname": { $type: "string", $ne: "" } },
  { "extra.metadata.path": { $type: "string", $ne: "" } },
  { "extra.metadata.file_id": { $type: "string", $ne: "" } },
  { "extra.metadata.url": { $type: "string", $ne: "" } },
];

const stateQuerySchema = {
  type: "object",
  properties: {
    strict: {
      type: "boolean",
      default: false,
      description: "When true, known pre-migration rehydratable event text backlog makes the state fail instead of warn.",
    },
  },
  additionalProperties: false,
} as const;

const redactionStateResponseSchema = {
  type: "object",
  required: ["ok", "status", "strict", "generatedAt", "checks", "collections"],
  properties: {
    ok: { type: "boolean" },
    status: { type: "string", enum: ["pass", "warn", "fail"] },
    strict: { type: "boolean" },
    generatedAt: { type: "string", format: "date-time" },
    checks: {
      type: "object",
      required: ["vectorRedaction", "documentBacklog", "schemaVersions"],
      properties: {
        vectorRedaction: {
          type: "object",
          required: ["ok", "redactedWithStoredText", "redactedMissingSourceRef"],
          properties: {
            ok: { type: "boolean" },
            redactedWithStoredText: { type: "number" },
            redactedMissingSourceRef: { type: "number" },
            redactedMissingOffsets: { type: "number" },
          },
          additionalProperties: true,
        },
        documentBacklog: {
          type: "object",
          required: ["ok", "rehydratableEventsWithText", "redactedEvents"],
          properties: {
            ok: { type: "boolean" },
            rehydratableEventsWithText: { type: "number" },
            redactedEvents: { type: "number" },
          },
          additionalProperties: true,
        },
        schemaVersions: {
          type: "object",
          required: ["ok", "eventTarget", "vectorChunkTarget", "eventsMissingOrBehind", "vectorsMissingOrBehind"],
          properties: {
            ok: { type: "boolean" },
            eventTarget: { type: "number" },
            vectorChunkTarget: { type: "number" },
            eventsMissingOrBehind: { type: "number" },
            vectorsMissingOrBehind: { type: "number" },
          },
          additionalProperties: true,
        },
      },
      additionalProperties: true,
    },
    collections: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "tier", "role", "total", "redacted", "redactedWithStoredText", "redactedMissingSourceRef"],
        properties: {
          name: { type: "string" },
          tier: { type: "string" },
          role: { type: "string", enum: ["flat", "partition"] },
          total: { type: "number" },
          redacted: { type: "number" },
          redactedWithStoredText: { type: "number" },
          redactedMissingSourceRef: { type: "number" },
          redactedMissingOffsets: { type: "number" },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
} as const;

async function vectorCollections(app: any): Promise<Array<{ name: string; tier: string; role: "flat" | "partition" }>> {
  const cfg = app.openplannerConfig;
  const flat = [
    { name: cfg.mongodb.vectorHotCollection, tier: "hot", role: "flat" as const },
    { name: cfg.mongodb.vectorCompactCollection, tier: "compact", role: "flat" as const },
  ];
  const partitions = await app.mongo.vectorPartitions.find({}).project({ collectionName: 1, tier: 1 }).toArray();
  return [
    ...flat,
    ...partitions.map((partition: { collectionName: string; tier?: string }) => ({
      name: partition.collectionName,
      tier: String(partition.tier ?? "unknown"),
      role: "partition" as const,
    })),
  ];
}

async function collectionRedactionStats(app: any, spec: { name: string; tier: string; role: "flat" | "partition" }) {
  const collection = app.mongo.db.collection(spec.name);
  const [total, redacted, redactedWithStoredText, redactedMissingSourceRef, redactedMissingOffsets] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ source_text_redacted: true }),
    collection.countDocuments({ source_text_redacted: true, text: { $type: "string", $ne: "" } }),
    collection.countDocuments({
      source_text_redacted: true,
      $or: [{ source_ref: { $exists: false } }, { source_ref: null }],
    }),
    collection.countDocuments({
      source_text_redacted: true,
      $or: [{ char_start: { $exists: false } }, { char_end: { $exists: false } }],
    }),
  ]);

  return {
    ...spec,
    total,
    redacted,
    redactedWithStoredText,
    redactedMissingSourceRef,
    redactedMissingOffsets,
  };
}

async function documentBacklogStats(app: any) {
  const rehydratableFilter = {
    kind: { $in: DOCUMENT_KINDS },
    source: { $ne: "knoxx" },
    text: { $type: "string", $ne: "" },
    $or: sourceRefClauses,
  };
  const [rehydratableEventsWithText, redactedEvents] = await Promise.all([
    app.mongo.events.countDocuments(rehydratableFilter),
    app.mongo.events.countDocuments({ "extra.migration_2.text_redacted": true }),
  ]);
  return {
    ok: rehydratableEventsWithText === 0,
    rehydratableEventsWithText,
    redactedEvents,
  };
}

async function schemaVersionStats(app: any, collectionNames: string[]) {
  const eventTarget = OPENPLANNER_SCHEMA_TARGETS.event;
  const vectorChunkTarget = OPENPLANNER_SCHEMA_TARGETS.vectorChunk;
  const eventsMissingOrBehind = await app.mongo.events.countDocuments({
    $or: [
      { schema_version: { $exists: false } },
      { schema_version: { $lt: eventTarget } },
    ],
  });
  const vectorCounts = await Promise.all(collectionNames.map((name) => app.mongo.db.collection(name).countDocuments({
    $or: [
      { schema_version: { $exists: false } },
      { schema_version: { $lt: vectorChunkTarget } },
    ],
  })));
  const vectorsMissingOrBehind = vectorCounts.reduce((sum, count) => sum + count, 0);
  return {
    ok: eventsMissingOrBehind === 0 && vectorsMissingOrBehind === 0,
    eventTarget,
    vectorChunkTarget,
    eventsMissingOrBehind,
    vectorsMissingOrBehind,
  };
}

export const stateRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: { strict?: boolean };
  }>("/state/redaction", {
    schema: {
      querystring: stateQuerySchema,
      response: {
        200: redactionStateResponseSchema,
      },
    },
  }, async (req) => {
    const strict = req.query.strict === true;
    const collections = await Promise.all((await vectorCollections(app)).map((spec) => collectionRedactionStats(app, spec)));
    const vectorTotals = collections.reduce((acc, row) => ({
      redactedWithStoredText: acc.redactedWithStoredText + row.redactedWithStoredText,
      redactedMissingSourceRef: acc.redactedMissingSourceRef + row.redactedMissingSourceRef,
      redactedMissingOffsets: acc.redactedMissingOffsets + row.redactedMissingOffsets,
    }), { redactedWithStoredText: 0, redactedMissingSourceRef: 0, redactedMissingOffsets: 0 });
    const documentBacklog = await documentBacklogStats(app);
    const schemaVersions = await schemaVersionStats(app, collections.map((collection) => collection.name));
    const vectorOk = vectorTotals.redactedWithStoredText === 0 && vectorTotals.redactedMissingSourceRef === 0;
    const strictBacklogOk = !strict || documentBacklog.ok;
    const ok = vectorOk && strictBacklogOk;
    const status = ok ? (documentBacklog.ok ? "pass" : "warn") : "fail";

    return {
      ok,
      status,
      strict,
      generatedAt: new Date().toISOString(),
      checks: {
        vectorRedaction: {
          ok: vectorOk,
          ...vectorTotals,
        },
        documentBacklog,
        schemaVersions,
      },
      collections,
    };
  });
};

export const redactionStateSchemas = {
  stateQuerySchema,
  redactionStateResponseSchema,
};
