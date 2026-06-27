import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  rename,
  stat,
} from 'node:fs/promises';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const INBOX_ROOT = join(PROJECT_ROOT, 'docs', 'inbox');
const RAW_DIR = join(INBOX_ROOT, 'raw');
const CATEGORY_DIR = join(INBOX_ROOT, 'categories');

const CATEGORY_KEYWORDS = {
  idea: ['thought', 'idea', 'concept', 'notion'],
  research: ['research', 'study', 'investigate', 'question', 'problem'],
  project: ['project', 'build', 'feature', 'implementation'],
  experiment: ['experiment', 'test', 'trial', 'prototype'],
};

const CATEGORY_FOLDERS = Object.keys(CATEGORY_KEYWORDS);
const AGENT_COMMAND = process.env.INBOX_AGENT_COMMAND ??
  'pnpm --dir orgs/riatzukiza/promethean exec opencode-agent';
const DRY_RUN = process.env.INBOX_AGENT_DRY_RUN !== 'false';
const PROCESSED = new Set();

async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
}

function parseFrontMatter(content) {
  if (content.startsWith('---')) {
    const [, fm, body] = content.split('---', 3);
    const lines = fm.trim().split('\n').filter(Boolean);
    const meta = {};
    for (const line of lines) {
      const [key, ...rest] = line.split(':');
      if (!key) continue;
      meta[key.trim()] = rest.join(':').trim();
    }
    return { meta, body: body.replace(/^\n/, '') };
  }
  return { meta: {}, body: content };
}

function buildFrontMatter(meta) {
  const fields = Object.entries(meta)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${fields}\n---\n\n`;
}

function extractTitle(body, defaultTitle) {
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim();
    }
  }
  return defaultTitle;
}

function normalizeFilename(category, title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${category}-${slug || 'note'}.md`;
}

function detectCategory(body, tags = []) {
  const lower = body.toLowerCase();
  for (const category of CATEGORY_FOLDERS) {
    if (tags.includes(category)) return category;
    for (const keyword of CATEGORY_KEYWORDS[category]) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'idea';
}

function inferTags(body) {
  const tags = new Set();
  const lower = body.toLowerCase();
  if (lower.includes('urgent') || lower.includes('production')) tags.add('urgent');
  if (lower.includes('research') || lower.includes('why')) tags.add('research');
  if (lower.includes('todo') || lower.includes('next step')) tags.add('actionable');
  return [...tags];
}

async function triggerAgent(stage, filePath, metadata) {
  const encodedMeta = Buffer.from(JSON.stringify(metadata)).toString('base64');
  const command = `${AGENT_COMMAND} --stage ${stage} --file ${filePath} --meta ${encodedMeta}`;
  if (DRY_RUN) {
    console.log(`[inbox-pipeline] DRY RUN -> ${command}`);
    return;
  }
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('[inbox-pipeline] agent failed', error.message);
  }
}

async function processFile(fileName) {
  const absolutePath = join(RAW_DIR, fileName);
  if (PROCESSED.has(absolutePath)) return;
  PROCESSED.add(absolutePath);

  try {
    const content = await readFile(absolutePath, 'utf8');
    const { meta, body } = parseFrontMatter(content);
    const defaultTitle = basename(fileName, '.md').replace(/[-_]/g, ' ');
    const title = extractTitle(body, meta.title || defaultTitle);
  const tags = Array.isArray(meta.tags)
    ? meta.tags
    : meta.tags
      ? meta.tags.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  const inferred = inferTags(body);
  const combinedTags = Array.from(new Set([...tags, ...inferred]));
  const category = detectCategory(body, combinedTags);

  const metadata = {
    title,
    category,
    tags: combinedTags,
    stage: 'categorize',
  };

  const updatedContent = `${buildFrontMatter({
    title,
    category,
    tags: combinedTags.join(', '),
  })}${body}`;

  await writeFile(absolutePath, updatedContent, 'utf8');
  await triggerAgent('retitle', absolutePath, metadata);
  await triggerAgent('label', absolutePath, metadata);

  const targetDir = join(CATEGORY_DIR, category);
  await ensureDirectory(targetDir);
  const targetFile = join(targetDir, normalizeFilename(category, title));
  await rename(absolutePath, targetFile);
  await triggerAgent('categorize', targetFile, metadata);

  // promote when the file gets safely categorized
  await triggerAgent('promote', targetFile, metadata);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    console.error(`[inbox-pipeline] failed to process ${fileName}`, error);
  }
}

async function scanRawFiles() {
  const entries = await readdir(RAW_DIR);
  for (const entry of entries) {
    const entryPath = join(RAW_DIR, entry);
    const stats = await stat(entryPath);
    if (stats.isFile() && entry.endsWith('.md')) {
      await processFile(entry);
    }
  }
}

function watchRawFolder() {
  const watcher = watch(RAW_DIR, { persistent: true });
  watcher.on('change', async (event, fileName) => {
    if (!fileName || !fileName.endsWith('.md')) return;
    console.log(`[inbox-pipeline] detected change in ${fileName}`);
    await processFile(fileName);
  });
  watcher.on('rename', async (event, fileName) => {
    if (!fileName || !fileName.endsWith('.md')) return;
    console.log(`[inbox-pipeline] detected rename/creation ${fileName}`);
    await processFile(fileName);
  });
}

async function runPipeline() {
  await ensureDirectory(RAW_DIR);
  await ensureDirectory(CATEGORY_DIR);
  await Promise.all(CATEGORY_FOLDERS.map((category) => ensureDirectory(join(CATEGORY_DIR, category))));
  await scanRawFiles();
  watchRawFolder();
  console.log('[inbox-pipeline] watching for new brain dumps in docs/inbox/raw/');
}

runPipeline().catch((error) => {
  console.error('[inbox-pipeline] fatal error', error);
  process.exit(1);
});
