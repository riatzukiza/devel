import anyTest, { type TestFn } from "ava";

import {
  fromBoundaryMemoryRecord,
  isBoundaryMemoryRecord,
  MEMORY_RECORD_SCHEMA_VERSION,
  normalizeBoundaryMemoryRecord,
  toBoundaryMemoryRecord,
} from "./memory-record.js";
import type { Memory } from "../types/index.js";

interface TestContext {
  memory: Memory;
}

const test = anyTest as TestFn<TestContext>;

test.before((t) => {
  t.context.memory = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    timestamp: 1706899200000,
    cephalonId: "duck",
    sessionId: "c3-symbolic",
    eventId: "550e8400-e29b-41d4-a716-446655440002",
    role: "assistant",
    kind: "message",
    content: { text: "quack", normalizedText: "quack" },
    source: { type: "discord", channelId: "343299242963763200", authorId: "duck" },
    retrieval: { pinned: false, lockedByAdmin: false, lockedBySystem: false, weightKind: 1, weightSource: 1 },
    usage: { includedCountTotal: 0, includedCountDecay: 0, lastIncludedAt: 0 },
    embedding: { status: "none" },
    lifecycle: { deleted: false },
    hashes: { contentHash: "abc" },
    schemaVersion: 1,
  };
});

test("toBoundaryMemoryRecord preserves canonical TS memory shape", (t) => {
  const record = toBoundaryMemoryRecord(t.context.memory);

  t.true(isBoundaryMemoryRecord(record));
  t.is(record.id, t.context.memory.id);
  t.is(record.cephalonId, "duck");
  t.is(record.content.text, "quack");
});

test("fromBoundaryMemoryRecord roundtrips canonical memory shape", (t) => {
  const record = toBoundaryMemoryRecord(t.context.memory);
  const roundtrip = fromBoundaryMemoryRecord(record);

  t.deepEqual(roundtrip, { ...t.context.memory, hashes: roundtrip.hashes });
  t.truthy(roundtrip.hashes.contentHash);
});

test("normalizeBoundaryMemoryRecord upgrades cljs-style namespaced records", (t) => {
  const record = normalizeBoundaryMemoryRecord({
    "memory/id": "m-cljs-1",
    "memory/timestamp": 1706899200000,
    "memory/cephalon-id": "duck",
    "memory/session-id": "main",
    "memory/role": "user",
    "memory/kind": "tool_result",
    "memory/content": { text: "Result: ok", "normalized-text": "tool:web.fetch" },
    "memory/source": { type: "discord", "channel-id": "123", "author-id": "u1" },
    "memory/retrieval": { pinned: true, "weight-kind": 0.5, "weight-source": 1 },
    "memory/usage": { "included-count-total": 2, "included-count-decay": 1.5, "last-included-at": 1706899200123 },
    "memory/embedding": { status: "ready", dims: 3, vector: [0.1, 0.2, 0.3] },
    "memory/lifecycle": { deleted: false },
    "memory/schema-version": 1,
  });

  t.is(record.kind, "tool_result");
  t.is(record.source.channelId, "123");
  t.true(record.retrieval.pinned);
  t.is(record.usage.includedCountTotal, 2);
});

test("normalizeBoundaryMemoryRecord upgrades legacy local memory shapes", (t) => {
  const record = normalizeBoundaryMemoryRecord({
    "memory/id": "legacy-1",
    "memory/ts": 1706899200000,
    "memory/kind": "event",
    "memory/role": "user",
    "memory/text": "legacy text",
    "memory/meta": {
      source: "discord",
      "session/id": "main",
      "discord/channel-id": "chan-1",
      "discord/author-id": "user-1",
      "discord/message-id": "msg-1",
    },
    "memory/lifecycle": { pinned: true, "replaced-by": "sum-1" },
    "memory/usage": { "included-total": 4, "included-decay": 2.5 },
    "memory/dedupe-key": "dedupe-1",
  }, { cephalonId: "duck" });

  t.is(record.kind, "message");
  t.is(record.sessionId, "main");
  t.is(record.source.type, "discord");
  t.true(record.retrieval.pinned);
  t.is(record.lifecycle.replacedBySummaryId, "sum-1");
  t.is(record.hashes.normalizedHash, "dedupe-1");
  t.is(record.schemaVersion, MEMORY_RECORD_SCHEMA_VERSION);
});