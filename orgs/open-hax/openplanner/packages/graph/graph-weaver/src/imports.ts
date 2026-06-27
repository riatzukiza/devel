export function extractJsTsImports(src: string): string[] {
  const out = new Set<string>();
  const patterns: RegExp[] = [
    /\bimport\s+(?:type\s+)?[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /\bexport\s+[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const spec = String(m[1] || "").trim();
      if (spec) out.add(spec);
    }
  }

  return [...out.values()];
}

export function extractPythonImports(src: string): string[] {
  const out = new Set<string>();
  const lines = src.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // from foo.bar import baz
    const from = /^from\s+([a-zA-Z0-9_\.]+)\s+import\b/.exec(trimmed);
    if (from?.[1]) out.add(from[1]);

    // import foo, bar.baz as qux
    const imp = /^import\s+(.+)$/.exec(trimmed);
    if (imp?.[1]) {
      for (const part of imp[1].split(",")) {
        const mod = part.trim().split(/\s+as\s+/)[0]?.trim();
        if (mod) out.add(mod);
      }
    }
  }
  return [...out.values()];
}

export function extractClojureRequires(src: string): string[] {
  const out = new Set<string>();
  // heuristic: require vectors look like [foo.bar :as x]
  const re = /\[\s*([a-zA-Z0-9][a-zA-Z0-9_.\-]*)\s*(?::as|:refer|:refer-macros|:include-macros|\]|\s)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const ns = String(m[1] || "").trim();
    if (!ns) continue;
    // reduce obvious false positives (keywords, numbers)
    if (ns.startsWith(":")) continue;
    if (/^\d/.test(ns)) continue;
    out.add(ns);
  }
  return [...out.values()];
}
