#!/usr/bin/env node

/*
  Markdown Lint Agent (Agents SDK)
  - Uses @openai/agents with function tools and built-in loop
  - Targets an OpenAI-compatible endpoint (e.g., Ollama) without adding a new client lib

  Env:
  - OPENAI_BASE_URL (default http://localhost:11434/v1)
  - OPENAI_API_KEY  (default "ollama")
  - MODEL (default gpt-oss:20b-cloud)

  Args:
  --batch <n>     Max issues per iteration (default 25)
  --max-iter <n>  Max iterations (default 6)
  --globs <csv>   Comma-separated globs (default README.md,*.md,docs/**/*.md,spec/**/*.md)
*/

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import markdownlint from "markdownlint";
import { Agent, run, tool, setDefaultOpenAIClient } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.OPENAI_BASE_URL || "http://localhost:11434/v1";
const API_KEY = process.env.OPENAI_API_KEY || "ollama";
const MODEL = process.env.MODEL || "gpt-oss:20b-cloud";

const DEFAULT_GLOBS = [
  "README.md",
  "*.md",
  "docs/**/*.md",
  "spec/**/*.md",
];
const DEFAULT_IGNORE = ["orgs/**", "**/dist/**", "**/build/**", ".git/**", "node_modules/**"];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { batch: 25, maxIter: 6, globs: DEFAULT_GLOBS };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--batch") out.batch = Number(args[++i]);
    else if (a === "--max-iter") out.maxIter = Number(args[++i]);
    else if (a === "--globs") out.globs = args[++i].split(",").map((s) => s.trim());
  }
  return out;
}

async function readMarkdownlintConfig() {
  const candidate = path.join(process.cwd(), ".markdownlint.jsonc");
  try {
    const jsonc = await fs.readFile(candidate, "utf8");
    const cleaned = jsonc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\n)\s*\/\/.*$/gm, "");
    return JSON.parse(cleaned);
  } catch (_) {
    return { MD013: false };
  }
}

async function runLint(globs) {
  const options = { files: globs, config: await readMarkdownlintConfig(), resultVersion: 3, ignorePatterns: DEFAULT_IGNORE };
  const results = await markdownlint.promises.markdownlint(options);
  const problems = [];
  for (const [file, issues] of Object.entries(results)) {
    if (!Array.isArray(issues)) continue;
    for (const issue of issues) problems.push({ file, ...issue });
  }
  return problems;
}

async function readFileSlice(file, lineStart, lineEnd) {
  const text = await fs.readFile(file, "utf8");
  const lines = text.split("\n");
  const start = Math.max(1, lineStart - 6);
  const end = Math.min(lines.length, lineEnd + 6);
  const slice = lines.slice(start - 1, end).join("\n");
  return { slice, start, end, total: lines.length };
}

// Tools
const scanLintIssuesTool = tool({
  name: "scan_lint_issues",
  description: "Scan markdown files for lint problems and return a batch with nearby context",
  parameters: z.object({ globs: z.array(z.string()), limit: z.number().min(1).max(200) }),
  execute: async ({ globs, limit }) => {
    const problems = await runLint(globs);
    problems.sort((a, b) => (a.file === b.file ? a.lineNumber - b.lineNumber : a.file.localeCompare(b.file)));
    const selected = problems.slice(0, limit);
    const enriched = [];
    for (const p of selected) {
      const ctx = await readFileSlice(p.file, p.lineNumber, p.lineNumber);
      enriched.push({
        file: p.file,
        lineNumber: p.lineNumber,
        ruleNames: p.ruleNames,
        ruleDescription: p.ruleDescription,
        errorDetail: p.errorDetail || "",
        context: ctx.slice,
        contextStart: ctx.start,
      });
    }
    return JSON.stringify({ count: problems.length, batch: enriched });
  },
});

const applyEditsTool = tool({
  name: "apply_edits",
  description: "Apply minimal edits to files to fix markdownlint problems (startLine..endLine inclusive)",
  parameters: z.object({
    edits: z.array(
      z.object({
        path: z.string(),
        startLine: z.number().min(1),
        endLine: z.number().min(1),
        replacement: z.string(),
      }),
    ).min(1),
  }),
  execute: async ({ edits }) => {
    let changed = 0;
    for (const e of edits) {
      const full = path.join(process.cwd(), e.path);
      const content = await fs.readFile(full, "utf8");
      const lines = content.split("\n");
      const s = Math.max(1, e.startLine) - 1;
      const t = Math.min(lines.length, e.endLine);
      const replacementLines = e.replacement.replace(/\r\n/g, "\n").split("\n");
      const newLines = [...lines.slice(0, s), ...replacementLines, ...lines.slice(t)];
      const newText = newLines.join("\n");
      if (newText !== content) {
        await fs.writeFile(full, newText, "utf8");
        changed++;
      }
    }
    return JSON.stringify({ changed });
  },
});

const doneTool = tool({
  name: "done",
  description: "Finish when there are no remaining markdownlint errors or budget is exhausted",
  parameters: z.object({ reason: z.string() }),
  execute: async ({ reason }) => JSON.stringify({ ok: true, reason }),
});

async function main() {
  const { batch, maxIter, globs } = parseArgs();
  setDefaultOpenAIClient(new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY }));

  const agent = new Agent({
    name: "mdlint-fixer",
    instructions: [
      "You fix markdownlint problems iteratively.",
      "Always call scan_lint_issues first with the provided globs and the given batch size.",
      "If count is zero, call done and include a short summary.",
      "From each batch item, produce precise minimal edits that correct only formatting issues (headings, blank lines, fenced code languages, trailing spaces, final newline).",
      "Call apply_edits with those edits, then scan again.",
      `Do not attempt to fix more than ${batch} issues per iteration.`,
    ].join("\n"),
    model: MODEL,
    tools: [scanLintIssuesTool, applyEditsTool, doneTool],
  });

  const result = await run(agent, {
    input: `Fix markdownlint errors with batch=${batch}, maxIter=${maxIter}. Globs=${globs.join(",")}. Repeat scan/apply until clean or limit reached.`,
    context: { batch, maxIter, globs },
    maxIterations: maxIter,
  });

  const remaining = await runLint(globs);
  console.log(`[agentsdk] remaining problems: ${remaining.length}`);
  if (result?.finalOutput) console.log(result.finalOutput);
  process.exit(remaining.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
