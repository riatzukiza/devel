#!/usr/bin/env node

/*
  Markdown Lint AI Fixer
  - Runs markdownlint programmatically
  - Feeds top N errors to an LLM (OpenAI-compatible endpoint; works with Ollama via /v1)
  - Applies JSON-described edits
  - Repeats until clean or limits reached

  Env:
  - OPENAI_BASE_URL (default http://localhost:11434/v1)
  - OPENAI_API_KEY  (default "ollama")
  - MODEL (default gpt-oss:20b-cloud)
*/

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import markdownlint from "markdownlint";

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
  const out = { batch: 25, maxIter: 6, dryRun: false, globs: DEFAULT_GLOBS };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--batch") out.batch = Number(args[++i]);
    else if (a === "--max-iter") out.maxIter = Number(args[++i]);
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--globs") out.globs = args[++i].split(",").map((s) => s.trim());
  }
  return out;
}

async function runLint(globs) {
  const options = {
    files: globs,
    config: await readMarkdownlintConfig(),
    resultVersion: 3,
    ignorePatterns: DEFAULT_IGNORE,
  };
  const results = await markdownlint.promises.markdownlint(options);
  const problems = [];
  for (const [file, issues] of Object.entries(results)) {
    if (!Array.isArray(issues)) continue;
    for (const issue of issues) {
      problems.push({ file, ...issue });
    }
  }
  return problems;
}

async function readMarkdownlintConfig() {
  // Honor .markdownlint.jsonc if present; otherwise default to {} with MD013 disabled
  const candidate = path.join(process.cwd(), ".markdownlint.jsonc");
  try {
    const jsonc = await fs.readFile(candidate, "utf8");
    // naive strip comments
    const cleaned = jsonc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\n)\s*\/\/.*$/gm, "");
    return JSON.parse(cleaned);
  } catch (_) {
    return { MD013: false };
  }
}

async function readFileSlice(file, lineStart, lineEnd) {
  const text = await fs.readFile(file, "utf8");
  const lines = text.split("\n");
  const start = Math.max(1, lineStart - 6);
  const end = Math.min(lines.length, lineEnd + 6);
  const slice = lines.slice(start - 1, end);
  return { slice: slice.join("\n"), start, end, total: lines.length };
}

function buildPrompt(batchProblems) {
  return `You are a precise markdown editor. You will receive a list of markdownlint issues with
nearby context. Respond ONLY with a JSON object of the form:
{
  "edits": [
    {"path": string, "startLine": number, "endLine": number, "replacement": string}
  ]
}
Rules:
- Edits must be minimal and syntactically correct Markdown.
- Use appropriate headings, blank lines, and code fence languages.
- Do not invent content; only adjust formatting/whitespace/heading levels/languages.
- Preserve surrounding lines except between startLine..endLine (inclusive).
- Ensure the file still compiles as Markdown; avoid trailing spaces.

Issues:
${batchProblems
  .map((p, i) => `#${i + 1} ${p.ruleNames?.join("/") || p.ruleNames}
File: ${p.file}
Line: ${p.lineNumber}
Detail: ${p.ruleDescription} ${p.errorDetail || ""}
Context:
---
${p.context}
---`)
  .join("\n\n")}
`;
}

async function callLLM(prompt) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You return strict JSON only. No prose." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 12000,
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  // Attempt to extract JSON
  const match = text.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : text;
  return JSON.parse(jsonText);
}

async function applyEdits(edits, dryRun) {
  let changed = 0;
  for (const e of edits) {
    const full = path.join(process.cwd(), e.path);
    const content = await fs.readFile(full, "utf8");
    const lines = content.split("\n");
    const s = Math.max(1, e.startLine) - 1;
    const t = Math.min(lines.length, e.endLine);
    const replacementLines = (e.replacement ?? "").replace(/\r\n/g, "\n").split("\n");
    const newLines = [...lines.slice(0, s), ...replacementLines, ...lines.slice(t)];
    const newText = newLines.join("\n");
    if (newText !== content) {
      changed += 1;
      if (!dryRun) await fs.writeFile(full, newText, "utf8");
      console.log(`[edit] ${e.path}:${e.startLine}-${e.endLine}`);
    }
  }
  return changed;
}

async function main() {
  const { batch, maxIter, dryRun, globs } = parseArgs();
  console.log(`[mdlint-agent] baseURL=${BASE_URL} model=${MODEL} batch=${batch} maxIter=${maxIter}`);

  for (let iter = 1; iter <= maxIter; iter++) {
    const problems = await runLint(globs);
    if (problems.length === 0) {
      console.log(`[mdlint-agent] No markdownlint errors. Done.`);
      return;
    }
    console.log(`[mdlint-agent] Iter ${iter}: ${problems.length} problems`);

    // Sort by file then line
    problems.sort((a, b) => (a.file === b.file ? a.lineNumber - b.lineNumber : a.file.localeCompare(b.file)));

    const batchProblems = [];
    for (const p of problems) {
      if (batchProblems.length >= batch) break;
      const { slice, start } = await readFileSlice(p.file, p.lineNumber, p.lineNumber);
      batchProblems.push({
        file: p.file,
        lineNumber: p.lineNumber,
        ruleNames: p.ruleNames,
        ruleDescription: p.ruleDescription,
        errorDetail: p.errorDetail,
        context: slice,
        contextStart: start,
      });
    }

    const prompt = buildPrompt(batchProblems);
    let json;
    try {
      json = await callLLM(prompt);
    } catch (e) {
      console.error(`[mdlint-agent] LLM call failed:`, e);
      process.exit(2);
    }
    const edits = Array.isArray(json?.edits) ? json.edits : [];
    if (edits.length === 0) {
      console.log(`[mdlint-agent] No edits proposed; stopping.`);
      break;
    }
    const changed = await applyEdits(edits, dryRun);
    console.log(`[mdlint-agent] Applied ${changed} edits.`);
    if (changed === 0) break;
  }

  const remain = await runLint(globs);
  console.log(`[mdlint-agent] Remaining problems: ${remain.length}`);
  process.exit(remain.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
