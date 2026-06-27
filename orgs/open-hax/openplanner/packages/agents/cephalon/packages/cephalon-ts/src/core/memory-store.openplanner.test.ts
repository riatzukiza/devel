import test from "ava";

import { InMemoryMemoryStore } from "./memory-store.js";
import type { Memory } from "../types/index.js";

const buildMemory = (): Memory => ({
  id: "mem-123",
  timestamp: 1738762200000,
  cephalonId: "duck",
  sessionId: "session-1",
  eventId: "event-1",
  role: "user",
  kind: "message",
  content: { text: "hello" },
  source: { type: "discord", channelId: "c-1", authorId: "u-1" },
  retrieval: {
    pinned: false,
    lockedByAdmin: false,
    lockedBySystem: false,
    weightKind: 1,
    weightSource: 1,
  },
  usage: {
    includedCountTotal: 0,
    includedCountDecay: 0,
    lastIncludedAt: 1738762200000,
  },
  embedding: { status: "none" },
  lifecycle: { deleted: false },
  hashes: { contentHash: "abc" },
  schemaVersion: 1,
});

test("InMemoryMemoryStore emits OpenPlanner event on insert", async (t) => {
  let emittedMemoryId: string | null = null;
  const openPlannerClient = {
    emitMemoryCreated: async (memory: Memory) => {
      emittedMemoryId = memory.id;
    },
  };

  const store = new InMemoryMemoryStore(undefined, openPlannerClient as never);
  const memory = buildMemory();

  await store.insert(memory);

  t.true(emittedMemoryId === "mem-123");
  t.truthy(await store.findById("mem-123"));
});

test("InMemoryMemoryStore logs OpenPlanner failures and continues", async (t) => {
  const errorMessages: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    errorMessages.push(args.map((arg) => String(arg)).join(" "));
  };

  const openPlannerClient = {
    emitMemoryCreated: async () => {
      throw new Error("openplanner down");
    },
  };

  try {
    const store = new InMemoryMemoryStore(undefined, openPlannerClient as never);
    const memory = buildMemory();
    await t.notThrowsAsync(() => store.insert(memory));
    t.truthy(await store.findById("mem-123"));
    t.true(
      errorMessages.some((message) =>
        message.includes("Error emitting memory mem-123 to OpenPlanner"),
      ),
    );
  } finally {
    console.error = originalError;
  }
});
