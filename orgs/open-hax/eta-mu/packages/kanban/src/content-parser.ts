import matter from "gray-matter";

export interface ParsedSection {
  type: "body" | "comment";
  content: string;
}

export interface ParsedTaskContent {
  frontmatter: Record<string, unknown>;
  sections: ParsedSection[];
}

/**
 * Parse a task markdown file into frontmatter + body sections + comments.
 *
 * After the YAML frontmatter, `---` on its own line acts as a comment delimiter.
 * Text between two `---` lines (or between `---` and end-of-file) is a comment.
 * Text NOT wrapped in `---` delimiters is body content.
 *
 * Example:
 *   ---
 *   uuid: "foo"
 *   ---
 *
 *   # Heading
 *   Body text here.
 *
 *   ---
 *   This is a comment.
 *   ---
 *
 *   More body text.
 */
export const parseTaskContent = (raw: string): ParsedTaskContent => {
  let data: Record<string, unknown> = {};
  let content = raw;

  // Parse frontmatter with gray-matter
  try {
    const parsed = matter(raw);
    data = parsed.data as Record<string, unknown>;
    content = parsed.content;
  } catch {
    // Try manual extraction
    const fmMatch = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/u);
    if (fmMatch) {
      content = raw.slice(fmMatch[0].length);
      // Simple key: value parsing
      for (const line of fmMatch[1].split(/\r?\n/u)) {
        const kv = line.match(/^\s*([A-Za-z0-9_]+):\s*(.+)$/u);
        if (kv) {
          const key = kv[1];
          let val: unknown = kv[2].trim().replace(/^["']|["']$/gu, "");
          if (val === "true") val = true;
          else if (val === "false") val = false;
          else if (/^\d+$/u.test(String(val))) val = Number(val);
          data[key] = val;
        }
      }
    }
  }

  // Split body into sections by `---` delimiters
  const lines = content.split(/\r?\n/u);
  const sections: ParsedSection[] = [];
  let currentType: "body" | "comment" = "body";
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.trim() === "---") {
      // Flush current buffer
      const text = buffer.join("\n").trim();
      if (text) {
        sections.push({ type: currentType, content: text });
      }
      // Toggle between body and comment
      currentType = currentType === "body" ? "comment" : "body";
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  // Flush remaining
  const remaining = buffer.join("\n").trim();
  if (remaining) {
    sections.push({ type: currentType, content: remaining });
  }

  return { frontmatter: data, sections };
};

/**
 * Rebuild a task markdown file from parsed structure.
 */
export const serializeTaskContent = (parsed: ParsedTaskContent): string => {
  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(parsed.frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
    } else if (typeof value === "string") {
      lines.push(`${key}: "${value}"`);
    } else if (value === null || value === undefined) {
      lines.push(`${key}: null`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }

  lines.push("---");
  lines.push("");

  for (const section of parsed.sections) {
    if (section.type === "comment") {
      lines.push("---");
      lines.push(section.content);
      lines.push("---");
    } else {
      lines.push(section.content);
    }
    lines.push("");
  }

  return lines.join("\n");
};

/**
 * Update a single frontmatter field and write back.
 */
export const updateFrontmatterField = async (
  filePath: string,
  key: string,
  value: unknown
): Promise<ParsedTaskContent> => {
  const raw = await (await import("node:fs/promises")).readFile(filePath, "utf8");
  const parsed = parseTaskContent(raw);
  parsed.frontmatter[key] = value;
  const serialized = serializeTaskContent(parsed);
  await (await import("node:fs/promises")).writeFile(filePath, serialized, "utf8");
  return parsed;
};

/**
 * Append a comment to a task file.
 */
export const appendComment = async (
  filePath: string,
  commentText: string
): Promise<ParsedTaskContent> => {
  const raw = await (await import("node:fs/promises")).readFile(filePath, "utf8");
  const parsed = parseTaskContent(raw);

  // Find last comment section or create new one
  const lastSection = parsed.sections[parsed.sections.length - 1];
  if (lastSection && lastSection.type === "comment") {
    lastSection.content += "\n\n" + commentText;
  } else {
    parsed.sections.push({ type: "comment", content: commentText });
  }

  const serialized = serializeTaskContent(parsed);
  await (await import("node:fs/promises")).writeFile(filePath, serialized, "utf8");
  return parsed;
};
