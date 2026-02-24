import { promises as fs } from "node:fs";
import path from "node:path";

import { resolveWithinRoot } from "../util/pathJail.js";

export type ApplyPatchOptions = {
  cwd: string;
};

export type ApplyPatchResult = {
  output: string;
};

type Hunk =
  | { type: "add"; filePath: string; content: string }
  | { type: "delete"; filePath: string }
  | { type: "update"; filePath: string; movePath?: string; chunks: UpdateChunk[] };

type UpdateChunk = {
  oldLines: string[];
  newLines: string[];
  context?: string;
  endOfFile: boolean;
};

const BEGIN_PATCH = "*** Begin Patch";
const END_PATCH = "*** End Patch";
const ADD_FILE = "*** Add File: ";
const DELETE_FILE = "*** Delete File: ";
const UPDATE_FILE = "*** Update File: ";
const MOVE_TO = "*** Move to: ";
const END_OF_FILE = "*** End of File";

const stripHeredoc = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/);
  if (!match) {
    return trimmed;
  }
  return match[2];
};

const ensureRelativePath = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error("apply_patch verification failed: empty file path");
  }
  if (path.isAbsolute(trimmed)) {
    throw new Error("apply_patch verification failed: File references can only be relative, NEVER ABSOLUTE.");
  }
  return trimmed;
};

const parseAddContent = (lines: string[], start: number): { content: string; next: number } => {
  const out: string[] = [];
  let i = start;

  while (i < lines.length && !lines[i].startsWith("*** ")) {
    if (!lines[i].startsWith("+")) {
      throw new Error("apply_patch verification failed: add file lines must start with '+'");
    }
    out.push(lines[i].slice(1));
    i += 1;
  }

  return { content: out.join("\n"), next: i };
};

const parseUpdateChunks = (lines: string[], start: number): { chunks: UpdateChunk[]; next: number } => {
  const chunks: UpdateChunk[] = [];
  let i = start;

  while (i < lines.length && !lines[i].startsWith("*** ")) {
    if (!lines[i].startsWith("@@")) {
      i += 1;
      continue;
    }

    const header = lines[i] === "@@" ? "" : lines[i].slice(2).trim();
    i += 1;

    const oldLines: string[] = [];
    const newLines: string[] = [];
    let endOfFile = false;

    while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("*** ")) {
      const line = lines[i];

      if (line === END_OF_FILE) {
        endOfFile = true;
        i += 1;
        break;
      }

      const marker = line[0];
      const text = line.slice(1);

      if (marker === " ") {
        oldLines.push(text);
        newLines.push(text);
      } else if (marker === "-") {
        oldLines.push(text);
      } else if (marker === "+") {
        newLines.push(text);
      } else {
        throw new Error("apply_patch verification failed: invalid update line prefix");
      }
      i += 1;
    }

    chunks.push({ oldLines, newLines, context: header || undefined, endOfFile });
  }

  return { chunks, next: i };
};

const parsePatch = (patchText: string): Hunk[] => {
  const cleaned = stripHeredoc(patchText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n");
  const start = lines.findIndex((line) => line.trim() === BEGIN_PATCH);
  const end = lines.findIndex((line) => line.trim() === END_PATCH);

  if (start === -1 || end === -1 || start >= end) {
    throw new Error("apply_patch verification failed: Invalid patch format: missing Begin/End markers");
  }

  const hunks: Hunk[] = [];
  let i = start + 1;

  while (i < end) {
    const line = lines[i];

    if (line.startsWith(ADD_FILE)) {
      const filePath = ensureRelativePath(line.slice(ADD_FILE.length));
      const { content, next } = parseAddContent(lines, i + 1);
      hunks.push({ type: "add", filePath, content });
      i = next;
      continue;
    }

    if (line.startsWith(DELETE_FILE)) {
      const filePath = ensureRelativePath(line.slice(DELETE_FILE.length));
      hunks.push({ type: "delete", filePath });
      i += 1;
      continue;
    }

    if (line.startsWith(UPDATE_FILE)) {
      const filePath = ensureRelativePath(line.slice(UPDATE_FILE.length));
      let movePath: string | undefined;
      let next = i + 1;
      if (next < end && lines[next].startsWith(MOVE_TO)) {
        movePath = ensureRelativePath(lines[next].slice(MOVE_TO.length));
        next += 1;
      }
      const parsed = parseUpdateChunks(lines, next);
      if (parsed.chunks.length === 0) {
        throw new Error("apply_patch verification failed: update file requires at least one hunk");
      }
      hunks.push({ type: "update", filePath, movePath, chunks: parsed.chunks });
      i = parsed.next;
      continue;
    }

    i += 1;
  }

  if (hunks.length === 0) {
    throw new Error("patch rejected: empty patch");
  }

  return hunks;
};

const normalizeUnicode = (value: string): string => value
  .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
  .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
  .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
  .replace(/\u2026/g, "...")
  .replace(/\u00A0/g, " ");

const tryMatch = (
  lines: string[],
  pattern: string[],
  startIndex: number,
  compare: (a: string, b: string) => boolean,
  eof: boolean,
): number => {
  if (eof) {
    const fromEnd = lines.length - pattern.length;
    if (fromEnd >= startIndex) {
      let ok = true;
      for (let j = 0; j < pattern.length; j += 1) {
        if (!compare(lines[fromEnd + j], pattern[j])) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return fromEnd;
      }
    }
  }

  for (let i = startIndex; i <= lines.length - pattern.length; i += 1) {
    let ok = true;
    for (let j = 0; j < pattern.length; j += 1) {
      if (!compare(lines[i + j], pattern[j])) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return i;
    }
  }

  return -1;
};

const seekSequence = (lines: string[], pattern: string[], startIndex: number, eof = false): number => {
  if (pattern.length === 0) {
    return -1;
  }

  const exact = tryMatch(lines, pattern, startIndex, (a, b) => a === b, eof);
  if (exact !== -1) {
    return exact;
  }

  const rstrip = tryMatch(lines, pattern, startIndex, (a, b) => a.trimEnd() === b.trimEnd(), eof);
  if (rstrip !== -1) {
    return rstrip;
  }

  const trim = tryMatch(lines, pattern, startIndex, (a, b) => a.trim() === b.trim(), eof);
  if (trim !== -1) {
    return trim;
  }

  return tryMatch(
    lines,
    pattern,
    startIndex,
    (a, b) => normalizeUnicode(a.trim()) === normalizeUnicode(b.trim()),
    eof,
  );
};

const applyUpdateChunks = (originalContent: string, chunks: UpdateChunk[], filePath: string): string => {
  const originalLines = originalContent.split("\n");
  if (originalLines.length > 0 && originalLines[originalLines.length - 1] === "") {
    originalLines.pop();
  }

  const replacements: Array<[number, number, string[]]> = [];
  let lineIndex = 0;

  for (const chunk of chunks) {
    if (chunk.context) {
      const idx = seekSequence(originalLines, [chunk.context], lineIndex);
      if (idx === -1) {
        throw new Error(`apply_patch verification failed: Failed to find context '${chunk.context}' in ${filePath}`);
      }
      lineIndex = idx + 1;
    }

    if (chunk.oldLines.length === 0) {
      const insertion = originalLines.length > 0 && originalLines[originalLines.length - 1] === ""
        ? originalLines.length - 1
        : originalLines.length;
      replacements.push([insertion, 0, chunk.newLines]);
      continue;
    }

    let pattern = chunk.oldLines;
    let newSlice = chunk.newLines;
    let found = seekSequence(originalLines, pattern, lineIndex, chunk.endOfFile);

    if (found === -1 && pattern.length > 0 && pattern[pattern.length - 1] === "") {
      pattern = pattern.slice(0, -1);
      if (newSlice.length > 0 && newSlice[newSlice.length - 1] === "") {
        newSlice = newSlice.slice(0, -1);
      }
      found = seekSequence(originalLines, pattern, lineIndex, chunk.endOfFile);
    }

    if (found === -1) {
      throw new Error(`apply_patch verification failed: Failed to find expected lines in ${filePath}:\n${chunk.oldLines.join("\n")}`);
    }

    replacements.push([found, pattern.length, newSlice]);
    lineIndex = found + pattern.length;
  }

  replacements.sort((a, b) => a[0] - b[0]);
  const result = [...originalLines];

  for (let i = replacements.length - 1; i >= 0; i -= 1) {
    const [start, oldLen, newSegment] = replacements[i];
    result.splice(start, oldLen, ...newSegment);
  }

  if (result.length === 0 || result[result.length - 1] !== "") {
    result.push("");
  }

  return result.join("\n");
};

const summarize = (operations: Array<{ type: "A" | "M" | "D"; relPath: string }>): string => {
  const lines = operations.map((op) => `${op.type} ${op.relPath}`);
  return `Success. Updated the following files:\n${lines.join("\n")}`;
};

export async function applyPatchText(patchText: string, options: ApplyPatchOptions): Promise<ApplyPatchResult> {
  const hunks = parsePatch(patchText);
  const ops: Array<{ type: "A" | "M" | "D"; relPath: string }> = [];

  for (const hunk of hunks) {
    if (hunk.type === "add") {
      const target = resolveWithinRoot(options.cwd, hunk.filePath);
      await fs.mkdir(path.dirname(target.absPath), { recursive: true });
      const content = hunk.content.length === 0 || hunk.content.endsWith("\n") ? hunk.content : `${hunk.content}\n`;
      await fs.writeFile(target.absPath, content, "utf8");
      ops.push({ type: "A", relPath: target.relPath });
      continue;
    }

    if (hunk.type === "delete") {
      const target = resolveWithinRoot(options.cwd, hunk.filePath);
      const stat = await fs.stat(target.absPath).catch(() => null);
      if (!stat || !stat.isFile()) {
        throw new Error(`apply_patch verification failed: Failed to read file to update: ${target.absPath}`);
      }
      await fs.unlink(target.absPath);
      ops.push({ type: "D", relPath: target.relPath });
      continue;
    }

    const source = resolveWithinRoot(options.cwd, hunk.filePath);
    const stat = await fs.stat(source.absPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      throw new Error(`apply_patch verification failed: Failed to read file to update: ${source.absPath}`);
    }
    const oldContent = await fs.readFile(source.absPath, "utf8");
    const newContent = applyUpdateChunks(oldContent, hunk.chunks, source.absPath);

    if (hunk.movePath) {
      const destination = resolveWithinRoot(options.cwd, hunk.movePath);
      await fs.mkdir(path.dirname(destination.absPath), { recursive: true });
      await fs.writeFile(destination.absPath, newContent, "utf8");
      await fs.unlink(source.absPath);
      ops.push({ type: "M", relPath: destination.relPath });
      continue;
    }

    await fs.writeFile(source.absPath, newContent, "utf8");
    ops.push({ type: "M", relPath: source.relPath });
  }

  return { output: summarize(ops) };
}
