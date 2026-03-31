// GPL-3.0-only

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_PARSER_VERSION = 'eta_mu_docs_index.v1';

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
}

function stableId(prefix, seed, width = 20) {
  const token = sha256Hex(seed).slice(0, Math.max(8, width));
  return `${prefix}:${token}`;
}

function isObjectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTag(value) {
  return String(value ?? '')
    .trim()
    .replace(/^#/, '')
    .replace(/^\[|\]$/g, '')
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .toLowerCase();
}

function stripFencedCodeBlocks(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (String(line).trim().startsWith('```')) {
      inFence = !inFence;
      out.push('');
      continue;
    }
    out.push(inFence ? '' : line);
  }
  return out.join('\n');
}

function parseFrontmatter(text) {
  const raw = String(text ?? '');
  if (!raw.startsWith('---')) return { frontmatter: '', body: raw };
  const lines = raw.split(/\r?\n/);
  if (lines[0].trim() !== '---') return { frontmatter: '', body: raw };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return { frontmatter: '', body: raw };
  return {
    frontmatter: lines.slice(1, end).join('\n'),
    body: lines.slice(end + 1).join('\n'),
  };
}

function parseFrontmatterScalar(frontmatter, key) {
  const fm = String(frontmatter ?? '');
  const re = new RegExp(`^${key}:\\s*(.+)\\s*$`, 'm');
  const m = fm.match(re);
  if (!m) return '';
  return String(m[1] ?? '').trim().replace(/^['"]|['"]$/g, '');
}

function parseFrontmatterTags(frontmatter) {
  const fm = String(frontmatter ?? '');
  const lines = fm.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^tags:\s*(.*)\s*$/);
    if (!m) continue;
    const rest = String(m[1] ?? '').trim();
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1);
      for (const item of inner.split(',')) {
        const t = item.trim().replace(/^['"]|['"]$/g, '');
        if (t) out.push(t);
      }
      return out;
    }
    for (let j = i + 1; j < lines.length; j++) {
      const li = lines[j];
      const mm = li.match(/^\s*-\s*(.+)\s*$/);
      if (!mm) break;
      const t = String(mm[1] ?? '').trim().replace(/^['"]|['"]$/g, '');
      if (t) out.push(t);
      i = j;
    }
    return out;
  }
  return out;
}

function extractInlineTags(text) {
  const tags = [];
  const re = /(^|\s)#([a-zA-Z0-9_-]{1,64})\b/g;
  let m;
  while ((m = re.exec(String(text ?? ''))) !== null) {
    const t = normalizeTag(m[2] ?? '');
    if (t) tags.push(t);
  }
  return tags;
}

function extractHashtagsLines(text) {
  const tags = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = String(line).match(/^#hashtags:\s*(.*)$/i);
    if (!m) continue;
    const rest = String(m[1] ?? '');
    for (const raw of rest.split(/\s+/g)) {
      if (!raw.startsWith('#')) continue;
      const t = normalizeTag(raw);
      if (t) tags.push(t);
    }
  }
  return tags;
}

function extractHeadings(text) {
  const headings = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const m = String(line).match(/^(#{1,6})\s+(.+)$/);
    if (!m) continue;
    headings.push({ level: m[1].length, title: String(m[2] ?? '').trim() });
  }
  return headings;
}

function extractWikilinks(text) {
  const out = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  const s = String(text ?? '');
  while ((m = re.exec(s)) !== null) {
    const rawInner = String(m[1] ?? '').trim();
    if (!rawInner) continue;
    const parts = rawInner.split('|');
    const target = String(parts[0] ?? rawInner).trim();
    const alias = String(parts[1] ?? '').trim();
    out.push({ target, alias, raw: rawInner, index: m.index });
  }
  return out;
}

function extractMarkdownLinks(text) {
  const out = [];
  const re = /(^|[^!])\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  const s = String(text ?? '');
  while ((m = re.exec(s)) !== null) {
    const label = String(m[2] ?? '').trim();
    const url = String(m[3] ?? '').trim();
    if (!url) continue;
    out.push({ url, text: label, index: m.index });
  }
  return out;
}

function lineNumberAt(text, index) {
  let line = 1;
  const s = String(text ?? '');
  for (let i = 0; i < Math.min(index, s.length); i++) {
    if (s[i] === '\n') line++;
  }
  return line;
}

function normalizeWikilinkKey(target) {
  return String(target ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function readJsonl(filePath) {
  const target = String(filePath ?? '').trim();
  if (!target) return [];
  try {
    if (!fs.existsSync(target)) return [];
    const raw = fs.readFileSync(target, 'utf8');
    const rows = [];
    for (const line of raw.split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try {
        const row = JSON.parse(s);
        if (isObjectRecord(row)) rows.push(row);
      } catch {
        // ignore
      }
    }
    return rows;
  } catch {
    return [];
  }
}

function writeJsonl(filePath, rows) {
  const target = String(filePath ?? '').trim();
  if (!target) throw new Error('writeJsonl: missing filePath');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const safeRows = Array.isArray(rows) ? rows : [];
  fs.writeFileSync(
    target,
    safeRows.map((row) => JSON.stringify(row)).join('\n') + '\n',
    'utf8',
  );
}

function loadEtaMuMounts({ repoRoot, mountsPath }) {
  const root = String(repoRoot ?? '').trim() || process.cwd();
  const mountsAbs = path.resolve(root, String(mountsPath ?? ''));
  const payload = JSON.parse(fs.readFileSync(mountsAbs, 'utf8'));
  const mounts = Array.isArray(payload.mounts) ? payload.mounts : [];
  return { ...payload, mounts };
}

function parseEtaMuMarkdown({ relPath, text }) {
  const sourceRel = String(relPath ?? '');
  const raw = String(text ?? '');
  const { frontmatter, body } = parseFrontmatter(raw);
  const bodyNoCode = stripFencedCodeBlocks(body);
  const headings = extractHeadings(bodyNoCode);
  const title = (headings.find((h) => h.level === 1)?.title || path.posix.basename(sourceRel)).trim();
  const uuid = parseFrontmatterScalar(frontmatter, 'uuid');
  const frontmatterTags = parseFrontmatterTags(frontmatter).map(normalizeTag);
  const inlineTags = extractInlineTags(bodyNoCode);
  const hashtagTags = extractHashtagsLines(raw);
  const tags = [...new Set([...frontmatterTags, ...inlineTags, ...hashtagTags].filter(Boolean))];

  const wikilinks = extractWikilinks(bodyNoCode);
  const mdLinks = extractMarkdownLinks(bodyNoCode);
  const links = [];
  for (const w of wikilinks) {
    const line = lineNumberAt(bodyNoCode, w.index);
    const targetKey = normalizeWikilinkKey(w.target);
    links.push({
      kind: 'wikilink',
      target: w.target,
      target_key: targetKey,
      alias: w.alias,
      line,
    });
  }
  for (const l of mdLinks) {
    const line = lineNumberAt(bodyNoCode, l.index);
    links.push({ kind: 'markdown', url: l.url, text: l.text, line });
  }
  return { uuid, title, headings, tags, links };
}

function shouldSkipDir(name) {
  return (
    name === 'node_modules'
    || name === '.git'
    || name === 'dist'
    || name === 'build'
    || name === 'coverage'
    || name === '.cache'
    || name === '.opencode'
    || name === '.ημ'
    || name === '.Π'
  );
}

function walkMarkdownFiles(rootAbs) {
  const out = [];
  const todo = [rootAbs];
  while (todo.length) {
    const dir = todo.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.#')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (shouldSkipDir(e.name)) continue;
        todo.push(abs);
      } else if (e.isFile()) {
        if (e.name.toLowerCase().endsWith('.md')) out.push(abs);
      }
    }
  }
  return out;
}

function posixRel(fromAbs, toAbs) {
  const rel = path.relative(fromAbs, toAbs);
  return rel.split(path.sep).join('/');
}

async function indexEtaMuDocs({
  repoRoot,
  mountsPath,
  indexPath,
  backlinksPath,
  parserVersion = DEFAULT_PARSER_VERSION,
}) {
  const rootAbs = path.resolve(String(repoRoot ?? '').trim() || process.cwd());
  const mounts = loadEtaMuMounts({ repoRoot: rootAbs, mountsPath }).mounts;

  const indexAbs = path.resolve(rootAbs, String(indexPath));
  const backlinksAbs = path.resolve(rootAbs, String(backlinksPath));

  const existingRows = readJsonl(indexAbs);
  const byPath = new Map();
  const byContent = new Map();
  for (const row of existingRows) {
    if (!isObjectRecord(row)) continue;
    const mountId = String(row.mount_id ?? '');
    const rel = String(row.source_rel_path ?? '');
    const content = String(row.content_sha256 ?? '');
    if (mountId && rel) byPath.set(`${mountId}:${rel}`, row);
    if (content) byContent.set(content, row);
  }

  const nextRows = [];
  const backlinkEdges = [];

  for (const mount of mounts) {
    if (!isObjectRecord(mount)) continue;
    const mountId = String(mount.id ?? '').trim();
    const mountRoot = String(mount.root ?? '').trim();
    if (!mountId || !mountRoot) continue;
    const mountRootAbs = path.resolve(rootAbs, mountRoot);
    const files = walkMarkdownFiles(mountRootAbs);

    for (const absPath of files) {
      const rel = posixRel(rootAbs, absPath);
      const st = fs.statSync(absPath);
      const bytes = Number(st.size);
      const mtimeNs = Number(st.mtimeNs);
      const mtimeUtc = new Date(st.mtimeMs).toISOString();

      const cacheKey = `${mountId}:${rel}`;
      const prevByPath = byPath.get(cacheKey);

      const cachedOk = (
        prevByPath
        && String(prevByPath.parser_version ?? '') === String(parserVersion)
        && Number(prevByPath.mtime_ns ?? -1) === mtimeNs
        && Number(prevByPath.bytes ?? -1) === bytes
      );

      if (cachedOk) {
        const entityId = String(prevByPath.entity_id ?? stableId('doc', cacheKey, 20));
        nextRows.push({ ...prevByPath, entity_id: entityId, mtime_utc: mtimeUtc });
        const links = Array.isArray(prevByPath.links) ? prevByPath.links : [];
        for (const link of links) {
          if (!isObjectRecord(link) || link.kind !== 'wikilink') continue;
          const targetKey = String(link.target_key ?? '');
          if (!targetKey) continue;
          backlinkEdges.push({
            target_key: targetKey,
            edge: {
              kind: 'wikilink',
              src_entity_id: entityId,
              src_rel_path: rel,
              target: String(link.target ?? ''),
              target_key: targetKey,
              line: Number(link.line ?? 0),
            },
          });
        }
        continue;
      }

      const text = fs.readFileSync(absPath, 'utf8');
      const contentSha = sha256Hex(text);
      const prevByContent = byContent.get(contentSha);

      const parsed = parseEtaMuMarkdown({ relPath: rel, text });

      let entityId = '';
      if (parsed.uuid) entityId = `doc:${parsed.uuid}`;
      else if (prevByPath?.entity_id) entityId = String(prevByPath.entity_id);
      else if (prevByContent?.entity_id) entityId = String(prevByContent.entity_id);
      else entityId = stableId('doc', `${mountId}:${rel}`, 20);

      for (const link of parsed.links) {
        if (!isObjectRecord(link) || link.kind !== 'wikilink') continue;
        const targetKey = String(link.target_key ?? '');
        if (!targetKey) continue;
        backlinkEdges.push({
          target_key: targetKey,
          edge: {
            kind: 'wikilink',
            src_entity_id: entityId,
            src_rel_path: rel,
            target: String(link.target ?? ''),
            target_key: targetKey,
            line: Number(link.line ?? 0),
          },
        });
      }

      nextRows.push({
        record: 'ημ.docs-index.v1',
        parser_version: String(parserVersion),
        extracted_at: new Date().toISOString(),
        entity_id: entityId,
        mount_id: mountId,
        source_rel_path: rel,
        bytes,
        mtime_ns: mtimeNs,
        mtime_utc: mtimeUtc,
        content_sha256: contentSha,
        title: parsed.title,
        headings: parsed.headings,
        tags: parsed.tags,
        links: parsed.links,
      });
    }
  }

  nextRows.sort((a, b) => String(a.source_rel_path ?? '').localeCompare(String(b.source_rel_path ?? '')));
  writeJsonl(indexAbs, nextRows);

  const byTarget = new Map();
  for (const { target_key, edge } of backlinkEdges) {
    if (!byTarget.has(target_key)) byTarget.set(target_key, []);
    byTarget.get(target_key).push(edge);
  }
  const backlinkRows = [];
  const keys = [...byTarget.keys()].sort();
  const now = new Date().toISOString();
  for (const key of keys) {
    backlinkRows.push({
      record: 'ημ.docs-backlinks.v1',
      generated_at: now,
      target_key: key,
      sources: byTarget.get(key) ?? [],
    });
  }
  writeJsonl(backlinksAbs, backlinkRows);

  return {
    indexedFiles: nextRows.length,
    indexPath: indexAbs,
    backlinksPath: backlinksAbs,
  };
}

module.exports = {
  indexEtaMuDocs,
  loadEtaMuMounts,
  parseEtaMuMarkdown,
  readJsonl,
  writeJsonl,
};
