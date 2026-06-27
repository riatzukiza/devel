#!/usr/bin/env node
/**
 * Generate dark.json theme from @open-hax/uxx design tokens.
 *
 * Brand colors (Monokai):
 *   - Success (green):  accent.green  = #A6E22E
 *   - Error (red):      accent.red    = #F92672
 *   - Info (cyan):      accent.cyan   = #66D9EF
 *
 * Tool output uses cyan for visibility.
 * Tool success/error backgrounds use subtle blends of green/red
 * composited onto the surface background as solid hex values.
 */

import { monokai } from '/home/err/devel/orgs/open-hax/uxx/dist/tokens/src/colors.js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const p = monokai;

/** Composite fg over bg at given alpha, return 6-char hex. */
function alphaHex(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const r = Math.round(bg.r * (1 - alpha) + fg.r * alpha);
  const g = Math.round(bg.g * (1 - alpha) + fg.g * alpha);
  const b = Math.round(bg.b * (1 - alpha) + fg.b * alpha);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function toHex(n) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
}

const surface = p.bg.darker; // #1e1f1c — the tool panel background

const theme = {
  $schema: 'https://raw.githubusercontent.com/open-hax/eta-mu/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json',
  name: 'dark',
  vars: {
    background: p.bg.default,
    surface: p.bg.darker,
    panel: p.bg.tabInactive,
    selection: p.bg.selection,
    border: p.bg.groupBorder,
    borderMuted: p.fg.subtle,
    text: p.fg.default,
    textBright: p.fg.bright,
    textMuted: p.fg.muted,
    textDim: p.fg.subtle,
    accent: p.accent.green,
    accentAlt: p.accent.magenta,
    success: p.semantic.success,
    error: p.semantic.error,
    warning: p.semantic.warning,
    info: p.semantic.info,
  },
  colors: {
    accent: p.accent.green,
    border: p.bg.groupBorder,
    borderAccent: p.fg.muted,
    borderMuted: p.fg.subtle,
    success: p.semantic.success,
    error: p.semantic.error,
    warning: p.semantic.warning,
    muted: p.fg.muted,
    dim: p.fg.subtle,
    text: p.fg.default,
    thinkingText: p.fg.soft,
    selectedBg: p.bg.selection,
    userMessageBg: p.bg.lighter,
    userMessageText: p.fg.default,
    customMessageBg: p.bg.tabInactive,
    customMessageText: p.fg.default,
    customMessageLabel: p.accent.magenta,
    // Tool colors — brand-forward: cyan text, tinted backgrounds
    toolPendingBg: p.bg.darker,
    toolSuccessBg: alphaHex(p.accent.green, surface, 0.12),
    toolErrorBg: alphaHex(p.accent.red, surface, 0.18),
    toolTitle: p.fg.bright,
    toolOutput: p.accent.cyan,
    // Markdown
    mdHeading: p.accent.yellow,
    mdLink: p.accent.cyan,
    mdLinkUrl: p.fg.subtle,
    mdCode: p.accent.cyan,
    mdCodeBlock: p.accent.green,
    mdCodeBlockBorder: p.bg.groupBorder,
    mdQuote: p.fg.soft,
    mdQuoteBorder: p.fg.subtle,
    mdHr: p.bg.groupBorder,
    mdListBullet: p.accent.green,
    // Diffs
    toolDiffAdded: p.semantic.success,
    toolDiffRemoved: p.semantic.error,
    toolDiffContext: p.fg.muted,
    // Syntax
    syntaxComment: p.fg.muted,
    syntaxKeyword: p.accent.magenta,
    syntaxFunction: p.accent.yellow,
    syntaxVariable: p.accent.blue,
    syntaxString: p.accent.green,
    syntaxNumber: p.accent.orange,
    syntaxType: p.accent.cyan,
    syntaxOperator: p.fg.bright,
    syntaxPunctuation: p.fg.soft,
    // Thinking levels
    thinkingOff: p.fg.subtle,
    thinkingMinimal: p.fg.muted,
    thinkingLow: p.accent.blue,
    thinkingMedium: p.accent.cyan,
    thinkingHigh: p.accent.magenta,
    thinkingXhigh: p.accent.red,
    bashMode: p.semantic.success,
  },
  export: {
    pageBg: p.bg.default,
    cardBg: p.bg.darker,
    infoBg: p.bg.lighter,
  },
};

const outPath = join(__dirname, '..', 'src', 'modes', 'interactive', 'theme', 'dark.json');
writeFileSync(outPath, JSON.stringify(theme, null, '\t') + '\n');
console.log(`Wrote ${outPath}`);
