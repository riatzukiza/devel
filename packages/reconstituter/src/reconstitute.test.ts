import test from "ava";
import {
  extractPathsLoose,
  flattenForEmbedding,
  isWithinRoot,
  normalizePathKey,
  opencodeEntryToOllamaReplay,
} from "./reconstitute.ts";

test("normalizePathKey collapses slashes and backslashes", (t) => {
  const value = normalizePathKey("services\\opencode-indexer//src//index.ts");
  t.is(value, "services/opencode-indexer/src/index.ts");
});

test("isWithinRoot detects root and subpaths", (t) => {
  const root = "services/opencode-indexer";
  t.true(isWithinRoot("services/opencode-indexer", root));
  t.true(isWithinRoot("services/opencode-indexer/src/index.ts", root));
  t.false(isWithinRoot("services/other/src/index.ts", root));
});

test("extractPathsLoose finds relative and repo paths", (t) => {
  const text = "See ./services/opencode-indexer/src/index.ts and services/cephalon/src/main.ts.";
  const paths = extractPathsLoose(text);
  t.true(paths.some((p) => p.endsWith("services/opencode-indexer/src/index.ts")));
  t.true(paths.length >= 1);
});

test("flattenForEmbedding formats tool calls with assistant content", (t) => {
  const flattened = flattenForEmbedding([
    {
      role: "assistant",
      content: "ok",
      tool_calls: [
        {
          type: "function",
          function: { index: 0, name: "memory.lookup", arguments: { query: "duck" } },
        },
      ],
    },
    { role: "tool", tool_name: "memory.lookup", content: "{\"results\":[]}" },
  ]);

  t.true(flattened.includes("[tool_call:memory.lookup]"));
  t.true(flattened.includes("[assistant] ok"));
  t.true(flattened.includes("[tool:memory.lookup] {\"results\":[]}"));
});

test("opencodeEntryToOllamaReplay emits tool call + tool result", (t) => {
  const parts = opencodeEntryToOllamaReplay({
    info: { role: "assistant" },
    parts: [
      { type: "text", text: "ok" },
      { tool_name: "memory.lookup", arguments: { query: "duck" }, output: "{\"results\":[]}" },
    ],
  });

  const first = parts[0];
  t.is(first?.role, "assistant");
  if (first && first.role === "assistant" && "tool_calls" in first) {
    t.is(first.tool_calls?.[0]?.function?.name, "memory.lookup");
  } else {
    t.fail("Expected assistant tool call entry");
  }

  const second = parts[1];
  t.is(second?.role, "tool");
  if (second && second.role === "tool") {
    t.is(second.tool_name, "memory.lookup");
  } else {
    t.fail("Expected tool result entry");
  }
});
