import test from "ava";

import { TOOL_REGISTRY } from "./registry.js";

test("memory.lookup uses OpenPlanner FTS results", async (t) => {
  const searchFts = async () => [
    {
      id: "mem-1",
      text: "first memory",
      score: 0.92,
    },
    {
      id: "mem-2",
      text: "second memory",
      score: 0.81,
    },
  ];

  const result = await TOOL_REGISTRY["memory.lookup"].handler(
    { query: "duck", limit: 2 },
    {
      openPlannerClient: { searchFts } as never,
      discordApiClient: {} as never,
      sessionId: "session-1",
    },
  );

  t.true(result.success);
  t.deepEqual(result.result, {
    query: "duck",
    limit: 2,
    results: [
      { id: "mem-1", content: "first memory", similarity: 0.92 },
      { id: "mem-2", content: "second memory", similarity: 0.81 },
    ],
    note: undefined,
  });
});

test("memory.lookup handles OpenPlanner failures without throwing", async (t) => {
  const searchFts = async () => {
    throw new Error("OpenPlanner unavailable");
  };

  const result = await TOOL_REGISTRY["memory.lookup"].handler(
    { query: "duck", limit: 2 },
    {
      openPlannerClient: { searchFts } as never,
      discordApiClient: {} as never,
      sessionId: "session-1",
    },
  );

  t.false(result.success);
  t.regex(result.error ?? "", /OpenPlanner unavailable/);
});
