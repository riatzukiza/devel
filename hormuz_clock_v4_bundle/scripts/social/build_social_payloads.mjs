#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function readJsonMaybe(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(readText(p));
}

function trim(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '...';
}

function pct(value) {
  return `${Math.round(Number(value) * 100)}%`;
}

function extractSummary(markdown) {
  const lines = markdown.split(/\r?\n/).filter(Boolean);
  const bullets = lines.filter((l) => /^[-*]\s/.test(l)).map((l) => l.replace(/^[-*]\s/, '').trim());
  const paragraphs = lines.filter((l) => !/^#/.test(l) && !/^[-*]\s/.test(l) && !/^>/.test(l));
  return {
    headline: paragraphs[0] || 'Hormuz clock update',
    bullets: bullets.slice(0, 5),
  };
}

function formatAsOf(input) {
  const raw = typeof input === 'string'
    ? (input.match(/As of:\s*(.+)/)?.[1] ?? input)
    : input;
  if (!raw) return 'latest';
  const date = new Date(String(raw).trim());
  if (Number.isNaN(date.getTime())) return String(raw).trim();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function branchRange(branch) {
  if (!branch || typeof branch !== 'object') return '?';
  return `${pct(branch.range?.low ?? 0)}-${pct(branch.range?.high ?? 0)}`;
}

function branchConfidenceLabel(branches) {
  const values = Object.values(branches || {})
    .map((branch) => Number(branch?.confidence ?? 0))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return 'unknown';
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (avg >= 0.72) return 'high';
  if (avg >= 0.52) return 'medium';
  return 'low';
}

function buildBlueskyText(markdown, state) {
  const asOf = formatAsOf(state?.as_of_utc ?? markdown);
  const reopening = branchRange(state?.branches?.reopening);
  const closure = branchRange(state?.branches?.effective_closure);
  const escalation = branchRange(state?.branches?.wider_escalation);
  const confidence = branchConfidenceLabel(state?.branches);
  return [
    `Hormuz Risk Clock, ${asOf}: JMIC says only 4 commercial transits vs ~138 historical daily flow.`,
    'IEA still puts bypass at 3.5-5.5 mb/d vs ~20 mb/d normal Hormuz flow.',
    `Scenario ranges: reopening ${reopening}, closure ${closure}, escalation ${escalation}; model confidence ${confidence}.`,
  ].join(' ');
}

function buildBlueskyImage(state, markdown) {
  const asOf = state?.as_of_utc || markdown.match(/As of:\s*(.+)/)?.[1]?.trim() || 'latest snapshot';
  const branches = state?.branches || {};
  return {
    path: 'assets/hormuz_risk_clock_v4.png',
    alt: `Hormuz Risk Clock v4 snapshot for ${asOf}; branch range bands show reopening ${branchRange(branches.reopening)}, effective closure ${branchRange(branches.effective_closure)}, and wider escalation ${branchRange(branches.wider_escalation)}.`,
  };
}

function buildPayloads(reportPath, statePath = path.resolve('data/state.v4.json')) {
  const md = readText(reportPath);
  const state = readJsonMaybe(statePath);
  const summary = extractSummary(md);
  const bulletText = summary.bullets.slice(0, 3).map((b) => `- ${b}`).join('\n');
  const base = [summary.headline, bulletText].filter(Boolean).join('\n').trim();
  return {
    bluesky: {
      text: trim(buildBlueskyText(md, state), 280),
      image: buildBlueskyImage(state, md),
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
      text: trim(buildBlueskyText(md, state), 280),
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
  const statePath = process.argv[4] || path.resolve('data/state.v4.json');
  const payloads = buildPayloads(reportPath, statePath);
  fs.writeFileSync(outPath, JSON.stringify(payloads, null, 2));
  console.log(`wrote ${outPath}`);
}

export { buildPayloads };
