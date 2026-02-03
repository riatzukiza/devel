import anyTest, { type TestFn } from "ava";
import { InMemoryEventBus } from "@promethean-os/event";
type ExecutorModule = typeof import("./executor.js");
type DiscordModule = typeof import("../../discord/api-client.js");
import type { ToolResult } from "../../types/index.js";

const test = anyTest as TestFn;

const loadExecutorModule = async (): Promise<ExecutorModule> => {
  const mod = await import(new URL("./executor.js", import.meta.url).toString());
  return mod as ExecutorModule;
};

const loadDiscordModule = async (): Promise<DiscordModule> => {
  const mod = await import(
    new URL("../../discord/api-client.js", import.meta.url).toString(),
  );
  return mod as DiscordModule;
};

const createExecutor = async () => {
  const { ToolExecutor } = await loadExecutorModule();
  const { DiscordApiClient } = await loadDiscordModule();
  const eventBus = new InMemoryEventBus();
  const discordApiClient = new DiscordApiClient({ token: "test-token" });
  return new ToolExecutor(eventBus, { discordApiClient });
};

test("executes discord tools without channel cache", async (t) => {
  const executor = await createExecutor();
  let called = false;

  executor.registerTool("discord.search", async (): Promise<ToolResult> => {
    called = true;
    return { toolName: "discord.search", success: true, result: { ok: true } };
  });

  const result = await executor.execute(
    {
      type: "tool_call",
      name: "discord.search",
      args: { scope: "channel", channel_id: "123" },
      callId: "call-1",
    },
    "session-a",
  );

  t.true(result.success);
  t.true(called, "handler should execute when registered");
});

test("allows discord tools after list.channels caches ids", async (t) => {
  const executor = await createExecutor();
  let searchCalled = false;

  executor.registerTool("discord.list.channels", async (): Promise<ToolResult> => {
    return {
      toolName: "discord.list.channels",
      success: true,
      result: {
        channels: [{ id: "chan-1", name: "general", guildId: "guild-1" }],
        count: 1,
      },
    };
  });

  executor.registerTool("discord.search", async (): Promise<ToolResult> => {
    searchCalled = true;
    return { toolName: "discord.search", success: true, result: { ok: true } };
  });

  await executor.execute(
    {
      type: "tool_call",
      name: "discord.list.channels",
      args: {},
      callId: "call-2",
    },
    "session-a",
  );

  const result = await executor.execute(
    {
      type: "tool_call",
      name: "discord.search",
      args: { scope: "channel", channel_id: "chan-1", query: "duck" },
      callId: "call-3",
    },
    "session-a",
  );

  t.true(result.success);
  t.true(searchCalled, "handler should execute once channel id is cached");
});

test("executes discord.send when handler registered", async (t) => {
  const executor = await createExecutor();
  let sendCalled = false;

  executor.registerTool("discord.send", async (): Promise<ToolResult> => {
    sendCalled = true;
    return { toolName: "discord.send", success: true, result: { ok: true } };
  });

  const result = await executor.execute(
    {
      type: "tool_call",
      name: "discord.send",
      args: { channel_id: "seed-1", content: "hi" },
      callId: "call-4",
    },
    "session-b",
  );

  t.true(result.success);
  t.true(sendCalled, "handler should run for registered tools");
});
