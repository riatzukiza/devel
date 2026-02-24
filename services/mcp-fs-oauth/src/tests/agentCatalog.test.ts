import { describe, expect, it } from "bun:test";

import { formatPrimaryAgentList, primaryAgentNames } from "../agentCatalog.js";

describe("agentCatalog", () => {
  it("formats only primary and all-mode agents", () => {
    const text = formatPrimaryAgentList([
      { name: "build", mode: "primary", builtIn: true, description: "Build things" },
      { name: "explore", mode: "subagent", builtIn: true, description: "Explore repo" },
      { name: "custom", mode: "all", builtIn: false, description: "Custom agent" },
    ], 50, false);

    expect(text).toContain("build [primary] built-in");
    expect(text).toContain("custom [all] custom");
    expect(text).not.toContain("explore [subagent]");
  });

  it("extracts only non-subagent names in lowercase", () => {
    const names = primaryAgentNames({
      agents: [
        { name: "Build", mode: "primary" },
        { name: "Explore", mode: "subagent" },
        { name: "Plan", mode: "all" },
      ],
    });

    expect(names).toEqual(["build", "plan"]);
  });
});
