import test from "ava";
import {
  extractPathsLoose,
  flattenForEmbedding,
  opencodeMessageToOllamaParts,
  parseCliArgs,
} from "./opencode-sessions.ts";

test("extractPathsLoose finds repo-style paths", (t) => {
  const text = "See services/cephalon-cljs/src/promethean/main.cljs and ./services/opencode-indexer/src/index.ts.";
  const paths = extractPathsLoose(text);
  t.true(paths.includes("services/cephalon-cljs/src/promethean/main.cljs"));
  t.true(paths.length >= 1);
});

test("flattenForEmbedding serializes tool calls and tool outputs", (t) => {
  const flattened = flattenForEmbedding([
    { role: "user", content: "hello" },
    {
      role: "assistant",
      content: "working",
      tool_calls: [
        {
          type: "function",
          function: { index: 0, name: "memory.lookup", arguments: { query: "duck" } },
        },
      ],
    },
    { role: "tool", tool_name: "memory.lookup", content: "{\"results\":[]}" },
  ]);

  t.true(flattened.includes("[user] hello"));
  t.true(flattened.includes("[tool_call:memory.lookup]"));
  t.true(flattened.includes("[tool:memory.lookup] {\"results\":[]}"));
});

test("opencodeMessageToOllamaParts handles tool calls and results", (t) => {
  const parts = opencodeMessageToOllamaParts({
    info: { role: "assistant" },
    parts: [
      { type: "text", text: "ok" },
      {
        tool_name: "memory.lookup",
        arguments: { query: "duck" },
        output: "{\"results\":[]}",
      },
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

test("parseCliArgs parses search options", (t) => {
  const args = parseCliArgs(["search", "hello world", "--k", "7", "--session", "ses_123"]);
  t.is(args.command, "search");
  t.is(args.searchArgs?.k, 7);
  t.is(args.searchArgs?.session, "ses_123");
  t.is(args.searchArgs?.query, "hello world");
});
