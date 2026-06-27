import anyTest, { type TestFn } from "ava";

import {
  EVENT_ENVELOPE_SCHEMA_VERSION,
  fromBoundaryEventEnvelope,
  isBoundaryEventEnvelope,
  normalizeBoundaryEventEnvelope,
  toBoundaryEventEnvelope,
} from "./event-envelope.js";
import type { CephalonEvent } from "../types/index.js";

interface TestContext {
  toolResultEvent: CephalonEvent;
}

const test = anyTest as TestFn<TestContext>;

test.before((t) => {
  t.context.toolResultEvent = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    type: "tool.result",
    timestamp: 1706899200000,
    sessionId: "c3-symbolic",
    payload: {
      toolName: "web.fetch",
      callId: "9d1ee247-8136-4ca2-9f37-db6eeff360f2",
      result: { ok: true },
    },
  } as CephalonEvent;
});

test("toBoundaryEventEnvelope adds schema, source, and trace", (t) => {
  const envelope = toBoundaryEventEnvelope(t.context.toolResultEvent, {
    cephalonId: "duck",
    source: { runtime: "candidate-1" },
  });

  t.is(envelope.schemaVersion, EVENT_ENVELOPE_SCHEMA_VERSION);
  t.is(envelope.cephalonId, "duck");
  t.is(envelope.source?.package, "cephalon-ts");
  t.is(envelope.source?.runtime, "candidate-1");
  t.is(envelope.source?.surface, "tool");
  t.is(envelope.trace?.callId, "9d1ee247-8136-4ca2-9f37-db6eeff360f2");
});

test("fromBoundaryEventEnvelope preserves the core event shape", (t) => {
  const envelope = toBoundaryEventEnvelope(t.context.toolResultEvent, {
    cephalonId: "duck",
  });

  const event = fromBoundaryEventEnvelope(envelope);

  t.deepEqual(event, t.context.toolResultEvent);
});

test("normalizeBoundaryEventEnvelope upgrades legacy envelopes", (t) => {
  const envelope = normalizeBoundaryEventEnvelope({
    id: "6b4f9c4b-8806-41ae-af97-2f4eaebc6420",
    type: "system.tick",
    timestamp: 1706899200123,
    payload: {
      scheduleId: "cephalon:c3-symbolic:tick",
      intervalMs: 15000,
      tickNumber: 4,
    },
  } as unknown as CephalonEvent);

  t.true(isBoundaryEventEnvelope(envelope));
  t.is(envelope.schemaVersion, EVENT_ENVELOPE_SCHEMA_VERSION);
  t.is(envelope.trace?.scheduleId, "cephalon:c3-symbolic:tick");
});