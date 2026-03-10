#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function trim(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function extractSummary(markdown) {
  const lines = markdown.split(/?
/).filter(Boolean);
  const bullets = lines.filter(l => /^[-*]\s/.test(l)).map(l => l.replace(/^[-*]\s/, '').trim());
  const paragraphs = lines.filter(l => !/^#/.test(l) && !/^[-*]\s/.test(l));
  return {
    headline: paragraphs[0] || 'Hormuz clock update',
    bullets: bullets.slice(0, 5),
  };
}

function buildPayloads(reportPath) {
  const md = readText(reportPath);
  const summary = extractSummary(md);
  const base = `${summary.headline}
${summary.bullets.slice(0, 3).map(b => `• ${b}`).join('
')}`.trim();
  return {
    bluesky: {
      text: trim(base, 280),
      thread: summary.bullets.slice(3),
    },
    discord: {
      content: trim(base, 1900),
      embed: {
        title: trim(summary.headline, 200),
        description: trim(summary.bullets.map(b => `• ${b}`).join('
'), 3800),
      },
    },
    x: {
      text: trim(base.replace(/
• /g, ' • '), 280),
      thread: summary.bullets.slice(3).map(b => trim(b, 280)),
    },
    reddit: {
      title: trim(summary.headline, 300),
      body: md,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reportPath = process.argv[2] || path.resolve('reports/v4_snapshot.md');
  const outPath = process.argv[3] || path.resolve('data/social_payloads.latest.json');
  const payloads = buildPayloads(reportPath);
  fs.writeFileSync(outPath, JSON.stringify(payloads, null, 2));
  console.log(`wrote ${outPath}`);
}

export { buildPayloads };
