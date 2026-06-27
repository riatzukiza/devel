export type MarkdownLink = {
  kind: "wiki" | "md" | "angle";
  target: string;
};

export function extractMarkdownLinks(src: string): MarkdownLink[] {
  const out: MarkdownLink[] = [];

  // wikilinks: [[target]] or [[target|label]] or [[target#heading]]
  const wiki = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = wiki.exec(src))) {
    const raw = String(m[1] || "");
    const target = raw.split("|")[0]!.split("#")[0]!.trim();
    if (target) out.push({ kind: "wiki", target });
  }

  // markdown links: [text](target)
  const md = /\[[^\]]*\]\(([^)]+)\)/g;
  while ((m = md.exec(src))) {
    const target = String(m[1] || "").trim().replace(/^<|>$/g, "");
    if (target) out.push({ kind: "md", target });
  }

  // angle autolinks: <https://...>
  const angle = /<\s*(https?:\/\/[^\s>]+)\s*>/g;
  while ((m = angle.exec(src))) {
    const target = String(m[1] || "").trim();
    if (target) out.push({ kind: "angle", target });
  }

  return out;
}
