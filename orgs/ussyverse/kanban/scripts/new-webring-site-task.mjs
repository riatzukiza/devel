#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);

const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
};

const usage = () => {
  process.stdout.write(`\nnew-webring-site-task\n\n` +
    `Creates a Trello-synced incoming kanban task for an ussyco.de webring site.\n\n` +
    `Usage:\n` +
    `  node scripts/new-webring-site-task.mjs --name "Display Name" --subdomain "subdomain" --description "One-liner"\n\n` +
    `Options:\n` +
    `  --name         Display name (shown on the hub)\n` +
    `  --subdomain    Subdomain (becomes <subdomain>.ussyco.de)\n` +
    `  --description  One-line hub description\n` +
    `  --priority     P1|P2|P3 (default: P2)\n`);
};

const name = getArg("name");
const subdomain = getArg("subdomain");
const description = getArg("description") ?? "";
const priority = getArg("priority") ?? "P2";

if (!name || !subdomain) {
  usage();
  process.stderr.write("\nerror: --name and --subdomain are required\n");
  process.exit(1);
}

const slugify = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const uuid = randomUUID();
const slug = slugify(subdomain);

const outDir = join(process.cwd(), "tasks", "incoming");
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, `webring-site-${slug}.md`);
if (existsSync(outPath)) {
  process.stderr.write(`error: file already exists: ${outPath}\n`);
  process.exit(2);
}

const title = `Webring site: ${subdomain} — ${name}`;

const content = `---\n` +
  `uuid: ${uuid}\n` +
  `title: "${title.replace(/\"/g, "\\\"")}"\n` +
  `status: incoming\n` +
  `priority: ${priority}\n` +
  `labels:\n` +
  `  - webring\n` +
  `  - site\n` +
  `  - ussyco\n` +
  `created_at: ${createdAt}\n` +
  `---\n\n` +
  `## Brief\n\n` +
  `- Display name: **${name}**\n` +
  `- Subdomain: **${subdomain}.ussyco.de**\n` +
  `- One-line description (hub): ${description}\n\n` +
  `## Checklist\n\n` +
  `### 1) Research (MANDATORY)\n` +
  `- [ ] Review current ring members: \`curl -s https://ussyco.de/api/webring | python3 -m json.tool\`\n` +
  `- [ ] Read 2–3 existing site index.html files on the server\n` +
  `- [ ] Confirm concept/aesthetic is not a duplicate\n\n` +
  `### 2) Build\n` +
  `- [ ] Create dir on server: \`mkdir -p /home/mojo/projects/<your-site-name>\`\n` +
  `- [ ] Build self-contained \`index.html\` (no external CDN deps)\n` +
  `- [ ] Include webring widget:\n\n` +
  "```html\n" +
  "<div id=\"webring\" data-theme=\"dark\"></div>\n" +
  "<script src=\"https://ussyco.de/api/webring/widget.js\"></script>\n" +
  "```\n\n" +
  `### 3) Serve\n` +
  `- [ ] Pick unused port (8422–8499): \`ss -tlnp | grep -E ':(84[0-9]{2}|85[0-9]{2})'\`\n` +
  `- [ ] Start server and verify: \`curl -s http://localhost:<PORT> | head -5\`\n\n` +
  `### 4) Register (admin)\n` +
  `- [ ] Register member with admin key (mode: proxy, can_proxy: true)\n\n` +
  `### 5) Verify end-to-end\n` +
  `- [ ] Proxy internal: \`curl -s -H "X-Subdomain: ${subdomain}" http://localhost:8421/api/subdomain/ | head -5\`\n` +
  `- [ ] HTTPS live: \`curl -s https://${subdomain}.ussyco.de | head -5\`\n` +
  `- [ ] Appears in ring: \`curl -s https://ussyco.de/api/webring | python3 -c \"import json,sys; d=json.load(sys.stdin); print([s['name'] for s in d['sites'] if s['subdomain']=='${subdomain}'])\"\`\n\n`;

writeFileSync(outPath, content, { encoding: "utf8" });
process.stdout.write(`created ${outPath}\n`);
