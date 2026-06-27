import type { CephalonEvent, EventPayload } from "../types/index.js";

export const EVENT_ENVELOPE_SCHEMA_VERSION = 1;

export interface BoundaryEventTrace {
  correlationId?: string;
  causationId?: string;
  scheduleId?: string;
  callId?: string;
}

export interface BoundaryEventSource {
  package?: string;
  runtime?: string;
  surface?: string;
}

export interface BoundaryEventEnvelope {
  schemaVersion: number;
  id: string;
  type: string;
  timestamp: number;
  sessionId?: string;
  cephalonId?: string;
  payload: unknown;
  trace?: BoundaryEventTrace;
  source?: BoundaryEventSource;
}

export interface ToBoundaryEventEnvelopeOptions {
  cephalonId?: string;
  source?: BoundaryEventSource;
  trace?: BoundaryEventTrace;
  schemaVersion?: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function omitUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

function pickString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

export function inferSurfaceFromEventType(type: string): string | undefined {
  const [surface] = type.split(".");
  return surface || undefined;
}

export function extractBoundaryTraceFromPayload(
  payload: unknown,
): BoundaryEventTrace | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const trace = omitUndefined<BoundaryEventTrace>({
    correlationId: pickString(payload, ["correlationId", "correlation_id"]),
    causationId: pickString(payload, ["causationId", "causation_id"]),
    scheduleId: pickString(payload, ["scheduleId", "schedule_id"]),
    callId: pickString(payload, ["callId", "call_id"]),
  });

  return Object.keys(trace).length > 0 ? trace : undefined;
}

export function isBoundaryEventEnvelope(
  value: unknown,
): value is BoundaryEventEnvelope {
  return (
    isRecord(value)
    && typeof value.id === "string"
    && typeof value.type === "string"
    && typeof value.timestamp === "number"
  );
}

export function toBoundaryEventEnvelope(
  event: CephalonEvent,
  options: ToBoundaryEventEnvelopeOptions = {},
): BoundaryEventEnvelope {
  const trace = omitUndefined<BoundaryEventTrace>({
    ...extractBoundaryTraceFromPayload(event.payload),
    ...options.trace,
  });

  const source = omitUndefined<BoundaryEventSource>({
    package: options.source?.package ?? "cephalon-ts",
    runtime: options.source?.runtime,
    surface: options.source?.surface ?? inferSurfaceFromEventType(event.type),
  });

  return omitUndefined<BoundaryEventEnvelope>({
    schemaVersion: options.schemaVersion ?? EVENT_ENVELOPE_SCHEMA_VERSION,
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    sessionId: event.sessionId,
    cephalonId: options.cephalonId,
    payload: event.payload,
    trace: Object.keys(trace).length > 0 ? trace : undefined,
    source: Object.keys(source).length > 0 ? source : undefined,
  }) as BoundaryEventEnvelope;
}

export function fromBoundaryEventEnvelope(
  envelope: BoundaryEventEnvelope,
): CephalonEvent {
  return {
    id: envelope.id,
    type: envelope.type as CephalonEvent["type"],
    timestamp: envelope.timestamp,
    sessionId: envelope.sessionId,
    payload: (envelope.payload ?? {}) as EventPayload,
  };
}

export function normalizeBoundaryEventEnvelope(
  value: BoundaryEventEnvelope | CephalonEvent,
  options: ToBoundaryEventEnvelopeOptions = {},
): BoundaryEventEnvelope {
  if (!isBoundaryEventEnvelope(value)) {
    return toBoundaryEventEnvelope(value, options);
  }

  const normalizedTrace = omitUndefined<BoundaryEventTrace>({
    ...extractBoundaryTraceFromPayload(value.payload),
    ...(isRecord(value.trace) ? (value.trace as BoundaryEventTrace) : {}),
    ...options.trace,
  });

  const normalizedSource = omitUndefined<BoundaryEventSource>({
    ...(isRecord(value.source) ? (value.source as BoundaryEventSource) : {}),
    ...options.source,
  });

  return omitUndefined<BoundaryEventEnvelope>({
    schemaVersion:
      typeof value.schemaVersion === "number"
        ? value.schemaVersion
        : (options.schemaVersion ?? EVENT_ENVELOPE_SCHEMA_VERSION),
    id: value.id,
    type: value.type,
    timestamp: value.timestamp,
    sessionId:
      value.sessionId
      ?? (isRecord(value.payload) ? pickString(value.payload, ["sessionId", "session_id"]) : undefined),
    cephalonId: value.cephalonId ?? options.cephalonId,
    payload: value.payload ?? {},
    trace: Object.keys(normalizedTrace).length > 0 ? normalizedTrace : undefined,
    source: Object.keys(normalizedSource).length > 0 ? normalizedSource : undefined,
  }) as BoundaryEventEnvelope;
}