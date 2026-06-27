import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { exportPrometheusMetrics, gaugeSet } from "../../lib/metrics.js";

type MongoMetricCounts = {
  events: number;
  compacted: number;
  hotVectors: number;
  compactVectors: number;
};

const mongoGaugeRefreshMs = Math.max(5_000, Math.min(10 * 60_000, Number(process.env.OPENPLANNER_METRICS_MONGO_REFRESH_MS ?? 60_000)));
let lastMongoGaugeRefresh = 0;
let lastMongoGaugeCounts: MongoMetricCounts | null = null;
let pendingMongoGaugeRefresh: Promise<MongoMetricCounts> | null = null;

function scheduleMongoGaugeRefresh(app: FastifyInstance): void {
  const now = Date.now();
  if (lastMongoGaugeCounts && now - lastMongoGaugeRefresh < mongoGaugeRefreshMs) return;
  if (pendingMongoGaugeRefresh) return;

  pendingMongoGaugeRefresh = refreshMongoGaugesNow(app)
    .then((counts) => {
      lastMongoGaugeCounts = counts;
      lastMongoGaugeRefresh = Date.now();
      return counts;
    })
    .catch(() => lastMongoGaugeCounts ?? { events: 0, compacted: 0, hotVectors: 0, compactVectors: 0 })
    .finally(() => {
      pendingMongoGaugeRefresh = null;
    });
}

async function refreshMongoGauges(app: FastifyInstance): Promise<MongoMetricCounts> {
  const now = Date.now();
  if (lastMongoGaugeCounts && now - lastMongoGaugeRefresh < mongoGaugeRefreshMs) {
    return lastMongoGaugeCounts;
  }
  if (pendingMongoGaugeRefresh) return await pendingMongoGaugeRefresh;

  pendingMongoGaugeRefresh = refreshMongoGaugesNow(app);
  try {
    const counts = await pendingMongoGaugeRefresh;
    lastMongoGaugeCounts = counts;
    lastMongoGaugeRefresh = Date.now();
    return counts;
  } finally {
    pendingMongoGaugeRefresh = null;
  }
}

async function refreshMongoGaugesNow(app: FastifyInstance): Promise<MongoMetricCounts> {
  const [eventsCount, compactedCount, hotVectorsCount, compactVectorsCount] = await Promise.all([
    app.mongo.events.countDocuments(),
    app.mongo.compacted.countDocuments(),
    app.mongo.hotVectors.countDocuments(),
    app.mongo.compactVectors.countDocuments(),
  ]);

  gaugeSet("openplanner_events_total", eventsCount, { backend: "mongodb" });
  gaugeSet("openplanner_compacted_total", compactedCount, { backend: "mongodb" });
  gaugeSet("openplanner_vectors_hot_total", hotVectorsCount, { backend: "mongodb" });
  gaugeSet("openplanner_vectors_compact_total", compactVectorsCount, { backend: "mongodb" });
  gaugeSet("openplanner_fts_enabled", 1, { backend: "mongodb" });

  return {
    events: eventsCount,
    compacted: compactedCount,
    hotVectors: hotVectorsCount,
    compactVectors: compactVectorsCount,
  };
}

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/metrics", async (_req, reply) => {
    scheduleMongoGaugeRefresh(app);
    return reply
      .header("content-type", "text/plain; version=0.0.4; charset=utf-8")
      .send(exportPrometheusMetrics());
  });

  app.get("/metrics/json", async () => {
    const counts = await refreshMongoGauges(app);

    return {
      ok: true,
      storageBackend: "mongodb",
      counts,
      ftsEnabled: true,
    };
  });
};
