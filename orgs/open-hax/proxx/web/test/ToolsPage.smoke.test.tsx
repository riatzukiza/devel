import React from "react";
import assert from "node:assert/strict";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { ToolsPage } from "../src/pages/ToolsPage";

test("ToolsPage smoke: renders tool and MCP manager shells", () => {
  const html = renderToStaticMarkup(<ToolsPage />);

  assert.ok(html.includes("Tool Manager"));
  assert.ok(html.includes("MCP Manager"));
  assert.ok(html.includes("gpt-5.3-codex"));
  assert.ok(html.includes("Refresh"));
});
