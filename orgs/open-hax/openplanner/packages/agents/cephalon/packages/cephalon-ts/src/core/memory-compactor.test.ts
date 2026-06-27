import test from "ava";

import { loadDefaultPolicy } from "../config/policy.js";
import { MemoryFactory } from "./memory-factory.js";
import { MemoryCompactor } from "./memory-compactor.js";
import { InMemoryMemoryStore } from "./memory-store.js";

test("MemoryCompactor creates summaries without deleting originals", async (t) => {
  const store = new InMemoryMemoryStore();
  const factory = new MemoryFactory({
    cephalonId: "duck",
    sessionId: "c3-symbolic",
    schemaVersion: 1,
  });
  const policy = loadDefaultPolicy();

  const first = factory.createUserMessageMemory("ordis meme alert", {
    type: "discord",
    guildId: "guild-1",
    channelId: "chan-1",
    authorId: "user-1",
  }, { timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000 });
  const second = factory.createAssistantMemory("ordis meme alert", {
    timestamp: Date.now() - 19 * 24 * 60 * 60 * 1000,
  });
  second.source = { type: "discord", guildId: "guild-1", channelId: "chan-1", authorId: "duck-bot" };
  second.usage.includedCountDecay = 0;
  first.usage.includedCountDecay = 0;

  await store.insert(first);
  await store.insert(second);

  const compactor = new MemoryCompactor(
    store,
    policy,
    {
      cephalonId: "duck",
      sessionId: "memory-compactor",
      schemaVersion: 1,
    },
    {
      threshold: 2,
      maxGroupsPerRun: 2,
    },
  );

  await compactor.runOnce();

  const all = store.getAllMemories();
  const summaries = all.filter((memory) => memory.kind === "summary");
  t.true(summaries.length >= 1);

  const [summary] = summaries;
  t.truthy(summary?.cluster?.clusterId);
  t.false(first.lifecycle.deleted);
  t.false(second.lifecycle.deleted);

  const updatedFirst = await store.findById(first.id);
  const updatedSecond = await store.findById(second.id);
  t.is(updatedFirst?.lifecycle.replacedBySummaryId, summary?.id);
  t.is(updatedSecond?.lifecycle.replacedBySummaryId, summary?.id);
  t.is(updatedFirst?.cluster?.clusterId, summary?.cluster?.clusterId);
  t.is(updatedSecond?.cluster?.clusterId, summary?.cluster?.clusterId);
});
