import { Kafka, logLevel, type Producer, type RecordMetadata } from "kafkajs";
import os from "node:os";
import type { EventEnvelopeV1 } from "./types.js";
import { counterInc, gaugeSet } from "./metrics.js";

export type KafkaEventBusConfig = {
  enabled: boolean;
  brokers: string[];
  clientId: string;
  rawEventsTopic: string;
  connectTimeoutMs: number;
  requestTimeoutMs: number;
};

type Logger = {
  info: (bindings: Record<string, unknown>, message: string) => void;
  warn: (bindings: Record<string, unknown>, message: string) => void;
};

export type KafkaPublishResult =
  | { ok: true; enabled: true; topic: string; count: number; metadata: RecordMetadata[] }
  | { ok: true; enabled: false; topic: string; count: 0; reason: string }
  | { ok: false; enabled: true; topic: string; count: number; error: string };

export type KafkaBusStatus = {
  enabled: boolean;
  connected: boolean;
  brokers: string[];
  rawEventsTopic: string;
  lastError: string | null;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseBrokers(raw: string | undefined): string[] {
  return (raw ?? "redpanda:9092")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function kafkaEventBusConfigFromEnv(env: NodeJS.ProcessEnv = process.env): KafkaEventBusConfig {
  return {
    enabled: parseBool(env.OPENPLANNER_KAFKA_ENABLED, false),
    brokers: parseBrokers(env.OPENPLANNER_KAFKA_BROKERS),
    clientId: env.OPENPLANNER_KAFKA_CLIENT_ID?.trim() || "openplanner-api",
    rawEventsTopic: env.OPENPLANNER_KAFKA_EVENTS_RAW_TOPIC?.trim() || "openplanner.events.raw",
    connectTimeoutMs: parsePositiveInt(env.OPENPLANNER_KAFKA_CONNECT_TIMEOUT_MS, 10_000),
    requestTimeoutMs: parsePositiveInt(env.OPENPLANNER_KAFKA_REQUEST_TIMEOUT_MS, 30_000),
  };
}

export class OpenPlannerKafkaEventBus {
  readonly config: KafkaEventBusConfig;
  private readonly logger: Logger;
  private producer: Producer | null = null;
  private connectPromise: Promise<Producer> | null = null;
  private connected = false;
  private lastError: string | null = null;

  constructor(config: KafkaEventBusConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    gaugeSet("openplanner_kafka_enabled", config.enabled ? 1 : 0, { client: config.clientId });
    gaugeSet("openplanner_kafka_connected", 0, { client: config.clientId });
  }

  status(): KafkaBusStatus {
    return {
      enabled: this.config.enabled,
      connected: this.connected,
      brokers: this.config.brokers,
      rawEventsTopic: this.config.rawEventsTopic,
      lastError: this.lastError,
    };
  }

  async connect(): Promise<Producer | null> {
    if (!this.config.enabled) return null;
    if (this.producer && this.connected) return this.producer;
    if (this.connectPromise) return await this.connectPromise;

    this.connectPromise = (async () => {
      const kafka = new Kafka({
        clientId: this.config.clientId,
        brokers: this.config.brokers,
        connectionTimeout: this.config.connectTimeoutMs,
        requestTimeout: this.config.requestTimeoutMs,
        logLevel: logLevel.NOTHING,
      });
      const producer = kafka.producer({ allowAutoTopicCreation: true, idempotent: false });
      await producer.connect();
      this.producer = producer;
      this.connected = true;
      this.lastError = null;
      gaugeSet("openplanner_kafka_connected", 1, { client: this.config.clientId });
      this.logger.info({ brokers: this.config.brokers, topic: this.config.rawEventsTopic }, "kafka event producer connected");
      return producer;
    })();

    try {
      return await this.connectPromise;
    } catch (err) {
      this.connected = false;
      this.lastError = err instanceof Error ? err.message : String(err);
      gaugeSet("openplanner_kafka_connected", 0, { client: this.config.clientId });
      counterInc("openplanner_kafka_errors_total", { operation: "connect" });
      this.logger.warn({ err, brokers: this.config.brokers }, "kafka event producer connect failed");
      throw err;
    } finally {
      this.connectPromise = null;
    }
  }

  async publishRawEvents(events: EventEnvelopeV1[], context: { requestId?: string } = {}): Promise<KafkaPublishResult> {
    if (!this.config.enabled) {
      return { ok: true, enabled: false, topic: this.config.rawEventsTopic, count: 0, reason: "disabled" };
    }
    if (events.length === 0) {
      return { ok: true, enabled: true, topic: this.config.rawEventsTopic, count: 0, metadata: [] };
    }

    try {
      const producer = await this.connect();
      if (!producer) return { ok: true, enabled: false, topic: this.config.rawEventsTopic, count: 0, reason: "disabled" };

      const acceptedAt = new Date().toISOString();
      const metadata = await producer.send({
        topic: this.config.rawEventsTopic,
        acks: -1,
        messages: events.map((event) => ({
          key: event.id,
          value: JSON.stringify({
            schema: "openplanner.kafka.record.v1",
            topic: this.config.rawEventsTopic,
            kind: "openplanner.events.raw",
            accepted_at: acceptedAt,
            producer: {
              service: "openplanner-api",
              host: os.hostname(),
              pid: process.pid,
              request_id: context.requestId ?? null,
            },
            event,
          }),
          headers: {
            "content-type": "application/json",
            "openplanner-schema": event.schema,
            "openplanner-event-kind": event.kind,
            "openplanner-event-source": event.source,
          },
        })),
      });

      counterInc("openplanner_kafka_events_published_total", { topic: this.config.rawEventsTopic }, events.length);
      return { ok: true, enabled: true, topic: this.config.rawEventsTopic, count: events.length, metadata };
    } catch (err) {
      this.connected = false;
      this.lastError = err instanceof Error ? err.message : String(err);
      gaugeSet("openplanner_kafka_connected", 0, { client: this.config.clientId });
      counterInc("openplanner_kafka_errors_total", { operation: "publish", topic: this.config.rawEventsTopic });
      this.logger.warn({ err, topic: this.config.rawEventsTopic, count: events.length }, "kafka raw event publish failed");
      return { ok: false, enabled: true, topic: this.config.rawEventsTopic, count: events.length, error: this.lastError };
    }
  }

  async close(): Promise<void> {
    if (!this.producer) return;
    try {
      await this.producer.disconnect();
    } finally {
      this.producer = null;
      this.connected = false;
      gaugeSet("openplanner_kafka_connected", 0, { client: this.config.clientId });
    }
  }
}
