import { describe, expect, it } from "bun:test";

import { SessionAliasStore } from "../sessionAliasStore.js";

describe("session alias store", () => {
  it("resolves aliases across different MCP sessions via global store", () => {
    const store = new SessionAliasStore({
      ttlMsProvider: () => 60_000,
    });

    const alias = store.aliasFor("session", "ses_123", "mcp-a");
    expect(alias).toBe("S0001");

    const resolvedFromOtherSession = store.resolveAlias("session", alias, "mcp-b");
    expect(resolvedFromOtherSession).toBe("ses_123");
  });

  it("keeps alias stable when reminted from another context", () => {
    const store = new SessionAliasStore({
      ttlMsProvider: () => 60_000,
    });

    const first = store.aliasFor("session", "ses_abc", "mcp-a");
    const second = store.aliasFor("session", "ses_abc", "mcp-b");

    expect(first).toBe("S0001");
    expect(second).toBe("S0001");
  });

  it("expires aliases after TTL and allows reminting", () => {
    let now = 0;
    const store = new SessionAliasStore({
      ttlMsProvider: () => 1_000,
      nowProvider: () => now,
    });

    const alias = store.aliasFor("message", "msg_1", "mcp-a");
    expect(alias).toBe("M0001");
    expect(store.resolveAlias("message", alias, "mcp-a")).toBe("msg_1");

    now = 2_000;
    expect(store.resolveAlias("message", alias, "mcp-a")).toBeNull();

    const reminted = store.aliasFor("message", "msg_1", "mcp-a");
    expect(reminted).toBe("M0001");
    expect(store.resolveAlias("message", reminted, "mcp-a")).toBe("msg_1");
  });
});
