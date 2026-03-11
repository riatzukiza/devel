#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function trim(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '...';
}

function extractSummary(markdown) {
  const lines = markdown.split(/\r?\n/).filter(Boolean);
  const bullets = lines.filter((l) => /^[-*]\s/.test(l)).map((l) => l.replace(/^[-*]\s/, '').trim());
  const paragraphs = lines.filter((l) => !/^#/.test(l) && !/^[-*]\s/.test(l));
  return {
    headline: paragraphs[0] || 'Hormuz clock update',
    bullets: bullets.slice(0, 5),
  };
}

function extractBranch(markdown, name) {
  const match = markdown.match(new RegExp(`- \\*\\*${name}\\*\\*: ([^\\n]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function formatAsOf(markdown) {
  const match = markdown.match(/As of:\s*(.+)/);
  if (!match) return 'latest';
  const date = new Date(match[1].trim());
  if (Number.isNaN(date.getTime())) return match[1].trim();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function buildBlueskyText(markdown) {
  const asOf = formatAsOf(markdown);
  const reopening = extractBranch(markdown, 'reopening') || '?';
  const closure = extractBranch(markdown, 'effective_closure') || '?';
  const escalation = extractBranch(markdown, 'wider_escalation') || '?';
  return [
    `Hormuz Risk Clock, ${asOf}: transit flow remains below 10% of pre-conflict levels; bypass capacity stays at 3.5-5.5 mb/d vs ~20 mb/d normal flow.`,
    'IEA approved a 400m-barrel emergency release.',
    `Priors: reopening ${reopening}, effective closure ${closure}, wider escalation ${escalation}.`,
  ].join(' ');
}

function buildBlueskyImage(markdown) {
  const asOfMatch = markdown.match(/As of:\s*(.+)/);
  const asOf = asOfMatch ? asOfMatch[1].trim() : 'latest snapshot';
  return {
    path: 'assets/hormuz_risk_clock_v4.png',
    alt: `Hormuz Risk Clock v4 snapshot for ${asOf}`,
  };
}

function buildPayloads(reportPath) {
  const md = readText(reportPath);
  const summary = extractSummary(md);
  const bulletText = summary.bullets.slice(0, 3).map((b) => `- ${b}`).join('\n');
  const base = [summary.headline, bulletText].filter(Boolean).join('\n').trim();
  return {
    bluesky: {
      text: trim(buildBlueskyText(md), 280),
      image: buildBlueskyImage(md),
      thread: summary.bullets.slice(3),
    },
    discord: {
      content: trim(base, 1900),
      embed: {
        title: trim(summary.headline, 200),
        description: trim(summary.bullets.map((b) => `- ${b}`).join('\n'), 3800),
      },
    },
    x: {
      text: trim(base.replace(/\n- /g, ' - '), 280),
      thread: summary.bullets.slice(3).map((b) => trim(b, 280)),
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
